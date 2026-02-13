import { FILE_PATH, REPO_NAME, REPO_OWNER } from "@/src/config";
import { fetchWithRetry, getGitHubHeaders } from "@/src/utils/http";

export async function getBranches(): Promise<string[]> {
  const res = await fetchWithRetry(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches?per_page=100`,
    { headers: getGitHubHeaders() },
  );
  if (!res.ok)
    throw new Error(`Failed to fetch branches: ${res.status}`);
  const data = (await res.json()) as { name: string }[];
  return data.map(b => b.name);
}

export async function getFileContent(branch: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${branch}/${FILE_PATH}`;
  const res = await fetchWithRetry(url, { headers: getGitHubHeaders() });
  if (!res.ok)
    return null;
  return res.text();
}
