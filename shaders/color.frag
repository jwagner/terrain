precision highp float;

varying float depth;
varying float morph;
uniform vec3 color;
uniform vec4 heightMapTransform;

void main(){
//  gl_FragColor = vec4(color, 1.0);
    gl_FragColor = vec4(pow(2.0, heightMapTransform.z)*0.1, 0.0, morph, 1.0);
}
