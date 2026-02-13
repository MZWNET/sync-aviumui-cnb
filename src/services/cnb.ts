import { CNB_ORG } from "@/src/config";
import { getCnbHeaders, sleep } from "@/src/utils/http";

export async function getCnbRepos(): Promise<string[]> {
  const url = `https://api.cnb.cool/${CNB_ORG}/-/repos?filter_type=public&desc=false&descendant=all`;
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, { headers: getCnbHeaders() });
    if (res.ok) {
      const data = (await res.json()) as { name: string }[];
      return data.map(r => r.name);
    }
    if (i < maxRetries - 1) {
      console.log(`CNB API returned ${res.status}, retrying (${i + 1}/${maxRetries})...`);
      await sleep(1000 * (i + 1));
    }
    else {
      throw new Error(`Failed to fetch CNB repos after ${maxRetries} attempts: ${res.status}`);
    }
  }

  throw new Error("Unreachable");
}
