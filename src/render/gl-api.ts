// export function createGLProgram(gl: WebGL2RenderingContext, vertShader: string, fragShader: string) {
//   const program = gl.createProgram() as WebGLProgram;

//   gl.attachShader(program, createGLShader(gl, gl.VERTEX_SHADER, vertShader) as WebGLShader);
//   gl.attachShader(program, createGLShader(gl, gl.FRAGMENT_SHADER, fragShader) as WebGLShader);

//   gl.linkProgram(program);

//   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//     const info = gl.getProgramInfoLog(program);

//     console.warn(`Fail to link program: ${info}`);

//     gl.deleteProgram(program);

//     return null;
//   }

//   return program;
// }

// export function createGLShader(gl: WebGL2RenderingContext, type: GLenum, shaderSrc: string) {
//   const shader = gl.createShader(type) as WebGLShader;

//   if (shader === 0) console.warn('Fail to create shader');

//   gl.shaderSource(shader, shaderSrc);
//   gl.compileShader(shader);

//   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//     const message = gl.getShaderInfoLog(shader);

//     console.warn(`Fail to compile shader: ${message}`);

//     gl.deleteShader(shader);

//     return null;
//   }

//   return shader;
// }
export function createGLProgram(gl: WebGL2RenderingContext, vertShader: WebGLShader, fragShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram() as WebGLProgram;

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);

    console.warn(`Fail to link program: ${info}`);

    gl.deleteProgram(program);

    return null;
  }

  return program;
}


function createGLShader(gl: WebGL2RenderingContext, type: number, shaderSrc: string): WebGLShader | null {
  const shader = gl.createShader(type) as WebGLShader;

  if (shader === 0) console.warn('Fail to create shader');

  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);

    console.warn(`Fail to compile shader: ${message}`);

    gl.deleteShader(shader);

    return null;
  }

  return shader;
}

export function createVertexGLShader(gl: WebGL2RenderingContext, shaderSrc: string): WebGLShader | null {
  return createGLShader(gl, gl.VERTEX_SHADER, shaderSrc);
}

export function createFragmentGLShader(gl: WebGL2RenderingContext, shaderSrc: string): WebGLShader | null {
  return createGLShader(gl, gl.FRAGMENT_SHADER, shaderSrc);
}

export function deleteShader(gl: WebGLRenderingContext | WebGL2RenderingContext, shader: WebGLShader): void {
  gl.deleteShader(shader);
}
