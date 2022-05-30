#version 300 es

precision mediump float;

in vec3 color;
in vec2 textureCoord;
in float vertexId;

uniform sampler2D outTexture;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out uvec4 fragId;

void main()
{

  float dist = texture(outTexture, textureCoord).r;
  float edgeDistance = 0.5;
  float edgeWidth = 0.7 * length(vec2(dFdx(dist), dFdy(dist)));
  float opacity = smoothstep(edgeDistance - edgeWidth, edgeDistance + edgeWidth, dist);

  // // fragColor = vec4(color * texture(outTexture, textureCoord).rgb, 1.0);
  // // fragColor = vec4(1.0, 1.0, 1.0, dist);
  // fragColor = vec4(1.0, 1.0, 1.0, opacity);
  // fragColor = vec4(dist, 0.0, 0.0, 1.0);

  vec4 bgColor = vec4(0.0, 0.0, 0.0, 1.0);
  // vec4 fgColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 fgColor = vec4(color, 1.0);
  // float screenPxDistance = 4.5 * (dist - 0.5);
  // float opacity = clamp(screenPxDistance + 0.5, 0.0, 1.0);

  fragColor = mix(bgColor, fgColor, opacity);

  uint id = uint(vertexId);
  fragId = uvec4(id & uint(255), (id >> uint(8)) & uint(255), (id >> uint(16)) & uint(255), (id >> uint(24)) & uint(255));
}
