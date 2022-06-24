import { createVec2, createVec3, Vec2, Vec3 } from '../../math/vec';
import { Material } from '../material/material';
import { LineMaterial } from '../material/line-material';

export enum ComponentType {
  line = 0,
  circle,
  text,
}

export interface Drawable <T> {
  type: ComponentType;
  transformation: {
    position: Vec2;
    scale: Vec2;
    rotate: Vec2;
  };
  color: Vec3;
  id: number;
  material: Material<T>;
}

export interface LineComponent extends Drawable<null> {
  type: ComponentType.line,
  position: Vec2;
  length: number;
  scale: number;
  rotate: number;
  line: number;
}

export interface CircleComponent extends Drawable<null> {
  type: ComponentType.circle,
  position: Vec2;
  radius: number;
}

export interface TextComponent extends Drawable<null> {
  type: ComponentType.text,
  position: Vec2;
  content: string;
}

export type Component = LineComponent | CircleComponent | TextComponent;

export function createLine(position: Vec2, length: number, id: number, material: LineMaterial, color?: Vec3): LineComponent {
  const scale = createVec2(length, 1.0);
  const rotate = createVec2(0.0, 0.0);

  color = color ?? createVec3(1.0, 1.0, 1.0);

  return ({
    type: ComponentType.line,
    transformation: {
      position,
      scale,
      rotate,
    },
    position,
    color,
    length,
    scale: 1.0,
    rotate: 0.0,
    line: -1,
    id,
    material,
  });
}
