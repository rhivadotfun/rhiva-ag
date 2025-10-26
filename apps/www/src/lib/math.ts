export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return value / total;
}
