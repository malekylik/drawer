#version 300 es

precision mediump float;

in vec3 color;
in float vertexId;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out uvec4 fragId;

void main()
{
  fragColor = vec4(color, 1.0);

  uint id = uint(vertexId);
  fragId = uvec4(id & uint(255), (id >> uint(8)) & uint(255), (id >> uint(16)) & uint(255), (id >> uint(24)) & uint(255));
}
