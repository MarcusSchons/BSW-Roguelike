window.chadaboom3D = function(batches, onLoad) {

    var self = this;
    this.bwidth  = 9;
    this.bheight = 5;
    this.nframes = this.bwidth * this.bheight;

    var toLoad = 0;
    for (var i=0; i<batches.length; i++) {
        var b = batches[i];
        toLoad += b.count;
    }

    this.allTextures = [];

    for (var i=0; i<batches.length; i++) {
        var b = batches[i];
        b.img = [];

        for (var j=0; j<b.count; j++) {
            var img = new Image();
            img.src = b.name + '-' + b.size + '-' + j + '.png';
            img.onload = function() {
                toLoad -= 1;
                if (toLoad === 0) {

                    for (var k=0; k<batches.length; k++) {
                        var bk = batches[k];
                        for (var k2=0; k2<bk.img.length; k2++) {
                            // Prepare animation sheet as texture for use in shader
                            var timg = bk.img[k2];
                            var isz = bk.size;
                            var osz = Math.min(isz, 256); // currently downscales if frames are larger than 256x256
                            var width = osz * 8,
                                height = osz * 8;

                            bk.img[k2] = BSWG.render.proceduralImage(width, height, function(ctx, w, h){

                                ctx.fillStyle = '#000';
                                ctx.fillRect(0, 0, w, h);

                                for (var k3=0; k3<self.nframes; k3++) {
                                    ctx.drawImage(
                                        timg,
                                        (k3%self.bwidth) * isz, Math.floor(k3/self.bwidth) * isz,
                                        isz, isz,
                                        (k3%8) * osz, Math.floor(k3/8) * osz,
                                        osz, osz
                                    );
                                }

                            });

                            self.allTextures.push(bk.img[k2].texture)

                        }
                    }

                    self.init();

                    if (onLoad)
                        onLoad();
                }
            };
            b.img.push(img);
        }

        b.i = i;
    }

    this.batches = batches;

}

chadaboom3D.prototype.init = function () {

    this.hasInit = true;

    this.MAX_PRT = 8192*2;
    // 0: startPosition.x
    // 1: startPosition.y
    // 2: startPosition.z
    this.vertices = new Float32Array(this.MAX_PRT * 3 * 3);
    // 3: startVelocity.x
    // 4: startVelocity.y
    // 5: startVelocity.z
    // 6: startTime
    this.attr1 = new Float32Array(this.MAX_PRT * 4 * 3);
    // 7: (int)batch * 10 + (int)palette
    // 8: attack
    // 9: life
    // 10: rot
    this.attr2 = new Float32Array(this.MAX_PRT * 4 * 3);
    // 11: uv.x
    // 12: uv.y
    // 13: size
    this.attr3 = new Float32Array(this.MAX_PRT * 3 * 3);

    for (var i=0; i<this.MAX_PRT*3; i++) {
        this.vertices[i*3 + 0] =
            this.vertices[i*3 + 1] =
            this.vertices[i*3 + 2] = 0.0;
        this.attr1[i*4 + 0] =
            this.attr1[i*4 + 1] =
            this.attr1[i*4 + 2] =
            this.attr1[i*4 + 3] = 0.0;
        this.attr2[i*3 + 0] =
            this.attr2[i*3 + 1] =
            this.attr2[i*3 + 2] =
            this.attr2[i*3 + 3] = 0.0;
        this.attr3[i*3 + 0] =
            this.attr3[i*3 + 1] =
            this.attr3[i*3 + 2] = 0.0;
    }

    this.faces = new Uint32Array(this.MAX_PRT * 3);
    for (var i=0; i<this.MAX_PRT*3; i++) {
        this.faces[i] = i;
    }

    this.time = 0.0;

    geom = new THREE.BufferGeometry();
    geom.setIndex( new THREE.BufferAttribute( this.faces, 1 ) );
    geom.addAttribute( 'position', new THREE.BufferAttribute( this.vertices, 3 ).setDynamic(true) );
    geom.addAttribute( 'attr1',    new THREE.BufferAttribute( this.attr1, 4 ).setDynamic(true) );
    geom.addAttribute( 'attr2',    new THREE.BufferAttribute( this.attr2, 4 ).setDynamic(true) );
    geom.addAttribute( 'attr3',    new THREE.BufferAttribute( this.attr3, 3 ).setDynamic(true) );

    var uniforms = {
        time: {
            type: 'f',
            value: this.time
        },
        damping: {
            type: 'f',
            value: Math.pow(0.995, 60.0)
        }
    };

    for (var i=0; i<this.allTextures.length && i<8; i++) {
        uniforms['tex' + (i+1)] = {
            type: 't',
            value: this.allTextures[i]
        };
    }

    for (var i=0; i<chadaboom3D.palettes.length; i++) {
        var pal = chadaboom3D.palettes[i];
        for (var j=0; j<4; j++) {
            uniforms['pal' + i + '_' + j] = {
                type: 'v4',
                value: new THREE.Vector4(pal[j][0], pal[j][1], pal[j][2], pal[j][3])
            }
        }
    }

    this.mat = BSWG.render.newMaterial("expVertex", "expFragment", uniforms, THREE.AdditiveBlending);
    this.mat.depthWrite = false;

    mesh = new THREE.Mesh( geom, this.mat );
    mesh.frustumCulled = false;
    mesh.position.z = 2.0;

    geom.needsUpdate = true;
    this.mat.needsUpdate = true;
    mesh.needsUpdate = true;

    BSWG.render.scene.add( mesh );

    this.mesh = mesh;

    this.posAttr = geom.getAttribute('position');
    this.a1Attr = geom.getAttribute('attr1');
    this.a2Attr = geom.getAttribute('attr2');
    this.a3Attr = geom.getAttribute('attr3');

    this.particleIdx = 0;
    this.particleUpdate = false;
    this.pOffset = 0;
    this.pCount = 0;

};

