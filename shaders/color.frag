precision highp float;

varying float depth;
uniform vec3 color;
uniform vec3 heightMapTransform;

void main(){
//  gl_FragColor = vec4(color, 1.0);
    gl_FragColor = vec4(heightMapTransform, 1.0);
}
