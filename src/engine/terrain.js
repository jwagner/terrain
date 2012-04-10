(function(){
var terrain = provides('engine.terrain'),
    scene = requires('engine.scene'),
    glUtils = requires('engine.glUtils'),
    uniform = requires('engine.uniform'),
    mesh = requires('engine.mesh');


var auxVec3 = vec3.create();

/**
  Quadtree based terrain LOD system

  Draws terrain at <0, 0, 0> to <1, 0, 1>

  @constructor
  @param {engine.scene.Camera} camera - Camera used for LOD calculations, can be different from actual camera
  @param {number} resolution - resolution per grid level
  @param {number} depth - maximal depth of quadtree
*/

terrain.QuadTree = function TerrainQuadTree(camera, resolution, depth) {
    this.camera = camera;
    this.resolution = resolution;
    this.depth = depth;
    this.localCameraPosition = vec3.create();

    this.mesh = new scene.SimpleMesh(new glUtils.VBO(mesh.wireFrame(mesh.grid(resolution))), gl.LINES);
    this.matrix = mat4.identity();
    this.matrixUniform = new uniform.Mat4(this.matrix);
    this.heightMapTransformUniform = new uniform.Vec3(vec3.create([0, 0, 1]));
    this.inverseModelTransform = mat4.create();
};
terrain.QuadTree.prototype = extend({}, scene.Node.prototype, {
    visit: function(graph) {
        graph.pushUniforms();
        mat4.inverse(graph.uniforms.modelTransform.value, this.inverseModelTransform);
        mat4.multiplyVec3(this.inverseModelTransform, this.camera.position, this.localCameraPosition);

        mat4.set(graph.uniforms.modelTransform.value, this.matrix);

        graph.uniforms.modelTransform = this.matrixUniform;
        graph.uniforms.heightMapTransform = this.heightMapTransformUniform;
        this.visitNode(graph, 0, 0, 1, 0);
        graph.popUniforms();
    },
    visitNode: function(graph, left, top, scale, level) {
        var x = this.localCameraPosition[0]-left-scale*0.5,
            y = this.localCameraPosition[1]-scale*0.5,
            z = this.localCameraPosition[2]-top-scale*0.5,
            distance = Math.sqrt(x*x + y*y + z*z);


        if(distance > scale*3.4 || level === this.depth){
            mat4.translate(this.matrix, [left, 0, top], this.matrix);
            mat4.scale(this.matrix, [scale, 1, scale], this.matrix);
            this.heightMapTransformUniform.value[0] = left;
            this.heightMapTransformUniform.value[1] = top;
            this.heightMapTransformUniform.value[2] = scale;
            this.mesh.visit(graph);
            mat4.scale(this.matrix, [1/scale, 1, 1/scale], this.matrix);
            mat4.translate(this.matrix, [-left, 0, -top], this.matrix);
        }
        else {
            scale *= 0.5;
            level += 1;
            this.visitNode(graph, left, top, scale, level);
            this.visitNode(graph, left+scale, top, scale, level);
            this.visitNode(graph, left, top+scale, scale, level);
            this.visitNode(graph, left+scale, top+scale, scale, level);
        }
    } 
});

})();

