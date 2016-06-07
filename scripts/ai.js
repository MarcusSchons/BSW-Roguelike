BSWG.enemyStats = {};
BSWG.getEnemy = function(type) {

    var estr = BSWG['ais_' + type];
    var eobj = estr ? JSON.parse(estr) : null;
    var stats = BSWG.enemyStats[type] || null;

    if (BSWG.componentList && !stats && eobj) {
        stats = BSWG.componentList.loadScan(eobj);
        BSWG.enemyStats[type] = stats;
    }

    var title = 'Unkown Enemy';

    switch (type) {
        case 'big-flail':       title = 'Big Flail'; break;
        case 'big-spinner':     title = 'Big Spinner'; break;
        case 'brute':           title = 'Brute'; break; 
        case 'crippler':        title = 'Crippler'; break;
        case 'cruncher-boss':   title = 'Crimson Cruncher'; break;
        case 'fighter':         title = 'Fighter'; break;
        case 'brutenie':        title = 'Brutenie'; break;
        case 'marauder':        title = 'Marauder'; break;
        case 'striker':         title = 'Striker'; break;
        case 'four-blaster-x2': title = '4x Blaster II'; break;
        case 'four-blaster':    title = '4x Blaster'; break;
        case 'heavy-fighter':   title = 'Heavy Fighter'; break;
        case 'laser-fighter':   title = 'Laser Fighter'; break;
        case 'little-brute':    title = 'Little Brute'; break;
        case 'little-charger-2':title = 'Little Charger X'; break;
        case 'little-charger':  title = 'Little Charger Y'; break;
        case 'little-cruncher': title = 'Little Cruncher'; break;
        case 'mele-boss':       title = 'Mele Monster'; break;
        case 'missile-boss':    title = 'Flail'; break;
        case 'missile-spinner': title = 'Missile Spinner'; break;
        case 'msl-fighter':     title = 'Missile Fighter'; break;
        case 'scorpion':        title = 'Scorpion'; break;
        case 'spinner':         title = 'Spinner'; break;
        case 'uni-dir-fighter': title = 'Uni-Fighter'; break;
        case 'uni-fight-msl':   title = 'Uni-Fighter II'; break;
        case 'uni-laser':       title = 'Scanner'; break;
        case 'little-tough-guy':title = 'Lil\' Tough Guy'; break;
        case 'tough-guy':       title = 'Tough Guy'; break;
        case 'stinger':         title = 'Stinger'; break;
        case 'freighter':       title = 'Freighter'; break;
        case 'tracker':         title = 'Tracker'; break;
        default: break;
    }

    eobj.title = title;

    return {
        obj: eobj,
        stats: stats,
        title: title,
        compStats: function (ostats) {
            var ustats = {};
            for (var stat in stats) {
                var found = false;
                var count = stats[stat];
                for (var statj in stats) {
                    if (stat.localeCompare(statj) < 0 && BSWG.compImplied(stat, statj)) {
                        found = true;
                    }
                    if (BSWG.compImplied(statj, stat)) {
                        count += stats[statj];
                    }
                }
                if (!found) {
                    ustats[stat] = count;
                }
            }
            var f = 0, nf = 0;
            for (var stat in ustats) {
                var found = false;
                for (var i=0; i<ostats.length && !found; i++) {
                    if (BSWG.compImplied(stat, ostats[i])) {
                        f += ustats[stat];
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    nf += ustats[stat];
                }
            }
            return f / (f+nf);
        }
    };
};

BSWG.applyAIHelperFunctions = function (obj, self) {

    obj.log = function (text) {
        BSWG.ai.logError(self.tag + '/' + self.id + ': ' + text);
    };

    var sensors = new Array();
    obj.get_sensors = function () {

        return sensors;

    };

    var aiobj = obj;

    obj.vec = function(x,y) {
        return new b2Vec2(x||0, y||0);
    };

    obj.world = function (comp, vec) {
        var v2 = Math.rotVec2(vec, comp.frontOffset);
        return comp.obj.body.GetWorldPoint(v2);
    };

    obj.trace = function (comp, clr) {
        comp.traceClr = clr || null;
    };

    obj.player_cc = function () {
        return BSWG.game.ccblock || null;
    };

    obj.player_comp = function () {
        var cc = this.player_cc();
        var list = new Array();
        var CL = BSWG.componentList.compList;
        for (var i=0; cc && i<CL.length; i++) {
            if (CL[i].onCC === cc) {
                list.push(CL[i]);
            }
        }
        return list;
    };

    obj.make_sensor = function (type, args) {

        var obj = new Object();

        for (var key in args) {
            obj[key] = args[key];
        }

        obj.type = type;

        switch (type) {

            case 'turret':

                var comp = obj.comp;
                var oradius = obj.radius || comp.obj.radius;
                var forwardOffset = obj.forwardOffset || 0.0;
                var reverse = obj.reverse || false;
                var limit = obj.limit || Math.PI/2.05;

                obj.track = function (p, keyDown, left, right, keyFire) { // Stateless

                    if (!comp || !comp.obj || !comp.obj.body || !p) {
                        return;
                    }

                    left = left || BSWG.KEY.LEFT;
                    right = right || BSWG.KEY.RIGHT;

                    var mp = comp.obj.body.GetWorldCenter();
                    var distance = Math.distVec2(mp, p);
                    var radius = oradius;

                    var angDiff = Math.angleBetween(mp, p) - (comp.obj.body.GetAngle() + comp.frontOffset + forwardOffset);
                    angDiff = Math.atan2(Math.sin(angDiff), Math.cos(angDiff));

                    this.angleDistance = angDiff;

                    if (distance > radius || this.tracker) {
                        if (Math.abs(angDiff) < limit) {
                            var ad2 = angDiff;
                            if (reverse) {
                                ad2 *= -1;
                            }
                            if (ad2 > 0.0) {
                                keyDown[left] = true;
                            }
                            else if (ad2 < 0.0) {
                                keyDown[right] = true;
                            }
                            keyDown[keyFire] = true;
                        }
                    }

                };

                obj.updateRender = function (ctx, dt) {

                    lastDT = dt;

                };

                sensors.push(obj);
                break;

                break;

            case 'tracker': //
                obj.tracker = true;

            case 'movement': // Controller

                var comp = obj.comp;
                var hinge = obj.hinge || false;
                var oradius = obj.radius || comp.obj.radius;
                var revRadius = obj.revRadius || (oradius * 2.0);
                var forwardOffset = obj.forwardOffset || 0.0;
                var charge = obj.charge || false;
                var exclusive = obj.exclusive || false;
                var predComp = obj.predComp || comp;

                obj.reached = false;
                obj.spinner = obj.spinner || false;

                var lastDT = 1.0/60.0;
                var aDists = [];
                var pDists = [];

                var computeVel = function(dists) {
                    if (dists.length < 2) {
                        return 0.0;
                    }
                    else {
                        var vels = 0, count = 0;
                        for (var i=1; i<dists.length; i++) {
                            vels += (dists[i] - dists[i-1]) / lastDT;
                            count += 1.0;
                        }
                        return vels / count;
                    }
                };

                obj.timeStop = function (tmag, ptype) {

                    var mag = Math.abs(computeVel(ptype === 'vel' ? pDists : aDists));

                    var damping = comp.obj.body.GetAngularDamping();
                    if (!ptype || ptype === 'vel') {
                        damping = comp.obj.body.GetLinearDamping();
                    }

                    damping = (1/(1 + damping));

                    if (mag < 0.000001 || tmag < 0.000001) {
                        return 1000000.0;
                    }

                    var ret = Math.log(tmag/mag) / Math.log(damping);
                    if (isNaN(ret) || !(ret>0)) {
                        return 1500000.0;
                    }
                    return ret;

                };

                obj.timeTarget = function (dist, ptype) {

                    var mag = Math.abs(computeVel(ptype === 'vel' ? pDists : aDists));

                    var damping = comp.obj.body.GetAngularDamping();
                    if (!ptype || ptype === 'vel') {
                        damping = comp.obj.body.GetLinearDamping();
                    }

                    damping = (1/(1 + damping));

                    if (Math.abs(mag) < 0.001) {
                        return 1500000.0;
                    }

                    var ld = Math.log(damping);
                    var ret = Math.log(dist*ld/mag + 1.0) / ld;
                    if (isNaN(ret) || !(ret>0)) {
                        return 1500000.0;
                    }
                    return ret;
                };

                obj.predict = function (t, ptype) {

                    var mag = computeVel(ptype === 'vel' ? pDists : aDists);

                    var damping = comp.obj.body.GetAngularDamping();
                    if (!ptype || ptype === 'vel') {
                        damping = comp.obj.body.GetLinearDamping();
                    }

                    damping = (1/(1 + damping));

                    return mag * (Math.pow(damping, t) - 1.0) / Math.log(damping);

                };

                var moveTos = new Array();

                obj.moveTo = function (p, keyDown, left, right, forward, reverse) { // Stateless

                    if (!comp || !comp.obj || !comp.obj.body || !p) {
                        return;
                    }

                    left = left || BSWG.KEY.LEFT;
                    right = right || BSWG.KEY.RIGHT;
                    if (!this.tracker) {
                        forward = forward || BSWG.KEY.UP;
                    }

                    var doReverse = false;
                    var mp = comp.obj.body.GetWorldCenter();
                    var distance = Math.distVec2(mp, p);

                    if (charge) {
                        p = p.clone();
                        p.x += (p.x - mp.x) / distance * oradius * 2;
                        p.y += (p.y - mp.y) / distance * oradius * 2;
                        distance = Math.distVec2(mp, p);
                    }

                    var radius = oradius;

                    this.distance = distance;

                    var vel = predComp.obj.body.GetLinearVelocity().clone();
                    var vlen = Math.lenVec2(vel);

                    if (vlen > 1.0) {
                        vel.x /= vlen;
                        vel.y /= vlen;

                        var t = Math.min(4, this.timeTarget(distance, 'vel'));
                        if (charge) {
                            t = Math.max(t, 1);
                        }
                        var len2 = this.predict(t, 'vel');

                        vel.x = p.x + vel.x * len2;
                        vel.y = p.y + vel.y * len2;
                    }
                    else {
                        vel.x = p.x;
                        vel.y = p.y;
                    }

                    var angDiff = Math.angleBetween(mp, vel) - (comp.obj.body.GetAngle() + comp.frontOffset + forwardOffset);
                    angDiff = Math.atan2(Math.sin(angDiff), Math.cos(angDiff));
                    if (Math.abs(angDiff) > Math.PI*0.5 && reverse && distance < revRadius && !this.tracker) {
                        doReverse = true;
                        angDiff = Math.atan2(Math.sin(angDiff+Math.PI), Math.cos(angDiff+Math.PI));
                    }

                    this.angleDistance = angDiff;

                    aDists.push(angDiff);
                    pDists.push(distance);
                    while (aDists.length > 10) {
                        aDists.splice(0, 1);
                    }
                    while (pDists.length > 10) {
                        pDists.splice(0, 1);
                    }

                    moveTos.push({
                        p: p,
                        mp: mp,
                        a: -(comp.obj.body.GetAngle() + comp.frontOffset + forwardOffset + (doReverse ? Math.PI : 0)),
                        r: radius
                    });

                    this.reached = this.tracker ? (Math.abs(angDiff) < Math.PI/90) : (distance <= radius);

                    if (distance > radius || this.tracker) {
                        if (this.spinner) {
                            if (computeVel(aDists) > 0) {
                                keyDown[right] = true;
                            }
                            else {
                                keyDown[left] = true;
                            }
                        }
                        else if (Math.abs(angDiff) > Math.PI/45) {
                            var ad2 = angDiff + this.predict(1.0, 'ang');
                            if (ad2 > 0.0) {
                                keyDown[left] = true;
                            }
                            else if (ad2 < 0.0) {
                                keyDown[right] = true;
                            }
                        }
                        if (!this.tracker && (!(exclusive && (keyDown[left] || keyDown[right])) || this.spinner)) {
                            var tt = this.timeTarget(distance, 'vel');
                            if (Math.abs(angDiff) < Math.PI/4 && (tt > this.timeStop(0.2, 'vel') || (tt>10.0 && Math.abs(angDiff) < Math.PI/12) || charge)) {
                                keyDown[doReverse ? reverse : forward] = true;
                            }
                        }
                    }

                    this.angDist = angDiff;

                };

                obj.updateRender = function (ctx, dt) {

                    lastDT = dt;

                    if (!ctx) {
                        moveTos.length = 0;
                        return;
                    }

                    for (var i=0; i<moveTos.length; i++) {
                        var MT = moveTos[i];
                        var p = BSWG.game.cam.toScreen(BSWG.render.viewport, MT.p);
                        var mp = BSWG.game.cam.toScreen(BSWG.render.viewport, MT.mp);
                        var r = BSWG.game.cam.toScreenSize(BSWG.render.viewport, MT.r);
                        var a = MT.a;
                        ctx.lineWidth = 2.0;
                        ctx.strokeStyle = 'rgba(0,255,0,0.5)';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, r, 0.0, Math.PI*2.0);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mp.x, mp.y);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(mp.x, mp.y);
                        ctx.lineTo(mp.x + Math.cos(a) * r, mp.y + Math.sin(a) * r);
                        ctx.closePath();
                        ctx.stroke();
                    }
                    moveTos.length = 0;

                };

                sensors.push(obj);
                break;

            case 'radius': // Sensor

                obj.list = [];
                obj.first = null;
                obj.found = false;

                obj.updateRender = function (ctx, dt, noUpdate) {

                    // update

                    if (!noUpdate) {

                        var refBlock = this.refObject || aiobj.ccblock;
                        var refOffset = this.refOffset || new b2Vec2(0, 0);

                        if (!refBlock || !refBlock.obj || !refBlock.obj.body) {
                            refBlock = aiobj.ccblock;
                            if (!refBlock || !refBlock.obj || !refBlock.obj.body) {
                                this.found = false;
                                this.first = null;
                                this.list.length = 0;
                                return;
                            }
                        }

                        this.minDist = this.distance && this.distance[0] ? this.distance[0] : 0.0;
                        this.maxDist = this.distance && this.distance[1] ? this.distance[1] : 10.0;
                        this.fullRange = false;
                        if (!this.angle) {
                            this.fullRange = true;
                        }
                        else {
                            this.minAngle = this.angle && (this.angle[0] || this.angle[0] === 0) ? this.angle[0] : -Math.PI;
                            this.maxAngle = this.angle && (this.angle[1] || this.angle[1] === 0) ? this.angle[1] : Math.PI;
                            this.minAngle += refBlock.obj.body.GetAngle() + refBlock.frontOffset;
                            this.maxAngle += refBlock.obj.body.GetAngle() + refBlock.frontOffset;
                            this.minAngle = Math.atan2(Math.sin(this.minAngle), Math.cos(this.minAngle));
                            this.maxAngle = Math.atan2(Math.sin(this.maxAngle), Math.cos(this.maxAngle));
                        }

                        this.cWorld = aiobj.world(refBlock, refOffset);
                        this.cScreen = BSWG.game.cam.toScreen(BSWG.render.viewport, this.cWorld);
                        this.minDistScreen = BSWG.game.cam.toScreenSize(BSWG.render.viewport, this.minDist);
                        this.maxDistScreen = BSWG.game.cam.toScreenSize(BSWG.render.viewport, this.maxDist);

                        this.found = false;
                        this.first = null;
                        this.list.length = 0;

                        var CL = BSWG.componentList.withinRadiusPlayerOnly(this.cWorld, this.maxDist);
                        //BSWG.componentList.withinRadius(this.cWorld, this.maxDist);
                        for (var i=0; CL && i<CL.length; i++) {
                            if (!CL[i] || !CL[i].obj) {
                                continue;
                            }
                            var enemy = CL[i].onCC === BSWG.game.ccblock && BSWG.game.ccblock !== self;
                            var friendly = CL[i].onCC && !enemy;
                            var neutral = !enemy && !friendly;
                            if ((enemy && this.enemy) ||
                                (friendly && this.friendly) ||
                                (neutral && this.neutral)) {
                                var radius = CL[i].obj.radius || 0.0;
                                var dist = Math.distSqVec2(this.cWorld, CL[i].obj.body.GetWorldCenter());
                                if (dist > Math.pow(this.minDist-radius, 2.0)) {
                                    if (this.fullRange || Math.pointBetween(this.cWorld, this.minAngle, this.maxAngle, CL[i].obj.body.GetWorldCenter())) {
                                        this.list.push([CL[i], dist, enemy, friendly, neutral]);
                                    }
                                }
                            }
                        }

                        this.list.sort(function(a,b){
                            return a[1] - b[1];
                        });
                        for (var i=0; i<this.list.length; i++) {
                            this.list[i] = {
                                comp: this.list[i][0],
                                distance: this.list[i][1],
                                angle: Math.angleBetween(this.cWorld, this.list[i][0].p()),
                                enemy: this.list[i][2],
                                friendly: this.list[i][3],
                                neutral: this.list[i][4]
                            };
                        }

                        if (this.list.length > 0) {
                            this.first = this.list[0];
                            this.found = true;
                        }

                    }

                    if (ctx && this.cScreen) { // render

                        var minAngle = this.minAngle || 0;
                        if (minAngle < 0.0) {
                            minAngle += 2.0 * Math.PI;
                            maxAngle += 2.0 * Math.PI;
                        }
                        var maxAngle = this.maxAngle || 0;
                        if (maxAngle < 0.0) {
                            minAngle += 2.0 * Math.PI;
                            maxAngle += 2.0 * Math.PI;
                        }

                        if (this.fullRange) {
                            minAngle = 0;
                            maxAngle = Math.PI * 2.0;
                        }

                        ctx.fillStyle = 'rgba(' + (this.enemy ? '255' : '0') + ',' + (this.friendly ? '255' : '0') + ',' + (this.neutral ? '255' : '0') + ',0.25)';
                        ctx.beginPath();
                        ctx.moveTo(this.cScreen.x, this.cScreen.y);
                        ctx.arc(this.cScreen.x, this.cScreen.y, this.maxDistScreen, Math.PI*2.0-maxAngle, Math.PI*2.0-minAngle, false);
                        ctx.moveTo(this.cScreen.x, this.cScreen.y);
                        ctx.arc(this.cScreen.x, this.cScreen.y, this.minDistScreen, Math.PI*2.0-minAngle, Math.PI*2.0-maxAngle, true);
                        ctx.closePath();
                        ctx.fill();

                    }

                };

                sensors.push(obj);
                break;
            default:
                break;
        }

        return obj;

    };

    obj.make_controller = obj.make_sensor;

    var frameIdx = 0;

    obj.__update_sensors = function (ctx, dt) {

        for (var i=0; i<sensors.length; i++) {
            var S = sensors[i];
            if (S.updateRender) {
                S.updateRender(ctx, dt, (frameIdx % sensors.length) !== i);
            }
        }

        frameIdx += 1;

    };

    obj.pause = function(time) {
        self.aiPause(time);
    };

    obj.hold = function(time) {
        self.aiHold(time);
    };

    obj.sub = function(time, fn) {
        self.aiSub(time, fn);
    };

    obj.each = function(cbk) {
        if (typeof cbk === 'function') {
            for (var i=0; i<BSWG.componentList.compList.length; i++) {
                var comp = BSWG.componentList.compList[i];
                if (comp && comp.onCC === self) {
                    cbk(comp);
                }
            }                
        }
    };

    obj.get = function(tag) {
        for (var i=0; i<BSWG.componentList.compList.length; i++) {
            var comp = BSWG.componentList.compList[i];
            if (comp && comp.onCC === self && comp.tag === tag) {
                return comp;
            }
        }
    };

    obj.mouse = function() {
        var mx = BSWG.input.MOUSE('x');
        var my = BSWG.input.MOUSE('y');
        var mps = new b2Vec2(mx, my);
        return BSWG.render.unproject3D(mps, 0.0);
    };

    obj.ccblock = self;

};

