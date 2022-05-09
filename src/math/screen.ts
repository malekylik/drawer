import { toDegrees } from './utils';
import { Vec2, Vec3 } from './vec';

export function normalizeXCoord(x: number, screenWidth: number) {
  return ((x / screenWidth) * 2 - 1);
}

export function normalizeYCoord(y: number, screenHeight: number) {
  return ((y / screenHeight) * 2 - 1) * -1;
}

export function getAngleFromLineProjection(projectionX: number, projectionY: number) {
  let angel = toDegrees(Math.atan(projectionY / projectionX));

  if (projectionX < 0 && projectionY > 0) {
    angel = 180 + angel;
  } if (projectionX < 0 && projectionY < 0) {
    angel = 180 + angel;
  } if (projectionX > 0 && projectionY < 0) {
    angel = 360 + angel;
  }

  angel = Math.abs(angel);

  return angel;
}

export function convertScreenCoordToWorldCoord(coord: Vec2, cameraPosition: Vec3, paitingLayer: number, screenWidth: number, screenHeight: number, fovy: number, aspect: number) {

  const offsetXNormalized = normalizeXCoord(coord.x, screenWidth);
  const offsetYNormalized = normalizeYCoord(coord.y, screenHeight);

  const tan = Math.tan(fovy / 2);

  // TODO: use inverse projection matrix to calculate this
  const projectCoefX = (aspect * tan * (-paitingLayer + cameraPosition.z));
  const projectCoefY = (tan * (-paitingLayer + cameraPosition.z));

  const startX = cameraPosition.x + (offsetXNormalized * projectCoefX);
  const startY = cameraPosition.y + (offsetYNormalized * projectCoefY);

  coord.x = startX;
  coord.y = startY;
}
