#extension GL_OES_standard_derivatives : enable
precision highp float;
//include "noise2D.glsl"


varying float depth;
varying float morph;
varying float lod;
uniform vec3 color;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec4 heightMapTransform;
varying vec2 offset;
varying vec2 uv;
uniform sampler2D heightSampler;

varying vec3 worldPosition;
uniform vec3 terrainCameraPosition;

#include "atmosphere.glsl"

float height(vec2 uv){
//    return texture2D(heightSampler, uv, 3.0).r;//+snoise(uv*1000.0)*0.001+snoise(uv*10000.0)*0.001;
    vec2 d = vec2(0.004);
    return (texture2D(heightSampler, uv, 3.0).r+texture2D(heightSampler, uv+d).r+texture2D(heightSampler, uv-d)+texture2D(heightSampler, uv+d.yx)+texture2D(heightSampler, uv-d.yx)).r*(1.0/6.0);
}

void main(){
//  gl_FragColor = vec4(color, 1.0);
//    vec3 diffuse = max(dot(sunDirection, normalize(n)), 0.0)*sunColor;
    float dist = gl_FragCoord.z/gl_FragCoord.w;

    // calculate normal
    // 6500/2^14.. 2.5
    float heightRatio = 6500.0/81920.0;//0.04;
    vec2 uvWidth = vec2(0.001);
    uvWidth = vec2(1.0/4096.0)*9.0;
//    uvWidth = fwidth(uv)*2.0;
    vec2 dx = vec2(uvWidth.x, 0.0);
    vec2 dy = vec2(0.0, uvWidth.y);
    float left = height(uv);
    float right = height(uv+dx);
    float top = left;
    float bottom = height(uv+dx);
    vec3 s = (vec3(uvWidth.x, (right-left)*heightRatio, 0.0));
    vec3 t = (vec3(0.0, (bottom-top)*heightRatio, -uvWidth.y));
    vec3 n = normalize(cross(s, t));
    vec3 diffuse = max(dot(sunDirection, n), 0.0)*sunColor;
    /*gl_FragColor = vec4(color*dot(uvWidth, uvWidth)*100000.0, 1.0);*/
    vec3 ambient = vec3(0.2, 0.2, 0.3);
    vec3 albedo = (diffuse+0.5+ambient)*color;
    
    float density = 0.00005;
    vec3 rayDirection = normalize(worldPosition-terrainCameraPosition);
    float fog = exp(-dist*density);
    vec3 atmosphere = atmosphereColor(rayDirection); 
    albedo = mix(atmosphere, albedo, fog);


//    gl_FragColor = vec4(vec3(dot(rayDirection))*0.5+0.5, 1.0);
    gl_FragColor = vec4(albedo, 1.0);
    /*gl_FragColor = vec4(0.0, 1.0, 0.0, 0.0)*lod;*/
    /*gl_FragColor += vec4(1.0, 0.0, 0.0, 0.0)*morph;*/
    /*//gl_FragColor = vec4(vec3(morph)+vec3(1.0, 0.0, 0.0), 1.0);*/
}
