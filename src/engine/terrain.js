(function(){
var terrain = provides('engine.terrain'),
    scene = requires('engine.scene'),
    glUtils = requires('engine.glUtils'),
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

function checkFrustumAABB(frustum, aabb){
    // plane
    for(var i = 0; i < 6; i++) {
        var lx = frustum[i*4],
            ly = frustum[i*4+1],
            lz = frustum[i*4+2],
            lw = frustum[i*4+3],
            p = 0,

            qx = aabb[0],
            qy = aabb[1],
            qz = aabb[2];
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;
        //if(lx*qx + ly*qy + lz*qz + lw < 0 ) p ++;
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;

        qx = aabb[3];
        qy = aabb[1];
        qz = aabb[2];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;
 
        qx = aabb[0];
        qy = aabb[4];
        qz = aabb[2];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;

        qx = aabb[3];
        qy = aabb[4];
        qz = aabb[2];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;

        qx = aabb[0];
        qy = aabb[1];
        qz = aabb[5];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;

        qx = aabb[3];
        qy = aabb[1];
        qz = aabb[5];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;

        qx = aabb[0];
        qy = aabb[4];
        qz = aabb[5];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;

        qx = aabb[3];
        qy = aabb[4];
        qz = aabb[5];
        if((lx*qx + ly*qy + lz*qz + lw > 0)) continue;
        //if(lx*(qx-lx*lw) + ly*(qy-ly*lw) + lz*(qz-lz*lw) + lw < 0) continue;

        return false;

    }
    // inside
    return true;
}

var frustum = {};
frustum.create = function(){
    return new MatrixArray(4*6);
};

frustum.extract = function(mat, dest) {
    // near
    dest[0] = mat[2] + mat[3];
    dest[1] = mat[6] + mat[7];
    dest[2] = mat[10] + mat[11];
    var m = 1/Math.sqrt(dest[0]*dest[0]+dest[1]*dest[1]+dest[2]*dest[2]);
    dest[0] *= m;
    dest[1] *= m;
    dest[2] *= m;
    dest[3] = (mat[14] + mat[15])*m;
    // far
    dest[4] = -mat[2] + mat[3];
    dest[5] = -mat[6] + mat[7];
    dest[6] = -mat[10] + mat[11];
    m = 1/Math.sqrt(dest[4]*dest[4]+dest[5]*dest[5]+dest[6]*dest[6]);
    dest[4] *= m;
    dest[5] *= m;
    dest[6] *= m;
    dest[7] = (-mat[14] + mat[15])*m;
    // bottom
    dest[8] = mat[1] + mat[3];
    dest[9] = mat[5] + mat[7];
    dest[10] = mat[9] + mat[11];
    m = 1/Math.sqrt(dest[8]*dest[8]+dest[9]*dest[9]+dest[10]*dest[10]);
    dest[8] *= m;
    dest[9] *= m;
    dest[10] *= m;
    dest[11] = (mat[13] + mat[15])*m;
    // top
    dest[12] = -mat[1] + mat[3];
    dest[13] = -mat[5] + mat[7];
    dest[14] = -mat[9] + mat[11];
    m = 1/Math.sqrt(dest[12]*dest[12]+dest[13]*dest[13]+dest[14]*dest[14]);
    dest[12] *= m;
    dest[13] *= m;
    dest[14] *= m;
    dest[15] = (-mat[13] + mat[15])*m;
    // left
    dest[16] = mat[0] + mat[3];
    dest[17] = mat[4] + mat[7];
    dest[18] = mat[8] + mat[11];
    m = 1/Math.sqrt(dest[16]*dest[16]+dest[17]*dest[17]+dest[18]*dest[18]);
    dest[16] *= m;
    dest[17] *= m;
    dest[18] *= m;
    dest[19] = (mat[12] + mat[15])*m;
    // right
    dest[20] = -mat[0] + mat[3];
    dest[21] = -mat[4] + mat[7];
    dest[22] = -mat[8] + mat[11];
    m = 1/Math.sqrt(dest[20]*dest[20]+dest[21]*dest[21]+dest[22]*dest[22]);
    dest[20] *= m;
    dest[21] *= m;
    dest[22] *= m;
    dest[23] = (-mat[12] + mat[15])*m;
};


/**
  Quadtree based terrain LOD system

  Draws terrain at <0, 0, 0> to <1, 0, 1>

  @constructor
  @param {engine.scene.Camera} camera - Camera used for LOD calculations, can be different from actual camera
  @param {number} resolution - resolution per grid level
  @param {number} depth - maximal depth of quadtree
*/

terrain.QuadTree = function TerrainQuadTree(camera, resolution, depth, viewDistance) {
    this.wireframe = false;
    this.camera = camera;
    this.viewDistance = viewDistance || camera.far;
    this.resolution = resolution;
    this.depth = depth;
    this.topLeftWorldSpace = vec3.create([0, 0, 0]);
    this.scaleWorldSpace = vec4.create([0, 0, 0, 0]);
    this.worldScale = 1.0;
    this.worldHeight = 1.0;
    this.vbo = this.vboGrid = new glUtils.VBO(mesh.grid(resolution));

    this.matrix = mat4.identity();
    this.inverseModelTransform = mat4.create();
    this.heightMapTransform = vec4.create();
    this.frustum = frustum.create();
    this.shader = null;
};
terrain.QuadTree.prototype = extend({}, scene.Node.prototype, {
    setWireFrame: function(wireframe) {
        if(this.wireframe === wireframe) return;
        if(this.wireframe){
            this.vboWireframe = this.vboWireframe || new glUtils.VBO(mesh.wireFrame(mesh.grid(this.resolution)));
            this.vbo = this.vboWireframe;
        }
        else {
            this.vbo = this.vboGrid;
        }

        this.wireframe = wireframe;
    },
    visit: function(graph) {
        graph.pushUniforms();
        //gl state
        var shader = graph.getShader(),
            location = shader.getAttribLocation('position'),
            stride = 0,
            offset = 0,
            normalized = false;

        this.shader = shader;

        this.vbo.bind();
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 3, gl.FLOAT, normalized, stride, offset);

        var modelTransform = graph.uniforms.modelTransform;
        mat4.multiplyVec3(modelTransform, [0, 0, 0], this.topLeftWorldSpace);
        mat4.multiplyVec4(modelTransform, [1, 1, 1, 0], this.scaleWorldSpace);
        // optimize me
 //       var mvp = mat4.create();
//        mat4.multiply(this.camera.getProjection(graph), this.camera.getWorldView(), mvp);
        frustum.extract(graph.uniforms.worldViewProjection, this.frustum);
        assert(this.scaleWorldSpace[0] == this.scaleWorldSpace[2], 'world space scale should be uniform');
        this.worldScale = this.scaleWorldSpace[0];
        this.worldHeight = this.scaleWorldSpace[1];

        mat4.set(modelTransform, this.matrix);

        graph.uniforms.modelTransform = this.matrix;
        graph.uniforms.heightMapTransform = this.heightMapTransform;
        graph.uniforms.terrainCameraPosition = this.camera.position;
        graph.uniforms.terrainResolution = this.resolution;

        shader.uniforms(graph.uniforms);
        this.visitNode(graph, 0, 0, 1, 0);
        this.vbo.unbind();
        graph.popUniforms();
    },
    visitNode: function(graph, left, top, scale, level) {
        var x = this.topLeftWorldSpace[0]+this.worldScale*left,
            y = this.topLeftWorldSpace[1],
            z = this.topLeftWorldSpace[2]+this.worldScale*top,
            aabb = [x, y, z, x+this.worldScale*scale, this.worldHeight, z+this.worldScale*scale];

        if(!checkFrustumAABB(this.frustum, aabb)) {
            return;
        }
        var distance = Math.sqrt(distancePointAABBSquared(this.camera.position, aabb)),
            // 2.0 for parent scale
            lodDistance = scale*this.viewDistance*2;

        if(distance > lodDistance || level === this.depth){
            mat4.translate(this.matrix, [left, 0, top], this.matrix);
            mat4.scale(this.matrix, [scale, 1, scale], this.matrix);
            this.heightMapTransform[0] = left;
            this.heightMapTransform[1] = top;
            this.heightMapTransform[2] = scale;
            this.heightMapTransform[3] = lodDistance;
            gl.uniform4fv(this.shader.uniformLocations.heightMapTransform, this.heightMapTransform);
            gl.uniformMatrix4fv(this.shader.uniformLocations.modelTransform, false, this.matrix);
            this.vbo.draw(this.wireframe ? gl.LINES : gl.TRIANGLES);
            graph.statistics.drawCalls ++;
            graph.statistics.vertices += this.vbo.length/3;
            mat4.scale(this.matrix, [1/scale, 1, 1/scale], this.matrix);
            mat4.translate(this.matrix, [-left, 0, -top], this.matrix);
        }
        else {
            level += 1;
            scale *= 0.5;
            this.visitNode(graph, left, top, scale, level);
            this.visitNode(graph, left+scale, top, scale, level);
            this.visitNode(graph, left, top+scale, scale, level);
            this.visitNode(graph, left+scale, top+scale, scale, level);
        }
    }
});

})();

