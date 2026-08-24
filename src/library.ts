import {
  availableCopies,
  copiesHeldBy,
  type Catalogue,
  type Copy,
} from "./catalogue.ts";
import { fineFor } from "./fines.ts";
import { allowanceFor, type Member } from "./members.ts";

const DAY = 24 * 60 * 60 * 1000;

export type Refusal =
  | "no_copies"
  | "at_limit"
  | "fines_owed"
  | "already_holding";

export type LendResult =
  | { ok: true; copy: Copy }
  | { ok: false; reason: Refusal };

export type Library = {
  catalogue: Catalogue;
  members: Map<string, Member>;
  /** Unpaid fines, in pence, by member id. */
  owed: Map<string, number>;
};

/**
 * Lend a copy of a title to a member.
 *
 * The order of the checks is deliberate and is the thing most people get wrong
 * when they change this: availability is checked first, so a member who is
 * over their limit is told the book is out rather than being told off, when
 * the book being out is the fact they can actually act on.
 */
export function lend(
  library: Library,
  memberId: string,
  isbn: string,
  now: Date = new Date()
): LendResult {
  const member = library.members.get(memberId);
  if (!member) return { ok: false, reason: "no_copies" };

  const free = availableCopies(library.catalogue, isbn);
  if (free.length === 0) return { ok: false, reason: "no_copies" };

  const held = copiesHeldBy(library.catalogue, memberId);
  if (held.some((copy) => copy.isbn === isbn)) {
    return { ok: false, reason: "already_holding" };
  }

  const allowance = allowanceFor(member);
  if (held.length >= allowance.limit) return { ok: false, reason: "at_limit" };

  const owed = library.owed.get(memberId) ?? 0;
  if (owed > allowance.fineCeiling) return { ok: false, reason: "fines_owed" };

  const copy = free[0];
  copy.lentTo = memberId;
  copy.lentAt = now.toISOString();
  copy.dueAt = new Date(now.getTime() + allowance.loanDays * DAY).toISOString();

  return { ok: true, copy };
}

export type ReturnResult =
  | { ok: true; fine: number }
  | { ok: false; reason: "not_lent" | "unknown_copy" };

/** Take a copy back, and charge for it if it is late. */
export function receive(
  library: Library,
  copyId: string,
  now: Date = new Date()
): ReturnResult {
  const copy = library.catalogue.copies.get(copyId);
  if (!copy) return { ok: false, reason: "unknown_copy" };
  if (copy.lentTo === null) return { ok: false, reason: "not_lent" };

  const book = library.catalogue.books.get(copy.isbn);
  const fine = book ? fineFor(copy, book, now) : 0;

  if (fine > 0) {
    const owed = library.owed.get(copy.lentTo) ?? 0;
    library.owed.set(copy.lentTo, owed + fine);
  }

  copy.lentTo = null;
  copy.lentAt = null;
  copy.dueAt = null;

  return { ok: true, fine };
}
