import { BRANCH, FILE_PATH, MANIFEST_OWNER, MANIFEST_REPO } from "@/src/config";
import { fetchWithRetry, getGitHubHeaders } from "@/src/utils/http";

export async function getBranches(): Promise<string[]> {
  if (BRANCH != null && BRANCH !== "") {
    return [BRANCH];
  }
  const res = await fetchWithRetry(
    `https://api.github.com/repos/${MANIFEST_OWNER}/${MANIFEST_REPO}/branches?per_page=100`,
    { headers: getGitHubHeaders() },
  );
  if (!res.ok)
    throw new Error(`Failed to fetch branches: ${res.status}`);
  const data = (await res.json()) as { name: string }[];
  return data.map(b => b.name);
}

export async function getFileContent(branch: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${MANIFEST_OWNER}/${MANIFEST_REPO}/${branch}/${FILE_PATH}`;
  const res = await fetchWithRetry(url, { headers: getGitHubHeaders() });
  if (res.ok) {
    return res.text();
  }

  const fallbackUrl = `https://raw.githubusercontent.com/${MANIFEST_OWNER}/${MANIFEST_REPO}/${branch}/snippets/custom.xml`;
  const fallbackRes = await fetchWithRetry(fallbackUrl, { headers: getGitHubHeaders() });
  if (fallbackRes.ok) {
    console.log(`Fallback to snippets/custom.xml on branch ${branch}`);
    return fallbackRes.text();
  }

  return null;
}
