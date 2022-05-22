import { convertScreenCoordToWorldCoord } from '../math/screen';
import { createVec2, Vec2, Vec3 } from '../math/vec';

export interface CanvasKeyboardEvent {
  type: 'keyup' | 'keypress' | 'keydown';
  keyCode: number;
  key: string;
}

export interface CanvasMouseEvent {
  type: 'mouseup' | 'mousemove' | 'mousedown';
  x: number;
  y: number;
}

export type CanvasEvent = CanvasMouseEvent | CanvasKeyboardEvent;

// Aircraft_principal_axes
export function bindEvents(
  canvas: HTMLCanvasElement, cameraPosition: Vec3, paitingLayer: number, screenWidth: number, screenHeight: number, fovy: number, aspect: number,
  mousePosition: Vec2,
) {
  const eventStack: Array<CanvasEvent> = [];
  const keyboard = new Uint8Array(128);

  canvas.addEventListener('keydown', (e) => {
    if (e.key.charCodeAt(0) < 128) {
      keyboard[e.key.charCodeAt(0)] = 1;
    }

    eventStack.push({
      type: 'keydown',
      keyCode: e.key.charCodeAt(0),
      key: e.key,
    });
  });

  canvas.addEventListener('keyup', (e) => {
    if (e.key.charCodeAt(0) < 128) {
      keyboard[e.key.charCodeAt(0)] = 0;
    }

    eventStack.push({
      type: 'keyup',
      keyCode: e.key.charCodeAt(0),
      key: e.key,
    });
  });


  canvas.addEventListener('keypress', (e) => {
    eventStack.push({
      type: 'keypress',
      keyCode: -1,
      key: e.key,
    });
  });

  canvas.addEventListener('mousedown', (e) => {
    const coord = createVec2(e.offsetX, e.offsetY);

    convertScreenCoordToWorldCoord(coord, cameraPosition, paitingLayer, screenWidth, screenHeight, fovy, aspect);

    eventStack.push({
      type: 'mousedown',
      x: coord.x,
      y: coord.y,
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    const coord = createVec2(e.offsetX, e.offsetY);

    convertScreenCoordToWorldCoord(coord, cameraPosition, paitingLayer, screenWidth, screenHeight, fovy, aspect);

    mousePosition.x = e.offsetX;
    mousePosition.y = e.offsetY;

    eventStack.push({
      type: 'mousemove',
      x: coord.x,
      y: coord.y,
    });
  });

  canvas.addEventListener('mouseup', (e) => {
    const coord = createVec2(e.offsetX, e.offsetY);

    convertScreenCoordToWorldCoord(coord, cameraPosition, paitingLayer, screenWidth, screenHeight, fovy, aspect);

    eventStack.push({
      type: 'mouseup',
      x: coord.x,
      y: coord.y,
    });
  });

  return { eventStack, keyboard };
}
