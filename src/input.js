(function(){
var input = provides('input');

// mapping keycodes to names
var keyname = {
    32: 'SPACE',
    13: 'ENTER',
    9: 'TAB',
    8: 'BACKSPACE',
    16: 'SHIFT',
    17: 'CTRL',
    18: 'ALT',
    20: 'CAPS_LOCK',
    144: 'NUM_LOCK',
    145: 'SCROLL_LOCK',
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    33: 'PAGE_UP',
    34: 'PAGE_DOWN',
    36: 'HOME',
    35: 'END',
    45: 'INSERT',
    46: 'DELETE',
    27: 'ESCAPE',
    19: 'PAUSE'
};


/* User input handler using jQuery */
input.Handler = function InputHandler(element) {
    this.bind(element);
    this.reset();
}
input.Handler.prototype = {
    offset: {x: 0, y: 0},
    onClick: null,
    onKeyUp: null,
    onKeyDown: null,
    hasFocus: true,
    bind: function(element) {
        var self = this,
            offset = $(element).offset();
        this.element = element;
        this.offset = {x:offset.left, y:offset.top};
        $(document).keydown(function(e){
            return !self.keyDown(e.keyCode);
        });
        $(document).keyup(function(e){
            return !self.keyUp(e.keyCode);
        });
        $(window).click(function(e){
            if(e.originalEvent.target != element){
                self.blur();
            }
            else {
                self.focus();
            }
        });
        $(window).blur(function(){
            self.blur();
        });
        /*
        too much overhead, using the dom directly for mouse tracking
        $(window).mousemove(function(e){
            self.mouseMove(e.pageX, e.pageY);
        });
        */
        document.onmousemove = function(e) {
            self.mouseMove(e.pageX, e.pageY);
        }
        $(element).mousedown(function(e){
            self.mouseDown();
        });
        $(element).mouseup(function(e){
            self.mouseUp();
        });
        // prevent text selection in browsers that support it
        document.onselectstart = function(){return false;}
    },
    blur: function() {
        this.hasFocus = false;
        this.reset();
    },
    focus: function() {
        if(!this.hasFocus) {
            this.hasFocus = true;
            this.reset();
        }
    },
    reset: function() {
        this.keys = {};
        for(var i = 65; i < 128; i++) {
            this.keys[String.fromCharCode(i)] = false;
        }
        for(i in keyname){
            this.keys[keyname[i]] = false;
        }
        this.mouse = {down: false, x: 0, y: 0};
    },
    keyDown: function(key) {
        var name = this._getKeyName(key),
            wasDown = this.keys[name];
        this.keys[name] = true;
        if(this.onKeyDown && !wasDown) {
            this.onKeyDown(name);
        }
        return this.hasFocus;
    },
    keyUp: function(key) {
        var name = this._getKeyName(key);
        this.keys[name] = false;
        if(this.onKeyUp) {
            this.onKeyUp(name);
        }
        return this.hasFocus;
    },
    mouseDown: function() {
        this.mouse.down = true;
    },
    mouseUp: function() {
        this.mouse.down = false;
        if(this.hasFocus && this.onClick) {
            this.onClick(this.mouse.x, this.mouse.y);
        }
    },
    mouseMove: function(x, y){
        this.mouse.x = clamp(x-this.offset.x, 0, this.width);
        this.mouse.y = clamp(y-this.offset.y, 0, this.height);
    },
    _getKeyName: function(key) {
        if(key in keyname) {
            return keyname[key];
        }
        return String.fromCharCode(key);
    }
 
};
})();
