export function createUniqeIdGenerator(start: number = 0) {
  return () => start++;
}
