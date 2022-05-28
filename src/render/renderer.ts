import {
  Matrix,
  createMatrix, multiplyMatrix, getMatrixValue,
  getRawValues, transposeMatrix, createUnitMatrix,
  createTranslationMatrix, createRotationMatrix, createScaleMatrix,
} from '../math/matix';
import { paitingLayer } from './const';
import { CircleComponent, LineComponent } from './components';
import { toRadians } from '../math/utils';

import { shaderStore, ShaderProgramIndex } from './shader-store';
import { GLProgram } from './shader';
import { QUAD_WITH_TEXTURE_COORD_DATA } from './const';
import { AttribType, GLVBO } from './vbo';
import { GLTexture, TextureConfig, TextureFormat } from './texture';
import { BufferAttachmentOption, BufferAttacment, GLFramebuffer } from './framebuffer';
import { RenderStat } from './render-stat';
import { Vec3 } from 'src/math/vec';

const circleLayout = [
  {
    type: AttribType.FLOAT, // coord
    componentsCount: 3,
  },
  {
    type: AttribType.FLOAT, // color
    componentsCount: 3,
  },
  {
    type: AttribType.FLOAT, // uv
    componentsCount: 2,
  },
  {
    type: AttribType.FLOAT, // id
    componentsCount: 1,
  },
];

const squareLayout = [
  {
    type: AttribType.FLOAT, // coord
    componentsCount: 3,
  },
  {
    type: AttribType.FLOAT, // color
    componentsCount: 3,
  },
  {
    type: AttribType.FLOAT, // id
    componentsCount: 1,
  },
];

const outLayout = [
  {
    type: AttribType.FLOAT, // coord
    componentsCount: 3,
  },
  {
    type: AttribType.FLOAT, // uv
    componentsCount: 2,
  },
];

const dataPerLineVertex = squareLayout.reduce((prev, curr) => prev + curr.componentsCount, 0);
const dataPerLine = dataPerLineVertex * 6;
const dataPerCircleVertex = circleLayout.reduce((prev, curr) => prev + curr.componentsCount, 0);
const dataPerCircle = dataPerCircleVertex * 6;
const lineBufferSize = 10000;
const circleBufferSize = 100;

const colorTexutureOptions: TextureConfig = {
  imageFormat: { internalFormat: TextureFormat.RGBA, format: TextureFormat.RGBA }
};

const idTexutureOptions: TextureConfig = {
  imageFormat: { internalFormat: TextureFormat.RGBA8UI, format: TextureFormat.RGBA_INTEGER }
};

export interface RendererStat {
  flushedSqures: number;
  flushedCircles: number;

  flushedBatchSquresCount: number;
  flushedBatchCirclesCount: number;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private projection: Matrix | null;
  private camera: Matrix | null;

  private squreCount: number;
  private circleCount: number;

  private squreData: Float32Array;
  private circleData: Float32Array;

  private mainVBO: GLVBO;
  private squreVBO: GLVBO;
  private circleVBO: GLVBO;

  private framebuffer: GLFramebuffer;
  private colorTexture: GLTexture;

  private stat: RenderStat;

  constructor (gl: WebGL2RenderingContext, screenWidth: number, screenHeight: number) {
    this.gl = gl;

    this.projection = null;
    this.camera = null;

    this.squreData = new Float32Array(lineBufferSize * dataPerLine);
    this.circleData = new Float32Array(circleBufferSize * dataPerCircle);

    this.squreCount = 0;
    this.circleCount = 0;

    this.stat = new RenderStat();

    this.squreVBO = new GLVBO(gl, squareLayout);
    this.squreVBO.bind();
    this.squreVBO.setData(this.squreData);

    this.mainVBO = new GLVBO(gl, outLayout);

    this.circleVBO = new GLVBO(gl, circleLayout);
    this.circleVBO.bind();
    this.circleVBO.setData(this.circleData);

    gl.viewport(0, 0, screenWidth, screenHeight);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const colorTexture = new GLTexture(gl, 600, 400, null, colorTexutureOptions);
    const idTexture = new GLTexture(gl, 600, 400, null, idTexutureOptions);

    const rbo = gl.createRenderbuffer() as WebGLRenderbuffer;
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, 600, 400);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    const bufferOptions: Array<BufferAttachmentOption> = [
      { type: BufferAttacment.color, buffer: colorTexture, name: 'color' },
      { type: BufferAttacment.color, buffer: idTexture,    name: 'id'    },
      { type: BufferAttacment.depth, buffer: rbo,                        },
    ];

    const framebuffer = new GLFramebuffer(gl, bufferOptions);

    this.framebuffer = framebuffer;
    this.colorTexture = colorTexture;

