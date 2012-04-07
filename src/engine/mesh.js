(function(){

var mesh = provides('engine.mesh');
mesh.grid = function(size){
    var buffer = new Float32Array(size*size*6*3),
        i = 0,
        half = size * 0.5;

    for(var y = 0; y < size; y++){
        for(var x = 0; x < size; x++) {
            buffer[i++] = x/size;
            buffer[i++] = 0;
            buffer[i++] = y/size;

            buffer[i++] = x/size;
            buffer[i++] = 0;
            buffer[i++] = (y+1)/size;

            buffer[i++] = (x+1)/size;
            buffer[i++] = 0;
            buffer[i++] = (y+1)/size;

            buffer[i++] = x/size;
            buffer[i++] = 0;
            buffer[i++] = y/size;

            buffer[i++] = (x+1)/size;
            buffer[i++] = 0;
            buffer[i++] = (y+1)/size;

            buffer[i++] = (x+1)/size;
            buffer[i++] = 0;
            buffer[i++] = y/size;
        }
    }
    return buffer;
};

mesh.screen_quad = function screen_quad() {
    return new Float32Array([
            -1, 1, 0,
            -1, -1, 0,
            1, -1, 0,
            
            -1, 1, 0,
            1, -1, 0,
            1, 1, 0
    ]);
};

mesh.cube = function cube(scale) {
    scale = scale || 1;
    return new Float32Array([
            // back
            scale, scale, scale,
            scale, -scale, scale,
            -scale, -scale, scale,
            
            scale, scale, scale,
            -scale, -scale, scale,
            -scale, scale, scale,

            // front
            -scale, scale, -scale,
            -scale, -scale, -scale,
            scale, scale, -scale,
            
            scale, scale, -scale,
            -scale, -scale, -scale,
            scale, -scale, -scale,
            // left
            -scale, scale, scale,
            -scale, -scale, -scale,
            -scale, scale, -scale,
            
            -scale, scale, scale,
            -scale, -scale, scale,
            -scale, -scale, -scale,

            // right

            scale, scale, scale,
            scale, scale, -scale,
            scale, -scale, -scale,
            
            scale, scale, scale,
            scale, -scale, -scale,
            scale, -scale, scale,

            // top
            scale, scale, scale,
            -scale, scale, scale,
            -scale, scale, -scale,

            scale, scale, -scale,
            scale, scale, scale,
            -scale, scale, -scale,

            // bottom
            -scale, -scale, -scale,
            -scale, -scale, scale,
            scale, -scale, scale,

            -scale, -scale, -scale,
            scale, -scale, scale,
            scale, -scale, -scale
        ]);
};

})();
