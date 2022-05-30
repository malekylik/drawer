import { createVec3, Vec2, Vec3 } from '../math/vec';

export interface LineComponent {
  position: Vec2;
  color: Vec3;
  length: number;
  scale: number;
  rotate: number;
  line: number;
  id: number;
}

export interface CircleComponent {
  position: Vec2;
  color: Vec3;
  radius: number;
  id: number;
}

export interface TextComponent {
  position: Vec2;
  color: Vec3;
  id: number;
  content: string;
}

export type Component = LineComponent | CircleComponent | TextComponent;

export function createLine(position: Vec2, length: number, id: number, color?: Vec3): LineComponent {
  color = color ?? createVec3(1.0, 1.0, 1.0);

  return ({
    position,
    color,
    length,
    scale: 1.0,
    rotate: 0.0,
    line: -1,
    id
  });
}
