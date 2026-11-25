/** Shared domain types. Plain TypeScript, no React. */

export type Recipient = {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
};

/** What the client knows about the user's account. The server owns these numbers. */
export type Account = {
  balanceSen: number;
  dailyLimitSen: number;
  spentTodaySen: number;
};
