precision highp float;

uniform sampler2D t;
uniform vec2 resolution;
uniform float grainAmount;
uniform float grainSize;
uniform float time;

varying vec2 uv;

// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Improved noise with multiple octaves
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec4 color = texture2D(t, uv);
  
  // Generate grain based on position and time
  vec2 grainCoord = uv * resolution / grainSize;
  float grain = noise(grainCoord + time * 0.1);
  grain = (grain - 0.5) * grainAmount;
  
  // Apply grain
  vec3 result = color.rgb + grain;
  
  gl_FragColor = vec4(result, color.a);
}

