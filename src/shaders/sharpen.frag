precision highp float;

uniform sampler2D t;
uniform vec2 resolution;
uniform float sharpenAmount;
uniform float sharpenRadius;

varying vec2 uv;

void main() {
  vec2 pixelSize = 1.0 / resolution;
  
  // Sample center and surrounding pixels
  vec4 center = texture2D(t, uv);
  vec4 up = texture2D(t, uv + vec2(0.0, pixelSize.y * sharpenRadius));
  vec4 down = texture2D(t, uv - vec2(0.0, pixelSize.y * sharpenRadius));
  vec4 left = texture2D(t, uv - vec2(pixelSize.x * sharpenRadius, 0.0));
  vec4 right = texture2D(t, uv + vec2(pixelSize.x * sharpenRadius, 0.0));
  
  // Unsharp mask: subtract blurred from original
  vec3 blurred = (up.rgb + down.rgb + left.rgb + right.rgb) / 4.0;
  vec3 sharpened = center.rgb + (center.rgb - blurred) * sharpenAmount;
  
  gl_FragColor = vec4(sharpened, center.a);
}

