import { GLTexture } from './texture';

export enum BufferAttacment {
  color = 0,
  depth,
}

export interface BufferColorAttachment {
  type: BufferAttacment.color;
  buffer: GLTexture;
  name?: string;
}

export interface BufferDepthAttachment {
  type: BufferAttacment.depth;
  buffer: WebGLRenderbuffer;
}

export type BufferAttachmentOption = BufferColorAttachment | BufferDepthAttachment;

export class GLFramebuffer {
  private gl: WebGL2RenderingContext;
  private frameBuffer: WebGLFramebuffer;
  private colorAttachmentCount: number;
  private colorAttachmentMap: Map<string, number>;
  private options: Array<BufferAttachmentOption>;

  constructor (gl: WebGL2RenderingContext, options: Array<BufferAttachmentOption>) {
    this.colorAttachmentCount = 0;
    this.colorAttachmentMap = new Map();

    const frameBuffer = gl.createFramebuffer() as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    for (let i = 0; i < options.length; i++) {
      const option = options[i] as BufferAttachmentOption;

      if (option.type === BufferAttacment.color) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + this.colorAttachmentCount, gl.TEXTURE_2D, option.buffer.getGLTexture(), 0);

        if (option.name) {
          this.colorAttachmentMap.set(option.name, this.colorAttachmentCount);
        }

        this.colorAttachmentCount += 1;
      } else {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, option.buffer);
      }
    }

    gl.drawBuffers((new Array(this.colorAttachmentCount).fill(0)).map((_, i) => gl.COLOR_ATTACHMENT0 + i));

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.frameBuffer = frameBuffer;
    this.gl = gl;
    this.options = options;

    if (this.colorAttachmentCount === 0) {
      console.warn('Framebuffer should have at least one color attachment');
    }
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
  }

  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  clearDepthBuffer() {
    this.gl.clearBufferfi(this.gl.DEPTH_STENCIL, 0, 1.0, 0); // TODO: why depth = 1.0
  }

  // TODO: think how to make logic for selection func for clearing (clearBufferfv, clearBufferuiv, etc) base on texture type
  clearColorBufferFloat(name: string, r: number, g: number, b: number, a: number) {
    let location = this.colorAttachmentMap.get(name);

    if (location === undefined) {
      console.warn('Unknown color attachment name');
      location = -1;
    }

    this.gl.clearBufferfv(this.gl.COLOR, location, new Float32Array([r, g, b, a]));
  }

  // TODO: think how to make logic for selection func for clearing (clearBufferfv, clearBufferuiv, etc) base on texture type
  clearColorBufferUInt(name: string, r: number, g: number, b: number, a: number) {
    let location = this.colorAttachmentMap.get(name);

    if (location === undefined) {
      console.warn('Unknown color attachment name');
      location = -1;
    }

    this.gl.clearBufferuiv(this.gl.COLOR, location, new Uint32Array([r, g, b, a]));
  }

  getGLFramebuffer() {
    return this.frameBuffer;
  }

  getAttachmentReader(name: string) {
    let location = this.colorAttachmentMap.get(name);
    const texutre = this.options.filter(option => option.type === BufferAttacment.color)[location ?? 0]?.buffer as GLTexture;
    const width = texutre.getWidth();
    const height = texutre.getHeight();

    const gl = this.gl;

    const readPixels = (x: number, y: number, width: number, height: number) => {
      if (location === undefined) {
        console.warn('Unknown color attachment name');
        location = -1;
      }

      const b = new Uint8Array(width * height * 4);

      gl.readBuffer(gl.COLOR_ATTACHMENT0 + location);
      gl.readPixels(x, y, width, height, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, b);

      return b;
    };

    return {
      bind: () => this.bind(),
      readBuffer: () => readPixels(0, 0, width, height), readPixel: (x: number, y: number) => readPixels(x, y, 1, 1),
      unbind: () => this.unbind(),
    };
  }
}
