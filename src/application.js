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
    Q = getHashValue('Q', '1')*1.0,
    HEIGHTMAP = 'gfx/maui-diff.png',
    HIGH_LOD = 5,
    LOW_LOD = 4,
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
    floatFormat,
    globalUniforms,
    controller;

console.log('DEBUG=' + DEBUG);

function getImageData(i){
    var e = document.createElement('canvas'),
        c = e.getContext('2d');
    e.width = i.width;
    e.height = i.height;
    c.drawImage(i, 0, 0);
    //document.body.appendChild(e);
    return c.getImageData(0, 0, e.width, e.height);
}

function sampleHeight(img, u, v){
    if(u < 0 || u > 1 || v < 0 || v > 1) return 0.0;
    var x = ~~(img.width*u),
        y = ~~(img.height*v),
        i = (y*img.width+x)*4+3;
    return img.data[i]/255;
}

function prepareScene(){
    if(gl.getExtension('OES_texture_half_float')){
        floatFormat = gl.HALF_FLOAT;
        gl.getExtension('OES_texture_half_float_linear');
        console.log('half float');
    }
    else {
        floatFormat = gl.FLOAT;
        gl.getExtension('OES_texture_float_linear');
    }
    sceneGraph = new scene.Graph();

    var heightmapTexture = new glUtils.Texture2D(resources[HEIGHTMAP]),
        heightData = getImageData(resources[HEIGHTMAP]),
        waternormals3Texture = new glUtils.Texture2D(resources['gfx/waternormals3.png']),
        terrainShader = shaderManager.get('terrain'),
        skyShader = shaderManager.get('sky'),
        waterShader = shaderManager.get('water'),
        scale = 75110,
        far_away = scale*2.0,
        vscale = 6055;

    globalUniforms = {
        sunColor: [2.0, 1.75, 1.65],
        sunDirection: [-1.0, 0.2, 0.0],
        horizonColor: [0.6, 0.7, 1.0],
        zenithColor: [0.025, 0.1, 0.5],
        clip: 0.0,
        mirror: 1.0,
        time: time,
        wireframe: false
    };

    vec3.normalize(globalUniforms.sunDirection);


    var fakeCamera = new scene.Camera([]),
        terrainTree = new terrain.QuadTree(fakeCamera, 64, HIGH_LOD, far_away),
        terrainTransform = new scene.Transform([
            new scene.Material(terrainShader, {
                    color: [0.2, 0.4, 0.2],
                    heightSampler: heightmapTexture
                },
                [terrainTree]
            )
        ]),
        lowresTerrainTree = new terrain.QuadTree(fakeCamera, 32, HIGH_LOD>>1, far_away),
        lowresTerrainTransform = new scene.Transform([
            new scene.Material(terrainShader, {
                    color: [0.2, 0.4, 0.2],
                    heightSampler: heightmapTexture
                },
                [lowresTerrainTree]
            )
        ]),
        skyBox = new scene.Skybox(scale, skyShader, {}),
        reflectionFBO = new glUtils.FBO(1024, 512, floatFormat),
        reflectionTarget = new scene.RenderTarget(reflectionFBO, [
            new scene.Mirror(vec3.create([0.0, -1.0, 0.0]), [
                lowresTerrainTransform
            ]),
            skyBox

        ]),
        waterTransform = new scene.Transform([
                new scene.Material(waterShader, {
                        color: [0.4, 0.5, 0.8],
                        normalSampler: waternormals3Texture,
                        reflectionSampler: reflectionFBO
                    }, [
                        new scene.SimpleMesh(new glUtils.VBO(mesh.grid(1000)))
                    ]
                )
        ]),
        globalUniformsNode = new scene.Uniforms(globalUniforms, [
            //reflectionUniforms
            reflectionTarget, terrainTransform, waterTransform, skyBox
        ]),
        camera = new scene.Camera([globalUniformsNode]);
    window.camera = camera;
    vec3.set([26244.78125, 509.8193359375, 57317.26953125], camera.position);
    //vec3.set([0, 1, 0], camera.position);
    vec3.set(camera.position, fakeCamera.position);

    fakeCamera.yaw = camera.yaw = -1.8244;
    fakeCamera.pitch = camera.pitch = 0.001;

    fakeCamera.far = camera.far = far_away;
    fakeCamera.near = camera.near = 10.0;

   // mat4.rotate(terrainTransform.matrix, Math.PI/2, [1, 0, 0]);
    mat4.translate(terrainTransform.matrix, [0, -200, 0]);
    mat4.scale(terrainTransform.matrix, [scale, vscale, scale]);

    mat4.set(terrainTransform.matrix, lowresTerrainTransform.matrix);

    // y is a bias to fix reflection boundaries
    mat4.translate(waterTransform.matrix, [-scale*5, -20, -scale*5]);
    mat4.scale(waterTransform.matrix, [scale*10, 1, scale*10]);
//    mat4.translate(waterTransform.matrix, [-scale*0.5, 0, -scale*0.5]);
//    mat4.scale(waterTransform.matrix, [scale*1, 1, scale*1]);

    sceneGraph.root.append(camera);
//    sceneGraph.root.append(reflectionTarget);

    gl.clearColor(0.5, 0.6, 0.8, 1.0);

    controller = new MouseController(input, camera);
    controller.velocity = 2000;
    //controller.velocity = 500;

    var outOfBody = false,
        inverseterrainTransform = mat4.inverse(terrainTransform.matrix, mat4.create()),
        uv = vec3.create();

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

        if(PERF){
            debug.innerHTML = (
                'drawCalls: ' + sceneGraph.statistics.drawCalls + '<br>' +
                'vertices: ' + ~~(sceneGraph.statistics.vertices/1000) + 'k<br>' +
                'triangles: ' + ~~(sceneGraph.statistics.vertices/3000) + 'k<br>'
            );
        }

        if(!outOfBody){
            // collision detection
            mat4.multiplyVec3(inverseterrainTransform, camera.position, uv);
            var height = sampleHeight(heightData, uv[0], 1.0-uv[2]),
                delta = height-uv[1]+0.1;
            if(delta > 0){
                camera.position[1] += delta*vscale;
            }
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

    $('.ghost').click(function(){
        outOfBody = !outOfBody;
    });
    $('.wireframe').click(function(){
        terrainTree.setWireFrame(!terrainTree.wireframe);
        globalUniforms.wireframe = terrainTree.wireframe;
    });

    $('.fullscreen').click(function(){
        if(canvas.webkitRequestFullScreen){
            canvas.webkitRequestFullScreen(canvas.ALLOW_KEYBOARD_INPUT);
        }
        else if(canvas.mozRequestFullScreen){
            canvas.mozRequestFullScreen();
        }
        else if(canvas.requestFullScreen){
            canvas.requestFullScreen();
        }
        else {
            alert('no fullscreen support');
        }
    });

    $('.hq').click(function() {
        setLod(HIGH_LOD);
        $('.lq').addClass('active');
        $(this).removeClass('active');
    }); 
    $('.lq').click(function() {
        setLod(LOW_LOD);
        $('.hq').addClass('active');
        $(this).removeClass('active');
    }); 

    function setLod(lod){
        terrainTree.depth = lod;
        lowresTerrainTree.depth = lod>>1;
    }


}


function setStatus(status){
    $('#loading .status').text(status);
}

setStatus('loading data...');

loader.load([
    HEIGHTMAP,
    'gfx/waternormals3.png',
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
    $('canvas').css({display: 'block'});
    glUtils.getContext(canvas, {debug: DEBUG, standard_derivatives: true, texture_float: true, vertex_texture_units: 2});
    prepareScene();
    glUtils.fullscreen(canvas, sceneGraph, $('#cc')[0]);
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
    $('#video').show();
    $('#video iframe').attr('src', $('#video iframe').data('src'));
    $('#perfhub').hide();
    $('#menu').hide();
    $(canvas).hide();
};

window.loader = loader;

});
