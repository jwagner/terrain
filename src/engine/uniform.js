(function(){
var uniform = provides('engine.uniform');

function glValue(set){
    function GlValue(value){
        if(value instanceof Float32Array){
            this.value = value;
        }
        else {
            this.value = new Float32Array(value);
        }
    }
    GlValue.prototype = {
        uniform: set,
        equals: function(value) {
            if(!value) return false;
            var v = this.value;
            for(var i = 0, l=v.length; i < l; i++) {
                if(value[i] !== v[i]) return false;
            }
            return true;
        },
        set: function(obj, name){
            var v = obj[name],
                v2 = this.value;
            if(!v){
                obj[name] = new Float32Array(v2);
            }
            else {
                for(var i = 0, l=v.length; i < l; i++) {
                    v[i] = v2[i];
                }
            }
        }
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
uniform.Int = function(value){
    this.value = value;
};
uniform.Int.prototype = {
    uniform: function (location) {
        gl.uniformi(location, this.value);
    },
    equals: function(value){
        return this.value === value;
    },
    set: function(obj, name){
        obj[name] = this.value;
    }
};

})();
