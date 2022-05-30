import { GLProgram } from './shader';

export const ShaderStoreMaxSize = 32;

export enum ShaderProgramIndex {
  texture = 0,
  square = 1,
  circle = 2,
  text = 3,
}

export class ShaderStore {
  private store: Array<GLProgram>;

  constructor () {
    this.store = new Array(ShaderStoreMaxSize).fill(null);
  }

  setProgram(index: number, program: GLProgram) {
    this.store[index] = program;
  }

  getProgram(index: number) {
    return this.store[index];
  }
}

let shaderStore = new ShaderStore();

export { shaderStore };
