(function(){
var perfhub = provides('engine.perfhub');

var ArrayType = window.Float32Array || function(l) { var a = new Array(l); for(var i = 0; i < l; i++) { a[l] = 0.0; } return a; };
    
function PerfHub(el){
    if(!el){
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'perfhub';
        this.canvas.width = '512';
        this.canvas.height = '256';
        document.body.appendChild(this.canvas);
    }
    else {
        this.canvas = el;
    }

    this.ctx = this.canvas.getContext('2d');
    this.buckets = {};
    this.buckets.values = [];
    this.sample = 0;
    this.t = this.start = new Date();
    this.scale = Infinity;
    this.bucketSize = this.canvas.width/this.sampleWidth;
    this.ctx.font = '12px monospace';
    this.fontHeight = 16;
}
PerfHub.prototype = {
    colors: ['red', 'orange', 'yellow', 'green', 'blue', 'magenta'],
    sampleWidth: 2,
    frame: function() {
        this.t = new Date();
        var lastSample = this.sample;
        this.sample = (this.sample+1)%this.bucketSize;
        for(var i = 0; i < this.buckets.values.length; i++) {
            var bucket = this.buckets.values[i],
                samples = bucket.samples;
            if(bucket.average === -1){
                var s = samples[lastSample];
                for(var j = 0; j < samples.length; j++) {
                    samples[j] = s;
                }
                bucket.average = s;
            }
            else{
                bucket.average += samples[lastSample]/samples.length;
                bucket.average -= samples[this.sample]/samples.length;
            }
            samples[this.sample] = 0.0;
        }
        this.exit('frame');
        this.enter('frame');
    },
    enter: function (name) {
        var bucket = this.buckets[name];
        if(!bucket){
            bucket = this.buckets[name] = {
                name: name,
                t: new Date(),
                average: -1,
                samples: new ArrayType(this.bucketSize)
            };
            this.buckets.values.push(bucket);
        }
        else {
            bucket.t = new Date();
        }
    },
    exit: function(name) {
        var bucket = this.buckets[name];
        if(!bucket) return;
        var td = new Date()-bucket.t;
        bucket.samples[this.sample] += td;
        bucket.t = null;
    },
    drawFrame: function () {
        this.draw();
        this.frame();
    },
    draw: function() {
        var total = 0,
            textSpacing = this.fontHeight,
            textHeight = textSpacing+this.fontHeight*(this.buckets.values.length),
            availableHeight = this.canvas.height-textHeight,
            bucket;

        for(var i = 0; i < this.buckets.values.length; i++) {
            bucket = this.buckets.values[i];
            if(bucket.name != 'frame'){
                total += Math.max(0.000001, bucket.average);
            }
            
        }
        if(availableHeight/total < this.scale){
            this.scale = availableHeight/total/2;
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        var x = this.canvas.width-this.sampleWidth,
            y = this.canvas.height;
        total = 0;
        i = 0;
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, textHeight);
        this.ctx.drawImage(this.canvas, -1, 0);
        for(i = 0; i < this.buckets.values.length; i++) {
            bucket = this.buckets.values[i];
            var name = bucket.name,
                color = this.colors[(i)%this.colors.length];

            this.ctx.fillStyle = color;

            if(name != 'frame') {
                var sample = bucket.samples[this.sample],
                height = sample*this.scale;
                y -= height;
                this.ctx.fillRect(x, y, this.sampleWidth, height);
            }
            this.ctx.fillText(name + ': ' + ~~(bucket.average*100)/100 + " ms", textSpacing, textSpacing+this.fontHeight*i);
        }
        this.ctx.fillStyle = 'white';
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x, 0, this.sampleWidth, y);
        return;
    }
};

perfhub.PerfHub = PerfHub;

})();
