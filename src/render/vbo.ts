export enum AttribType {
  FLOAT,
}

export function convertToGLAttribType(gl: WebGLRenderingContext | WebGL2RenderingContext, type: AttribType): number {
  switch (type) {
  case AttribType.FLOAT: return gl.FLOAT;
  }

  return 0;
}

export function convertToSize(gl: WebGLRenderingContext | WebGL2RenderingContext, type: AttribType): number {
  switch (type) {
  case gl.FLOAT:
  case AttribType.FLOAT: return Float32Array.BYTES_PER_ELEMENT;
  }

  return 0;
}

export interface AttribLayout {
  type: AttribType;
  componentsCount: number;
}

interface PrivateAttribLayout {
  type: number;
  offset: number;
  componentsCount: number;
}

export class GLVBO {
  private vbo: WebGLBuffer;
  private layout: Array<PrivateAttribLayout>;
  private stride: number;
  private gl: WebGL2RenderingContext;

  constructor (gl: WebGL2RenderingContext, layout: Array<AttribLayout>) {
    this.gl = gl;
    this.vbo = gl.createBuffer() as WebGLBuffer;

    let offset = 0;
    this.layout = layout.map((v) => {
      const currentOffset = offset;
      offset += convertToSize(gl, v.type) * v.componentsCount;

      return ({
        type: convertToGLAttribType(gl, v.type),
        componentsCount: v.componentsCount,
        offset: currentOffset,
      });
    });

    this.stride = 0;
    if (layout.length) {
      const layoutItem = this.layout[layout.length - 1] as PrivateAttribLayout;
      this.stride = layoutItem.offset + convertToSize(gl, layoutItem.type) * layoutItem.componentsCount;
    }
  }

  bind() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
  }

  activateAttribPointer(index: number): void {
    if (index >= 0 && index < this.layout.length) {
      this.setAttribPointer(index);
      this.gl.enableVertexAttribArray(index);
    }
  }

  activateAllAttribPointers(): void {
    this.setAllAttribPointers();

    for (let i = 0; i < this.layout.length; i++) {
      this.gl.enableVertexAttribArray(i);
    }
  }

  setData(data: BufferSource): void {
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }

  private setAttribPointer(index: number): void {
    if (index >= 0 && index < this.layout.length) {
      const layoutItem = this.layout[index] as PrivateAttribLayout;
      this.gl.vertexAttribPointer(index, layoutItem.componentsCount, layoutItem.type, false, this.stride, layoutItem.offset);
    }
  }

  private setAllAttribPointers(): void {
    for (let i = 0; i < this.layout.length; i++) {
      const layoutItem = this.layout[i] as PrivateAttribLayout;
      this.gl.vertexAttribPointer(i, layoutItem.componentsCount, layoutItem.type, false, this.stride, layoutItem.offset);
    }
  }
}
