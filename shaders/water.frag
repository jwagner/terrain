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
#include "noise2D.glsl"
#line 17


void sunLight(const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse,
              inout vec3 diffuseColor, inout vec3 specularColor){
    vec3 reflection = normalize(reflect(-sunDirection, surfaceNormal));
    float direction = max(0.0, dot(eyeDirection, reflection));
    specularColor += pow(direction, shiny)*sunColor*spec;
    diffuseColor += max(dot(sunDirection, surfaceNormal),0.0)*sunColor*diffuse;
}

vec4 getNoise(vec2 uv){
    vec2 uv0 = (uv/103.0)+vec2(time/17.0, time/29.0);
    vec2 uv1 = uv/107.0-vec2(time/-19.0, time/31.0)+vec2(0.23);
    vec2 uv2 = uv/vec2(897.0, 983.0)+vec2(time/101.0, time/97.0)+vec2(0.51);
    vec2 uv3 = uv/vec2(991.0, 877.0)-vec2(time/109.0, time/-113.0)+vec2(0.71);
    vec4 noise = (texture2D(normalSampler, uv0)) +
                 (texture2D(normalSampler, uv1)) +
                 (texture2D(normalSampler, uv2)) +
                 (texture2D(normalSampler, uv3));
    return noise*0.5-1.0;
}

void main(){
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    vec3 worldToEye = eye-worldPosition;
    vec3 eyeDirection = normalize(worldToEye);

    vec2 uv = worldPosition.xz*0.5;
    vec4 noise = getNoise(uv);
    float dist = length(worldToEye);
    float distortionFactor = max(dist/100.0, 10.0);

    vec3 surfaceNormal = normalize(noise.xzy*vec3(2.0, clamp(dist*0.001, 1.0, 100.0), 2.0));

    sunLight(surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuse, specular);


    vec2 screen = (projectedPosition.xy/projectedPosition.z + 1.0)*0.5;

    vec2 distortion = surfaceNormal.xz/distortionFactor;
    vec3 reflectionSample = vec3(texture2D(reflectionSampler, screen+distortion));

    /*gl_FragColor = vec4(color*(reflectionSample+vec3(0.1))*(diffuse+specular+0.3)*2.0, 1.0);*/

    /*float theta1 = abs(dot(eyeDirection, surfaceNormal));*/

    float theta1 = max(dot(eyeDirection, surfaceNormal), 0.0);
    float rf0 = 0.02; // realtime rendering, page 236
    float reflectance = rf0 + (1.0 - rf0)*pow((1.0 - theta1), 5.0);

    // hacky
    /*reflectance = min(reflectance+dist/25000.0, 0.9);*/


    vec3 rayDirection = normalize(worldPosition-eye);
    vec3 light = specular+diffuse;// sunLight(surfaceNormal, eyeDirection, 100.0, 5.0, 0.5)+0.5;
    vec3 scatter = max(0.0, dot(surfaceNormal, eyeDirection))*vec3(0.0, 0.2, 0.14);
    vec3 albedo = mix(scatter*0.3, (vec3(0.1)+reflectionSample*0.9+specular), reflectance);

    albedo = aerialPerspective(albedo, dist, eye, rayDirection);
    gl_FragColor = vec4(albedo, 1.0);
    /*gl_FragColor = vec4(reflectionSample, 1.0);*/
    /*gl_FragColor = vec4(fract(uv), 0.0, 1.0);*/

    /*gl_FragColor = vec4(reflectance, 0.0, 0.0, 1.0);*/
//    gl_FragColor = vec4(distortion*10.0, 0.0, 1.0);

//    gl_FragColor = vec4(vec3(fract(uv), 1.0), 1.0);
}


