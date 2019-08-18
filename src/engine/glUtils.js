(function(){

var glUtils = provides('engine.glUtils');

glUtils.Texture2D = function Texture2D(image) {
    this.texture = gl.createTexture();
    this.bindTexture();
    this.unit = -1;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
    gl.generateMipmap(gl.TEXTURE_2D);
};
glUtils.Texture2D.prototype = {
    bindTexture: function(unit) {
        if(unit !== undefined){
            gl.activeTexture(gl.TEXTURE0+unit);
            this.unit = unit;
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    },
    unbindTexture: function () {
        gl.activeTexture(gl.TEXTURE0+this.unit);
        gl.bindTexture(gl.TEXTURE_2D, null);
    },
    uniform: function (location) {
        gl.uniform1i(location, this.unit);
    },
    equals: function(value) {
        return this.unit === value;
    },
    set: function(obj, name) {
        obj[name] = this.unit;
    } 
};

glUtils.VBO = function VBO(data){
    this.buffer = gl.createBuffer();
    this.bind();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    this.unbind();
    this.length = data.length;
};
glUtils.VBO.prototype = {
    bind: function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    },
    unbind: function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },
    draw: function(mode) {
        gl.drawArrays(mode, 0, this.length/3);
    }
};

glUtils.FBO = function FBO(width, height, format){
    this.width = width;
    this.height = height;

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, format || gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.unit = -1;
};
glUtils.FBO.prototype = $.extend({}, glUtils.Texture2D.prototype, {
    bind: function () {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    },
    unbind: function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
});


glUtils.getContext = function (canvas, options) {
    var upgrade = 'Try upgrading to the latest version of firefox or chrome.';
    if(!canvas.getContext){
        glUtils.onerror(canvas, 'canvas is not supported by your browser. ' +
             upgrade, 'no-canvas');
        return;
    }
    window.gl = canvas.getContext('webgl', {depth: true, alpha: false});
    if(window.gl == null){
        window.gl = canvas.getContext('experimental-webgl');
        if(window.gl == null){
            if(window.WebGLRenderingContext){
                glUtils.onerror(canvas, 'webgl is supported by your browser but not by your graphics card or driver. ' +
                                'please upgrade your graphics driver to the most recent version.', 'no-webgl-driver');
                return;
            }
            else {
                glUtils.onerror(canvas, 'webgl is not supported by your browser. ' +
                     upgrade, 'no-webgl');
                return;
            }
        }
    }

    if(options.vertex_texture_units && gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < options.vertex_texture_units){
        glUtils.onerror(canvas, 'This demo needs at least two vertex texture units which are not supported by your browser. ' +
              upgrade, 'no-vertext-texture-units');
        return;
    }

    if(options.texture_float && gl.getExtension('OES_texture_float') == null){
        glUtils.onerror(canvas, 'This demo needs float textures for HDR rendering which is not supported by your browser. ' +
                upgrade, 'no-OES_texture_float');
        return;
    }

    if(options.standard_derivatives && gl.getExtension('OES_standard_derivatives') == null){
        glUtils.onerror(canvas, 'This demo need the standard deriviates extensions for WebGL which is not supported by your Browser.' +
                upgrade, 'no-OES_standard_derivatives');

    }

    if(window.WebGLDebugUtils && options.debug){
        window.gl = WebGLDebugUtils.makeDebugContext(gl);
        console.log('running in debug context');
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.lost = false;
    canvas.addEventListener('webglcontextlost', function () {
        alert('lost webgl context');
    }, false);
    canvas.addEventListener('webglcontextrestored', function () {
        alert('restored webgl context - reloading!');
        window.location.reload();
    }, false);

    return window.gl;
};

glUtils.fullscreen = function (canvas, scene, parent) {
    function onresize() {
        var height = $(parent || canvas).height(),
            width = $(parent || canvas).width();
        if(canvas.width != width){
            canvas.width = scene.viewportWidth = width;
        }
        if(canvas.height != height){
            canvas.height = scene.viewportHeight = height;
        }
        scene.draw();
    }
    window.addEventListener('resize', onresize, false);
    onresize();
};

glUtils.onerror = function(){
};


})();
