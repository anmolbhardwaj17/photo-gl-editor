precision highp float;

uniform sampler2D t;
uniform vec2 resolution;
uniform vec2 curvePoints[16]; // Max 16 points
uniform int curvePointCount;

varying vec2 uv;

// Simple linear interpolation between curve points
float applyCurve(float value) {
  if (curvePointCount < 2) return value;
  
  // Find the two points to interpolate between
  for (int i = 0; i < 15; i++) {
    if (float(i + 1) >= float(curvePointCount)) break;
    
    float x0 = curvePoints[i].x;
    float y0 = curvePoints[i].y;
    float x1 = curvePoints[i + 1].x;
    float y1 = curvePoints[i + 1].y;
    
    if (value >= x0 && value <= x1) {
      // Linear interpolation
      float t = (value - x0) / (x1 - x0);
      return mix(y0, y1, t);
    }
  }
  
  // Clamp to first/last point
  if (value <= curvePoints[0].x) {
    return curvePoints[0].y;
  }
  if (value >= curvePoints[curvePointCount - 1].x) {
    return curvePoints[curvePointCount - 1].y;
  }
  
  return value;
}

void main() {
  vec4 color = texture2D(t, uv);
  
  // Apply curve per channel (or could be luminance-based)
  vec3 result;
  result.r = applyCurve(color.r);
  result.g = applyCurve(color.g);
  result.b = applyCurve(color.b);
  
  gl_FragColor = vec4(result, color.a);
}

