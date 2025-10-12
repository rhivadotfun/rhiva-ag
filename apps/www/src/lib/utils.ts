import { format } from "util";

export const truncateString = (value: string, length: number = 4) =>
  format("%s...%s", value.slice(0, length), value.slice(-length));
