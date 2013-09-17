#extension GL_OES_standard_derivatives : enable
precision highp float;


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
uniform float wireframe;

varying vec3 worldPosition;
uniform vec3 terrainCameraPosition;
uniform vec3 eye;

#include "atmosphere.glsl"
#include "noise2D.glsl"
#line 22

float noize(vec2 uv){
    vec3 n = vec3(0.0);
    float f = 0.5;
    float w = 0.25;
    vec2 d = vec2(0.0);
    for( int i=0; i < 16 ; i++ )
    {
        float z = snoise(uv, n);
        d += n.xz;
        f += w * z / (1.0 + dot(d, d)); // replace with "w * n[0]" for a classic fbm()
        w *= 0.5;
        uv *= 2.0;
    }
    return f;
}

float height(vec2 uv){
    /*return noize(uv*10.0);*/
    return texture2D(heightSampler, uv, 0.0).r;
//    vec2 d = vec2(0.004);
//    return (texture2D(heightSampler, uv, 3.0).r+texture2D(heightSampler, uv+d).r+texture2D(heightSampler, uv-d)+texture2D(heightSampler, uv+d.yx)+texture2D(heightSampler, uv-d.yx)).r*(1.0/6.0);
}

void main(){
//  gl_FragColor = vec4(color, 1.0);
//    vec3 diffuse = max(dot(sunDirection, normalize(n)), 0.0)*sunColor;
    float dist = length(worldPosition-eye);

    // calculate normal
    // 6500/2^14.. 2.5
    float heightRatio = 6500.0/81920.0;//0.04;
    vec2 uvWidth = vec2(0.001);
    uvWidth = vec2(1.0/4096.0)*9.0;
//    uvWidth = fwidth(uv)*2.0;
    /*vec2 dx = vec2(uvWidth.x, 0.0);*/
    /*vec2 dy = vec2(0.0, uvWidth.y);*/
    vec4 c = texture2D(heightSampler, uv, 3.0);
    float top = c.a;
    float left = c.a;
    float right = (c.r-0.5)*-2.0;
    float bottom = (c.g-0.5)*2.0;
//    vec2 d = vec2(0.004);
    vec3 s = (vec3(uvWidth.x, (right)*heightRatio, 0.0));
    vec3 t = (vec3(0.0, (bottom)*heightRatio, -uvWidth.y));
    vec3 n = normalize(cross(s, t));
    float up = clamp(dot(vec3(0.0, 1.0, 0.0), n)*0.5-0.1, 0.0, 1.0);
    vec3 color_ = mix(vec3(0.12, 0.1, 0.1), vec3(0.15, 0.3, 0.1), up);
    vec3 diffuse = max(dot(sunDirection, n), 0.0)*sunColor;
    /*gl_FragColor = vec4(color*dot(uvWidth, uvWidth)*100000.0, 1.0);*/
    vec3 ambient = vec3(0.2, 0.2, 0.3);
    vec3 albedo = (diffuse+0.5+ambient)*color_;
    
    vec3 rayDirection = normalize(worldPosition-eye);
    albedo = aerialPerspective(albedo, dist, eye, rayDirection);


//    gl_FragColor = vec4(vec3(dot(rayDirection))*0.5+0.5, 1.0);
    if(wireframe == 1.0){
        gl_FragColor = vec4(vec3(lod, morph, 0.0), 1.0);
    }
    else {
        gl_FragColor = vec4(albedo, 1.0);
    }

//    gl_FragColor = vec4(vec3(noize(uv*10.0)), 1.0);
    /*gl_FragColor = vec4(vec3(worldPosition.y/20.0), 1.0);*/
    /*gl_FragColor = vec4(0.0, 1.0, 0.0, 0.0)*lod;*/
    /*gl_FragColor += vec4(1.0, 0.0, 0.0, 0.0)*morph;*/
    /*//gl_FragColor = vec4(vec3(morph)+vec3(1.0, 0.0, 0.0), 1.0);*/
}
