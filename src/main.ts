import { createVec2, createVec3, Vec2 } from './math/vec';
import {
  createPerspectiveMatrix, createUnitMatrix,
  createTranslationMatrix, createRotationMatrix,
  multiplyMatrix,
  transposeMatrix,
} from './math/matix';
import { toRadians } from './math/utils';
import { convertScreenCoordToWorldCoord, getAngleFromLineProjection } from './math/screen';
import { bindEvents, CanvasEvent } from './event/canvas-event';
import { KeyboardKeyCode } from './event/const';
import { Renderer, RendererStat } from './render/renderer';
import { LineComponent, CircleComponent, createLine } from './render/components';
import { paitingLayer } from './render/const';
import { createUniqeIdGenerator } from './utils/uniqeId';
import { interpretAsInt32 } from './utils/memory';
import { shaderStore, ShaderProgramIndex } from './render/shader-store';
import { GLProgram } from './render/shader';
import { createFragmentGLShader, createVertexGLShader } from './render/gl-api';
import lineVertexShader from './assets/line-vertex.glsl';
import circleVertexShader from './assets/circle-vertex.glsl';
import linePixelShader from './assets/line-pixel.glsl';
import circlePixelShader from './assets/circle-pixel.glsl';
import textureVertexShader from './assets/texture-vertex.glsl';
import texturePixelShader from './assets/texture-pixel.glsl';

// import { binaryFind } from './utils/array';

const getNewId = createUniqeIdGenerator(1);

let prevComponentId = -1;
let prevRendererStat: RendererStat = {
  flushedSqures: -1,
  flushedCircles: -1,
  flushedBatchSquresCount: -1,
  flushedBatchCirclesCount: -1,
};

const prevMousePosition = createVec2(-1, -1);
const mousePosition = createVec2(0, 0);

enum DrawMode {
  line = 'line',
  circle = 'circle',
}

let mode: DrawMode = DrawMode.line;

const lines: Array<LineComponent> = [

];

const circles: Array<CircleComponent> = [

];

const screenWidth = 600;
const screenHeight = 400;

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const componentIdViewer: HTMLSpanElement = document.getElementById('component-id') as HTMLSpanElement;
const mousePostionViewer: HTMLSpanElement = document.getElementById('mouse-position') as HTMLSpanElement;
const lineCountViewer: HTMLSpanElement = document.getElementById('line-count') as HTMLSpanElement;
const circleCountViewer: HTMLSpanElement = document.getElementById('circle-count') as HTMLSpanElement;

canvas.width = screenWidth;
canvas.height = screenHeight;
canvas.style.width = `${screenWidth}px`;
canvas.style.height = `${screenHeight}px`;

const gl = canvas.getContext('webgl2', { antialias: false }) as WebGL2RenderingContext;

shaderStore.setProgram(
  ShaderProgramIndex.texture,
  new GLProgram(gl, createVertexGLShader(gl, textureVertexShader) as WebGLShader, createFragmentGLShader(gl, texturePixelShader) as WebGLShader)
);

shaderStore.setProgram(
  ShaderProgramIndex.square,
  new GLProgram(gl, createVertexGLShader(gl, lineVertexShader) as WebGLShader, createFragmentGLShader(gl, linePixelShader) as WebGLShader)
);

shaderStore.setProgram(
  ShaderProgramIndex.circle,
  new GLProgram(gl, createVertexGLShader(gl, circleVertexShader) as WebGLShader, createFragmentGLShader(gl, circlePixelShader) as WebGLShader)
);

const renderer = new Renderer(gl, screenWidth, screenHeight);

const near = 0.1;
const far = 10.0;
const fovy = toRadians(45);
const aspect = screenWidth / screenHeight;

const cameraPosition = createVec3(0, 0, 0);

const { keyboard, eventStack } = bindEvents(canvas, cameraPosition, paitingLayer, screenWidth, screenHeight, fovy, aspect, mousePosition);

let drawingLine = false;
let drawingCirle = false;

