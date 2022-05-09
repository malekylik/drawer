export interface Vec2 {
  x: number; y: number;
}

export interface Vec3 {
  x: number; y: number; z: number;
}

export interface Vec4 {
  x: number; y: number; z: number; w: number;
}

export function createVec2(x: number, y: number): Vec2 {
  return ({
    x, y
  });
}

export function createVec3(x: number, y: number, z: number): Vec3 {
  return ({
    x, y, z
  });
}

export function createVec4(x: number, y: number, z: number, w: number): Vec4 {
  return ({
    x, y, z, w
  });
}
