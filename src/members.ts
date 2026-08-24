/** Membership tiers. What somebody is allowed depends on which one they hold. */
export type Tier = "standard" | "gold" | "staff";

export type Member = {
  id: string;
  name: string;
  tier: Tier;
  joinedAt: string;
};

type Allowance = {
  /** How many copies may be out at once. */
  limit: number;
  /** Days a copy may be kept before it is late. */
  loanDays: number;
  /**
   * Fines owed above this block further borrowing.
   *
   * Gold members get headroom on purpose: the tier is sold on convenience, and
   * a member who forgot one book should not be locked out of the library on
   * their way to a meeting. Staff are never blocked by fines, because a member
   * of staff being unable to fetch a book is the library's problem.
   */
  fineCeiling: number;
};

const ALLOWANCE: Record<Tier, Allowance> = {
  standard: { limit: 3, loanDays: 14, fineCeiling: 5_00 },
  gold: { limit: 10, loanDays: 28, fineCeiling: 25_00 },
  staff: { limit: 25, loanDays: 90, fineCeiling: Number.POSITIVE_INFINITY },
};

export function allowanceFor(member: Member): Allowance {
  return ALLOWANCE[member.tier];
}