    (shaderStore.getProgram(ShaderProgramIndex.texture) as GLProgram).useProgram();
    (shaderStore.getProgram(ShaderProgramIndex.texture) as GLProgram).setTextureUniform('outTexture', 0); // TODO: why can't use gl.TEXTURE0
  }

  beginScene(projection: Matrix, camera: Matrix) {
    this.stat.clear();

    this.projection = projection;
    this.camera = camera;

    if (this.isDataNotFlushed()) {
      console.warn('Render data was not flushed from prev scene');
    }

    this.squreCount = 0;
    this.circleCount = 0;

    this.framebuffer.bind();

    this.framebuffer.clearColorBufferFloat('color', 0, 0, 0, 1.0);
    this.framebuffer.clearColorBufferUInt('id', 0, 0, 0, 0);

    this.framebuffer.clearDepthBuffer();
  }

  drawLine(line: LineComponent) {
    const lineLength = line.length;
    const xProjection = (lineLength * Math.cos(toRadians(line.rotate)) / 2);
    const yProjection = (lineLength * Math.sin(toRadians(line.rotate)) / 2);
    const translate = createTranslationMatrix(line.position.x + xProjection, line.position.y + yProjection, 0);
    const rotate = createRotationMatrix(toRadians(line.rotate), 0, 0);
    const scale = createScaleMatrix(lineLength, 0.1, 1.0);

    this.drawSqure(translate, rotate, scale, line.color, line.id);
  }

  drawSqure(translate: Matrix | null = null, rotate: Matrix | null = null, scale: Matrix | null = null, color: Vec3, id: number) {
    if (this.squreCount === lineBufferSize) {
      let modelMatrix = transposeMatrix(createUnitMatrix(1.0));

      this.flushSqure(modelMatrix);
    }

    let leftTop = createMatrix([-0.5, 0.5, paitingLayer, 1.0], 4, 1);
    let leftBottom = createMatrix([-0.5, -0.5, paitingLayer, 1.0], 4, 1);
    let rightTop = createMatrix([0.5, 0.5, paitingLayer, 1.0], 4, 1);
    let rightBottom = createMatrix([0.5, -0.5, paitingLayer, 1.0], 4, 1);

    if (scale) {
      leftTop = multiplyMatrix(scale, leftTop);
      leftBottom = multiplyMatrix(scale, leftBottom);
      rightTop = multiplyMatrix(scale, rightTop);
      rightBottom = multiplyMatrix(scale, rightBottom);
    }

    if (rotate) {
      leftTop =  multiplyMatrix(rotate, leftTop);
      leftBottom = multiplyMatrix(rotate, leftBottom);
      rightTop =  multiplyMatrix(rotate, rightTop);
      rightBottom = multiplyMatrix(rotate, rightBottom);
    }

    if (translate) {
      leftTop =  multiplyMatrix(translate, leftTop);
      leftBottom = multiplyMatrix(translate, leftBottom);
      rightTop =  multiplyMatrix(translate, rightTop);
      rightBottom = multiplyMatrix(translate, rightBottom);
    }

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 0] = getMatrixValue(leftTop, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 1] = getMatrixValue(leftTop, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 2] = getMatrixValue(leftTop, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 3] = color.x;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 4] = color.y;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 5] = color.z;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 0 + 6] = id;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 3] = color.x;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 4] = color.y;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 5] = color.z;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 1 + 6] = id;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 3] = color.x;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 4] = color.y;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 5] = color.z;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 2 + 6] = id;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 0] = getMatrixValue(rightBottom, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 1] = getMatrixValue(rightBottom, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 2] = getMatrixValue(rightBottom, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 3] = color.x;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 4] = color.y;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 5] = color.z;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 3 + 6] = id;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 3] = color.x;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 4] = color.y;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 5] = color.z;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 4 + 6] = id;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 3] = color.x;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 4] = color.y;
    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 5] = color.z;

    this.squreData[this.squreCount * dataPerLine + dataPerLineVertex * 5 + 6] = id;

    this.squreCount += 1;
  }

  drawCircle(circle: CircleComponent) {
    if (this.circleCount === circleBufferSize) {
      let modelMatrix = transposeMatrix(createUnitMatrix(1.0));

      this.flushCircle(modelMatrix);
    }

    let leftTop = createMatrix([-0.5, 0.5, paitingLayer, 1.0], 4, 1);
    let leftBottom = createMatrix([-0.5, -0.5, paitingLayer, 1.0], 4, 1);
    let rightTop = createMatrix([0.5, 0.5, paitingLayer, 1.0], 4, 1);
    let rightBottom = createMatrix([0.5, -0.5, paitingLayer, 1.0], 4, 1);

    const translate = createTranslationMatrix(circle.position.x, circle.position.y, 0);
    // const rotate = createRotationMatrix(0, 0, 0);
    const scale = createScaleMatrix(circle.radius * 2, circle.radius * 2, 1.0);

    leftTop = multiplyMatrix(scale, leftTop);
    leftBottom = multiplyMatrix(scale, leftBottom);
    rightTop = multiplyMatrix(scale, rightTop);
    rightBottom = multiplyMatrix(scale, rightBottom);

    // leftTop =  multiplyMatrix(rotate, leftTop);
    // leftBottom = multiplyMatrix(rotate, leftBottom);
    // rightTop =  multiplyMatrix(rotate, rightTop);
    // rightBottom = multiplyMatrix(rotate, rightBottom);

    leftTop =  multiplyMatrix(translate, leftTop);
    leftBottom = multiplyMatrix(translate, leftBottom);
    rightTop =  multiplyMatrix(translate, rightTop);
    rightBottom = multiplyMatrix(translate, rightBottom);

    const color = circle.color;
    const id = circle.id;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 0] = getMatrixValue(leftTop, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 1] = getMatrixValue(leftTop, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 2] = getMatrixValue(leftTop, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 3] = color.x;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 4] = color.y;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 5] = color.z;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 6] = 0.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 7] = 1.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 0 + 8] = id;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 3] = color.x;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 4] = color.y;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 5] = color.z;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 6] = 1.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 7] = 1.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 1 + 8] = id;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 3] = color.x;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 4] = color.y;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 5] = color.z;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 6] = 0.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 7] = 0.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 2 + 8] = id;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 0] = getMatrixValue(rightBottom, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 1] = getMatrixValue(rightBottom, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 2] = getMatrixValue(rightBottom, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 3] = color.x;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 4] = color.y;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 5] = color.z;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 6] = 1.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 7] = 0.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 3 + 8] = id;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 3] = color.x;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 4] = color.y;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 5] = color.z;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 6] = 1.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 7] = 1.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 4 + 8] = id;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 3] = color.x;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 4] = color.y;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 5] = color.z;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 6] = 0.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 7] = 0.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerCircleVertex * 5 + 8] = id;

    this.circleCount += 1;
  }

  endScene() {
    this.flush();

    this.framebuffer.unbind();

    (shaderStore.getProgram(ShaderProgramIndex.texture) as GLProgram).useProgram();

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture.getGLTexture());

    this.mainVBO.bind();
    this.mainVBO.setData(QUAD_WITH_TEXTURE_COORD_DATA);
    this.mainVBO.activateAllAttribPointers();

    this.gl.drawArrays(this.gl.TRIANGLES, 0, QUAD_WITH_TEXTURE_COORD_DATA.length);

    this.projection = null;
    this.camera = null;

    this.squreCount = 0;
    this.circleCount = 0;
  }

  flush() {
    let modelMatrix = transposeMatrix(createUnitMatrix(1.0));

    this.flushSqure(modelMatrix);
    this.flushCircle(modelMatrix);
  }

  getIdDataReader() {
    return this.framebuffer.getAttachmentReader('id');
  }

  getDrawStat(): RendererStat {
    return {
      flushedSqures: this.stat.flushedSqures,
      flushedCircles: this.stat.flushedCircles,

      flushedBatchSquresCount: Math.ceil(this.stat.flushedSqures / lineBufferSize),
      flushedBatchCirclesCount: Math.ceil(this.stat.flushedCircles / circleBufferSize),
    };
  }

  private flushSqure(modelMatrix: Matrix) {
    if (this.squreCount !== 0) {
      this.stat.flushedSqures += this.squreCount;

      (shaderStore.getProgram(ShaderProgramIndex.square) as GLProgram).useProgram();

      this.squreVBO.bind();
      this.squreVBO.setData(this.squreData);
      this.squreVBO.activateAllAttribPointers();

      if (this.camera) {
        (shaderStore.getProgram(ShaderProgramIndex.square) as GLProgram).setMatrix44('MV', getRawValues(this.camera));
      }

      (shaderStore.getProgram(ShaderProgramIndex.square) as GLProgram).setMatrix44('MM', getRawValues(modelMatrix));

      if (this.projection) {
        (shaderStore.getProgram(ShaderProgramIndex.square) as GLProgram).setMatrix44('P', getRawValues(this.projection));
      }

      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.squreCount * 6);
    }

    this.squreCount = 0;
  }

  private flushCircle(modelMatrix: Matrix) {
    if (this.circleCount !== 0) {
      this.stat.flushedCircles += this.circleCount;

      (shaderStore.getProgram(ShaderProgramIndex.circle) as GLProgram).useProgram();

      this.circleVBO.bind();
      this.circleVBO.setData(this.circleData);
      this.circleVBO.activateAllAttribPointers();

      if (this.camera) {
        (shaderStore.getProgram(ShaderProgramIndex.circle) as GLProgram).setMatrix44('MV', getRawValues(this.camera));
      }

      (shaderStore.getProgram(ShaderProgramIndex.circle) as GLProgram).setMatrix44('MM', getRawValues(modelMatrix));

      if (this.projection) {
        (shaderStore.getProgram(ShaderProgramIndex.circle) as GLProgram).setMatrix44('P', getRawValues(this.projection));
      }

      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.circleCount * 6);
    }

    this.circleCount = 0;
  }

  private isDataNotFlushed() {
    return this.squreCount !== 0 || this.circleCount !== 0;
  }
}
