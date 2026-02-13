import { CNB_TOKEN, GITHUB_TOKEN } from "@/src/config";

export function getGitHubHeaders(): Record<string, string> {
  if (GITHUB_TOKEN) {
    return { Authorization: `Bearer ${GITHUB_TOKEN}` };
  }
  return {};
}

export function getCnbHeaders(): Record<string, string> {
  return {
    Accept: "application/vnd.cnb.api+json",
    Authorization: CNB_TOKEN ?? "",
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);

    if (res.status === 403 || res.status === 429) {
      const resetHeader = res.headers.get("x-ratelimit-reset");
      const retryAfter = res.headers.get("retry-after");

      let waitMs = 1000 * (i + 1);
      if (resetHeader) {
        waitMs = Math.max(0, Number(resetHeader) * 1000 - Date.now());
      }
      else if (retryAfter) {
        waitMs = Number(retryAfter) * 1000;
      }

      if (i < maxRetries - 1) {
        console.log(`Rate limited, waiting ${Math.ceil(waitMs / 1000)}s...`);
        await sleep(waitMs);
        continue;
      }
    }

    return res;
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
