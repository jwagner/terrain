(function(){

var shader = provides('engine.shader');

function makeShader(shaderType, source){
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.log(gl.getShaderInfoLog(shader), shaderType, source);
        throw 'Compiler exception: "' + gl.getShaderInfoLog(shader) + '"';
    }
    return shader;
}

function makeProgram(vertexSource, fragmentSource){
    var vertexShader = makeShader(gl.VERTEX_SHADER, vertexSource),
        fragmentShader = makeShader(gl.FRAGMENT_SHADER, fragmentSource),
        program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        throw 'Linker exception: ' + gl.getProgramInfoLog(program);
    }

    return program;
}

function keys(o){
    var a = [];
    for(var name in o){
        a.push(name);
    }
    return a;
}

function Shader(vertexSource, fragmentSource) {
        this.program = makeProgram(vertexSource, fragmentSource);
        this.uniformLocations = {};
        this.uniformValues = {};
        this.uniformNames = [];
        this.attributeLocations = {};
}
Shader.prototype = {
    use: function() {
        gl.useProgram(this.program);
    },
    prepareUniforms: function(values) {
        this.uniformNames = keys(values);
        for(var i = 0; i < this.uniformNames.length; i++) {
            var name = this.uniformNames[i];
            this.uniformLocations[name] = gl.getUniformLocation(this.program, name);
        }
    }, 
    uniforms: function (values) {
        if(this.uniformNames.length === 0){
            this.prepareUniforms(values);
        }
        for(var i = 0; i < this.uniformNames.length; i++) {
            var name = this.uniformNames[i];
            
            var location = this.uniformLocations[name],
                value = values[name];

            if(location === null) continue;

            if(value.uniform){
                if(!value.equals(this.uniformValues[name])){
                    value.uniform(location);
                    value.set(this.uniformValues, name);
                }
            }
            else if(value.length){
                var value2 = this.uniformValues[name];
                if(value2 !== undefined){
                    for(var j = 0, l = value.length; j < l; j++) {
                        if(value[j] != value2[j]) break;
                    }
                    // already set
                    if(j == l) {
                        continue;
                    }
                    else {
                        for(j = 0, l = value.length; j < l; j++) {
                            value2[j] = value[j];
                        }
                    }
                }
                else {
                    this.uniformValues[name] = new Float32Array(value);
                }
                switch(value.length){
                    case 2:
                        gl.uniform2fv(location, value);
                        break;
                    case 3:
                        gl.uniform3fv(location, value);
                        break;
                    case 4:
                        gl.uniform4fv(location, value);
                        break;
                    case 9:
                        gl.uniformMatrix3fv(location, false, value);
                        break;
                    case 16:
                        gl.uniformMatrix4fv(location, false, value);
                        break;

                }
            }
            else {
                if(value != this.uniformValues[name]){
                    gl.uniform1f(location, value);
                    this.uniformValues[name] = value;
                }

            }
        }
    },
    getUniformLocation: function(name) {
        if(this.uniformLocations[name] === undefined){
            this.uniformLocations[name] = gl.getUniformLocation(this.program, name);
        }
        return this.uniformLocations[name];
    },
    getAttribLocation: function(name) {
        if(!(name in this.attributeLocations)){
            var location = gl.getAttribLocation(this.program, name);
            if(location < 0){
                throw 'undefined attribute ' + name;
            }
            this.attributeLocations[name] = location;
        }
        return this.attributeLocations[name];
    }
};

shader.Manager = function ShaderManager(resources){
    this.resources = resources;
    this.shaders = [];
};
shader.Manager.prototype = {
    prefix: 'shaders/',
    includeExpression: /#include "([^"]+)"/g,
    preprocess: function(name, content) {
        return content.replace(this.includeExpression, function (_, name) {
            return this.getSource(name);
        }.bind(this));
    },
    getSource: function(name) {
        var content = this.resources[this.prefix + name];
        if(!content) {
            throw 'shader not found: ' + name;
        }
        return this.preprocess(name, content);
    },
    get: function(vertex, frag) {
        if(!frag) {
            frag = vertex + '.frag';
            vertex = vertex + '.vertex';
        }
        var key = frag + ';' + vertex;
        if(!(key in this.shaders)){
            this.shaders[key] = new Shader(this.getSource(vertex), this.getSource(frag));
        }
        return this.shaders[key];
    }
};

})();
