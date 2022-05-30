#version 300 es

uniform mat4x4 P;
uniform mat4x4 MV;
uniform mat4x4 MM;

layout(location = 0) in vec3 vPosition;
layout(location = 1) in vec3 vColor;
layout(location = 2) in vec2 vTextureCoord;
layout(location = 3) in float vVertexId;

out vec3 color;
out vec2 textureCoord;
out float vertexId;

void main()
{
  gl_Position = P * inverse(MV) * MM * vec4(vPosition, 1.0);

  color = vColor;
  textureCoord = vTextureCoord;
  vertexId = vVertexId;
}
