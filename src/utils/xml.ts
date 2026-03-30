const regex = /<project[^>]+name="([^"]+)"/g;

export function extractProjectNames(xml: string): string[] {
  const names: string[] = [];
  for (const match of xml.matchAll(regex)) {
    names.push(match[1]!);
  }
  return names;
}
