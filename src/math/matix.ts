export interface Matrix {
  n: number; // rows
  m: number; // columns
  values: Float32Array;
}

export function createMatrix(values: Array<number>, n = 4, m = 4): Matrix {
  return ({
    n: n, // rows
    m: m, // columns
    values: Float32Array.from(values.slice(0, n * m))
  });
}

export function getRawValues(matrix: Matrix): Float32Array {
  return matrix.values;
}

export function getMatrixValue(matrix: Matrix, j: number, i: number) {
  return matrix.values[i + matrix.m * j];
}

export function setMatrixValue(matrix: Matrix, j: number, i: number, value: number) {
  matrix.values[i + matrix.m * j] = value;
}

export function printMatrix(matrix: Matrix) {
  let res = '';

  for (let j = 0; j < matrix.n; j++) {
    res += `(${getMatrixValue(matrix, j, 0)}`;

    for (let i = 1; i < matrix.m; i++) {
      res += `|${getMatrixValue(matrix, j, i)}`;
    }

    res += ')\n';
  }

  return res;
}

export function createUnitMatrix(value: number) {
  return createMatrix([
    value, 0, 0, 0,
    0, value, 0, 0,
    0, 0, value, 0,
    0, 0, 0, value,
  ]);
}

export function transposeMatrix(matrix: Matrix) {
  for (let j = 0; j < matrix.m; j++) {
    for (let i = j + 1; i < matrix.n; i++) {
      const temp = getMatrixValue(matrix, j, i) as number;
      setMatrixValue(matrix, j, i, getMatrixValue(matrix, i, j) as number);
      setMatrixValue(matrix, i, j, temp);
    }
  }

  return matrix;
}

export function createPerspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
  const matrix = createUnitMatrix(0.0);
  const tan = Math.tan(fov / 2);

  setMatrixValue(matrix, 0, 0, 1 / (aspect * tan));

  setMatrixValue(matrix, 1, 1, 1 / tan);

  setMatrixValue(matrix, 2, 2, -((far + near) / (far - near)));
  setMatrixValue(matrix, 2, 3, -1);

  setMatrixValue(matrix, 3, 2, -(2 * (far * near) / (far - near)));

  return matrix;
}

export function createTranslationMatrix(x: number, y: number, z: number) {
  const matrix = createUnitMatrix(1.0);

  setMatrixValue(matrix, 0, 3, x);
  setMatrixValue(matrix, 1, 3, y);
  setMatrixValue(matrix, 2, 3, z);

  return matrix;
}

export function createScaleMatrix(x: number, y: number, z: number) {
  const matrix = createUnitMatrix(1.0);

  setMatrixValue(matrix, 0, 0, x);
  setMatrixValue(matrix, 1, 1, y);
  setMatrixValue(matrix, 2, 2, z);

  return matrix;
}

export function createRotationMatrix(a: number, b: number, g: number) {
  const matrix = createUnitMatrix(1.0);

  setMatrixValue(matrix, 0, 0, Math.cos(a) * Math.cos(b));
  setMatrixValue(matrix, 0, 1, Math.cos(a) * Math.sin(b) * Math.sin(g) - Math.sin(a) * Math.cos(g));
  setMatrixValue(matrix, 0, 2, Math.cos(a) * Math.sin(b) * Math.cos(g) + Math.sin(a) * Math.sin(g));


  setMatrixValue(matrix, 1, 0, Math.sin(a) * Math.cos(b));
  setMatrixValue(matrix, 1, 1, Math.sin(a) * Math.sin(b) * Math.sin(g) + Math.cos(a) * Math.cos(g));
  setMatrixValue(matrix, 1, 2, Math.sin(a) * Math.sin(b) * Math.cos(g) - Math.cos(a) * Math.sin(g));

  setMatrixValue(matrix, 2, 0, -Math.sin(b));
  setMatrixValue(matrix, 2, 1, Math.cos(b) * Math.sin(g));
  setMatrixValue(matrix, 2, 2, Math.cos(b) * Math.cos(g));

  return matrix;
}

export function multiplyMatrix(m1: Matrix, m2: Matrix) {
  // m1.n x m2.m
  let value = 0;
  const src = createMatrix(new Array(m1.n * m2.m).fill(0), m1.n, m2.m);

  for (let j = 0; j < m1.n; j++) {
    for (let i = 0; i < m2.m; i++) {
      value = 0;

      for (let m = 0; m < m1.m; m++) {
        value += (getMatrixValue(m1, j, m) as number) * (getMatrixValue(m2, m, i) as number);
      }

      setMatrixValue(src, j, i, value);
    }
  }

  return src;
}
