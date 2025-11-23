precision highp float;

uniform sampler2D t;
uniform float wbTemp;
uniform float wbTint;
uniform vec2 resolution;

varying vec2 uv;

// Temperature to RGB multiplier approximation
vec3 temperatureToRGB(float temp) {
  float t = temp / 100.0;
  vec3 color;
  
  // Red
  if (t <= 66.0) {
    color.r = 1.0;
  } else {
    color.r = t - 60.0;
    color.r = 329.698727446 * pow(color.r, -0.1332047592) / 255.0;
    color.r = clamp(color.r, 0.0, 1.0);
  }
  
  // Green
  if (t <= 66.0) {
    color.g = t;
    color.g = (99.4708025861 * log(color.g) - 161.1195681661) / 255.0;
    color.g = clamp(color.g, 0.0, 1.0);
  } else {
    color.g = t - 60.0;
    color.g = (288.1221695283 * pow(color.g, -0.0755148492)) / 255.0;
    color.g = clamp(color.g, 0.0, 1.0);
  }
  
  // Blue
  if (t >= 66.0) {
    color.b = 1.0;
  } else {
    if (t <= 19.0) {
      color.b = 0.0;
    } else {
      color.b = t - 10.0;
      color.b = (138.5177312231 * log(color.b) - 305.0447927307) / 255.0;
      color.b = clamp(color.b, 0.0, 1.0);
    }
  }
  
  return color;
}

// sRGB to linear
float srgbToLinear(float c) {
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return pow((c + 0.055) / 1.055, 2.4);
}

vec3 srgbToLinearVec(vec3 c) {
  return vec3(
    srgbToLinear(c.r),
    srgbToLinear(c.g),
    srgbToLinear(c.b)
  );
}

void main() {
  vec4 color = texture2D(t, uv);
  
  // Convert to linear
  vec3 linear = srgbToLinearVec(color.rgb);
  
  // Apply white balance
  vec3 wbMultiplier = temperatureToRGB(wbTemp);
  
  // Tint adjustment (green-magenta shift)
  float tintFactor = wbTint / 100.0;
  wbMultiplier.g += tintFactor * 0.1;
  wbMultiplier.r -= tintFactor * 0.05;
  wbMultiplier.b -= tintFactor * 0.05;
  
  linear *= wbMultiplier;
  
  gl_FragColor = vec4(linear, color.a);
}

