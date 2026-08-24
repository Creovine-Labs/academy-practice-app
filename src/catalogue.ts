/** A title the library owns, and the physical copies of it. */
export type Book = {
  isbn: string;
  title: string;
  author: string;
  /** What it costs to replace, in pence. Caps the fine. */
  replacementCost: number;
};

export type Copy = {
  id: string;
  isbn: string;
  /** Null when it is on the shelf. */
  lentTo: string | null;
  /** When it went out, and when it is due back. */
  lentAt: string | null;
  dueAt: string | null;
};

export type Catalogue = {
  books: Map<string, Book>;
  copies: Map<string, Copy>;
};

export function emptyCatalogue(): Catalogue {
  return { books: new Map(), copies: new Map() };
}

/** Copies of a title that nobody has out. */
export function availableCopies(catalogue: Catalogue, isbn: string): Copy[] {
  return [...catalogue.copies.values()].filter(
    (copy) => copy.isbn === isbn && copy.lentTo === null
  );
}

/** Everything a given member currently holds. */
export function copiesHeldBy(catalogue: Catalogue, memberId: string): Copy[] {
  return [...catalogue.copies.values()].filter((copy) => copy.lentTo === memberId);
}