BSWG.ai = new function() {

    var EDITOR_WIDTH = 550;

    this.getFile = false;
    this.testOtherShip = null;

    this.init = function () {

        this.closeEditor();
        this.testMenuOpen = false;
        if (this.getFile) {
            BSWG.input.REMOVE_GFILE(this.getFile);
            this.getFile = null;
        }

    };

    this.saveCode = function () {

        if (this.editor && this.editorCC) {
            this.editorCC.aiStr = this.editor.getValue();
        }

    };

    this.addEditor = function ( ) {

        if (this.editor) {
            this.removeEditor();
        }

        this.editorDiv = document.createElement('div');
        this.editorDiv.style.position = 'fixed';
        this.editorDiv.style.zIndex = '50';
        this.editorDiv.style.width = (EDITOR_WIDTH-8) + 'px';
        this.editorDiv.style.height = '400px';
        this.editorDiv.style.top = '66px';
        this.editorDiv.style.border = '4px solid rgba(100,100,100,1.0)';
        document.body.appendChild(this.editorDiv);

        this.editor = ace.edit(this.editorDiv);
        this.editor.setFontSize(14);
        this.editor.setTheme("ace/theme/monokai");
        this.editor.getSession().setMode("ace/mode/javascript");
        this.editor.focus();

        this.editor.setValue(this.editorCC.aiStr || BSWG.ai_Template, -1);

    };

    this.removeEditor = function ( ) {

        if (!this.editor) {
            return;
        }

        this.lastCursor = this.editor.getCursorPosition();

        document.body.removeChild(this.editorDiv);
        this.editorDiv = null;
        this.editor.destroy();
        this.editor = null;

    };

    this.showDebug = false;

    this.openEditor = function (ccblock) {

        var self = this;

        this.closeEditor();

        this.editorCC = ccblock;
        this.showDebug = true;

        this.addEditor();

        this.consoleDiv = document.createElement('code');
        this.consoleDiv.style.position = 'fixed';
        this.consoleDiv.style.zIndex = '50';
        this.consoleDiv.style.width = (EDITOR_WIDTH-8) + 'px';
        this.consoleDiv.style.height = '144px';
        this.consoleDiv.style.top = '66px';
        this.consoleDiv.style.border = '4px solid rgba(100,100,100,1.0)';
        this.consoleDiv.style.overflowX = 'hidden';
        this.consoleDiv.style.overflowY = 'scroll';
        this.consoleDiv.style.color = 'rgb(248, 248, 242)';
        this.consoleDiv.style.backgroundColor = 'rgb(39, 40, 34)';
        this.consoleDiv.readOnly = true;
        document.body.appendChild(this.consoleDiv);

        if (this.lastCursor) {
            this.editor.navigateTo(this.lastCursor.row, this.lastCursor.column);
        }

        this.runBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 80, h: 50,
            text: "Run",
            selected: false,
            click: function (me) {
                self.logError('Run -------------');
                self.saveCode();
                self.editorCC.reloadAI();
            }
        });

        this.updateBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 125, h: 50,
            text: "Update",
            selected: false,
            click: function (me) {
                self.logError('Update ----------');
                self.saveCode();
                self.editorCC.reloadAI(true);
            }
        });

        this.stopBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 100, h: 50,
            text: "Stop",
            selected: false,
            click: function (me) {
                self.editorCC.removeAI();
                self.logError('Stop ------------');
            }
        });

        this.testMenuOpen = false;

        this.testBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 100, h: 50,
            text: "Test",
            selected: this.testMenuOpen,
            click: function (me) {
                self.testMenuOpen = !self.testMenuOpen;
                me.selected = self.testMenuOpen;
                if (self.testMenuOpen) {
                    self.testSelBtn.add();
                    if (self.testOtherShip && self.testOtherShipName) {
                        self.testRunBtn.add();
                    }
                }
                else {
                    self.testSelBtn.remove();
                    self.testRunBtn.remove();
                }
            }
        });

        this.testSelBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 115, h: 50,
            text: "Import",
            selected: false,
            click: function (me) {
            }
        });

        this.runMode = false;

        this.testRunBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 115, h: 50,
            text: "Run Test",
            selected: false,
            click: function (me) {
                me.selected = !me.selected;
                self.runMode = me.selected;
                if (me.selected) {
                    self.logError('Test Start ------');
                    self.saveCode();
                    me.text = "Stop Test";
                    self.removeEditor();
                    BSWG.game.shipTest(self.testOtherShip);
                    self.showDebugBtn.add();
                }
                else {
                    self.logError('Test End --------');
                    me.text = "Run Test";
                    self.addEditor();
                    BSWG.game.shipTest();
                    self.editorCC = BSWG.game.ccblock;
                    self.showDebugBtn.remove();
                }
            }
        });
        this.testSelBtn.remove();
        this.testRunBtn.remove();

        this.showDebugBtn = new BSWG.uiControl(BSWG.control_Button, {
            x: 10, y: -1000,
            w: 150, h: 50,
            text: "Show Debug",
            selected: this.showDebug,
            click: function (me) {
                self.showDebug = !self.showDebug;
                me.selected = self.showDebug;
            }
        });
        this.showDebugBtn.remove();

        this.getFile = BSWG.input.GET_FILE(function(data, x, y){
            if (!data) {
                if (!self.testSelBtn || !self.testMenuOpen) {
                    return false;
                }
                return x >= self.testSelBtn.p.x && y >= self.testSelBtn.p.y &&
                       x <= (self.testSelBtn.p.x + self.testSelBtn.w) && y <= (self.testSelBtn.p.y + self.testSelBtn.h);
            }

            try {
                self.testOtherShip = JSON.parse(data.data);
                self.testOtherShipName = data.filename;
            } catch (err) {
                self.testOtherShip = null;
                self.testOtherShipName = null;
            }
            
        }, "text");

    };

    this.closeEditor = function () {

        if (this.getFile) {
            BSWG.input.REMOVE_GFILE(this.getFile);
            this.getFile = null;
        }

        if (this.consoleDiv) {

            this.saveCode();

            this.removeEditor();

            document.body.removeChild(this.consoleDiv);
            this.consoleDiv = null;
            this.runBtn.destroy();
            this.runBtn.remove();
            this.runBtn = null;
            this.updateBtn.destroy();
            this.updateBtn.remove();
            this.updateBtn = null;
            this.stopBtn.destroy();
            this.stopBtn.remove();
            this.stopBtn = null;
            this.testBtn.destroy();
            this.testBtn.remove();
            this.testBtn = null;
            this.testSelBtn.destroy();
            this.testSelBtn.remove();
            this.testSelBtn = null;
            this.testRunBtn.destroy();
            this.testRunBtn.remove();
            this.testRunBtn = null;

            this.editorCC = null;
        }

    };

    this.logError = function(text) {
        text = text + '';
        var lines = text.match(/[^\r\n]+/g);
        if (!lines) {
            return;
        }
        for (var i=0; i<lines.length; i++) {
            if (lines[i].length > 70) {
                lines[i] = lines[i].substring(0, 35) + ' ... ' + lines[i].substring(lines[i].length-35);
            }
        }
        text = lines.join('\n') + '\n';
        console.log(text);
        if (this.consoleDiv) {
            this.consoleDiv.innerText += text + '\n';
            this.consoleDiv.scrollTop = this.consoleDiv.scrollHeight - this.consoleDiv.clientHeight;
        }
    };

    this.nextSave = 10;

    this.update = function ( ctx, dt ) {

        if (!this.consoleDiv) {
            return;
        }

        if (this.nextSave <= 0 && this.editor) {
            this.saveCode();
            this.nextSave = ~~((1/BSWG.render.dt) * 0.5);
        }
        this.nextSave -= 1;

        var mx = BSWG.input.MOUSE('x'), my = BSWG.input.MOUSE('y');

        if (this.editorDiv) {
            this.editorDiv.style.left = (10) + 'px';
            this.editorDiv.style.height = (window.innerHeight - 70 - 20 - 50 - 4 - (this.testMenuOpen ? 60 : 0) - 150 - 128) + 'px';
        }
        this.consoleDiv.style.left = (10) + 'px';
        if (this.editorDiv) {
            this.consoleDiv.style.top = (parseInt(this.editorDiv.style.top) + parseInt(this.editorDiv.style.height) + 12) + 'px';
        }

        if ((this.editorDiv &&
                mx >= parseInt(this.editorDiv.style.left) && my >= parseInt(this.editorDiv.style.top) &&
                mx < parseInt(this.editorDiv.style.left) + parseInt(this.editorDiv.style.width) &&
                my < parseInt(this.editorDiv.style.top) + parseInt(this.editorDiv.style.height)) ||
            (this.consoleDiv &&
                mx >= parseInt(this.consoleDiv.style.left) && my >= parseInt(this.consoleDiv.style.top) &&
                mx < parseInt(this.consoleDiv.style.left) + parseInt(this.consoleDiv.style.width) &&
                my < parseInt(this.consoleDiv.style.top) + parseInt(this.consoleDiv.style.height))) {
            BSWG.render.setCustomCursor(false);
            BSWG.input.EAT_MOUSE('wheel');
        }
        else {
            BSWG.render.setCustomCursor(true);
        }

        this.updateBtn.p.x = 10;
        this.updateBtn.p.y = BSWG.render.viewport.h - this.runBtn.h - 10 - 128;
        this.runBtn.p.x = this.updateBtn.p.x + this.updateBtn.w + 10;
        this.runBtn.p.y = this.updateBtn.p.y;
        this.stopBtn.p.x = this.runBtn.p.x + this.runBtn.w + 10;
        this.stopBtn.p.y = this.runBtn.p.y;
        this.testBtn.p.x = this.stopBtn.p.x + this.stopBtn.w + 10;
        this.testBtn.p.y = this.stopBtn.p.y;

        if (this.testMenuOpen) {
            this.testSelBtn.p.x = this.updateBtn.p.x;
            this.testSelBtn.p.y = this.updateBtn.p.y - 10 - this.testSelBtn.h + 3;
            this.testRunBtn.p.x = parseInt(this.consoleDiv.style.width) + parseInt(this.consoleDiv.style.left) - this.testRunBtn.w;
            this.testRunBtn.p.y = this.updateBtn.p.y - 10 - this.testSelBtn.h + 3;

            if (this.runMode) {
                this.consoleDiv.style.top = (window.innerHeight - (parseInt(this.consoleDiv.style.height) + 5 + 8)) + 'px';
                this.testSelBtn.p.y += 1000;
                this.testRunBtn.p.y = parseInt(this.consoleDiv.style.top) - (this.testRunBtn.h + 5);
                this.showDebugBtn.p.y = this.testRunBtn.p.y;
                this.showDebugBtn.p.x = this.testRunBtn.p.x - this.showDebugBtn.w - 10;
                this.runBtn.p.y += 1000;
                this.stopBtn.p.y += 1000;
                this.testBtn.p.y += 1000;
                this.updateBtn.p.y += 1000;
            }

            if (this.testOtherShip && this.testOtherShipName) {
                var x = this.runMode ? this.testSelBtn.p.x : this.testSelBtn.p.x + 10 + this.testSelBtn.w;
                ctx.fillStyle = '#aaa';
                ctx.strokeStyle = '#00f';
                ctx.font = '10px Orbitron';
                ctx.textAlign = 'left';
                ctx.fillTextB(this.testOtherShipName, x, this.testSelBtn.p.y + this.testSelBtn.h * 0.5 + 10/2, true);
                this.testRunBtn.add();
            }
        }

        if (this.editorDiv) {
            if (this.editor.isFocused()) {
                this.editorDiv.style.border = '4px solid rgba(200,200,200,1.0)';
            }
            else {
                this.editorDiv.style.border = '4px solid rgba(100,100,100,1.0)';
            }
        }

    };

}();