import { BRANCH, EXTRAS, MANIFEST_OWNER, MANIFEST_REPO, MANIFEST_URL, NVCHECKER_OWNER, REPO_OWNER } from "@/src/config";
import { getCnbRepos } from "@/src/services/cnb";
import { getBranches, getFileContent } from "@/src/services/github";
import {
  generateKeyfile,
  generateNvcheckerConfig,
  getChangedRepos,
  runNvchecker,
} from "@/src/services/nvchecker";
import { extractProjectNames } from "@/src/utils/xml";

async function main(): Promise<void> {
  if ((MANIFEST_URL == null || MANIFEST_URL === "") && (EXTRAS == null || EXTRAS === "")) {
    throw new Error("Both MANIFEST_URL and EXTRAS are empty. At least one must be set.");
  }

  const githubProjects = new Map<string, { name: string; url: string; branch: string }>();

  if (MANIFEST_REPO === "") {
    console.warn("Warning: MANIFEST_URL not set or has no repo name, skipping XML manifest parsing");
  }
  else {
    const branches = await getBranches();

    await Promise.all(
      branches.map(async (branch) => {
        const content = await getFileContent(branch);
        if (content != null && content !== "") {
          const projects = extractProjectNames(content);
          for (const p of projects) {
            const b = p.revision != null && p.revision !== "" ? p.revision : branch;
            const key = `${p.name}:${b}`;
            githubProjects.set(key, { name: p.name, url: p.url, branch: b });
          }
          console.log(`Branch ${branch}: ${projects.length} projects`);
        }
        else {
          console.log(`Branch ${branch}: no manifest found`);
        }
      }),
    );
  }

  const extraNames = (EXTRAS ?? "")
    .split(",")
    .map(name => name.trim())
    .filter(Boolean)
    .map((nameStr) => {
      // Split repo identifier and branch: "owner/repo:branch", "repo:branch", or "repo"
      const colonIdx = nameStr.indexOf(":");
      const repoId = colonIdx >= 0 ? nameStr.slice(0, colonIdx) : nameStr;
      const b = colonIdx >= 0 ? nameStr.slice(colonIdx + 1) : (BRANCH != null && BRANCH !== "" ? BRANCH : "");

      // If repoId contains "/", it's "owner/repo"; otherwise use REPO_OWNER
      let repoName: string;
      let url: string;
      if (repoId.includes("/")) {
        repoName = repoId.split("/").pop()!;
        url = `https://github.com/${repoId}`;
      }
      else {
        repoName = repoId;
        url = `https://github.com/${REPO_OWNER ?? MANIFEST_OWNER}/${repoId}`;
      }
      return { name: repoName, url, branch: b };
    });

  for (const extra of extraNames) {
    const key = `${extra.name}:${extra.branch}`;
    githubProjects.set(key, extra);
  }

  console.log(`\nGitHub: ${githubProjects.size} unique projects`);

  const cnbRepos = await getCnbRepos();
  const cnbNames = new Set(cnbRepos);
  console.log(`CNB: ${cnbNames.size} repos`);

  // Strip branches from githubProjects for CNB comparison
  const githubRepoNames = new Set(Array.from(githubProjects.values()).map(p => p.name));
  const toDelete = Array.from(cnbNames).filter(n => !githubRepoNames.has(n));
  await Bun.write("out/delete_repo.txt", toDelete.join(", "));

  const nvcheckerConfig = generateNvcheckerConfig(Array.from(githubProjects.values()));
  const nvcheckerDir = `assets/nvchecker-${NVCHECKER_OWNER}`;
  await Bun.$`mkdir -p ${nvcheckerDir}`;
  await Bun.write(`${nvcheckerDir}/config.toml`, nvcheckerConfig);
  await Bun.write(`${nvcheckerDir}/keyfile.toml`, generateKeyfile());

  console.log(`\nTo delete: ${toDelete.length} repos`);
  console.log(`nvchecker config written to ${nvcheckerDir}/config.toml`);

  await runNvchecker();

  const changedRepoKeys = await getChangedRepos();
  const changedRepos = changedRepoKeys.map((key) => {
    const project = githubProjects.get(key);
    if (project == null)
      return key;
    // For non-GitHub repos (e.g. GitLab), output the full URL:branch
    if (!project.url.startsWith("https://github.com/")) {
      return project.branch !== "" ? `${project.url}:${project.branch}` : project.url;
    }
    return key;
  });
  await Bun.write("out/change_repo.txt", changedRepos.join(", "));

  console.log(`\nChanged repos: ${changedRepos.length}`);
  console.log("Results written to out/change_repo.txt and out/delete_repo.txt");
}

void main();
