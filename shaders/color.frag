precision highp float;

varying float depth;
uniform vec3 color;

void main(){
  float radius = 0.5-distance(vec2(0.5, 0.5), gl_PointCoord);
  gl_FragColor = vec4(color*100.0/sqrt(depth), radius);
}
