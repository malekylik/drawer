export function interpretAsInt32(a: number, b: number, c: number, d: number) {
  return (a) | (b << 8) | (c as number << 16) | (d << 24);
}
