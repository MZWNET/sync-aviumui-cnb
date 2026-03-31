export const MANIFEST_URL = Bun.env.MANIFEST_URL;
if (MANIFEST_URL == null || MANIFEST_URL === "") {
  throw new Error("MANIFEST_URL is not set.");
}

// Ensure the URL doesn't have a trailing slash for consistent parsing
const _manifestUrlStr = MANIFEST_URL.endsWith("/") ? MANIFEST_URL.slice(0, -1) : MANIFEST_URL;
const _urlParts = _manifestUrlStr.split("/");

export const MANIFEST_REPO = _urlParts.pop() ?? "";
export const MANIFEST_OWNER = _urlParts.pop() ?? "";

export const REPO_OWNER = Bun.env.REPO_OWNER;

export const FILE_PATH = "snippets/avium.xml";

export const GITHUB_TOKEN = Bun.env.GITHUB_TOKEN;
export const GITLAB_TOKEN = Bun.env.GITLAB_TOKEN;
export const EXTRAS = Bun.env.EXTRAS;
export const CNB_TOKEN = Bun.env.CNB_TOKEN;
export const CNB_ORG = Bun.env.CNB_ORG;
export const BRANCH = Bun.env.BRANCH;
