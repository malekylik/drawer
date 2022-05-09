#version 300 es

precision mediump float;

in vec2 textureCoord;

out vec4 fragColor;

void main()
{
  vec2 textureCoordOffset = vec2(textureCoord) * 2.0;
  textureCoordOffset.x -= 1.0;
  textureCoordOffset.y -= 1.0;

  float squareDist = 1.0 - length(textureCoordOffset);

  // TODO: why is not bleended
  // float smoothes = smoothstep(0.0, 0.005, squareDist);
  float smoothes = 1.0;
  float coef = step(0.0, squareDist) * smoothes;

  if (coef == 0.0) {
    discard;
  }

  fragColor = vec4(1.0, 1.0, 1.0, coef);
}
