// BlockShip Wars Component

BSWG.compActiveConfMenu = null;

BSWG.component_minJMatch        = Math.pow(0.15, 2.0);
BSWG.component_jMatchClickRange = Math.pow(0.15, 2.0);

BSWG.friendlyFactor = 1/16;

BSWG.generateTag = function () {
    var chars1 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var chars2 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var k = 1000;
    while (k--) {
        var ret = chars1.charAt(Math.floor(Math.random() * chars1.length)) +
                  chars2.charAt(Math.floor(Math.random() * chars2.length));
                  //chars2.charAt(Math.floor(Math.random() * chars2.length)) +
                  //chars2.charAt(Math.floor(Math.random() * chars2.length));
        var found = false;
        for (var i=0; !found && i<BSWG.componentList.compList.length; i++) {
            if (BSWG.componentList.compList[i].tag === ret) {
                found = true;
            }
        }
        if (!found) {
            return ret;
        }
    }

    return null;
};

BSWG.componentHoverFn = function(self) {
    if (BSWG.componentList.mouseOver !== self || !BSWG.game.editMode || (self.onCC && self.onCC !== BSWG.game.ccblock)) {
        return false;
    }
    if (self.onCC && !self.hasConfig && !self.canMoveAttached) {
        return false;
    }
    return true;
};

BSWG.compAnchored = function(self) {
    return ((self.onCC && self.onCC.anchored) || self.anchored) ? true : false;
};

BSWG.updateOnCC = function (a, b) {

    var cc = a.onCC || (b && b.onCC);

    var scan = function(n, u) {

        if (!n)
            return false;

        if (!u) u = {};
        if (u[n.id])
            return false;
        u[n.id] = true;

        if (cc === n) {
            return true;
        }

        if (n.welds) {
            for (var key in n.welds) {
                if (n.welds[key]) {
                    if (scan(n.welds[key].other, u)) {
                        return true;
                    }
                }
            }
        }

        return false;

    };

    var mark = function(n, flag, u) {

        if (!n)
            return false;

        if (!u) u = {};
        if (u[n.id])
            return false;
        u[n.id] = true;

        n.onCC = flag ? cc : null;

        if (n.welds) {
            for (var key in n.welds) {
                if (n.welds[key]) {
                    mark(n.welds[key].other, flag, u);
                }
            }
        }

        return false;

    };

    mark(a, scan(a));
    if (b) {
        mark(b, scan(b));
    }

};

BSWG.comp_hashSize = 2.0;