chadaboom3D.prototype.render = function(dt) {

    if (!this.hasInit) {
        return;
    }

    this.time += dt;
    this.mat.uniforms.time.value = this.time;
    this.mat.needsUpdate = true;

    if (this.particleUpdate == true) {
        this.particleUpdate = false;

        if ((this.pOffset + this.pCount) < this.MAX_PRT) {
            this.posAttr.updateRange.offset = this.pOffset * 3 * 3;
            this.posAttr.updateRange.count = this.pCount * 3 * 3;
            this.a1Attr.updateRange.offset = this.pOffset * 4 * 3;
            this.a1Attr.updateRange.count = this.pCount * 4 * 3;
            this.a2Attr.updateRange.offset = this.pOffset * 4 * 3;
            this.a2Attr.updateRange.count = this.pCount * 4 * 3;
            this.a3Attr.updateRange.offset = this.pOffset * 3 * 3;
            this.a3Attr.updateRange.count = this.pCount * 3 * 3;
        } else {
            this.posAttr.updateRange.offset = 0;
            this.posAttr.updateRange.count = this.MAX_PRT * 3 * 3;
            this.a1Attr.updateRange.offset = 0;
            this.a1Attr.updateRange.count = this.MAX_PRT * 4 * 3;
            this.a2Attr.updateRange.offset = 0;
            this.a2Attr.updateRange.count = this.MAX_PRT * 4 * 3;
            this.a3Attr.updateRange.offset = 0;
            this.a3Attr.updateRange.count = this.MAX_PRT * 3 * 3;
        }

        this.posAttr.needsUpdate = true;
        this.a1Attr.needsUpdate = true;
        this.a2Attr.needsUpdate = true;
        this.a3Attr.needsUpdate = true;
     
        this.pOffset = 0;
        this.pCount = 0;
    }

};

chadaboom3D.fire = [
    [ 0.25, 0.25, 0.25, 0.25 ],
    [ 1.0,   0.0,  0.0, 0.50 ],
    [ 1.0,   1.0,  0.0, 0.75 ],
    [ 1.0,   1.0,  1.0,  1.0 ]
];

chadaboom3D.fire_bright = [
    [ 0.25, 0.25, 0.25, 0.125 ],
    [ 1.0,   0.0,  0.0, 0.25 ],
    [ 1.0,   0.5,  0.0, 0.50 ],
    [ 1.0,   1.0,  1.0,  1.0 ]
];

chadaboom3D.blue = [
    [ 0.25, 0.25, 0.25,  1/3 ],
    [ 0.0,   0.0,  1.0,  2/3 ],
    [ 1.0,   1.0,  1.0,  1.0 ],
    [ 1.0,   1.0,  1.0,  1.0 ]
];

chadaboom3D.blue_bright = [
    [ 0.25, 0.25, 0.25,  1/6 ],
    [ 0.0,   0.0,  1.0,  1/3 ],
    [ 1.0,   1.0,  1.0,  1.0 ],
    [ 1.0,   1.0,  1.0,  1.0 ]
];

chadaboom3D.green = [
    [ 0.25, 0.25, 0.25,  1/3 ],
    [ 0.0,   1.0,  0.0,  2/3 ],
    [ 1.0,   1.0,  1.0,  1.0 ],
    [ 1.0,   1.0,  1.0,  1.0 ]
];

chadaboom3D.palettes = [
    chadaboom3D.fire,
    chadaboom3D.fire_bright,
    chadaboom3D.blue,
    chadaboom3D.blue_bright,
    chadaboom3D.green
];

chadaboom3D.fire = 0;
chadaboom3D.fire_bright = 1;
chadaboom3D.blue = 2;
chadaboom3D.blue_bright = 3;
chadaboom3D.green = 4;

