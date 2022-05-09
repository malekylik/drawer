import {
  Matrix,
  createMatrix, multiplyMatrix, getMatrixValue,
  getRawValues, transposeMatrix, createUnitMatrix,
  createTranslationMatrix, createRotationMatrix, createScaleMatrix,
} from '../math/matix';
import { paitingLayer } from './const';
import { creareGLProgram } from './gl-api';
import { CircleComponent, LineComponent } from './components';
import { toRadians } from '../math/utils';

import lineVertexShader from '../assets/line-vertex.glsl';
import circleVertexShader from '../assets/circle-vertex.glsl';
import linePixelShader from '../assets/line-pixel.glsl';
import circlePixelShader from '../assets/circle-pixel.glsl';

const dataPerVertex = 3;
const dataPerLine = dataPerVertex * 6;
const dataPerCircleVertex = 5;
const dataPerCircle = dataPerCircleVertex * 6;
const lineBufferSize = 10000;
const circleBufferSize = 10000;

export class Renderer {
  private gl: WebGL2RenderingContext;
  private projection: Matrix | null;
  private camera: Matrix | null;

  private squreData: Float32Array;
  private circleData: Float32Array;

  private squreCount: number;
  private circleCount: number;

  private squreVBO: WebGLBuffer;
  private squreProgram: WebGLProgram;
  private squreUniforms: {
    projectionLocation: WebGLUniformLocation;
    modelViewLocation: WebGLUniformLocation;
    modelLocation: WebGLUniformLocation;
  };

  private circleVBO: WebGLBuffer;
  private circleProgram: WebGLProgram;
  private circleUniforms: {
    projectionLocation: WebGLUniformLocation;
    modelViewLocation: WebGLUniformLocation;
    modelLocation: WebGLUniformLocation;
  };

  private _flushedLine: number;
  private _flushedCircle: number;

