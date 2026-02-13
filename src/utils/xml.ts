export function extractProjectNames(xml: string): string[] {
  const names: string[] = [];
  const regex = /<project[^>]+name="([^"]+)"/g;
  for (const match of xml.matchAll(regex)) {
    names.push(match[1]!);
  }
  return names;
}
