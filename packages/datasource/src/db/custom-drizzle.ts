import { type SQL, sql, type Column } from "drizzle-orm";

// Todo: support nested jsonb types
export const updateJSON = <T extends Column, U extends T["_"]["data"]>(
  column: T,
  value: Partial<U>,
) => sql`${column} || ${JSON.stringify(value)}::jsonb`;

export const add = <T extends Array<Column | SQL<unknown> | SQL.Aliased>>(
  ...[a, b]: T
) => sql`${a}::decimal + ${b}::decimal`;

export const int = <T extends Column | SQL<unknown> | SQL.Aliased>(column: T) =>
  sql`${column}::int`;

export const caseWhen = <T extends SQL<unknown>, U>(when: T, then: U) =>
  sql`CASE WHEN ${when} THEN ${then} END`;

export const coalesce = <T extends Column | SQL.Aliased | SQL<unknown>>(
  column: T,
  value: number | string,
) => sql`COALESCE(${column}, ${value})`;

export const day = <T extends Column>(column: T) =>
  sql`date_trunc('day', ${column})`.as(column._.name);

export const mul = <T extends Column | SQL<unknown> | SQL.Aliased>(
  column: T,
  multiplier: number,
) => sql`${column}::decimal * ${multiplier}::decimal`;
