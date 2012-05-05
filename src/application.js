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
    Q = getHashValue('Q', '1.0')*1.0,
    HEIGHTMAP = 'gfx/maui-diff.png',
    PerfHub = requires('engine.perfhub').PerfHub,
    perfhub = new PerfHub(),
    scene = requires('engine.scene'),
    mesh = requires('engine.mesh'),
    terrain = requires('engine.terrain'),
    Loader = requires('engine.loader').Loader,
    ShaderManager = requires('engine.shader').Manager,
    glUtils = requires('engine.glUtils'),
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
        waternormalsTexture = new glUtils.Texture2D(resources['gfx/waternormals.png']),
        terrainShader = shaderManager.get('terrain'),
        skyShader = shaderManager.get('sky'),
        waterShader = shaderManager.get('water'),
        scale = 75110,
        far_away = scale*2.0,
        vscale = 3055;

    globalUniforms = {
        sunColor: [1.8, 1.75, 1.65],
        sunDirection: [-1.0, 0.5, 0.0],
        horizonColor: [0.6, 0.7, 0.9],
        zenithColor: [0.025, 0.1, 0.5],
        clip: 0.0,
        mirror: 1.0,
        time: time
    };

    vec3.normalize(globalUniforms.sunDirection);


    var fakeCamera = new scene.Camera([]),
        terrainTransform = new scene.Transform([
            new scene.Material(terrainShader, {
                    color: [0.2, 0.4, 0.2],
                    heightSampler: heightmapTexture
                }, [
                    new terrain.QuadTree(fakeCamera, 64*Q, 6, far_away)
                ]
            )
        ]),
        skyBox = new scene.Skybox(scale, skyShader, {}),
        reflectionTransform = new scene.Mirror([
            new scene.Uniforms({mirror: -1, clip: 1.0}, [
                terrainTransform, skyBox
            ])
        ]),
        reflectionFBO = new glUtils.FBO(1024, 512, gl.FLOAT),
        reflectionTarget = new scene.RenderTarget(reflectionFBO, [reflectionTransform]),
        waterTransform = new scene.Transform([
                new scene.Material(waterShader, {
                        color: [0.2, 0.4, 0.8],
                        normalSampler: waternormalsTexture,
                        reflectionSampler: reflectionFBO
                    }, [
                        new scene.SimpleMesh(new glUtils.VBO(mesh.grid(1000)))
                    ]
                )
        ]),
        globalUniformsNode = new scene.Uniforms(globalUniforms, [
            reflectionTarget, terrainTransform, waterTransform, skyBox
        ]),
        camera = new scene.Camera([globalUniformsNode]);
    vec3.set([scale/2, vscale/2, scale/2], camera.position);
    //vec3.set([0, 1, 0], camera.position);
    vec3.set(camera.position, fakeCamera.position);

    fakeCamera.yaw = camera.yaw = 0.0;
    fakeCamera.pitch = camera.pitch = 0.0;

    fakeCamera.far = camera.far = far_away;
    fakeCamera.near = camera.near = 10.0;

   // mat4.rotate(terrainTransform.matrix, Math.PI/2, [1, 0, 0]);
    mat4.translate(terrainTransform.matrix, [0, -200, 0]);
    mat4.scale(terrainTransform.matrix, [scale, vscale, scale]);
    mat4.translate(waterTransform.matrix, [-scale*5, 0, -scale*5]);
    mat4.scale(waterTransform.matrix, [scale*10, 1, scale*10]);
//    mat4.translate(waterTransform.matrix, [-scale*0.5, 0, -scale*0.5]);
//    mat4.scale(waterTransform.matrix, [scale*1, 1, scale*1]);

    sceneGraph.root.append(camera);
//    sceneGraph.root.append(reflectionTarget);

    gl.clearColor(0.5, 0.6, 0.8, 1.0);

    controller = new MouseController(input, camera);
    controller.velocity = 5000;

    var outOfBody = false;

    clock.ontick = function(td) {
        time += td;
        globalUniforms.time = time;
        //gl.disable(gl.DEPTH_TEST);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        //gl.enable(gl.BLEND);
        if(PERF) perfhub.enter('draw');
        sceneGraph.draw();
        if(PERF){
            //gl.finish();
            perfhub.exit('draw');
        }
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
        if(PERF) {
            perfhub.drawFrame();
        }
    };

    if(!PERF) {
        $('#perfhub').hide();
        $('#debug').hide();
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
    'gfx/waternormals.png',
    'shaders/transform.glsl',
    'shaders/noise2D.glsl',
    'shaders/atmosphere.glsl',
    'shaders/sky.frag',
    'shaders/sky.vertex',
    'shaders/terrain.frag',
    'shaders/terrain.vertex',
    'shaders/water.frag',
    'shaders/water.vertex'

]);

// all assets have been loaded
function ready(){
    $('#loading').hide();
    $('canvas').show();
    glUtils.getContext(canvas, {debug: DEBUG, standard_derivatives: true, texture_float: true, vertex_texture_units: 2});
    prepareScene();
    glUtils.fullscreen(canvas, sceneGraph, document.body);
    clock.start(canvas);
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
