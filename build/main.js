
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
document.write('<script src="../src/core.js" type="text/javascript"></script>');
document.write('<script src="../src/mesh.js" type="text/javascript"></script>');
document.write('<script src="../src/uniform.js" type="text/javascript"></script>');
document.write('<script src="../src/cameracontroller.js" type="text/javascript"></script>');
document.write('<script src="../src/input.js" type="text/javascript"></script>');
document.write('<script src="../src/clock.js" type="text/javascript"></script>');
document.write('<script src="../src/loader.js" type="text/javascript"></script>');
document.write('<script src="../src/shader.js" type="text/javascript"></script>');
document.write('<script src="../src/glUtils.js" type="text/javascript"></script>');
document.write('<script src="../src/scene.js" type="text/javascript"></script>');
document.write('<script src="../src/application.js" type="text/javascript"></script>');
