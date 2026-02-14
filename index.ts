import { mkdir } from "node:fs/promises";
import { EXTRAS } from "@/src/config";
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
  const branches = await getBranches();
  console.log(`Found ${branches.length} branches`);

  const githubNames: string[] = [];

  await Promise.all(
    branches.map(async (branch) => {
      const content = await getFileContent(branch);
      if (content) {
        const names = extractProjectNames(content);
        githubNames.push(...names);
        console.log(`Branch ${branch}: ${names.length} projects`);
      }
      else {
        console.log(`Branch ${branch}: no avium.xml found`);
      }
    }),
  );

  const extraNames = (EXTRAS ?? "")
    .split(",")
    .map(name => name.trim())
    .filter(Boolean);
  if (extraNames.length > 0) {
    githubNames.push(...extraNames);
  }

  const githubNameSet = new Set(githubNames);

  console.log(`\nGitHub: ${githubNameSet.size} unique projects`);

  const cnbRepos = await getCnbRepos();
  const cnbNames = new Set(cnbRepos);
  console.log(`CNB: ${cnbNames.size} repos`);

  const toDelete = Array.from(cnbNames).filter(n => !githubNameSet.has(n));

  await mkdir("out", { recursive: true });
  await Bun.write("out/delete_repo.txt", JSON.stringify(toDelete));

  const nvcheckerConfig = generateNvcheckerConfig(Array.from(githubNameSet));
  await Bun.write("assets/nvchecker/config.toml", nvcheckerConfig);
  await Bun.write("assets/nvchecker/keyfile.toml", generateKeyfile());

  console.log(`\nTo delete: ${toDelete.length} repos`);
  console.log("nvchecker config written to assets/nvchecker/config.toml");

  await runNvchecker();

  const changedRepos = await getChangedRepos();
  await Bun.write("out/change_repo.txt", JSON.stringify(changedRepos));

  console.log(`\nChanged repos: ${changedRepos.length}`);
  console.log("Results written to out/change_repo.txt and out/delete_repo.txt");
}

main();
