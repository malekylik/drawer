import { GLProgram } from '../shader';
import { ShaderProgramIndex, shaderStore } from '../shader-store';
import { getNewMaterialId, Material } from './material';

export class LineMaterial implements Material<null> {
  private gl: WebGL2RenderingContext;
  private materialData: null;
  private id: number;

  constructor (gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.materialData = null;
    this.id = getNewMaterialId();
  }

  bind(): void {
    (shaderStore.getProgram(ShaderProgramIndex.square) as GLProgram).useProgram();
  }

  getMaterialData(): null {
    return this.materialData;
  }

  getId(): number {
    return this.id;
  }
}