let lineCount = 0;

function updateCamera() {
  let isUpdated = false;

  // TODO: use more convinient func
  let updateValue = Math.sin(toRadians(
    ((cameraPosition.z + 2.8) / 9.0 * 8.0) + 270.0 + 11.0
  )) + 1.0;
  updateValue = Math.max(updateValue , 0.005);

  // TODO: change line end while drawing line and zooming in/out
  if (keyboard[KeyboardKeyCode.wKey]) {
    cameraPosition.z = cameraPosition.z - updateValue < -2.8 ? -2.8 : cameraPosition.z - updateValue;

    isUpdated = true;
  }

  if (keyboard[KeyboardKeyCode.sKey]) {
    cameraPosition.z = cameraPosition.z + updateValue > 6.0 ? 6.0 : cameraPosition.z + updateValue;

    isUpdated = true;
  }

  if (keyboard[KeyboardKeyCode.dKey]) {
    cameraPosition.x += updateValue;

    isUpdated = true;
  }

  if (keyboard[KeyboardKeyCode.aKey]) {
    cameraPosition.x -= updateValue;

    isUpdated = true;
  }

  if (keyboard[KeyboardKeyCode.spaceKey]) {
    cameraPosition.y += updateValue;

    isUpdated = true;
  }

  if (keyboard[KeyboardKeyCode.zKey]) {
    cameraPosition.y -= updateValue;

    isUpdated = true;
  }

  return isUpdated;
}

function renderLines() {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as LineComponent;

    renderer.drawLine(line);
  }

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i] as LineComponent;
    const nextLines = lines[i + 1] as LineComponent;

    if (line.line === nextLines.line) {
      const circle = {
        position: nextLines.position, radius: 0.1 / 2, id: line.id
      };

      renderer.drawCircle(circle);
    }
  }
}

function renderCircles() {
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i] as CircleComponent;

    renderer.drawCircle(circle);
  }
}

function handleMouseMoveForLineDrawing(coord: Vec2) {
  const lastLine = lines[lines.length - 1] as LineComponent;

  const lengthX = coord.x - lastLine.position.x;
  const lengthY = coord.y - lastLine.position.y;

  let angle = getAngleFromLineProjection(lengthX, lengthY);

  let lineLength = 0.0;

  if (angle === 90 || angle === 270) {
    lineLength = lengthY;
  } else {
    lineLength = (lengthX) / Math.cos(toRadians(angle));
  }

  lastLine.length = lineLength;
  lastLine.rotate = angle;
}

function handleEvents() {
  let i = 0;

  while (i < eventStack.length) {
    const event = eventStack[i] as CanvasEvent;

    if (mode === DrawMode.line) {
      if (event.type === 'mousedown' && !drawingLine) {
        drawingLine = true;
        const length = 0.01;

        lines.push(
          createLine(
            createVec2(event.x, event.y),
            length,
            getNewId(),
          )
        );

        (lines[lines.length - 1] as LineComponent).line = lineCount;
      } else if (event.type === 'mousedown' && drawingLine) {

        const lastLine = lines[lines.length - 1] as LineComponent;

        const lengthX = event.x - lastLine.position.x;
        const lengthY = event.y - lastLine.position.y;

        let angle = getAngleFromLineProjection(lengthX, lengthY);

        let lineLength = 0.0;

        if (angle === 90 || angle === 270) {
          lineLength = lengthY;
        } else {
          lineLength = (lengthX) / Math.cos(toRadians(angle));
        }

        // TODO: find out linear transformation, transform screen cordination to world (use inverse projection matrix)
        lastLine.length = lineLength;
        lastLine.rotate = angle;

        const length = 0.01;

        lines.push(
          createLine(
            createVec2(event.x, event.y),
            length,
            getNewId(),
          )
        );

        (lines[lines.length - 1] as LineComponent).line = lineCount;
      }

      if (event.type === 'mousemove' && drawingLine) {
        handleMouseMoveForLineDrawing(event);
      }

      if (event.type === 'keypress' && event.key === 'Enter' && drawingLine) {
        drawingLine = false;

        lines.pop();

        lineCount += 1;
      }
    }

    if (mode === DrawMode.circle) {
      if (event.type === 'mousedown' && !drawingCirle) {
        circles.push({
          position: createVec2(event.x, event.y),
          radius: 0.1,
          id: getNewId()
        });

        drawingCirle = true;
      }

      if (event.type === 'mousemove' && drawingCirle) {
        circles.push({
          position: createVec2(event.x, event.y),
          radius: 0.1,
          id: getNewId()
        });
      }

      if (event.type === 'mouseup' && drawingCirle) {
        drawingCirle = false;
      }
    }

    i++;
  }

  let length = eventStack.length;

  for (let i = 0; i < length; i++) {
    eventStack.pop();
  }
}

