// heavily based on http://www.iquilezles.org/www/articles/fog/fog.htm

uniform vec3 horizonColor;
uniform vec3 zenithColor;

vec3 atmosphereColor(vec3 rayDirection){
    float a = max(0.0, dot(rayDirection, vec3(0.0, 1.0, 0.0)));
    vec3 skyColor = mix(horizonColor, zenithColor, a);
    float sunTheta = max( dot(rayDirection, sunDirection), 0.0 );
    return skyColor+sunColor*pow(sunTheta, 256.0)*0.5;
}

vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayDirection){
    float density = 0.000015;
    //float fog = exp(-dist*density);
    float fog = exp(rayDirection.y*density) * (1.0-exp(-dist*rayDirection.y*density))/rayDirection.y;
    vec3 atmosphere = atmosphereColor(rayDirection); 
    /*return vec3(fog);*/
    return mix(albedo, atmosphere, clamp(fog, 0.0, 1.0));
}
