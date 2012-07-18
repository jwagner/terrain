// heavily based on http://www.iquilezles.org/www/articles/fog/fog.htm
#line 2

uniform vec3 horizonColor;
uniform vec3 zenithColor;

vec3 atmosphereColor(vec3 rayDirection){
    float a = max(0.0, dot(rayDirection, vec3(0.0, 1.0, 0.0)));
    vec3 skyColor = mix(horizonColor, zenithColor, a);
    float sunTheta = max( dot(rayDirection, sunDirection), 0.0 );
    return skyColor+sunColor*pow(sunTheta, 256.0)*0.5;
}

vec3 applyFog(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){
    float fogDensity = 0.00006;
    float vFalloff = 20.0;
    vec3 fogColor = vec3(0.88, 0.92, 0.999);
    float fog = exp((-rayOrigin.y*vFalloff)*fogDensity) * (1.0-exp(-dist*rayDirection.y*vFalloff*fogDensity))/(rayDirection.y*vFalloff);
    return mix(albedo, fogColor, clamp(fog, 0.0, 1.0));
}

vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){
    float atmosphereDensity = 0.000025;
    vec3 atmosphere = atmosphereColor(rayDirection)+vec3(0.0, 0.02, 0.04); 
    vec3 color = mix(albedo, atmosphere, clamp(1.0-exp(-dist*atmosphereDensity), 0.0, 1.0));
    return applyFog(color, dist, rayOrigin, rayDirection);
}
