BSWG.camera = function() {

    this.x = 0;
    this.y = 0;
    this.z = 0.01;

    this.panTo = function (dt, x, y) {

        if (typeof x === "object") {
            y = x.y;
            x = x.x;
        }

        this.x += (x - this.x) * Math.min(dt, 1.0);
        this.y += (y - this.y) * Math.min(dt, 1.0);
    };

    this.zoomTo = function (dt, z) {

        this.z += (z - this.z) * Math.min(dt, 1.0);
    };

    this.toScreenList = function (viewport, list) {

        var vpsz = Math.max(viewport.w, viewport.h);
        var ret = new Array(list.length);
        for (var i=0, len=list.length; i<len; i++) {
            ret[i] = new b2Vec2(
                (list[i].x - this.x) * this.z * vpsz + viewport.w * 0.5,
                -(list[i].y - this.y) * this.z * vpsz + viewport.h * 0.5
            );
        }
        return ret;

    };

    this.toScreen = function (viewport, x, y) {

        if (typeof x === "object") {
            y = x.y;
            x = x.x;
        }

        var vpsz = Math.max(viewport.w, viewport.h);

        return new b2Vec2(
            (x - this.x) * this.z * vpsz + viewport.w * 0.5,
            -(y - this.y) * this.z * vpsz + viewport.h * 0.5
        );

    };

    this.toScreenSize = function (viewport, sz) {

        var vpsz = Math.max(viewport.w, viewport.h);
        return sz * this.z * vpsz;

    };

    this.wrapToScreen = function (viewport, x, y) {

        if (typeof x === "object") {
            y = x.y;
            x = x.x;
        }

        var self = this;
        return function(vx, vy) {
            x += vx;
            y += vy;
            return self.toScreen(viewport, x, y);
        };

    }

    this.wrapToScreenSize = function (viewport, sz) {

        var self = this;
        return function() {
            return self.toScreenSize(viewport, sz);
        };

    };

    this.toWorld = function (viewport, x, y) {

        if (typeof x === "object") {
            y = x.y;
            x = x.x;
        }

        var vpsz = Math.max(viewport.w, viewport.h);

        return new b2Vec2(
            (x - viewport.w * 0.5) / (this.z * vpsz) + this.x,
            -(y - viewport.h * 0.5) / (this.z * vpsz) + this.y
        );

    };

};

BSWG.initCanvasContext = function(ctx) {

    ctx.fontSpacing = 1.0;
    ctx.textWidthB = function(text) {
        var total = 0.0;
        for (var i=0; i<text.length; i++) {
            var width = 0.0;
            if ((i+1) < text.length) {
                width = ctx.measureText(text.charAt(i) + '' + text.charAt(i+1)).width - 
                        ctx.measureText(text.charAt(i+1) + '').width;
                width += (ctx.fontSpacing || 0.0);
            }
            else {
                width = ctx.measureText(text.charAt(i) + '').width;
            }
            total += width;
        }
        return total;
    };
    ctx.fillTextB = function(text, x, y, noBorder) {

        if (!text || !text.trim || !text.trim().length) {
            return;
        }

        var widths = new Array(text.length);
        var total = 0.0;
        for (var i=0; i<widths.length; i++) {
            if ((i+1) < widths.length) {
                widths[i] = ctx.measureText(text.charAt(i) + '' + text.charAt(i+1)).width - 
                            ctx.measureText(text.charAt(i+1) + '').width;
                widths[i] += (ctx.fontSpacing || 0.0);
            }
            else {
                widths[i] = ctx.measureText(text.charAt(i) + '').width;
            }
            total += widths[i];
        }

        var oalign = ctx.textAlign;

        if (ctx.textAlign === 'center') {
            x -= total * 0.5;
        }
        else if (ctx.textAlign === 'right') {
            x -= total;
        }

        var x0 = x;

        ctx.textAlign = 'left';

        if (!noBorder) {
            var tmp = ctx.fillStyle;
            ctx.fillStyle = ctx.strokeStyle;
            for (var i=0; i<widths.length; i++) {
                var ch = text.charAt(i) + '';
                ctx.fillText(ch, x-2, y);
                ctx.fillText(ch, x+2, y);
                ctx.fillText(ch, x, y-2);
                ctx.fillText(ch, x, y+2);
                x += widths[i];
            }
            ctx.fillStyle = tmp;
        }

        x = x0;

        for (var i=0; i<widths.length; i++) {
            var ch = text.charAt(i) + '';
            ctx.fillText(ch, x, y);
            x += widths[i];
        }

        ctx.textAlign = oalign;
    };

};

