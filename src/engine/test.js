(function(){
    
provides('engine.test');
var assert = buster.assertions.assert,
    refute = buster.assertions.refute;

buster.testCase("A module", {
    "states the obvious": function () {
        assert.equals(2, 3);
    }
});

})();