chadaboom3D.prototype.add = function(posFn, sizeFn, res, life, attack, vel, noSub) {

    if (!this.hasInit) {
        return false;
    }

    res = res || 256;
    if (res < 0) {
        res = 0;
    }
    life = life || 2.0;
    attack = attack || 2.0;
    if (attack <= 0) {
        attack = 0;
    }

    if (!vel) {
        vel = { x:0, y:0, z:0 };
    }

    var bb = null;
    for (var i=0; i<this.batches.length; i++) {
        var d0 = bb ? Math.abs(res-bb.size) : 100000;
        var d1 = Math.abs(res-this.batches[i].size);
        if (bb && res < bb.size) {
            d0 = Math.pow(d0, 0.75);
        }
        if (res < this.batches[i].size) {
            d1 = Math.pow(d1, 0.75);
        }
        if (!bb || d0 > d1) {
            bb = this.batches[i];
        }
    }

    if (!bb) {
        return false;
    }

    var tex = bb.img[Math.floor(Math.random()*1000000) % bb.count].texture;
    var found = false;

    for (var i=0; i<this.allTextures.length && i<4; i++) {
        if (this.allTextures[i] === tex) {
            tex = i;
            found = true;
            break;
        }
    }

    if (!found) {
        tex = Math.min(this.allTextures.length - 1, 8-1);
    }

    var pos = posFn;
    var size = sizeFn;

    if (typeof posFn === "function") {
        pos = posFn(0,0,0);
    }
    if (typeof sizeFn === "function") {
        size = sizeFn(res);
    }

    if (!noSub && size > 0.1) {
        for (var i=0; i<8; i++) {
            var len = size * Math.random() * 2.0;
            var a = Math.random() * Math.PI * 2.0;
            var v2 = {
                x: vel.x + Math.cos(a) * len,
                y: vel.y + Math.sin(a) * len,
                z: vel.z
            };
            this.add(pos, size*0.15, 32, life * 1.0, attack, v2, true);
        }
    }


    var palIdx = this.palette || chadaboom3D.fire;

    var idx = this.particleIdx;

    var rot = Math.random() * Math.PI * 2.0;

    size *= 0.45;

    for (var k=0; k<3; k++) {
        this.posAttr.array[idx * 3 * 3 + 0 + k*3] = pos.x;
        this.posAttr.array[idx * 3 * 3 + 1 + k*3] = pos.y;
        this.posAttr.array[idx * 3 * 3 + 2 + k*3] = pos.z;

        this.a1Attr.array[idx * 4 * 3 + 0 + k*4] = vel.x;
        this.a1Attr.array[idx * 4 * 3 + 1 + k*4] = vel.y;
        this.a1Attr.array[idx * 4 * 3 + 2 + k*4] = vel.z;
        this.a1Attr.array[idx * 4 * 3 + 3 + k*4] = this.time;

        this.a2Attr.array[idx * 4 * 3 + 0 + k*4] = tex * 10.0 + palIdx;
        this.a2Attr.array[idx * 4 * 3 + 1 + k*4] = attack;
        this.a2Attr.array[idx * 4 * 3 + 2 + k*4] = life;
        this.a2Attr.array[idx * 4 * 3 + 3 + k*4] = rot;
    }

    this.a3Attr.array[idx * 3 * 3 + 0 + 0] = Math.cos(0);
    this.a3Attr.array[idx * 3 * 3 + 1 + 0] = Math.sin(0);
    this.a3Attr.array[idx * 3 * 3 + 2 + 0] = size;
    this.a3Attr.array[idx * 3 * 3 + 0 + 3] = Math.cos((Math.PI*2.0)/3.0);
    this.a3Attr.array[idx * 3 * 3 + 1 + 3] = Math.sin((Math.PI*2.0)/3.0);
    this.a3Attr.array[idx * 3 * 3 + 2 + 3] = size;
    this.a3Attr.array[idx * 3 * 3 + 0 + 6] = Math.cos(((Math.PI*2.0)/3.0)*2.0);
    this.a3Attr.array[idx * 3 * 3 + 1 + 6] = Math.sin(((Math.PI*2.0)/3.0)*2.0);
    this.a3Attr.array[idx * 3 * 3 + 2 + 6] = size;
    
    if (this.pOffset == 0) {
        this.pOffset = this.particleIdx;
    }

    this.pCount++;
    this.particleIdx ++;

    if (this.particleIdx >= this.MAX_PRT) {
        this.particleIdx = 0;
    }

    this.particleUpdate = true;

    return true;

};

chadaboom3D.prototype.clear = function() {

    if (!this.hasInit) {
        return;
    }

    for (var i=0; i<this.MAX_PRT; i++) {
        this.a1Attr.array[i * 4 * 3 + 3] = -1000.0;
    }
    this.a1Attr.updateRange.offset = 0;
    this.a1Attr.updateRange.count = this.MAX_PRT * 4 * 3;

    this.particleIdx = 0;
    this.pOffset = 0;
    this.pCount = 0;

};