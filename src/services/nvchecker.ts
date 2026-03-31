import { GITHUB_TOKEN, GITLAB_TOKEN, NVCHECKER_OWNER } from "@/src/config";

const TRAILING_SLASH_RE = /\/$/;

export function generateNvcheckerConfig(repos: { name: string; url: string; branch: string }[]): string {
  const header = `[__config__]
oldver = "old_ver.json"
newver = "new_ver.json"
keyfile = "keyfile.toml"
`;
  const entries = repos
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((repo) => {
      const { name, url, branch } = repo;
      const key = branch !== "" ? `${name}:${branch}` : name;

      let config = `["${key}"]\n`;
      if (url.startsWith("https://github.com/")) {
        const repoPath = url.replace("https://github.com/", "").replace(TRAILING_SLASH_RE, "");
        config += `source = "github"\ngithub = "${repoPath}"`;
      }
      else if (url.startsWith("https://gitlab.com/")) {
        const repoPath = url.replace("https://gitlab.com/", "").replace(TRAILING_SLASH_RE, "");
        config += `source = "gitlab"\ngitlab = "${repoPath}"`;
      }
      else {
        config += `source = "git"\ngit = "${url}"\nuse_commit = true`;
      }

      if (branch !== "") {
        config += `\nbranch = "${branch}"`;
      }
      return config;
    })
    .join("\n\n");
  return `${header}\n${entries}\n`;
}

export function generateKeyfile(): string {
  let content = `[keys]\ngithub = "${GITHUB_TOKEN ?? ""}"\n`;
  if (GITLAB_TOKEN != null && GITLAB_TOKEN !== "") {
    content += `gitlab = "${GITLAB_TOKEN}"\n`;
  }
  return content;
}

export async function runNvchecker(): Promise<void> {
  const nvcheckerDir = `assets/nvchecker-${NVCHECKER_OWNER}`;
  const configPath = `${nvcheckerDir}/config.toml`;

  console.log("\nRunning nvchecker...");
  await Bun.$`nvchecker -c ${configPath}`;

  console.log("Running nvcmp...");
  await Bun.$`nvcmp -c ${configPath} -j > ${nvcheckerDir}/changes.json`;

  console.log("Running nvtake...");
  await Bun.$`nvtake -c ${configPath} --all`;

  console.log("nvchecker commands completed");
}

export async function getChangedRepos(): Promise<string[]> {
  const content = await Bun.file(`assets/nvchecker-${NVCHECKER_OWNER}/changes.json`).text();
  const changes = JSON.parse(content) as { delta: string; name: string }[];
  return changes
    .filter(c => c.delta === "old" || c.delta === "new" || c.delta === "added")
    .map(c => c.name);
}
