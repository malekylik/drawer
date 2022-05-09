const toRaduansCof = Math.PI / 180.0;

export function toRadians(angle: number) {
  return angle * toRaduansCof;
}

export function toDegrees(angle: number) {
  return angle / toRaduansCof;
}

export function clamp(n: number, l: number, u: number) {
  return Math.min(Math.max(n, l), u);
}

export function smootsptep(edge0: number, edge1: number, x: number) {
  let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
