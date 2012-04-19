#extension GL_OES_standard_derivatives : enable
precision highp float;
#include "noise2D.glsl"


varying float depth;
varying float morph;
uniform vec3 color;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec4 heightMapTransform;
varying vec2 offset;
varying vec2 uv;
uniform sampler2D heightSampler;

float height(vec2 uv){
    return texture2D(heightSampler, uv).r;//+snoise(uv*1000.0)*0.001+snoise(uv*10000.0)*0.001;
}

void main(){
//  gl_FragColor = vec4(color, 1.0);
//    vec3 diffuse = max(dot(sunDirection, normalize(n)), 0.0)*sunColor;

    // calculate normal
    // 6500/2^14.. 2.5
    float heightRatio = 0.02;//0.04;
    vec2 uvWidth = vec2(0.001);//fwidth(uv);
    vec2 dx = vec2(uvWidth.x, 0.0);
    vec2 dy = vec2(0.0, uvWidth.y);
    float left = height(uv-dx);
    float right = height(uv+dx);
    float top = height(uv-dx);
    float bottom = height(uv+dx);
    vec3 s = normalize(vec3(uvWidth.x, (right-left)*heightRatio, 0.0));
    vec3 t = normalize(vec3(0.0, (bottom-top)*heightRatio, -uvWidth.y));
    vec3 n = cross(s, t);
    vec3 diffuse = max(dot(sunDirection, n), 0.0)*sunColor;
    /*gl_FragColor = vec4(color*dot(uvWidth, uvWidth)*100000.0, 1.0);*/
    gl_FragColor = vec4(diffuse*color, 1.0);
}
