import { XMLParser } from "fast-xml-parser";
import { MANIFEST_URL } from "@/src/config";

export interface ProjectInfo {
  name: string;
  url: string;
  revision?: string;
}

interface ParsedRemote {
  name?: string;
  fetch?: string;
}

interface ParsedDefault {
  remote?: string;
  revision?: string;
}

interface ParsedProject {
  name?: string;
  revision?: string;
  remote?: string;
}

interface ParsedManifest {
  manifest?: {
    remote?: ParsedRemote | ParsedRemote[];
    default?: ParsedDefault;
    project?: ParsedProject | ParsedProject[];
  };
}

export function extractProjectNames(xmlStr: string): ProjectInfo[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  const parsed = parser.parse(xmlStr) as ParsedManifest;
  const manifest = parsed.manifest;
  if (manifest == null) {
    return [];
  }

  // Parse remotes
  const remotesArray: ParsedRemote[] = manifest.remote != null
    ? Array.isArray(manifest.remote)
      ? manifest.remote
      : [manifest.remote]
    : [];
  const remotes = new Map<string, string>();
  for (const r of remotesArray) {
    if (typeof r.name === "string" && typeof r.fetch === "string") {
      remotes.set(r.name, r.fetch);
    }
  }

  // Parse default
  const defaultRemote = manifest.default?.remote;
  const defaultRevision = manifest.default?.revision;

  // Parse projects
  const projectsArray: ParsedProject[] = manifest.project != null
    ? Array.isArray(manifest.project)
      ? manifest.project
      : [manifest.project]
    : [];

  const projects: ProjectInfo[] = [];

  for (const p of projectsArray) {
    if (typeof p.name !== "string" || p.name.length === 0)
      continue;

    const revision = p.revision ?? defaultRevision;
    const remoteName = p.remote ?? defaultRemote;

    let url = p.name;
    if (typeof remoteName === "string" && remotes.has(remoteName)) {
      const fetchStr = remotes.get(remoteName)!;
      try {
        if (fetchStr.includes("://")) {
          url = new URL(p.name, fetchStr.endsWith("/") ? fetchStr : `${fetchStr}/`).href;
        }
        else if (MANIFEST_URL != null && MANIFEST_URL.length > 0) {
          // Resolve relative or unknown paths against MANIFEST_URL
          const baseUrl = MANIFEST_URL.endsWith("/") ? MANIFEST_URL : `${MANIFEST_URL}/`;
          const resolvedFetch = new URL(fetchStr, baseUrl).href;
          url = new URL(p.name, resolvedFetch.endsWith("/") ? resolvedFetch : `${resolvedFetch}/`).href;
        }
      }
      catch {
        console.warn(`Could not resolve URL for project ${p.name} with remote fetch ${fetchStr}`);
      }
    }

    projects.push({ name: p.name, url, revision });
  }

  return projects;
}
