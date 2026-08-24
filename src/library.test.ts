import assert from "node:assert/strict";
import { test } from "node:test";

import { emptyCatalogue, type Catalogue } from "./catalogue.ts";
import { fineFor } from "./fines.ts";
import { lend, receive, type Library } from "./library.ts";
import type { Member, Tier } from "./members.ts";

const DAY = 24 * 60 * 60 * 1000;
const START = new Date("2026-01-01T09:00:00.000Z");

function shelf(copies: number): Catalogue {
  const catalogue = emptyCatalogue();
  catalogue.books.set("978", {
    isbn: "978",
    title: "The Pragmatic Programmer",
    author: "Hunt and Thomas",
    replacementCost: 30_00,
  });
  for (let i = 0; i < copies; i++) {
    catalogue.copies.set(`c${i}`, {
      id: `c${i}`,
      isbn: "978",
      lentTo: null,
      lentAt: null,
      dueAt: null,
    });
  }
  return catalogue;
}

function library(tier: Tier = "standard", copies = 2): Library {
  const member: Member = {
    id: "m1",
    name: "Ada",
    tier,
    joinedAt: START.toISOString(),
  };
  return {
    catalogue: shelf(copies),
    members: new Map([["m1", member]]),
    owed: new Map(),
  };
}

test("a member can borrow a copy that is on the shelf", () => {
  const lib = library();
  const result = lend(lib, "m1", "978", START);
  assert.equal(result.ok, true);
});

test("the loan period comes from the tier, not from the book", () => {
  const standard = library("standard");
  const gold = library("gold");

  const a = lend(standard, "m1", "978", START);
  const b = lend(gold, "m1", "978", START);
  assert.ok(a.ok && b.ok);

  assert.equal(a.copy.dueAt, new Date(START.getTime() + 14 * DAY).toISOString());
  assert.equal(b.copy.dueAt, new Date(START.getTime() + 28 * DAY).toISOString());
});

test("nobody may hold two copies of the same title", () => {
  const lib = library("gold");
  lend(lib, "m1", "978", START);
  const second = lend(lib, "m1", "978", START);
  assert.deepEqual(second, { ok: false, reason: "already_holding" });
});

test("a return inside the grace period costs nothing", () => {
  const lib = library();
  const out = lend(lib, "m1", "978", START);
  assert.ok(out.ok);

  const twoDaysLate = new Date(Date.parse(out.copy.dueAt!) + 2 * DAY);
  const back = receive(lib, out.copy.id, twoDaysLate);
  assert.deepEqual(back, { ok: true, fine: 0 });
});

test("a fine never exceeds what the book costs to replace", () => {
  const lib = library();
  const out = lend(lib, "m1", "978", START);
  assert.ok(out.ok);

  const aYearLate = new Date(Date.parse(out.copy.dueAt!) + 365 * DAY);
  const back = receive(lib, out.copy.id, aYearLate);
  assert.ok(back.ok);
  assert.equal(back.fine, 30_00);
});

test("a copy cannot be returned twice", () => {
  const lib = library();
  const out = lend(lib, "m1", "978", START);
  assert.ok(out.ok);

  receive(lib, out.copy.id, START);
  const again = receive(lib, out.copy.id, START);
  assert.deepEqual(again, { ok: false, reason: "not_lent" });
});

test("fines block a standard member but not a member of staff", () => {
  const standard = library("standard");
  standard.owed.set("m1", 20_00);
  assert.deepEqual(lend(standard, "m1", "978", START), {
    ok: false,
    reason: "fines_owed",
  });

  const staff = library("staff");
  staff.owed.set("m1", 20_00);
  assert.equal(lend(staff, "m1", "978", START).ok, true);
});

test("a title with no copies free is refused before any other check", () => {
  const lib = library("standard", 1);
  lend(lib, "m1", "978", START);

  const other: Member = { id: "m2", name: "Grace", tier: "standard", joinedAt: "" };
  lib.members.set("m2", other);

  assert.deepEqual(lend(lib, "m2", "978", START), {
    ok: false,
    reason: "no_copies",
  });
});

test("the grace period is measured from the due date", () => {
  const book = { isbn: "978", title: "", author: "", replacementCost: 30_00 };
  const copy = {
    id: "c0",
    isbn: "978",
    lentTo: "m1",
    lentAt: START.toISOString(),
    dueAt: new Date(START.getTime() + 14 * DAY).toISOString(),
  };
  const fourDaysLate = new Date(Date.parse(copy.dueAt) + 4 * DAY);
  assert.equal(fineFor(copy, book, fourDaysLate), 20);
});
