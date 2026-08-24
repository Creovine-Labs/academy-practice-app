# Practice app

A small library lending service. It is here for one reason: in week one you
point Claude Code or Codex at code you have never seen and ask it to explain
something.

It is deliberately not the app you build in the lessons. The skill being
practised is reading unfamiliar code with an agent, and you cannot practise
that on code you wrote yourself.

## Run it

```bash
npm install
npm test
```

## What it does

Members borrow copies of a book. A copy is lent for a fixed loan period. A
member who is over their limit, or who owes fines above a threshold, cannot
borrow. Returning late accrues a fine per day, capped at the replacement cost
of the book.

## Where things are

| File | What is in it |
| --- | --- |
| `src/library.ts` | The lending rules. Start here. |
| `src/fines.ts` | How a late return turns into money owed. |
| `src/members.ts` | Membership tiers and what each is allowed. |
| `src/catalogue.ts` | Books, copies, and which copies are out. |
| `src/library.test.ts` | What the rules are supposed to do. |

## Your task, week one

Open this folder in VS Code, run your agent against it, and ask it one question
about the code. A good question is one you genuinely cannot answer by looking
at a single file, for example:

- Why can a gold member with an unpaid fine still borrow, when a standard
  member cannot?
- What happens if a book is returned twice?
- Where is the loan period actually decided?

Post a screenshot of its answer. You are not marked on the answer being right.
You are marked on having run the thing and asked something real.
