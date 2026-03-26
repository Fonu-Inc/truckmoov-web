export function parseCsvToObjects(csvText: string): Record<string, string>[] {
  const [headerLine, ...dataLines] = csvText.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return dataLines
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
}