BSWG.render = new function() {

    this.canvas = null;
    this.ctx = null;
    this.viewport = null;
    this.renderCbk = null;
    this.animFrameID = null;
    this.lastFrameTime = Date.timeStamp();
    this.dt = 1.0/60.0;
    this.time = 0.0;
    this.images = {};
    this.cam3D = null;

    var maxRes = { w: 1920, h: 1080 };

    this.init = function(complete, images, shaders) {

        if (!Detector.webgl) {
            alert('WebGL not supported.');
            return;
        }

        document.body.innerHTML = '';

        this.canvas = document.createElement('canvas');
        this.canvas.oncontextmenu = function(){ return false; };
        this.canvas.style.position = 'fixed';
        this.canvas.style.zIndex = 2;
        this.ctx = this.canvas.getContext('2d');

        this.canvas3D = document.createElement('canvas');
        this.canvas3D.style.position = 'fixed';
        this.canvas3D.style.zIndex = 1;
        this.canvas3D.oncontextmenu = function(){ return false; };

        this.cam3D = new THREE.PerspectiveCamera(85, 1.5, 1.0, 1000);
        this.cam3D.position.z = 10.0;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas3D, alpha: true, antialias: true });
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.loader = new THREE.JSONLoader();
        this.raycaster = new THREE.Raycaster();
    
        this.sizeViewport();

        BSWG.initCanvasContext(this.ctx);

        this.ctx.clearRect(0, 0, this.viewport.w, this.viewport.h);
        this.ctx.font = '48px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#7d7';
        this.ctx.fillTextB('Loading ...', 48, this.viewport.h - 48, true);

        document.body.appendChild(this.canvas);
        document.body.appendChild(this.canvas3D);

        this.images = images = images || {};

        var ocomplete = complete;
        var self = this;
        complete = function() {
            self.boom = new chadaboom3D([
                {
                    'name': 'images/explosion',
                    'size': 64,
                    'count': 4
                },
                {
                    'name': 'images/explosion',
                    'size': 128,
                    'count': 2
                },
                {
                    'name': 'images/explosion',
                    'size': 256,
                    'count': 2
                },
                {
                    'name': 'images/explosion',
                    'size': 512,
                    'count': 1
                }
            ],
            function(){            
                self.loadShaders(shaders, ocomplete);
            });
        };

        var toLoad = 0;
        for (var key in images) {
            toLoad += 1;
        }
        var totalImages = toLoad;
        if (!totalImages && complete)
            complete();
        for (var key in images) {
            var img = new Image();
            img.src = 'images/' + images[key];
            img.onload = function() {

                this.texture = new THREE.Texture(this, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping);
                this.texture.needsUpdate = true;

                toLoad -= 1;
                if (toLoad === 0) {
                    if (complete)
                        complete();
                }
            };
            images[key] = img;
        }
    };

    this.loadShaders = function(shadersIn, complete) {

        var shaders = [];
        
        for (var i=0; i<shadersIn.vertex.length; i++) {
            shaders.push([
                shadersIn.vertex[i],
                "x-shader/x-vertex"
            ]);
        }

        for (var i=0; i<shadersIn.fragment.length; i++) {
            shaders.push([
                shadersIn.fragment[i],
                "x-shader/x-fragment"
            ]);
        }

        var count = shaders.length;
        if (count === 0 && complete) {
            complete();
        }
        for (var i=0; i<shaders.length; i++)
        {
            jQuery.get("shaders/" + shaders[i][0] + ".glsl", function(shader){ return function(data){
                var script = jQuery("<script id=\'SHADER_" + shader[0] + "\' type=\'" + shader[1] + "\'>");
                script.html(data);
                script.appendTo(jQuery(document.head));
                count -= 1;
                if (count === 0 && complete) {
                    complete();
                }
            }; }(shaders[i]));
        }
    };

    this.proceduralImage = function (w, h, cbk) {

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');

        BSWG.initCanvasContext(ctx);

        cbk(ctx, w, h);

        canvas.texture = new THREE.Texture(canvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping);
        canvas.texture.needsUpdate = true;

        return canvas;

    };

    this.sizeViewport = function() {

        var lvp = this.viewport;
        this.viewport = {
            w: Math.min(maxRes.w, window.innerWidth),
            h: Math.min(maxRes.h, window.innerHeight)
        };
        this.canvas.width = this.viewport.w;
        this.canvas.height = this.viewport.h;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        if (!lvp || lvp.w !== this.viewport.w || lvp.h !== this.viewport.h) {
            this.renderer.setSize( this.viewport.w, this.viewport.h );
            this.cam3D.aspect = this.viewport.w / this.viewport.h;
            this.cam3D.updateProjectionMatrix();
        }
    };

    this.customCursor = true;

    this.startRenderer = function (cbk) {
        
        if (this.animFrameID !== null) {
            window.cancelAnimationFrame(this.animFrameID);
            this.animFrameID = null;
        }

        this.renderCbk = cbk;

        var self = this;
        var renderFrame = function () {

            var frameTime = Date.timeStamp();
            self.dt = frameTime - self.lastFrameTime;
            self.lastFrameTime = frameTime;
            self.dt = Math.clamp(self.dt, 1.0/60.0, 1.0/10.0);
            self.time += self.dt;

            self.sizeViewport();
            self.ctx.clearRect(0, 0, self.viewport.w, self.viewport.h);
            self.renderer.clear();

            if (self.renderCbk) {
                self.renderCbk(self.dt, self.time, self.ctx);
            }

            self.renderer.render( self.scene, self.cam3D );

            if (self.customCursor) {
                document.body.style.cursor = 'none';
                self.ctx.drawImage(
                    self.images[
                        BSWG.input.MOUSE('left') ? 'cursor-pressed' :
                        (BSWG.input.MOUSE('right') ? 'cursor-pressed-right' : 'cursor-normal')
                    ],
                    0,   0,
                    128, 128,
                    BSWG.input.MOUSE('x')-32,
                    BSWG.input.MOUSE('y')-32,
                    64,  64
                );
            }
            else {
                document.body.style.cursor = null;
            }

            BSWG.input.newFrame();

            self.animFrameID = window.requestAnimationFrame(renderFrame);
        };

        self.animFrameID = window.requestAnimationFrame(renderFrame);
    };

    this.updateCam3D = function ( cam ) {
        if (cam) {
            var f = Math.min(this.viewport.h / this.viewport.w, this.viewport.w / this.viewport.h) * 0.54;
            this.cam3D.position.set(cam.x, cam.y, f/cam.z);
            this.cam3D.lookAt(new THREE.Vector3(cam.x, cam.y, 0.0));
            this.cam3D.updateProjectionMatrix();
            this.cam3D.updateMatrix();
            this.cam3D.updateMatrixWorld();
        }       
    };

    this.project3D = function ( p, z ) {

        if (p.constructor === Array) {

            var len = p.length;
            var ret = new Array(len);
            for (var i=0; i<len; i++) {
                ret[i] = this.project3D(p[i], z);
            }

            return ret;

        }

        if (this.cam3D && this.viewport) {

            var p2 = new THREE.Vector3(p.x, p.y, z).project(this.cam3D);
            return new b2Vec2(
                (p2.x + 1) * this.viewport.w * 0.5,
                (-p2.y + 1) * this.viewport.h * 0.5
            );

        }
        else {

            return new b2Vec2(0, 0);

        }

    };

    this.unproject3D = function ( p, z ) {

        if (p.constructor === Array) {

            var len = p.length;
            var ret = new Array(len);
            for (var i=0; i<len; i++) {
                ret[i] = this.unproject3D(p[i], z);
            }

            return ret;

        }

        if (this.cam3D && this.viewport) {

            var p2 = new THREE.Vector3(
                 (p.x / this.viewport.w) * 2 - 1,
                -(p.y / this.viewport.h) * 2 + 1,
                0.5
            ).unproject(this.cam3D);

            var dir = p2.sub( this.cam3D.position ).normalize();
            var distance = -this.cam3D.position.z / dir.z;
            p2 = this.cam3D.position.clone().add(dir.multiplyScalar(distance));

            return new b2Vec2(p2.x, p2.y);

        }
        else {

            return new b2Vec2(0, 0);

        }

    };

    this.stopRenderer = function () {
        if (this.animFrameID !== null) {
            window.cancelAnimationFrame(this.animFrameID);
            this.animFrameID = null;
        }
        document.body.style.cursor = null;
        this.renderCbk = null;
    };

    this.getShader = function ( id )
    {
        return document.getElementById('SHADER_' + id).textContent;
    };

    var lastRandomValue = null;
    this.newMaterial = function (vertexID, fragmentID, data, blendMode) {
        var rand = Math.random();
        if (lastRandomValue === rand) { // using seed random other places can lead to materials with duplicate UUIDs
            Math.seedrandom();
        }
        lastRandomValue = rand;

        data = data || {};
        var attr = {};
        var uniforms = {};
        for (var key in data) {
            if (key.indexOf('a_') === 0) {
                attr[key.substring(2)] = data[key];
            }
            else {
                uniforms[key] = data[key];
            }
        }

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            //attributes: attr,
            vertexShader: this.getShader(vertexID),
            fragmentShader: this.getShader(fragmentID),
            transparent: true
        });
        material.side = THREE.DoubleSide;

        if (blendMode || blendMode === 0) {
            material.blending = blendMode;
        }

        material.needsUpdate = true;

        return material;
    };

    this.setCustomCursor = function(flag) {
        this.customCursor = !!flag;
    };

    this.test = function () {
        console.log('b');
    };

}();