BSWG.nextCompID = 1;
BSWG.component = function (desc, args) {

    this.handleInput = function(key) {};
    this.frontOffset = 0.0;

    for (var key in desc)
        this[key] = desc[key];

    this.id = BSWG.nextCompID++;
    this.jpoints = new Array();
    this.jmatch = new Array();
    this.jmatch = -1;
    this.welds = new Object();
    this.onCC = null;
    this.tag = BSWG.generateTag();
    if (this.type === 'cc') {
        this.onCC = this;
    }

    this.init(args);

    if (!this.maxHP) {
        this.maxHP = 100;
    }

    this.hp = this.maxHP;
    this.destroyed = false;

    this.takeDamage = function (amt, fromC, noMin) {

        if (fromC && fromC.onCC && this.onCC && fromC.onCC.id === this.onCC.id) {
            amt *= BSWG.friendlyFactor;
        }

        if (amt < 1 && !noMin) {
            return;
        }

        this.hp -= amt;
        if (this.hp > this.maxHP) {
            this.hp = this.maxHP;
        }
        if (this.hp <= 0 && !this.destroyed) {
            if (this.obj && this.obj.body) {
                var p = this.obj.body.GetWorldCenter();
                var v = this.obj.body.GetLinearVelocity();
                var r = this.obj.radius;
                for (var i=0; i<20; i++) {
                    var a = Math.random() * Math.PI * 2.0;
                    var r2 = Math.random() * r * 0.5;
                    var p2 = new b2Vec2(p.x + Math.cos(a) * r2,
                                        p.y + Math.sin(a) * r2);
                    BSWG.render.boom.palette = chadaboom3D.fire_bright;
                    BSWG.render.boom.add(
                        p2.particleWrap(0.025),
                        r*(3.5 + 2.5*Math.random()),
                        256,
                        1 + Math.pow(r, 1/3) * Math.random(),
                        2.0,
                        v.THREE(Math.random()*2.0)
                    );
                }
            }

            this.hp = 0;
            this.destroyed = true;
            this.onCC = null;
            this.removeSafe();
        }

    };

    if (this.obj) {
        this.obj.comp = this;
        if (this.obj.body) {
            this.obj.body.__comp = this;
        }
    }

    if (this.obj.body && args.vel) {
        this.obj.body.SetLinearVelocity(args.vel.clone());
    }

    if (this.obj.body && args.angVel) {
        this.obj.body.SetAngularVelocity(args.angVel);
    }

    if (this.jpoints && this.jpoints.length && this.obj) {

        for (var i=0; i<this.jpoints.length; i++) {
            this.jpoints[i].x *= 1.0005;
            this.jpoints[i].y *= 1.0005;
        }

        this.jpointsNormals = new Array(this.jpoints.length);
        for (var i=0; i<this.jpointsNormals.length; i++) {
            this.jpointsNormals[i] = BSWG.physics.getNormalAt(this.obj, this.jpoints[i]);
        }

    }

    this.p = function (v) {
        if (this.obj && this.obj.body) {
            if (!v) {
                return this.obj.body.GetWorldCenter();
            }
            else {
                return this.obj.body.GetWorldPoint(v);
            }
        }
        else {
            return null;
        }
    };

    this.remove = function() {

        BSWG.componentList.remove(this);

    };

    this.removeSafe = function() {

        BSWG.componentList.compRemove.push(this);

    };

    this.baseRenderOver = function(ctx, cam, dt) {

        if (this.renderOver) {
            this.renderOver(ctx, cam, dt);
        }

        if (!this.jpointsw) {
            return;
        }

        if (this.dispKeys && BSWG.game.showControls && this.onCC === BSWG.game.ccblock) {
            for (var key in this.dispKeys) {
                var info = this.dispKeys[key];
                if (info) {
                    var text = info[0];
                    var rot = 0.0;

                    var p = BSWG.render.project3D(BSWG.physics.localToWorld(info[1], this.obj.body), 0.0);
                    var w = Math.floor(8 * 2 + ctx.textWidthB(text)+1.0);
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = info[2] ? '#777' : '#fff';
                    ctx.fillRect(p.x - w * 0.5, p.y - 10, w, 20);

                    ctx.save();

                    ctx.translate(Math.floor(p.x), Math.floor(p.y));
                    ctx.rotate(rot);
                    ctx.translate(0, 3);

                    ctx.font = '11px Orbitron';
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = info[2] ? '#fff' : '#000';
                    ctx.textAlign = 'center';
                    ctx.fillText(text, 0, 0);
                    ctx.textAlign = 'left';

                    ctx.restore();
                }
            }
        }

        if (this.tag && BSWG.ai.editor && !BSWG.game.showControls && this.onCC === BSWG.game.ccblock && BSWG.componentList.compHover2 === this) {
            var text = this.tag;
            var rot = 0.0;

            ctx.font = '14px Courier, monospace';
            var p = BSWG.render.project3D(this.obj.body.GetWorldCenter(), 0.0);
            var w = Math.floor(8 * 2 + ctx.textWidthB(text)+1.0);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#fff';
            ctx.fillRect(p.x - w * 0.5, p.y - 10 - 15, w, 20);

            ctx.save();

            ctx.translate(Math.floor(p.x), Math.floor(p.y) - 15);
            ctx.rotate(rot);
            ctx.translate(0, 3);

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText(text, 0, 0);
            ctx.textAlign = 'left';

            ctx.restore();
        }

        ctx.globalAlpha = 1.0;

        if (this.traceClr) {
            ctx.globalAlpha = 0.85;
            var p = BSWG.render.project3D(this.obj.body.GetWorldCenter(), 0.0);
            ctx.fillStyle = this.traceClr;
            ctx.fillRect(p.x-5, p.y-5, 10, 10);
            ctx.globalAlpha = 1.0;
        }

    };

    this.cacheJPW = function() {
        if (this.jpointsw) {
            this.jpointsw = null;
        }
        this.jpointsw = BSWG.physics.localToWorld(this.jpoints, this.obj.body);
        for (var i=0; i<this.jpoints.length; i++) {
            this.jpointsw[i].motorType = this.jpoints[i].motorType || 0;
        }
        this.jmhover = -1;
    };

    this.updateJCache = function() {

        if (!BSWG.game.editMode && !BSWG.componentList.autoWelds) {
            return;
        }

        var autos = null;
        if (BSWG.componentList.autoWelds) {
            autos = BSWG.componentList.autoWelds;
        }

        if (!this.jpointsw || (this.onCC !== BSWG.game.ccblock && this.onCC !== null && !BSWG.componentList.autoWelds)) {
            return;
        }

        this.jmatch = new Array();
        this.jmhover = -1;

        var _p = this.obj.body.GetWorldCenter();
        var p = new b2Vec2(_p.x, _p.y);
        var cl = BSWG.componentList.withinRadius(p, this.obj.radius+0.5);

        var jpw = this.jpointsw;

        var mps = new b2Vec2(BSWG.input.MOUSE('x'), BSWG.input.MOUSE('y'));
        var mp = BSWG.render.unproject3D(mps, 0.0);

        var mind = 10.0;
        for (var i=0; i<jpw.length; i++) {
            var tp = jpw[i];
            var d = Math.pow(tp.x - mp.x, 2.0) +
                    Math.pow(tp.y - mp.y, 2.0);
            if (d < mind)
            {
                this.jmhover = i;
                mind = d;
            }
        }
        if (mind > BSWG.component_jMatchClickRange || BSWG.compActiveConfMenu) {
            this.jmhover = -1;
        }

        for (var i=0; i<cl.length; i++) {
            if (cl[i] !== this && BSWG.physics.bodyDistance(this.obj.body, cl[i].obj.body) < 1.0) {
                var jpw2 = cl[i].jpointsw;

                for (var k1=0; jpw && k1<jpw.length; k1++)
                    for (var k2=0; jpw2 && k2<jpw2.length; k2++)
                    {
                        var p1 = jpw[k1];
                        var p2 = jpw2[k2];
                        var d2 = Math.pow(p1.x - p2.x, 2.0) +
                                 Math.pow(p1.y - p2.y, 2.0);
                        if (((p1.motorType && !p2.motorType) || (p2.motorType && !p1.motorType) ||
                            (p1.motorType && p1.motorType === p2.motorType) ||
                            (p1.motorType && (p1.motorType%10) != (p2.motorType%10))) &&
                            !(p1.motorType === 61 && p2.motorType === 61)) {
                            continue;
                        }
                        if (d2 < BSWG.component_minJMatch) {
                            var auto = false;
                            if (autos) {
                                var _c = new b2Vec2((p1.x+p2.x)*0.5, (p1.y+p2.y)*0.5);
                                for (var f=0; f<autos.length; f++) {
                                    if (Math.distSqVec2(_c, autos[f]) < BSWG.component_minJMatch) {
                                        auto = true;
                                        break;
                                    }
                                }
                            }
                            this.jmatch.push([
                                k1, cl[i], k2, p1.motorType || 0, p2.motorType || 0, auto
                            ]);
                            if (cl[i].jmhover === k2) {
                                if (BSWG.game.editMode) {
                                    this.jmhover = k1;
                                }
                            }
                            else if (this.jmhover === k1) {
                                if (BSWG.game.editMode) {
                                    cl[i].jmhover = k2;
                                }
                            }
                            break;
                        }
                    }
            }
        }       
    }   

    this.baseUpdate = function(dt) {

        if (BSWG.compAnchored(this)) {
            if (this.obj && this.obj.body) {
                this.obj.body.SetAngularDamping(5.0);
                this.obj.body.SetLinearDamping(5.0);
            }
        }
        else {
            if (this.obj && this.obj.body) {
                this.obj.body.SetAngularDamping(0.1);
                this.obj.body.SetLinearDamping(0.1);
            }
        }

        if (!this.jpointsw || !this.jmatch) {
            return;
        }

        var doWelds = false;

        if (BSWG.game.editMode) {

            if (this.jmhover >= 0 && !BSWG.ui.mouseBlock && BSWG.input.MOUSE_PRESSED('left') && !BSWG.input.MOUSE('shift')) {

                doWelds = true;

            }
        }

        var autos = null;

        if (BSWG.componentList.autoWelds) {
            autos = BSWG.componentList.autoWelds;
            doWelds = true;
        }

        if (doWelds) {
            for (var i=0; i<this.jmatch.length; i++) {
                if (((this.jmatch[i][0] === this.jmhover || this.jmatch[i][5]) && this.jmatch[i][1].id > this.id)) {
                    if (!this.welds[this.jmatch[i][0]]) {
                        var obj = BSWG.physics.createWeld(this.obj.body, this.jmatch[i][1].obj.body,
                                                          this.jpoints[this.jmatch[i][0]],
                                                          this.jmatch[i][1].jpoints[this.jmatch[i][2]],
                                                          true,
                                                          this.jpointsNormals[this.jmatch[i][0]],
                                                          this.jmatch[i][1].jpointsNormals[this.jmatch[i][2]],
                                                          this.jmatch[i][3],
                                                          this.jmatch[i][4],
                                                          [13,14,15,23,24,25,61].indexOf(this.jmatch[i][3]) >= 0
                                                          );

                        if (this.onCC && !this.jmatch[i][1].onCC) {
                            this.jmatch[i][1].onCC = this.onCC;
                        }
                        if (!this.onCC && this.jmatch[i][1].onCC) {
                            this.onCC = this.jmatch[i][1].onCC;
                        }

                        this.welds[this.jmatch[i][0]] = { obj: obj, other: this.jmatch[i][1] };
                        this.jmatch[i][1].welds[this.jmatch[i][2]] = { obj: obj, other: this };

                        BSWG.updateOnCC(this, this.jmatch[i][1]);

                        var p2 = this.jmatch[i][1].jpointsw[this.jmatch[i][2]];
                        var p1 = this.jpointsw[this.jmatch[i][0]];

                        if (!autos) {
                            BSWG.render.boom.palette = chadaboom3D.blue;
                            BSWG.render.boom.add(
                                new b2Vec2((p1.x+p2.x)*0.5, (p1.y+p2.y)*0.5).particleWrap(0.2),
                                0.75,
                                32,
                                0.4,
                                1.0
                            );
                        }

                        BSWG.input.EAT_MOUSE('left');
                    }
                    else if (!autos) {
                        BSWG.physics.removeWeld(this.welds[this.jmatch[i][0]].obj);
                        this.welds[this.jmatch[i][0]].other = null;
                        this.welds[this.jmatch[i][0]] = null;
                        this.jmatch[i][1].welds[this.jmatch[i][2]].other = null;
                        this.jmatch[i][1].welds[this.jmatch[i][2]] = null;  

                        BSWG.updateOnCC(this, this.jmatch[i][1]);

                        BSWG.render.boom.palette = chadaboom3D.fire;
                        BSWG.render.boom.add(
                            this.jpointsw[this.jmatch[i][0]].particleWrap(0.2),
                            1.25,
                            32,
                            0.4,
                            1.0
                        );

                        BSWG.input.EAT_MOUSE('left');
                    }
                }
            }
        }

        if (this.welds) {
            for (var k in this.welds) {
                if (this.welds[k] && this.welds[k].obj.broken) {
                    var other = this.welds[k].other;
                    var k2;
                    for (k2 in other.welds) {
                        if (other.welds[k2] && other.welds[k2].obj === this.welds[k].obj) {
                            BSWG.physics.removeWeld(this.welds[k].obj);
                            this.welds[k].other = null;
                            this.welds[k] = null;
                            other.welds[k2].other = null;
                            other.welds[k2] = null; 
                            BSWG.updateOnCC(this, other);
                            break;
                        }
                    }
                }
            }
        }

    };

    this.pointIn = function(p) {

        if (this.obj.type === 'multipoly') {

            for (var i=0; i<this.obj.fixture.length; i++) {
                if (!!this.obj.fixture[i].TestPoint(p)) {
                    return true;
                }
            }
            return false;
        }
        else {
            return !!this.obj.fixture.TestPoint(p);
        }

    };

    this.getLocalPoint = function(p) {

        var p2 = this.obj.body.GetLocalPoint(p);
        return new b2Vec2(p2.x, p2.y);

    };

    this.getWorldPoint = function(p) {

        var p2 = this.obj.body.GetWorldPoint(p);
        return new b2Vec2(p2.x, p2.y);

    };

    this.addForce = function (f, p) {

        if (!p)
            this.obj.body.ApplyForceToCenter(f);
        else
            this.obj.body.ApplyForce(f, p);

    };

    this.distanceTo = function (comp2) {
        if (!this.obj || !this.obj.body || !comp2.obj || !comp2.obj.body) {
            return 1000000.0;
        }
        return Math.distVec2(this.obj.body.GetWorldCenter(), comp2.obj.body.GetWorldCenter());
    };

    BSWG.componentList.add(this);

};

