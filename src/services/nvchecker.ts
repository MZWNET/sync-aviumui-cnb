import { GITHUB_TOKEN, REPO_OWNER } from "@/src/config";

export function generateNvcheckerConfig(repos: string[]): string {
  const header = `[__config__]
oldver = "old_ver.json"
newver = "new_ver.json"
keyfile = "keyfile.toml"
`;
  const entries = repos
    .toSorted()
    .map(name => `[${name}]\nsource = "github"\ngithub = "${REPO_OWNER}/${name}"`)
    .join("\n\n");
  return `${header}\n${entries}\n`;
}

export function generateKeyfile(): string {
  return `[keys]\ngithub = "${GITHUB_TOKEN ?? ""}"\n`;
}

export async function runNvchecker(): Promise<void> {
  const configPath = "assets/nvchecker/config.toml";

  console.log("\nRunning nvchecker...");
  await Bun.$`nvchecker -c ${configPath}`;

  console.log("Running nvcmp...");
  await Bun.$`nvcmp -c ${configPath} -j > assets/nvchecker/changes.json`;

  console.log("Running nvtake...");
  await Bun.$`nvtake -c ${configPath} --all`;

  console.log("nvchecker commands completed");
}

export async function getChangedRepos(): Promise<string[]> {
  const content = await Bun.file("assets/nvchecker/changes.json").text();
  const changes = JSON.parse(content) as { delta: string; name: string }[];
  return changes
    .filter(c => c.delta === "old" || c.delta === "new" || c.delta === "added")
    .map(c => c.name);
}
