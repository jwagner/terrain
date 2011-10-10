(function(){
var uniform = provides('uniform');

function glValue(set){
    function GlValue(value){
        this.value = value;
    }
    GlValue.prototype = {
        uniform: set
    };
    return GlValue;
}

uniform.Mat4 = glValue(function (location) {
    gl.uniformMatrix4fv(location, false, this.value);
});
uniform.Mat3 = glValue(function (location) {
    gl.uniformMatrix3fv(location, false, this.value);
});
uniform.Vec3 = glValue(function (location) {
    gl.uniform3fv(location, this.value);
});
uniform.Vec4 = glValue(function (location) {
    gl.uniform4fv(location, this.value);
});
uniform.Int = glValue(function (location) {
    gl.uniformi(location, this.value);
});

})();
