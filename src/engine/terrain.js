(function(){
var terrain = provides('engine.terrain'),
    scene = requires('engine.scene'),
    glUtils = requires('engine.glUtils'),
    uniform = requires('engine.uniform'),
    mesh = requires('engine.mesh');


var auxVec3 = vec3.create();


// compute the closest point on an AABB to a point
function closestPointPointAABB(point, box, dest){
    var v;

    v = point[0];
    if(v < box[0]) v = box[0];
    if(v > box[3]) v = box[3];
    dest[0] = v;

    v = point[1];
    if(v < box[1]) v = box[1];
    if(v > box[4]) v = box[4];
    dest[1] = v;

    v = point[2];
    if(v < box[2]) v = box[2];
    if(v > box[5]) v = box[5];
    dest[2] = v;
}

function distancePointAABBSquared(point, box){
    var distance = 0.0,
        v, a;

    v = point[0];
    a = box[0];
    if(v < a) distance += (a - v)*(a - v);
    a = box[3];
    if(v > a) distance += (v - a)*(v - a);

    v = point[1];
    a = box[1];
    if(v < a) distance += (a - v)*(a - v);
    a = box[4];
    if(v > a) distance += (v - a)*(v - a);

    v = point[2];
    a = box[2];
    if(v < a) distance += (a - v)*(a - v);
    a = box[5];
    if(v > a) distance += (v - a)*(v - a);

    return distance;
}


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
        var aabb = [left, 0, top, left+scale, 1, top+scale],
            distance = distancePointAABBSquared(this.localCameraPosition, aabb);

        if(distance > scale*scale*50 || level === this.depth){
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

