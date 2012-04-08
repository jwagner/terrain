
window.namespace = {};
function provides(namespace) {
    var parts = namespace.split('.'),
        part,
        current = window.namespace;
    while(part = parts.shift(0)){
        if(!(part in current)){
            current[part] = {};
        }
        current = current[part];
    }
    return current;
}
requires = provides;
document.write('<script src="../lib/webgl-debug.js" type="text/javascript"></script>');
document.write('<script src="../lib/glMatrix.js" type="text/javascript"></script>');
document.write('<script src="../lib/jquery-dev.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/core.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/input.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/loader.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/shader.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/glUtils.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/cameracontroller.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/mesh.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/uniform.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/clock.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/scene.js" type="text/javascript"></script>');
document.write('<script src="../src/engine/terrain.js" type="text/javascript"></script>');
document.write('<script src="../src/application.js" type="text/javascript"></script>');
