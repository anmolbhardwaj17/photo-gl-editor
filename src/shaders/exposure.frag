precision highp float;

uniform sampler2D t;
uniform float exposure;
uniform float contrast;
uniform vec2 resolution;

varying vec2 uv;

void main() {
  vec4 color = texture2D(t, uv);
  
  // Exposure adjustment (linear)
  vec3 result = color.rgb * pow(2.0, exposure);
  
  // Contrast adjustment
  result = (result - 0.5) * (1.0 + contrast) + 0.5;
  
  gl_FragColor = vec4(result, color.a);
}