  constructor (gl: WebGL2RenderingContext, screenWidth: number, screenHeight: number) {
    this.gl = gl;

    this.projection = null;
    this.camera = null;

    this.squreData = new Float32Array(lineBufferSize * dataPerLine);
    this.circleData = new Float32Array(circleBufferSize * dataPerCircle);

    this.squreCount = 0;
    this.circleCount = 0;

    this._flushedLine = 0;
    this._flushedCircle = 0;

    this.squreVBO = gl.createBuffer() as WebGLBuffer;

    this.squreProgram = creareGLProgram(gl, lineVertexShader, linePixelShader) as WebGLProgram;

    this.squreUniforms = {
      modelViewLocation: gl.getUniformLocation(this.squreProgram, 'MV') as WebGLUniformLocation,
      modelLocation: gl.getUniformLocation(this.squreProgram, 'MM') as WebGLUniformLocation,
      projectionLocation: gl.getUniformLocation(this.squreProgram, 'P') as WebGLUniformLocation,
    };

    this.circleVBO = gl.createBuffer() as WebGLBuffer;

    this.circleProgram = creareGLProgram(gl, circleVertexShader, circlePixelShader) as WebGLProgram;

    this.circleUniforms = {
      modelViewLocation: gl.getUniformLocation(this.circleProgram, 'MV') as WebGLUniformLocation,
      modelLocation: gl.getUniformLocation(this.circleProgram, 'MM') as WebGLUniformLocation,
      projectionLocation: gl.getUniformLocation(this.circleProgram, 'P') as WebGLUniformLocation,
    };

    gl.viewport(0, 0, screenWidth, screenHeight);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  beginScene(projection: Matrix, camera: Matrix) {
    this._flushedLine = 0; // TODO: delete
    this._flushedCircle = 0;

    this.projection = projection;
    this.camera = camera;

    if (this.isDataNotFlushed()) {
      console.warn('Render data was not flushed from prev scene');
    }

    this.squreCount = 0;
    this.circleCount = 0;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  drawLine(line: LineComponent) {
    const lineLength = line.length;
    const xProjection = (lineLength * Math.cos(toRadians(line.rotate)) / 2);
    const yProjection = (lineLength * Math.sin(toRadians(line.rotate)) / 2);
    const translate = createTranslationMatrix(line.start.x + xProjection, line.start.y + yProjection, 0);
    const rotate = createRotationMatrix(toRadians(line.rotate), 0, 0);
    const scale = createScaleMatrix(lineLength, 0.1, 1.0);

    this.drawSqure(translate, rotate, scale);
  }

  drawSqure(translate: Matrix | null = null, rotate: Matrix | null = null, scale: Matrix | null = null) {
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

    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 0 + 0] = getMatrixValue(leftTop, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 0 + 1] = getMatrixValue(leftTop, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 0 + 2] = getMatrixValue(leftTop, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 1 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 1 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 1 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 2 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 2 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 2 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 3 + 0] = getMatrixValue(rightBottom, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 3 + 1] = getMatrixValue(rightBottom, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 3 + 2] = getMatrixValue(rightBottom, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 4 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 4 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 4 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 5 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 5 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.squreData[this.squreCount * dataPerLine + dataPerVertex * 5 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

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

    const translate = createTranslationMatrix(circle.originX, circle.originY, 0);
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

    const dataPerVertex = 5;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 0 + 0] = getMatrixValue(leftTop, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 0 + 1] = getMatrixValue(leftTop, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 0 + 2] = getMatrixValue(leftTop, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 0 + 3] = 0.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 0 + 4] = 1.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 1 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 1 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 1 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 1 + 3] = 1.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 1 + 4] = 1.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 2 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 2 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 2 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 2 + 3] = 0.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 2 + 4] = 0.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 3 + 0] = getMatrixValue(rightBottom, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 3 + 1] = getMatrixValue(rightBottom, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 3 + 2] = getMatrixValue(rightBottom, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 3 + 3] = 1.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 3 + 4] = 0.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 4 + 0] = getMatrixValue(rightTop, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 4 + 1] = getMatrixValue(rightTop, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 4 + 2] = getMatrixValue(rightTop, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 4 + 3] = 1.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 4 + 4] = 1.0;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 5 + 0] = getMatrixValue(leftBottom, 0, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 5 + 1] = getMatrixValue(leftBottom, 1, 0) as number;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 5 + 2] = getMatrixValue(leftBottom, 2, 0) as number;

    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 5 + 3] = 0.0;
    this.circleData[this.circleCount * dataPerCircle + dataPerVertex * 5 + 4] = 0.0;

    this.circleCount += 1;
  }

  endScene() {
    this.flush();

    this.projection = null;
    this.camera = null;

    this.squreCount = 0;
    this.circleCount = 0;

    // console.log('flush squre count', flushLine);
    // console.log('flush circle count', flushCircle);

    this._flushedLine = 0;
    this._flushedCircle = 0;
  }

  flush() {
    let modelMatrix = transposeMatrix(createUnitMatrix(1.0));

    this.flushSqure(modelMatrix);
    this.flushCircle(modelMatrix);
  }

  private flushSqure(modelMatrix: Matrix) {
    if (this.squreCount !== 0) {
      this._flushedLine += 1;

      this.gl.useProgram(this.squreProgram);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squreVBO);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.squreData, this.gl.STATIC_DRAW);

      this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * dataPerVertex, 0);
      this.gl.enableVertexAttribArray(0);

      if (this.camera) {
        this.gl.uniformMatrix4fv(this.squreUniforms.modelViewLocation, false, getRawValues(this.camera));
      }
      this.gl.uniformMatrix4fv(this.squreUniforms.modelLocation, false, getRawValues(modelMatrix));
      if (this.projection) {
        this.gl.uniformMatrix4fv(this.squreUniforms.projectionLocation, false, getRawValues(this.projection));
      }

      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.squreCount * 6);
    }

    this.squreCount = 0;
  }

  private flushCircle(modelMatrix: Matrix) {
    if (this.circleCount !== 0) {
      this._flushedCircle += 1;

      this.gl.useProgram(this.circleProgram);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.circleVBO);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.circleData, this.gl.STATIC_DRAW);

      this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * dataPerCircleVertex, 0);
      this.gl.enableVertexAttribArray(0);

      this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * dataPerCircleVertex, Float32Array.BYTES_PER_ELEMENT * 3);
      this.gl.enableVertexAttribArray(1);

      if (this.camera) {
        this.gl.uniformMatrix4fv(this.circleUniforms.modelViewLocation, false, getRawValues(this.camera));
      }
      this.gl.uniformMatrix4fv(this.circleUniforms.modelLocation, false, getRawValues(modelMatrix));
      if (this.projection) {
        this.gl.uniformMatrix4fv(this.circleUniforms.projectionLocation, false, getRawValues(this.projection));
      }

      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.circleCount * 6);
    }

    this.circleCount = 0;
  }

  private isDataNotFlushed() {
    return this.squreCount !== 0 || this.circleCount !== 0;
  }
}
