export function computeScrollProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number
): number {
  const maxScroll = scrollHeight - viewportHeight;
  if (maxScroll <= 0) return 0;
  const ratio = scrollY / maxScroll;
  return Math.min(1, Math.max(0, Number(ratio.toFixed(4))));
}
