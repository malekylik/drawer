#version 300 es

precision mediump float;

in vec2 textureCoord;
in float vertexId;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out uvec4 fragId;

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

  uint id = uint(vertexId);
  fragId = uvec4(id & uint(255), (id >> uint(8)) & uint(255), (id >> uint(16)) & uint(255), (id >> uint(24)) & uint(255));
}
