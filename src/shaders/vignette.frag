precision highp float;

uniform sampler2D t;
uniform vec2 resolution;
uniform float vignetteAmount;
uniform float vignetteSize;
uniform float vignetteRoundness;

varying vec2 uv;

void main() {
  vec4 color = texture2D(t, uv);
  
  // Calculate distance from center
  vec2 center = vec2(0.5, 0.5);
  vec2 coord = uv - center;
  
  // Aspect ratio correction
  float aspect = resolution.x / resolution.y;
  coord.x *= aspect;
  
  // Calculate distance with roundness
  float dist = length(coord);
  dist = pow(dist / vignetteSize, 1.0 / vignetteRoundness);
  
  // Apply vignette
  float vignette = 1.0 - smoothstep(0.0, 1.0, dist) * vignetteAmount;
  
  vec3 result = color.rgb * vignette;
  
  gl_FragColor = vec4(result, color.a);
}

