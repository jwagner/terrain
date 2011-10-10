jQuery(function(){

provides('main');

var sceneGraph;

function getHashValue(name, default_){
    var match = window.location.hash.match('[#,]+' + name + '(=([^,]*))?');
    if(!match){
        return default_;
    }
    return match.length == 3 && match[2] != null ? match[2] : true;
}

var DEBUG = getHashValue('debug', false),
    DATA = 'data/data.gz_',
    FAR_AWAY = 100000,
    scene = requires('scene'),
    mesh = requires('mesh'),
    Loader = requires('loader').Loader,
    ShaderManager = requires('shader').Manager,
    glUtils = requires('glUtils'),
    uniform = requires('uniform'),
    Clock = requires('clock').Clock,
    MouseController = requires('cameracontroller').MouseController,
    InputHandler = requires('input').Handler,
    canvas = document.getElementById('c'),
    clock = new Clock(),
    input = new InputHandler(canvas),
    loader = new Loader(),
    resources = loader.resources,
    shaderManager = new ShaderManager(resources),
    time = 0,
    targetExposure = 0.0,
    rotation = false,
    globalUniforms,
    controller;

console.log('DEBUG=' + DEBUG);

function prepareScene(){
    sceneGraph = new scene.Graph();

    var vbo = new glUtils.VBO(new Float32Array(resources[DATA])),
        addressShader = shaderManager.get('point.vertex', 'color.frag'),
        gridVBO = new glUtils.VBO(mesh.grid(100)),
        addressTransform;

    globalUniforms = {
        skyColor: new uniform.Vec3([0.1, 0.15, 0.45]),
        // looks sexy for some reason
        groundColor: new uniform.Vec3([0.025, 0.05, 0.1]),
        sunColor: new uniform.Vec3([1.6, 1.47, 1.29]),
        sunDirection: new uniform.Vec3([0.0, 0.5, 1.0]),
        time: time,
        clip: 1000
    };

    var addresses = new scene.Material(addressShader, {
                color: new uniform.Vec3([0.5, 0.01, 0.01])
            }, [ 
                addressTransform = new scene.Transform([
                    new scene.PointMesh(vbo),
                    new scene.SimpleMesh(gridVBO)
                ])
            ]
        ),
        camera = new scene.Camera([
            addresses
        ]);

    camera.position[0] = 305;
    camera.position[1] = 1500;
    camera.position[2] = 200;
    camera.yaw = -0.01;
    camera.pitch = 1.5;

    mat4.rotate(addressTransform.matrix, Math.PI/2, [1, 0, 0]);
    mat4.scale(addressTransform.matrix, [0.005, -0.005, -0.02]);
    mat4.translate(addressTransform.matrix, [-600000, -200000, 0]);

    camera.far = FAR_AWAY;
    camera.near = 0.1;

    sceneGraph.root.append(camera);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    controller = new MouseController(input, camera);

    clock.ontick = function(td) {
        time += td;
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        sceneGraph.draw();
        controller.velocity = clamp(camera.position[1]+10, 10, 10000)/300;
        controller.tick(td);
    };

    input.onKeyUp = function(key) {
        console.log(key);
    }

}


function setStatus(status){
    $('#loading .status').text('loading ' + status);
}

setStatus('shaders...');

loader.load([
    'shaders/transform.glsl',
    'shaders/color.frag',
    'shaders/point.vertex',

]);

// all assets have been loaded
function ready(){
    $('#loading').hide();
    //return  glUtils.onerror();
    $('canvas').show();
    glUtils.getContext(canvas, {debug: DEBUG});
    prepareScene();
    glUtils.fullscreen(canvas, sceneGraph);
    clock.start();
}

function numberFormat(n){
    var q = ~~(n/1000),
        r = n%1000 + '';
    if(q == 0)
        return r;
    while(r.length < 3) {
        r = '0' + r;
    }
    return numberFormat(q) + ' ' + r;
}

loader.onready = function() {
    setStatus('points ...');
    try{
        var xhr = new XMLHttpRequest(),
            self = this;
        xhr.open('GET', DATA, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(data) {
            resources[DATA] = this.response;
            ready();
        };
        xhr.onprogress = function(e) {
            setStatus('points (' + numberFormat(~~(e.loaded/12)) + ' / 3 748 071)');
        };
        xhr.onerror = function(error) {
            glUtils.onerror(canvas,'failed to load points. XHR2 not supported?', 'xhr2-onerror');
        };
        xhr.send();
    }
    catch(e){
        glUtils.onerror(canvas,'failed to load points. XHR2 not supported?', 'xhr2-exception');
    }

}

glUtils.onerror = function(canvas, reason, code) {
    window._gaq = window._gaq || [];
    window._gaq.push(['_trackEvent', 'addresscloud', 'webgl-error', code]);
    alert(reason);
    $('#youtube').show();
    $(canvas).hide();
}

window.loader = loader;

});
