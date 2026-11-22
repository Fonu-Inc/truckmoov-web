/** "oil_change" → "Oil Change" — display label for a maintenance service category slug. */
export function formatMaintenanceServiceLabel(value: string) {
  return value.replace(
    /_/g,
    " ",
  ).replace(
    /\b\w/g,
    letter => letter.toUpperCase(),
  );
}
