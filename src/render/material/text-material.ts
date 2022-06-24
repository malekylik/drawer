import { GLProgram } from '../shader';
import { getNewMaterialId, Material } from './material';

export class TextMaterial implements Material<null> {
  private gl: WebGL2RenderingContext;
  private shader: GLProgram;

  constructor (gl: WebGL2RenderingContext, shader: GLProgram) {
    this.gl = gl;
    this.shader = shader;
    // this.id = getNewMaterialId();
  }

  bind() {

  }

  getId(): number {
    throw new Error('Method not implemented.');
  }

  getMaterialData(): null {
    return null;
  }
}
