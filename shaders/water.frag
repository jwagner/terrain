precision highp float;

uniform vec3 sunColor;
uniform vec3 sunDirection;

varying vec3 worldPosition;
varying vec4 projectedPosition;

uniform sampler2D normalSampler;
uniform sampler2D reflectionSampler;
uniform vec3 eye;
uniform vec3 color;
uniform float time;

#include "atmosphere.glsl"

vec3 sunLight(const vec3 surfaceNormal, const vec3 eyeNormal, float shiny, float spec, float diffuse){
    vec3 diffuseColor = max(dot(sunDirection, surfaceNormal),0.0)*sunColor*diffuse;
    vec3 reflection = normalize(reflect(-sunDirection, surfaceNormal));
    float direction = max(0.0, dot(eyeNormal, reflection));
    vec3 specular = pow(direction, shiny)*sunColor*spec;
    return diffuseColor + specular;
}

void main(){
    vec2 uv0 = (worldPosition.xz/103.0)+vec2(time/17.0, time/29.0);
    vec2 uv1 = worldPosition.xz/107.0-vec2(time/-19.0, time/31.0);
    vec2 uv2 = worldPosition.xz/997.0+vec2(time/101.0, time/97.0);
    vec2 uv3 = worldPosition.xz/991.0-vec2(time/109.0, time/-113.0);
    vec4 noise = (texture2D(normalSampler, uv0)) +
                 (texture2D(normalSampler, uv1)) +
                 (texture2D(normalSampler, uv2)) +
                 (texture2D(normalSampler, uv3));
    noise = noise*0.5-1.0;
    vec3 surfaceNormal = normalize(noise.xzy*vec3(0.2, 1.0, 0.2));
    vec3 eyeNormal = normalize(eye-worldPosition);
    vec2 screen = (projectedPosition.xy/projectedPosition.z + 1.0)*0.5;

    vec3 reflectionSample = vec3(texture2D(reflectionSampler, screen+surfaceNormal.xz*0.5));

    vec3 light = sunLight(surfaceNormal, eyeNormal, 50.0, 4.0, 2.0);

    gl_FragColor = vec4((light*color*0.5+reflectionSample*0.9), 1.0);

//    gl_FragColor = vec4(vec3(fract(uv), 1.0), 1.0);
}


