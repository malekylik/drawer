import { createGLProgram } from './gl-api';

interface BufferCache {
  location: WebGLUniformLocation | null;
  value: unknown;
}

export class GLProgram {
  private program: WebGLProgram;
  private uniformBuffer: Map<string, BufferCache>;
  private gl: WebGL2RenderingContext;

  constructor (gl: WebGL2RenderingContext, vertShader: WebGLShader, fragShader: WebGLShader) {
    this.program = createGLProgram(gl, vertShader, fragShader) as WebGLProgram;
    this.uniformBuffer = new Map();
    this.gl = gl;
  }

  useProgram(): void {
    this.gl.useProgram(this.program);
  }

  setTextureUniform(location: string, texture: number): void {
    this.setUniform1i(location, texture);
  }

  setUniform1i(location: string, value: number): void {
    let cache = this.getCache(location);

    this.gl.uniform1i(cache.location, value);
  }

  setUniform1f(location: string, value: number): void {
    let cache = this.getCache(location);

    this.gl.uniform1f(cache.location, value);
  }

  setUniform1fv(location: string, x: number, y: number, z: number, w: number): void {
    let cache = this.getCache(location);

    const value = new Float32Array(4);
    value[0] = x;
    value[1] = y;
    value[2] = z;
    value[3] = w;

    this.gl.uniform4fv(cache.location, value);
  }

  setMatrix44(location: string, matrix: Float32Array) {
    let cache = this.getCache(location);

    this.gl.uniformMatrix4fv(cache.location, false, matrix);
  }

  private getCache(location: string): BufferCache {
    let cache = this.uniformBuffer.get(location);

    if (!cache) {
      cache = {
        location: this.gl.getUniformLocation(this.program, location),
        value: undefined,
      };
    }

    return cache;
  }
}
