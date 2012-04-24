(function(){
var perfhub = provides('engine.perfhub');
perfhub.PerfHub = function(id) {
    if(!id){
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'perfhub';
        this.canvas.width = '512';
        this.canvas.height = '256';
        document.body.appendChild(this.canvas);
    }
    else {
        this.canvas = document.getElementById(id);
    }
    this.ctx = this.canvas.getContext('2d');
    this.buckets = {};
    this.buckets.values = [];
    this.sample = 0;
    this.t = new Date();
    this.scale = Infinity;
    this.bucketSize = this.canvas.width/this.sampleWidth;
    this.ctx.font = '12px monospace';
    this.fontHeight = 16;
    this.visible = true;
};

perfhub.PerfHub.prototype = {
    colors: ['red', 'orange', 'yellow', 'green', 'blue'],
    sampleWidth: 2,
     start: function () {
        this.sample = (this.sample+1)%this.bucketSize;
        this.t = new Date();
    },
    tick: function(name) {
        var bucket = this.buckets[name];
        if(!bucket){
            bucket = this.buckets[name] = {
                average: 0,
                samples: new Float32Array(this.bucketSize)
            };
            this.buckets.values.push(bucket);
        }
        var t = new Date(),
            td = t-this.t;
        this.t = t;
        bucket.average -= bucket.samples[this.sample]/this.bucketSize;
        bucket.samples[this.sample] = td;
        bucket.average += td/this.bucketSize;
    },

    draw: function () {
        if(!this.visible){
            return;
        }
        var total = 0,
            textSpacing = 14,
            textHeight = 2*textSpacing+this.fontHeight*(this.buckets.values.length+2),
            availableHeight = this.canvas.height-textHeight,
            bucket;

        for(var i = 0; i < this.buckets.values.length; i++) {
            bucket = this.buckets.values[i];
            total += bucket.average;
            
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
                color = this.colors[(i)%this.colors.length],
                sample = bucket.samples[this.sample],
                height = sample*this.scale;

            y -= height;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, this.sampleWidth, height);
            this.ctx.fillText(name + ': ' + ~~(bucket.average*100)/100 + " ms", textSpacing, textSpacing+this.fontHeight*i);
            total += bucket.average;
        }
        this.ctx.fillStyle = 'white';
        this.ctx.fillText("total: " + ~~(total*100)/100 + " ms / " + ~~(1000/total) + " fps", textSpacing, textSpacing+this.fontHeight*(this.buckets.values.length+1));
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x, 0, this.sampleWidth, y);
        return;
    }
};

})();
