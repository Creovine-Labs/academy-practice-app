import type { Book, Copy } from "./catalogue.ts";

/** Pence charged for each day a copy is kept past its due date. */
const PER_DAY = 20;

/**
 * Days after the due date before anything is charged.
 *
 * A library that fines somebody for being an hour late collects very little
 * money and loses members. The grace period is why a copy returned the morning
 * after it was due costs nothing.
 */
const GRACE_DAYS = 3;

const DAY = 24 * 60 * 60 * 1000;

/**
 * What is owed on one late copy.
 *
 * Capped at the replacement cost. Past that point the library would rather
 * have the money than the book, and a fine larger than the book is one nobody
 * pays.
 */
export function fineFor(copy: Copy, book: Book, returnedAt: Date): number {
  if (!copy.dueAt) return 0;

  const late = Math.floor((returnedAt.getTime() - Date.parse(copy.dueAt)) / DAY);
  const chargeable = late - GRACE_DAYS;
  if (chargeable <= 0) return 0;

  return Math.min(chargeable * PER_DAY, book.replacementCost);
}

/** Money, for a person to read. */
export function money(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
