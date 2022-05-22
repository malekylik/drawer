import { Vec2 } from '../math/vec';

export interface LineComponent {
  position: Vec2;
  length: number;
  scale: number;
  rotate: number;
  line: number;
  id: number;
}

export interface CircleComponent {
  position: Vec2;
  radius: number;
  id: number;
}

export type Component = LineComponent | CircleComponent;

export function createLine(position: Vec2, length: number, id: number): LineComponent {
  return ({
    position,
    length,
    scale: 1.0,
    rotate: 0.0,
    line: -1,
    id
  });
}
