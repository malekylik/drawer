export function binaryFind<T>(arr: Array<T>, start: number, end: number, compare: (currentValue: T) => number) {
  let i = start;
  let j = Math.min(end, arr.length);
  let mid = 0;

  for (; j - i > 1;) {
    mid = (i + j) >>> 1;

    let compareValue = compare(arr[mid] as T);

    if (compareValue === 0) return arr[mid];
    if (compareValue < 0) {
      j = mid;
    } else {
      i = mid;
    }
  }

  return;
}
