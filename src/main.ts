import { createVec2, createVec3 } from './math/vec';
import {
  createPerspectiveMatrix, createUnitMatrix,
  createTranslationMatrix, createRotationMatrix,
  multiplyMatrix,
  transposeMatrix,
} from './math/matix';
import { toRadians } from './math/utils';
import { getAngleFromLineProjection } from './math/screen';
import { bindEvents, CanvasEvent } from './event/canvas-event';
import { KeyboardKeyCode } from './event/const';
import { Renderer } from './render/renderer';
import { LineComponent, CircleComponent, createLine } from './render/components';
import { paitingLayer } from './render/const';


enum DrawMode {
  line = 'line',
  circle = 'circle',
}

let mode: DrawMode = DrawMode.line; // line circle

const lines: Array<LineComponent> = [

];

const circles: Array<CircleComponent> = [

];

const screenWidth = 600;
const screenHeight = 400;

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;

canvas.width = screenWidth;
canvas.height = screenHeight;
canvas.style.width = `${screenWidth}px`;
canvas.style.height = `${screenHeight}px`;

const gl = canvas.getContext('webgl2', { antialias: false }) as WebGL2RenderingContext;

const renderer = new Renderer(gl, screenWidth, screenHeight);

const near = 0.1;
const far = 10.0;
const fovy = toRadians(45);
const aspect = screenWidth / screenHeight;

const cameraPosition = createVec3(0, 0, 0);

const { keyboard, eventStack } = bindEvents(canvas, cameraPosition, paitingLayer, screenWidth, screenHeight, fovy, aspect);

let drawingLine = false;
let drawingCirle = false;

let lineCount = 0;

function updateCamera() {
  // TODO: use function
  // TODO: make it slow when it goes closer to near
  let updateValue = Math.sin(toRadians(
    ((cameraPosition.z + 2.8) / 9.0 * 8.0) + 270.0 + 11.0
  )) + 1.0;
  updateValue = Math.max(updateValue , 0.005);

  // -2.9
  if (keyboard[KeyboardKeyCode.wKey]) {
    cameraPosition.z = cameraPosition.z - updateValue < -2.8 ? -2.8 : cameraPosition.z - updateValue;
  }

  // 6.0
  if (keyboard[KeyboardKeyCode.sKey]) {
    cameraPosition.z = cameraPosition.z + updateValue > 6.0 ? 6.0 : cameraPosition.z + updateValue;
  }

  // updateValue = updateValue !== 0.1 ? updateValue * 2 : updateValue;

  if (keyboard[KeyboardKeyCode.dKey]) {
    cameraPosition.x += updateValue;
  }

  if (keyboard[KeyboardKeyCode.aKey]) {
    cameraPosition.x -= updateValue;
  }

  if (keyboard[KeyboardKeyCode.spaceKey]) {
    cameraPosition.y += updateValue;
  }

  if (keyboard[KeyboardKeyCode.zKey]) {
    cameraPosition.y -= updateValue;
  }
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
        originX: nextLines.start.x, originY: nextLines.start.y, radius: 0.1 / 2
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
          )
        );

        (lines[lines.length - 1] as LineComponent).line = lineCount;
      } else if (event.type === 'mousedown' && drawingLine) {

        const lastLine = lines[lines.length - 1] as LineComponent;

        const lengthX = event.x - lastLine.start.x;
        const lengthY = event.y - lastLine.start.y;

        let angle = getAngleFromLineProjection(lengthX, lengthY);

        let lineLength = 0.0;

        if (angle === 90 || angle === 270) {
          lineLength = lengthY;
        } else {
          lineLength = (lengthX) / Math.cos(toRadians(angle));
        }

        // TODO: find out linear transformation, transform screen cordination to world
        lastLine.length = lineLength;
        lastLine.rotate = angle;

        const length = 0.01;

        lines.push(
          createLine(
            createVec2(event.x, event.y),
            length,
          )
        );

        (lines[lines.length - 1] as LineComponent).line = lineCount;
      }

      if (event.type === 'mousemove' && drawingLine) {
        const lastLine = lines[lines.length - 1] as LineComponent;

        const lengthX = event.x - lastLine.start.x;
        const lengthY = event.y - lastLine.start.y;

        let angle = getAngleFromLineProjection(lengthX, lengthY);

        let lineLength = 0.0;

        if (angle === 90 || angle === 270) {
          lineLength = lengthY;
        } else {
          lineLength = (lengthX) / Math.cos(toRadians(angle));
        }

        // TODO: find out linear transformation, transform screen cordination to world
        lastLine.length = lineLength;
        lastLine.rotate = angle;
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
          originX: event.x, originY: event.y,
          radius: 0.1
        });

        drawingCirle = true;
      }

      if (event.type === 'mousemove' && drawingCirle) {
        circles.push({
          originX: event.x, originY: event.y,
          radius: 0.1
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

// let cancel = null;

// TODO: check with glm about transpose projection
const projectionMatrix = (createPerspectiveMatrix(fovy, aspect, near, far));

function loop() {
  // cancel = requestAnimationFrame(loop);

  handleEvents();

  let viewMatrix = createUnitMatrix(1.0);
  viewMatrix = multiplyMatrix(viewMatrix, createRotationMatrix(0, 0, 0)); // rotate
  viewMatrix = multiplyMatrix(viewMatrix, createTranslationMatrix(cameraPosition.x, cameraPosition.y, cameraPosition.z)); // translate

  updateCamera();

  renderer.beginScene(projectionMatrix, transposeMatrix(viewMatrix));

  renderLines();
  renderCircles();

  renderer.endScene();
}

// setTimeout(() => {
//   cancelAnimationFrame(cancel);
// }, 3000);

loop();
