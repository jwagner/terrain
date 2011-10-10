(function(){

var glUtils = provides('glUtils');

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
}
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
    }
}

glUtils.VBO = function VBO(data){
    this.buffer = gl.createBuffer();
    this.bind();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    this.unbind();
    this.length = data.length;
}
glUtils.VBO.prototype = {
    bind: function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    },
    unbind: function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },
    drawTriangles: function() {
        gl.drawArrays(gl.TRIANGLES, 0, this.length/3);
    },
    drawPoints: function() {
        gl.drawArrays(gl.POINTS, 0, this.length/3);
    },
};

glUtils.FBO = function FBO(width, height, format){
    this.width = width;
    this.height = height;

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, format || gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
}
glUtils.FBO.prototype = $.extend({}, glUtils.Texture2D.prototype, {
    bind: function () {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    },
    unbind: function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
});


glUtils.getContext = function (canvas, options) {
    if(!canvas.getContext){
        glUtils.onerror(canvas, 'canvas is not supported by your browser. ' +
             'Try upgrading to chrome 12 or firefox 6 (aurora).', 'no-canvas');
        return;
    }
    window.gl = canvas.getContext('webgl');
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
                     'Try upgrading to chrome 12 or firefox 7.', 'no-webgl');
                return;
            }
        }
    }

    if(options.vertex_texture_units && gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 2){
        glUtils.onerror(canvas, 'This demo needs at least two vertex texture units which are not supported by your browser. ' +
              'Try upgrading to chrome 12 or firefox 6 (aurora).', 'no-vertext-texture-units');
        return;
    }

    if(options.texture_float && gl.getExtension('OES_texture_float') == null){
        glUtils.onerror(canvas, 'This demo needs float textures for HDR rendering which is not supported by your browser. ' +
              'Try upgrading to chrome 12 or firefox 6 (aurora).', 'no-OES_texture_float');
        return;
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

glUtils.fullscreen = function (canvas, scene) {
    function onresize() {
        var height = $(canvas).height(),
            width = $(canvas).width();
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
}


})();
