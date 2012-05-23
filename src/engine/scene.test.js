(function(b){
provides('engine.scene.test');
var scene = requires('engine.scene');
b.testCase('engine.scene', {
    Mirror: {
        construct: function(){
            var plane = [0.0,-1.0,0.0],
                mirror = new scene.Mirror(vec3.create(plane)),
                matrix = [
                    1, 0, 0, 0,
                    0, -1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ];
            b.assert.equals(matrix, Array.prototype.slice.call(mirror.matrix, 0));
            b.assert.equals(plane, Array.prototype.slice.call(mirror._plane, 0));
        },
        planeToCamera: function() {
            var plane = vec3.create([0.0,-1.0,0.0]),
                mirror = new scene.Mirror(plane);
                

        }
    }
}); 


})(buster);