function onCamerUpdate() {
  if (drawingLine) {
    const coord = createVec2(mousePosition.x, mousePosition.y);

    convertScreenCoordToWorldCoord(coord, cameraPosition, paitingLayer, screenWidth, screenHeight, fovy, aspect);

    handleMouseMoveForLineDrawing(coord);
  }
}

function updateHTML() {
  const idDataReader = renderer.getIdDataReader();

  idDataReader.bind();
  const b = renderer.getIdDataReader().readPixel(mousePosition.x, screenHeight - mousePosition.y);
  idDataReader.unbind();

  const componentId = interpretAsInt32(b[0] as number, b[1] as number, b[2] as number, b[3] as number);
  // const component = componentId !== 0 ? binaryFind(lines, 0, lines.length, l => componentId - l.id) : null;

  if (prevComponentId !== componentId) {
    componentIdViewer.innerText = `current component id: ${componentId === 0 ? 'no selected component' : componentId}`;

    prevComponentId = componentId;
  }

  if (prevMousePosition.x !== mousePosition.x || prevMousePosition.y !== mousePosition.y) {
    mousePostionViewer.innerText = `mouse position x: ${mousePosition.x} y: ${mousePosition.y}`;

    prevMousePosition.x = mousePosition.x;
    prevMousePosition.y = mousePosition.y;
  }

  const rendererStat = renderer.getDrawStat();

  if (
    prevRendererStat.flushedSqures              !== rendererStat.flushedSqures            ||
    prevRendererStat.flushedCircles             !== rendererStat.flushedCircles           ||
    prevRendererStat.flushedBatchSquresCount    !== rendererStat.flushedBatchSquresCount  ||
    prevRendererStat.flushedBatchCirclesCount   !== rendererStat.flushedBatchCirclesCount
  ) {
    lineCountViewer.innerText = `square count: ${rendererStat.flushedSqures} flushed square batch count: ${rendererStat.flushedBatchSquresCount}`;
    circleCountViewer.innerText = `circle count: ${rendererStat.flushedCircles} flushed circle batch count: ${rendererStat.flushedBatchCirclesCount}`;

    prevRendererStat = rendererStat;
  }
}

// let cancel = null;

// TODO: check with glm about transpose projection
const projectionMatrix = (createPerspectiveMatrix(fovy, aspect, near, far));

function loop() {
  requestAnimationFrame(loop);

  handleEvents();

  let viewMatrix = createUnitMatrix(1.0);
  viewMatrix = multiplyMatrix(viewMatrix, createRotationMatrix(0, 0, 0)); // rotate
  viewMatrix = multiplyMatrix(viewMatrix, createTranslationMatrix(cameraPosition.x, cameraPosition.y, cameraPosition.z)); // translate

  const isCameraUpdated = updateCamera();

  if (isCameraUpdated) {
    onCamerUpdate();
  }

  renderer.beginScene(projectionMatrix, transposeMatrix(viewMatrix));

  renderLines();
  renderCircles();

  renderer.endScene();

  updateHTML();
}

// setTimeout(() => {
//   cancelAnimationFrame(cancel);
// }, 3000);

loop();
