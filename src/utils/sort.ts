// Shared list-ordering helpers so catalogs, dropdowns, and pickers are consistently
// alphabetical instead of insertion-order (which makes long lists hard to scan).

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Returns a new array of items sorted alphabetically (natural/numeric-aware) by `.name`. */
export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => collator.compare(a.name, b.name));
}

/** Returns a new array of strings sorted alphabetically (natural/numeric-aware). */
export function sortStrings(values: string[]): string[] {
  return [...values].sort((a, b) => collator.compare(a, b));
}
