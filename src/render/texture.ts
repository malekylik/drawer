export enum TextureFiltering {
  NEAREST,
  LINEAR,
}

export enum TextureFormat {
  RGB,
  RGBA,
  RGBA8UI,
  RGBA_INTEGER,
  R8,
  RED,
}

export enum TextureType {
  UNSIGNED_BYTE,
}

export enum TextureUnit {
  TEXTURE0 = 0,
  TEXTURE1,
  TEXTURE2,
}

function convertToGLTextureFiltering(gl: WebGLRenderingContext | WebGL2RenderingContext, filering: TextureFiltering): number {
  switch (filering) {
  case TextureFiltering.NEAREST: return gl.NEAREST;
  case TextureFiltering.LINEAR: return gl.LINEAR;
  }

  return 0;
}

function convertToGLTextureFormat(gl: WebGL2RenderingContext, format: TextureFormat): number {
  switch (format) {
  case TextureFormat.R8: return gl.R8;
  case TextureFormat.RED: return gl.RED;
  case TextureFormat.RGB: return gl.RGB;
  case TextureFormat.RGBA: return gl.RGBA;
  case TextureFormat.RGBA8UI: return gl.RGBA8UI;
  case TextureFormat.RGBA_INTEGER: return gl.RGBA_INTEGER;
  }

  return 0;
}

function convertToGLTextureType(gl: WebGLRenderingContext | WebGL2RenderingContext, format: TextureType): number {
  switch (format) {
  case TextureType.UNSIGNED_BYTE: return gl.UNSIGNED_BYTE;
  }

  return 0;
}

function convertToGLTextureUnit(gl: WebGLRenderingContext | WebGL2RenderingContext, index: TextureUnit): number {
  return gl.TEXTURE0 + index;
}

const DefaultFiltering = {
  min: TextureFiltering.NEAREST,
  mag: TextureFiltering.NEAREST,
};

const DefaultImageFormat = {
  internalFormat: TextureFormat.RGB,
  format: TextureFormat.RGB,
  type: TextureType.UNSIGNED_BYTE,
};

export interface TextureConfig {
  filtering?: { min?: TextureFiltering, mag?: TextureFiltering },
  imageFormat?: {
    internalFormat?: TextureFormat; // how it's used inside opengl
    format?: TextureFormat; // which type would be exposed for reading
    type?: TextureType;
  }
}

export class GLTexture {
  private config: TextureConfig;
  private texture: WebGLTexture;
  private textureUnit: TextureUnit;
  private gl: WebGL2RenderingContext;
  private width: number;
  private height: number;

  constructor(gl: WebGL2RenderingContext, width: number, height: number, data: ArrayBufferView | null, config: TextureConfig = {}) {
    this.gl = gl;
    this.texture = gl.createTexture() as WebGLTexture;
    this.textureUnit = TextureUnit.TEXTURE0;
    const filtering = { ...DefaultFiltering, ...config.filtering };
    const imageFormat = { ...DefaultImageFormat, ...config.imageFormat };
    this.config = { filtering, imageFormat };

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, convertToGLTextureFiltering(gl, filtering.min));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, convertToGLTextureFiltering(gl, filtering.mag));

    gl.texImage2D(gl.TEXTURE_2D, 0, convertToGLTextureFormat(gl, imageFormat.internalFormat), width, height, 0, convertToGLTextureFormat(gl, imageFormat.format), convertToGLTextureType(gl, imageFormat.type), data);

    gl.bindTexture(gl.TEXTURE_2D, null);

    this.width = width;
    this.height = height;
  }

  bind(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  getTextureUnit(): number {
    return this.textureUnit;
  }

  setTextureUnit(index: number): void {
    this.textureUnit = index;
  }

  setData(x: number, y: number, width: number, height: number, data: ArrayBufferView | null): void {
    const imageFormat = this.config.imageFormat!; // TODO: fix type

    this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, x, y, width, height, convertToGLTextureFormat(this.gl, imageFormat.format!), convertToGLTextureType(this.gl, imageFormat.type!), data);
  }

  putData(x: number, y: number, width: number, height: number, data: ArrayBufferView | null): void {
    const imageFormat = this.config.imageFormat!; // TODO: fix type

    this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, x, y, width, height, convertToGLTextureFormat(this.gl, imageFormat.format!), convertToGLTextureType(this.gl, imageFormat.type!), data);
  }

  getGLTexture(): WebGLTexture {
    return this.texture;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  activeTexture(): void {
    this.gl.activeTexture(convertToGLTextureUnit(this.gl, this.textureUnit));
  }
}
