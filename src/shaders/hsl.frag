precision highp float;

uniform sampler2D t;
uniform vec2 resolution;
uniform float hue;
uniform float saturation;
uniform float luminance;
uniform float redHue;
uniform float redSat;
uniform float redLum;
uniform float greenHue;
uniform float greenSat;
uniform float greenLum;
uniform float blueHue;
uniform float blueSat;
uniform float blueLum;

varying vec2 uv;

// RGB to HSL
vec3 rgbToHsl(vec3 c) {
  float maxVal = max(max(c.r, c.g), c.b);
  float minVal = min(min(c.r, c.g), c.b);
  float delta = maxVal - minVal;
  
  float h = 0.0;
  if (delta != 0.0) {
    if (maxVal == c.r) {
      h = mod(((c.g - c.b) / delta) + (c.g < c.b ? 6.0 : 0.0), 6.0);
    } else if (maxVal == c.g) {
      h = (c.b - c.r) / delta + 2.0;
    } else {
      h = (c.r - c.g) / delta + 4.0;
    }
  }
  h /= 6.0;
  
  float l = (maxVal + minVal) / 2.0;
  float s = delta == 0.0 ? 0.0 : delta / (1.0 - abs(2.0 * l - 1.0));
  
  return vec3(h, s, l);
}

// HSL to RGB
vec3 hslToRgb(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;
  
  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
  float m = l - c / 2.0;
  
  vec3 rgb;
  if (h < 1.0 / 6.0) {
    rgb = vec3(c, x, 0.0);
  } else if (h < 2.0 / 6.0) {
    rgb = vec3(x, c, 0.0);
  } else if (h < 3.0 / 6.0) {
    rgb = vec3(0.0, c, x);
  } else if (h < 4.0 / 6.0) {
    rgb = vec3(0.0, x, c);
  } else if (h < 5.0 / 6.0) {
    rgb = vec3(x, 0.0, c);
  } else {
    rgb = vec3(c, 0.0, x);
  }
  
  return rgb + m;
}

void main() {
  vec4 color = texture2D(t, uv);
  vec3 rgb = color.rgb;
  
  // Global HSL adjustment
  vec3 hsl = rgbToHsl(rgb);
  hsl.x = mod(hsl.x + hue / 360.0, 1.0);
  hsl.y = clamp(hsl.y * (1.0 + saturation / 100.0), 0.0, 1.0);
  hsl.z = clamp(hsl.z + luminance / 100.0, 0.0, 1.0);
  rgb = hslToRgb(hsl);
  
  // Per-channel HSL adjustments
  // Red channel
  if (rgb.r > 0.5) {
    vec3 redHsl = rgbToHsl(vec3(rgb.r, 0.0, 0.0));
    redHsl.x = mod(redHsl.x + redHue / 360.0, 1.0);
    redHsl.y = clamp(redHsl.y * (1.0 + redSat / 100.0), 0.0, 1.0);
    redHsl.z = clamp(redHsl.z + redLum / 100.0, 0.0, 1.0);
    float redVal = hslToRgb(redHsl).r;
    rgb.r = mix(rgb.r, redVal, abs(rgb.r - 0.5) * 2.0);
  }
  
  // Green channel
  if (rgb.g > 0.5) {
    vec3 greenHsl = rgbToHsl(vec3(0.0, rgb.g, 0.0));
    greenHsl.x = mod(greenHsl.x + greenHue / 360.0, 1.0);
    greenHsl.y = clamp(greenHsl.y * (1.0 + greenSat / 100.0), 0.0, 1.0);
    greenHsl.z = clamp(greenHsl.z + greenLum / 100.0, 0.0, 1.0);
    float greenVal = hslToRgb(greenHsl).g;
    rgb.g = mix(rgb.g, greenVal, abs(rgb.g - 0.5) * 2.0);
  }
  
  // Blue channel
  if (rgb.b > 0.5) {
    vec3 blueHsl = rgbToHsl(vec3(0.0, 0.0, rgb.b));
    blueHsl.x = mod(blueHsl.x + blueHue / 360.0, 1.0);
    blueHsl.y = clamp(blueHsl.y * (1.0 + blueSat / 100.0), 0.0, 1.0);
    blueHsl.z = clamp(blueHsl.z + blueLum / 100.0, 0.0, 1.0);
    float blueVal = hslToRgb(blueHsl).b;
    rgb.b = mix(rgb.b, blueVal, abs(rgb.b - 0.5) * 2.0);
  }
  
  gl_FragColor = vec4(rgb, color.a);
}

