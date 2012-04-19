precision highp float;

varying float depth;
varying float morph;
uniform vec3 color;
uniform vec4 heightMapTransform;
varying vec2 offset;
varying vec3 n;

void main(){
//  gl_FragColor = vec4(color, 1.0);
    gl_FragColor = vec4(n, 1.0);
}
