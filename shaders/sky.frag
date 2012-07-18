precision highp float;

uniform vec3 sunColor;
uniform vec3 eye;
uniform vec3 sunDirection;

varying vec3 worldPosition;

#include "atmosphere.glsl"

void main(){
    vec3 rayDirection = normalize(worldPosition);
    vec3 atmosphere = applyFog(atmosphereColor(rayDirection), 100000.0, eye, rayDirection); 
    gl_FragColor = vec4(atmosphere, 1.0);
}
