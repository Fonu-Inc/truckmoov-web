export type CheckboxFilterValue = Record<string, string[]>;

/** Whether `option` passes the `title` group of a checkbox filter; an empty group passes everything. */
export function passesFilter(value: CheckboxFilterValue, title: string, option: string) {
  return !value[title]?.length || value[title].includes(option);
}
