precision highp float;

varying float depth;
uniform vec3 color;
uniform vec3 heightMapTransform;

void main(){
  gl_FragColor = vec4(color, 1.0);
  gl_FragColor = vec4(heightMapTransform.xy*0.5, 0.2, 2.0)*0.5;
}