BSWG.componentList = new function () {

    this.compList = new Array();
    this.compRemove = new Array();

    this.clear = function () {

        this.typeMap = {
            'blaster':          BSWG.component_Blaster,
            'block':            BSWG.component_Block,
            'chainlink':        BSWG.component_ChainLink,
            'cc':               BSWG.component_CommandCenter,
            'detacherlauncher': BSWG.component_DetacherLauncher,
            'hingehalf':        BSWG.component_HingeHalf,
            'laser':            BSWG.component_Laser,
            'missile-launcher': BSWG.component_MissileLauncher,
            'missile':          BSWG.component_Missile,
            'sawblade':         BSWG.component_SawBlade,
            'sawmotor':         BSWG.component_SawMotor,
            'spikes':           BSWG.component_Spikes,
            'thruster':         BSWG.component_Thruster
        };

        this.sbTypes = new Array();
        for (var key in this.typeMap) {
            if (this.typeMap[key].sbadd) {
                this.sbTypes.push(this.typeMap[key]);
            }
        }
        this.sbTypes.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        while (this.compList.length) {
            this.compList[0].remove();
        }

        this.compRemove.length = 0;

    };

    this.allCCs = function () {
        var len = this.compList.length;
        var ret = new Array();
        for (var i=0; i<len; i++) {
            if (this.compList[i].type === 'cc') {
                ret.push(this.compList[i]);
            }
        }
        return ret;
    };

    this.add = function (comp) {

        this.compList.push(comp);
        this.compList.sort(function(a,b){

            return a.sortOrder - b.sortOrder;

        });
        return true;

    };

    this.remove = function (comp) {

        if (comp.removed) {
            return false;
        }
        comp.removed = true;

        comp.destroy();

        if (comp.obj) {
            BSWG.physics.removeObject(comp.obj);
            comp.obj = null;
        };

        var oldCC = comp.onCC;
        comp.onCC = null;
        if (comp.welds) {
            for (var k in comp.welds) {
                if (comp.welds[k]) {
                    var other = comp.welds[k].other;
                    var k2;
                    for (k2 in other.welds) {
                        if (other.welds[k2] && other.welds[k2].obj === comp.welds[k].obj) {
                            BSWG.physics.removeWeld(comp.welds[k].obj);
                            comp.welds[k].other = null;
                            comp.welds[k] = null;
                            other.welds[k2].other = null;
                            other.welds[k2] = null; 
                            BSWG.updateOnCC(comp, other);
                            break;
                        }
                    }
                }
            }
        }
        comp.welds = null;

        for (var i=0; i<this.compList.length; i++)
            if (this.compList[i] === comp) {
                this.compList.splice(i, 1);
                return true;
            }

        return false;

    };

    this.handleInput = function (cc, keys) {

        var len = this.compList.length;
        for (var i=0; i<len; i++) {
            if (!cc || this.compList[i].onCC === cc) {
                this.compList[i].handleInput(keys);
            }
        }

        if (this.mouseOver && this.mouseOver.openConfigMenu && this.mouseOver.onCC && BSWG.game.editMode) {
            if (BSWG.input.MOUSE_PRESSED('left') && BSWG.input.MOUSE('shift') && !BSWG.ui.mouseBlock) {
                BSWG.input.EAT_MOUSE('left');
                this.mouseOver.openConfigMenu();
            }
            else if (BSWG.input.MOUSE_PRESSED('right') && !BSWG.ui.mouseBlock) {
                BSWG.input.EAT_MOUSE('right');
                this.mouseOver.openConfigMenu();
            }
        }

    };

    this.hash = {};
    this.hashXY = function ( v ) {
        return Math.floor(v/BSWG.comp_hashSize);
    };
    this.hashKey = function ( x, y ) {
        return Math.floor(x/BSWG.comp_hashSize) + Math.floor(y/BSWG.comp_hashSize) * 10000000;
    };
    this.hashKey2 = function ( x, y ) {
        return x + y * 10000000;
    };

    this.update = function (dt) {

        for (var key in this.hash) {
            var list = this.hash[key];
            for (var i=0; i<list.length; i++) {
                list[i] = null;
            }
            list.length = 0;
            list = null;
            this.hash[key] = null;
            delete this.hash[key];
        }

        var len = this.compList.length;
        for (var i=0; i<len; i++) {

            var C = this.compList[i];
            var p = C.obj.body.GetWorldCenter();
            var r = C.obj.radius * 1.25;
            var x1 = this.hashXY(p.x - r), y1 = this.hashXY(p.y - r),
                x2 = this.hashXY(p.x + r), y2 = this.hashXY(p.y + r);

            for (var x=x1; x<=x2; x++) {
                for (var y=y1; y<=y2; y++) {
                    var key = this.hashKey2(x,y);
                    if (!this.hash[key]) {
                        this.hash[key] = [];
                    }
                    this.hash[key].push(C);
                }
            }

            if (this.compList[i].updateAI) {
                var keys = this.compList[i].updateAI(dt);
                if (keys) {
                    this.handleInput(this.compList[i], keys);
                }
            }
        }
        for (var i=0; i<len; i++) {
            this.compList[i].cacheJPW();
        }
        for (var i=0; i<len; i++) {
            this.compList[i].updateJCache();
        }
        for (var i=0; i<len; i++) {
            this.compList[i].baseUpdate(dt);
            this.compList[i].update(dt);
        }

        len = this.compRemove.length;
        for (var i=0; i<len; i++) {
            this.remove(this.compRemove[i]);
        }
        this.compRemove.length = 0;
        this.autoWelds = null;

    };

    this.render = function (ctx, cam, dt) {

        var p = new b2Vec2(BSWG.input.MOUSE('x'), BSWG.input.MOUSE('y'));
        var pw = BSWG.render.unproject3D(p, 0.0);
        var len = this.compList.length;

        this.compHover2 = this.atPoint(pw);

        this.mouseOver = null;
        for (var i=0; i<len; i++) {
            if (this.compList[i].confm && this.compList[i].confm === BSWG.compActiveConfMenu) {
                this.mouseOver = this.compList[i];
                break;
            }
            if (BSWG.game.grabbedBlock === this.compList[i]) {
                this.mouseOver = this.compList[i];
                break;
            }
        }
        if (!this.mouseOver) {
            this.mouseOver = this.compHover2;
        }
        if (this.mouseOver && BSWG.componentHoverFn(this.mouseOver) && (!BSWG.ui.mouseBlock || BSWG.game.grabbedBlock)) {
            if (this.mouseOver.hasConfig && this.mouseOver.onCC && BSWG.game.editMode && !BSWG.ui.mouseBlock) {
                BSWG.render.setCustomCursor(true, 3);
            }
            else {
                BSWG.render.setCustomCursor(true, 2);
            }
        }
        else {
            BSWG.render.setCustomCursor(true);
        }

        for (var i=0; i<len; i++) {
            this.compList[i].render(ctx, cam, dt);
        }
        for (var i=0; i<len; i++) {
            this.compList[i].baseRenderOver(ctx, cam, dt);
        }

        BSWG.jpointRenderer.render();

        for (var i=0; i<len; i++) {
            if (this.compList[i].ai && this.compList[i].ai.__update_sensors) {
                this.compList[i].ai.__update_sensors(BSWG.ai.consoleDiv && BSWG.ai.showDebug ? ctx : null, dt);
            }
        }
    };

    this.atPoint = function (p, only) {

        var CL = only ? [ only ] : this.hash[this.hashKey(p.x, p.y)];
        if (!CL) {
            return;
        }

        var raycaster = BSWG.render.raycaster;

        raycaster.set(new THREE.Vector3(p.x, p.y, 0.4), new THREE.Vector3(0.0, 0.0, -1.0));

        var len = CL.length;
        for (var i=0; i<len; i++) {
            if (!CL[i].removed && raycaster.intersectObjects(CL[i].queryMeshes).length > 0) {
                return CL[i];
            }
        }
        return null;

    };

    this.inLine = function(_x1, _y1, _x2, _y2, fn) {
        var x1 = this.hashXY(_x1), y1 = this.hashXY(_y1),
            x2 = this.hashXY(_x2), y2 = this.hashXY(_y2);

        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = Math.sqrt(dx*dx+dy*dy);
        dx /= len;
        dy /= len;

        var found = {};

        for (var t=0; t<=len; t+=1.0) {
            var ox = Math.floor(x1 + dx * t),
                oy = Math.floor(y1 + dy * t);
            for (var _x=-1; _x<=1; _x++) {
                for (var _y=-1; _y<=1; _y++) {
                    if (_x && _y) {
                        continue;
                    }
                    var key = this.hashKey2(ox + _x, oy + _y);
                    var list = this.hash[key];
                    if (list) {
                        for (var i=0; i<list.length; i++) {
                            if (!found[list[i].id] && !list[i].removed) {
                                found[list[i].id] = true;
                                fn(list[i]);
                            }
                        }
                    }
                }
            }
        }

        found = null;
    };

    this.withRay = function (p, p2) {

        var raycaster = BSWG.render.raycaster;

        var dx = p2.x - p.x, dy = p2.y - p.y, dz = p2.z - p.z;
        var vlen = Math.sqrt(dx*dx+dy*dy+dz*dz);

        raycaster.set(p, new THREE.Vector3(dx/vlen, dy/vlen, dz/vlen));

        var dist = vlen+0.001;
        var best = null, bestP = null;
        this.inLine(p.x, p.y, p2.x, p2.y, function(C){
            var inter = raycaster.intersectObjects(C.queryMeshes);
            for (var j=0; j<inter.length; j++)
            {
                if (inter[j].distance < dist) {
                    dist = inter[j].distance;
                    best = C;
                    bestP = inter[j].point;
                }
            }
        });

        if (best) {
            return {
                comp: best,
                p: bestP,
                d: dist
            };
        }
        return null;

    };

    this.makeQueryable = function (comp, mesh) {

        mesh.__compid = comp.id;
        comp.queryMeshes = comp.queryMeshes || new Array();
        comp.queryMeshes.push(mesh);
        return true;

    };

    this.removeQueryable = function (comp, mesh) {

        if (!comp.queryMeshes) {
            return false;
        }
        for (var i=0; i<comp.queryMeshes.length; i++) {
            if (comp.queryMeshes[i].__compid === comp.id) {
                comp.queryMeshes.splice(i, 1);
                return true;
            }
        }
        return false;

    };

    this.withinBox = function (_x1, _y1, _x2, _y2, fn) {
        var x1 = this.hashXY(_x1), y1 = this.hashXY(_y1),
            x2 = this.hashXY(_x2), y2 = this.hashXY(_y2);

        var found = {};

        for (var x=x1; x<=x2; x++) {
            for (var y=y1; y<=y2; y++) {
                var key = this.hashKey2(x,y);
                var list = this.hash[key];
                if (list) {
                    for (var i=0; i<list.length; i++) {
                        if (!found[list[i].id] && !list[i].removed) {
                            found[list[i].id] = true;
                            fn(list[i]);
                        }
                    }
                }
            }
        }

        found = null;
    };

    this.withinRadius = function (p, r) {
        var ret = new Array();
        this.withinBox(p.x-r, p.y-r, p.x+r, p.y+r, function(C){
            var p2 = C.obj.body.GetWorldCenter();
            var dist = Math.pow(p2.x - p.x, 2.0) +
                       Math.pow(p2.y - p.y, 2.0);
            if (dist < Math.pow(r+C.obj.radius, 2.0)) {
                ret.push(C);
            }
        });
        return ret;
    };

    this.autoWelds = null;
    this.load = function(obj, spawn) {

        var comps = obj.list;
        var cc = null;

        var shipOnly = !!spawn;
        spawn = spawn || {};
        var offset = (spawn.p || new b2Vec2(0, 0)).clone();
        var angle  = spawn.a || 0.0;

        this.autoWelds = this.autoWelds || new Array();

        if (shipOnly) {
            for (var i=0; i<comps.length; i++) {
                var C = comps[i];
                if (C.type === 'cc') {
                    offset.x -= C.pos.x;
                    offset.y -= C.pos.y;
                    break;
                }
            }
        }

        for (var i=0; i<comps.length; i++) {
            var C = comps[i];
            if (shipOnly && C.onCC === null) {
                continue;
            }

            var args = new Object();
            if (C.args) {
                for (var key in C.args) {
                    args[key] = C.args[key];
                }
            }
            args.pos = new b2Vec2(C.pos.x + offset.x, C.pos.y + offset.y);
            args.angle = C.angle;
            var OC = new BSWG.component(this.typeMap[C.type], args);
            if (OC.type === 'cc') {
                cc = OC;
            }
            if (C.tag) {
                OC.tag = C.tag;
            }

            var WL = C.welds;
            for (var j=0; j<WL.length; j++) {
                var pos = new b2Vec2(WL[j].pos.x, WL[j].pos.y);
                this.autoWelds.push(BSWG.physics.localToWorld(pos, OC.obj.body));
            }
        }

        for (var i=0; i<this.autoWelds.length; i++) {
            for (var j=i+1; j<this.autoWelds.length; j++) {
                var dist = Math.distVec2(this.autoWelds[i], this.autoWelds[j]);
                if (dist <= Math.sqrt(BSWG.component_jMatchClickRange)) {
                    this.autoWelds.splice(j, 1);
                    j -= 1;
                    continue;
                }
            }
        }

        return cc;

    };

    // returns JSON
    this.serialize = function(onCC, everything) {

        var comps = new Array();

        // Filter list
        for (var i=0; i<this.compList.length; i++) {
            var C = this.compList[i];

            if (C.serialize && (everything || C.onCC === onCC)) {
                comps.push(C);
            }
        }

        var out = new Array(comps.length);

        for (var i=0; i<comps.length; i++) {
            var C  = comps[i];
            var OC = new Object();

            var body = C.obj.body;
            var pos = body.GetPosition();
            var angle = body.GetAngle();

            OC.type = C.type;
            OC.id = C.id;
            OC.onCC = C.onCC ? C.onCC.id : null;
            OC.pos = { x: pos.x, y: pos.y };
            OC.angle = angle;
            OC.tag = C.tag ? C.tag : BSWG.generateTag();

            OC.args = new Object();
            for (var j=0; j<C.serialize.length; j++) {
                var key = C.serialize[j];
                OC.args[key] = C[key];
            }

            OC.welds = new Array();
            if (C.welds) {
                for (var key in C.welds) {
                    var W = C.welds[key];
                    if (W && W.other) {
                        var OW = new Object();
                        OW.other = W.other.id;
                        OW.index = parseInt(key);
                        var jp = C.jpoints[OW.index];
                        OW.pos = { x: jp.x, y: jp.y }; // Local to current component
                        OC.welds.push(OW);
                    }
                }
            }

            out[i] = OC;
        }

        var ret = new Object();
        ret.list = out;

        return ret;

    };

}();