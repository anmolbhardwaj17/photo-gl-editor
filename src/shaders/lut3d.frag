precision highp float;

uniform sampler2D t;
uniform sampler2D lutTexture;
uniform float lutSize;
uniform vec2 resolution;

varying vec2 uv;

// Trilinear interpolation for 3D LUT lookup
vec3 sampleLUT3D(vec3 color, sampler2D lut, float size) {
  // Clamp color to valid range
  color = clamp(color, 0.0, 1.0);
  
  // Calculate grid position
  float scale = (size - 1.0) / size;
  float offset = 1.0 / (2.0 * size);
  
  vec3 scaled = color * scale + offset;
  
  // Get integer and fractional parts
  vec3 index = scaled * (size - 1.0);
  vec3 indexFloor = floor(index);
  vec3 indexFrac = index - indexFloor;
  
  // Clamp to valid range
  indexFloor = clamp(indexFloor, 0.0, size - 1.0);
  
  // Calculate texture coordinates for 8 corners of cube
  float r0 = indexFloor.r;
  float r1 = min(r0 + 1.0, size - 1.0);
  float g0 = indexFloor.g;
  float g1 = min(g0 + 1.0, size - 1.0);
  float b0 = indexFloor.b;
  float b1 = min(b0 + 1.0, size - 1.0);
  
  // Convert 3D indices to 2D texture coordinates
  // Texture layout: width = size², height = size
  // For position (r, g, b): x = g * size + r, y = b
  vec2 getCoord(float r, float g, float b) {
    float x = g * size + r;
    float y = b;
    return vec2((x + 0.5) / (size * size), (y + 0.5) / size);
  }
  
  // Sample 8 corners
  vec3 c000 = texture2D(lut, getCoord(r0, g0, b0)).rgb;
  vec3 c001 = texture2D(lut, getCoord(r0, g0, b1)).rgb;
  vec3 c010 = texture2D(lut, getCoord(r0, g1, b0)).rgb;
  vec3 c011 = texture2D(lut, getCoord(r0, g1, b1)).rgb;
  vec3 c100 = texture2D(lut, getCoord(r1, g0, b0)).rgb;
  vec3 c101 = texture2D(lut, getCoord(r1, g0, b1)).rgb;
  vec3 c110 = texture2D(lut, getCoord(r1, g1, b0)).rgb;
  vec3 c111 = texture2D(lut, getCoord(r1, g1, b1)).rgb;
  
  // Trilinear interpolation
  vec3 c00 = mix(c000, c100, indexFrac.r);
  vec3 c01 = mix(c001, c101, indexFrac.r);
  vec3 c10 = mix(c010, c110, indexFrac.r);
  vec3 c11 = mix(c011, c111, indexFrac.r);
  
  vec3 c0 = mix(c00, c10, indexFrac.g);
  vec3 c1 = mix(c01, c11, indexFrac.g);
  
  return mix(c0, c1, indexFrac.b);
}

void main() {
  vec4 color = texture2D(t, uv);
  vec3 result = sampleLUT3D(color.rgb, lutTexture, lutSize);
  gl_FragColor = vec4(result, color.a);
}

