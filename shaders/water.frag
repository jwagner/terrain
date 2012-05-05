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
    float dist = gl_FragCoord.z/gl_FragCoord.w;
    vec2 uv0 = (worldPosition.xz/103.0)+vec2(time/17.0, time/29.0);
    vec2 uv1 = worldPosition.xz/107.0-vec2(time/-19.0, time/31.0);
    vec2 uv2 = worldPosition.xz/vec2(897.0, 983.0)+vec2(time/101.0, time/97.0);
    vec2 uv3 = worldPosition.xz/vec2(991.0, 877.0)-vec2(time/109.0, time/-113.0);
    vec4 noise = (texture2D(normalSampler, uv0)) +
                 (texture2D(normalSampler, uv1)) +
                 (texture2D(normalSampler, uv2)) +
                 (texture2D(normalSampler, uv3));
    noise = noise*0.5-1.0;
    vec3 surfaceNormal = normalize(noise.xzy*vec3(2.0, 1.0, 2.0));
    vec3 eyeNormal = normalize(eye-worldPosition);
    vec2 screen = (projectedPosition.xy/projectedPosition.z + 1.0)*0.5;

    vec2 distortion = surfaceNormal.xz/max(dist*0.0005, 30.0);
    vec3 reflectionSample = vec3(texture2D(reflectionSampler, screen+distortion));

    float theta1 = abs(dot(eyeNormal, surfaceNormal));
    vec3 rf0 = vec3(0.02, 0.02, 0.02); // realtime rendering, page 236
    vec3 reflectance = rf0 + (1.0 - rf0)*pow((1.0 - theta1), 5.0);


    vec3 rayDirection = normalize(worldPosition-eye);
    vec3 light = sunLight(surfaceNormal, eyeNormal, 100.0, 5.0, 0.5)+0.5;
    vec3 scatter = max(0.0, dot(surfaceNormal, eyeNormal))*vec3(0.0, 0.1, 0.07);
    vec3 albedo = mix(color*light*0.3+scatter, (vec3(0.1)+reflectionSample), reflectance);
    albedo = aerialPerspective(albedo, dist, rayDirection);

    gl_FragColor = vec4(albedo, 1.0);
    /*gl_FragColor = vec4(distortion, 0.0, 1.0);*/

//    gl_FragColor = vec4(vec3(fract(uv), 1.0), 1.0);
}


