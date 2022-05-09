import { Vec2 } from '../math/vec';

export interface LineComponent {
  start: Vec2;
  length: number;
  scale: number;
  rotate: number;
  line: number;
}

export interface CircleComponent {
  originX: number; originY: number;
  radius: number;
}

export function createLine(start: Vec2, length: number): LineComponent {
  return ({
    start,
    length,
    scale: 1.0,
    rotate: 0.0,
    line: -1
  });
}
