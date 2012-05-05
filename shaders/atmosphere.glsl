uniform vec3 horizonColor;
uniform vec3 zenithColor;

vec3 atmosphereColor(vec3 rayDirection){
    float a = max(0.0, dot(rayDirection, vec3(0.0, 1.0, 0.0)));
    vec3 skyColor = mix(horizonColor, zenithColor, a);
    float sunTheta = max( dot(rayDirection, sunDirection), 0.0 );
    float density = 0.00005;
    return skyColor+sunColor*pow(sunTheta, 32.0)*0.5;
}

vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayDirection){
    float density = 0.00005;
    float fog = exp(-dist*density);
    vec3 atmosphere = atmosphereColor(rayDirection); 
    return mix(atmosphere, albedo, fog);
}
