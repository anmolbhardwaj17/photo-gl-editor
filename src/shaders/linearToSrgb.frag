precision highp float;

uniform sampler2D t;
uniform vec2 resolution;

varying vec2 uv;

// Linear to sRGB conversion
float linearToSrgb(float c) {
  if (c <= 0.0031308) {
    return 12.92 * c;
  }
  return 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}

vec3 linearToSrgbVec(vec3 c) {
  return vec3(
    linearToSrgb(c.r),
    linearToSrgb(c.g),
    linearToSrgb(c.b)
  );
}

void main() {
  vec4 color = texture2D(t, uv);
  vec3 srgb = linearToSrgbVec(color.rgb);
  gl_FragColor = vec4(srgb, color.a);
}

