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
    PERF = getHashValue('perf', false),
    FAR_AWAY = 10000,
    HEIGHTMAP = 'gfx/height4k_blur.png',
    PerfHub = requires('engine.perfhub').PerfHub,
    perfhub = new PerfHub(),
    scene = requires('engine.scene'),
    mesh = requires('engine.mesh'),
    terrain = requires('engine.terrain'),
    Loader = requires('engine.loader').Loader,
    ShaderManager = requires('engine.shader').Manager,
    glUtils = requires('engine.glUtils'),
    uniform = requires('engine.uniform'),
    Clock = requires('engine.clock').Clock,
    MouseController = requires('engine.cameracontroller').MouseController,
    InputHandler = requires('engine.input').Handler,
    canvas = document.getElementById('c'),
    debug = document.getElementById('debug'),
    clock = new Clock(),
    input = new InputHandler(canvas),
    loader = new Loader(),
    resources = loader.resources,
    shaderManager = new ShaderManager(resources),
    time = 0,
    globalUniforms,
    controller;

console.log('DEBUG=' + DEBUG);

function prepareScene(){
    sceneGraph = new scene.Graph();

    var heightmapTexture = new glUtils.Texture2D(resources[HEIGHTMAP]),
        terrainShader = shaderManager.get('terrain'),
        skyShader = shaderManager.get('sky'),
        scale = 163840/2,
        far_away = scale*2,
        vscale = 6500,
        terrainTransform;

    globalUniforms = {
        sunColor: new uniform.Vec3([1.6, 1.47, 1.29]),
        sunDirection: new uniform.Vec3([0.5, 0.1, -0.1]),
        horizonColor: new uniform.Vec3([0.6, 0.7, 0.9]),
        zenithColor: new uniform.Vec3([0.025, 0.1, 0.5])
//        time: time
    };

    vec3.normalize(globalUniforms.sunDirection.value);

    var fakeCamera = new scene.Camera([]),
        terrainNode = new scene.Material(terrainShader, {
                color: new uniform.Vec3([0.5, 0.3, 0.2]),
                heightSampler: heightmapTexture
            }, [ 
                terrainTransform = new scene.Transform([
                    new terrain.QuadTree(fakeCamera, 64, 5)
                ])
            ]
        ),
        skyBox = new scene.Skybox(scale, skyShader, {}),
        globalUniformsNode = new scene.Uniforms(globalUniforms, [
            terrainNode, skyBox
        ]),
        camera = new scene.Camera([globalUniformsNode]);

    vec3.set([scale/2, vscale/2, scale/2], camera.position);
    vec3.set(camera.position, fakeCamera.position);

    fakeCamera.yaw = camera.yaw = 0.0;
    fakeCamera.pitch = camera.pitch = 0.0;

    fakeCamera.far = camera.far = far_away;
    fakeCamera.near = camera.near = 1.0;

   // mat4.rotate(terrainTransform.matrix, Math.PI/2, [1, 0, 0]);
    mat4.scale(terrainTransform.matrix, [scale, vscale, scale]);

    sceneGraph.root.append(camera);

    gl.clearColor(0.5, 0.6, 0.8, 1.0);

    controller = new MouseController(input, camera);
    controller.velocity = 50;

    var outOfBody = false;

    clock.ontick = function(td) {
        time += td;
        perfhub.tick('waiting');
        //gl.disable(gl.DEPTH_TEST);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        //gl.enable(gl.BLEND);
        sceneGraph.draw();
        perfhub.tick('drawing');
        controller.tick(td);

        debug.innerHTML = (
            'drawCalls: ' + sceneGraph.statistics.drawCalls + '<br>' +
            'vertices: ' + ~~(sceneGraph.statistics.vertices/1000) + 'k<br>' +
            'triangles: ' + ~~(sceneGraph.statistics.vertices/3000) + 'k<br>'
        );

        if(!outOfBody){
            vec3.set(camera.position, fakeCamera.position);
            fakeCamera.yaw = camera.yaw;
            fakeCamera.pitch = camera.pitch;
            fakeCamera.far = camera.far;
            fakeCamera.near = camera.near;
        }
        if(PERF) perfhub.draw();
        perfhub.tick('debug');
        perfhub.start();
    };

    if(!PERF) {
        $('#perfhub').hide();
    }

    input.onKeyUp = function(key) {
        if(key == 'SPACE'){
            outOfBody = !outOfBody;
        }
        console.log(key);
    };


}


function setStatus(status){
    $('#loading .status').text(status);
}

setStatus('loading data...');

loader.load([
    HEIGHTMAP,
    'shaders/transform.glsl',
    'shaders/noise2D.glsl',
    'shaders/atmosphere.glsl',
    'shaders/sky.frag',
    'shaders/sky.vertex',
    'shaders/terrain.frag',
    'shaders/terrain.vertex'

]);

// all assets have been loaded
function ready(){
    $('#loading').hide();
    $('canvas').show();
    glUtils.getContext(canvas, {debug: DEBUG, standard_derivatives: true, texture_float: true, vertex_texture_units: 2});
    prepareScene();
    glUtils.fullscreen(canvas, sceneGraph);
    clock.start();
}

function numberFormat(n){
    var q = ~~(n/1000),
        r = n%1000 + '';
    if(q === 0)
        return r;
    while(r.length < 3) {
        r = '0' + r;
    }
    return numberFormat(q) + ' ' + r;
}

loader.onready = function() {
    setStatus('initializing ...');
    ready();
};

glUtils.onerror = function(canvas, reason, code) {
    window._gaq = window._gaq || [];
    window._gaq.push(['_trackEvent', 'terrain', 'webgl-error', code]);
    alert(reason);
    $('#youtube').show();
    $(canvas).hide();
};

window.loader = loader;

});
