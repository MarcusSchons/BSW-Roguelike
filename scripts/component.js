// BlockShip Wars Component

BSWG.compActiveConfMenu = null;

BSWG.component_minJMatch = 0.02;

BSWG.drawBlockPoly = function(ctx, obj, iscale, zcenter, outline) {

	var body = obj.body, verts = obj.verts;
	if (!zcenter) zcenter = body.GetLocalCenter();

	var overts = BSWG.physics.localToWorld(verts, body);
	var iverts = new Array(verts.length),
		len = verts.length;
	for (var i=0; i<len; i++) {
		var vec = new b2Vec2(
			(verts[i].x - zcenter.x) * iscale + zcenter.x,
			(verts[i].y - zcenter.y) * iscale + zcenter.y
		);
		iverts[i] = BSWG.physics.localToWorld(vec, body);
	}

	ctx.save();

	overts = BSWG.game.cam.toScreenList(BSWG.render.viewport, overts);
	iverts = BSWG.game.cam.toScreenList(BSWG.render.viewport, iverts);

	ctx.beginPath();
	ctx.moveTo(overts[0].x, overts[0].y);
	for (var i=1; i<len; i++) {
		ctx.lineTo(overts[i].x, overts[i].y);
	}
	ctx.closePath();
	ctx.fill();

	if (outline) {
		ctx.strokeStyle = 'rgba(255,255,255,0.5)';
		ctx.lineWidth = 2.0;
		ctx.stroke();
		ctx.lineWidth = 1.0;
	}

	var oAlpha = parseFloat(ctx.globalAlpha);
	ctx.fillStyle = '#fff';

	for (var i=0; i<len; i++) {
		var j = (i+1) % len;

		var a = overts[i], b = overts[j],
			c = iverts[j], d = iverts[i];

		var angle = Math.atan2(b.y - a.y, b.x - a.x);
		var alpha = Math.sin(angle) * 0.5 + 0.5;
		ctx.globalAlpha = oAlpha * alpha * 0.6;

		ctx.beginPath();
		ctx.moveTo(a.x, a.y);
		ctx.lineTo(b.x, b.y);
		ctx.lineTo(c.x, c.y);
		ctx.lineTo(d.x, d.y);
		ctx.closePath();
		ctx.fill();
	}

	ctx.beginPath();
	ctx.globalAlpha = 0.65;
	ctx.moveTo(iverts[0].x, iverts[0].y);
	for (var i=1; i<len; i++) {
		ctx.lineTo(iverts[i].x, iverts[i].y);
	}
	ctx.closePath();
	ctx.fill();

	ctx.restore();

};

BSWG.createBoxJPoints = function(w, h, t) {

	var jp = new Array();

	if (t) {

		for (var y=0; y<h; y++) {
			jp.push(new b2Vec2(t*-w * 0.5, y - h * 0.5 + 0.5));
		}

		if (!(h%2)) {
			jp.push(new b2Vec2(t*-w * 0.5, 0.0));
		}

		for (var x=0; x<w; x++) {
			jp.push(new b2Vec2(x - w * 0.5 + 0.5,  h * 0.5));
		}

		if (!(w%2)) {
			jp.push(new b2Vec2(0.0,  h * 0.5));
		}

		var l = Math.sqrt(w*w + h*h);
		var dx = w/l, dy = h/l;
		var x0 = dx * 0.5 * l - w * 0.5, 
			y0 = dy * 0.5 * l - h * 0.5;
		if (t === -1) {
			x0 = -x0;
			dx = -dx;
		}

		jp.push(new b2Vec2(
			x0, y0
		));

		for (var i=1.0; i<l*0.5 - 0.5; i+=1.0) {
			jp.push(new b2Vec2(
				x0 - dx * i,
				y0 - dy * i
			));
			jp.push(new b2Vec2(
				x0 + dx * i,
				y0 + dy * i
			));
		}

		return jp;

	};

	for (var y=0; y<h; y++) {
		jp.push(new b2Vec2(-w * 0.5, y - h * 0.5 + 0.5));
		jp.push(new b2Vec2( w * 0.5, y - h * 0.5 + 0.5));
	}

	if (!(h%2)) {
		jp.push(new b2Vec2(-w * 0.5, 0.0));
		jp.push(new b2Vec2( w * 0.5, 0.0));
	}

	for (var x=0; x<w; x++) {
		jp.push(new b2Vec2(x - w * 0.5 + 0.5, -h * 0.5));
		jp.push(new b2Vec2(x - w * 0.5 + 0.5,  h * 0.5));
	}

	if (!(w%2)) {
		jp.push(new b2Vec2(0.0, -h * 0.5));
		jp.push(new b2Vec2(0.0,  h * 0.5));
	}

	return jp;

};

BSWG.updateOnCC = function (a, b) {

	var cc = a.onCC || b.onCC;

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
	mark(b, scan(b));

};

BSWG.component_CommandCenter = {

	type: 'cc',

	init: function(args) {

		this.width  = 2;
		this.height = 3;

		this.obj = BSWG.physics.createObject('box', args.pos, args.angle || 0, {
			width:  this.width,
			height: this.height
		});

		this.jpoints = BSWG.createBoxJPoints(this.width, this.height);

	},

	render: function(ctx, cam, dt) {

		ctx.fillStyle = '#444';
		BSWG.drawBlockPoly(ctx, this.obj, 0.8);

		var poly = [
			new b2Vec2(-this.width * 0.5 * 0.75, -this.height * 0.5 * 0.0),
			new b2Vec2( this.width * 0.5 * 0.75, -this.height * 0.5 * 0.0),
			new b2Vec2( this.width * 0.3 * 0.75, -this.height * 0.5 * 0.75),
			new b2Vec2(-this.width * 0.3 * 0.75, -this.height * 0.5 * 0.75)
		].reverse();

		ctx.fillStyle = '#0b0';
		BSWG.drawBlockPoly(ctx, { body: this.obj.body, verts: poly }, 0.8,
			new b2Vec2(0, -this.height * 0.5 * 0.75 * 0.5)
			);

		var poly = [
			new b2Vec2(-this.width * 0.5 * 0.7, this.height * 0.5 * 0.75),
			new b2Vec2( this.width * 0.5 * 0.7, this.height * 0.5 * 0.75),
			new b2Vec2( this.width * 0.5 * 0.7, this.height * 0.5 * 0.05),
			new b2Vec2(-this.width * 0.5 * 0.7, this.height * 0.5 * 0.05)
		].reverse();

		ctx.fillStyle = '#00b';
		BSWG.drawBlockPoly(ctx, { body: this.obj.body, verts: poly }, 0.8,
			new b2Vec2(0, this.height * 0.5 * 0.8 * 0.5)
			);
	},

	update: function(dt) {

	},

	handleInput: function(keys) {

		var rot = 0;
		var accel = 0;

		if (keys[BSWG.KEY.LEFT]) rot -= 1;
		if (keys[BSWG.KEY.RIGHT]) rot += 1;

		if (keys[BSWG.KEY.UP]) accel -= 1;
		if (keys[BSWG.KEY.DOWN]) accel += 1;

		if (rot) {
			this.obj.body.SetAwake(true);
			this.obj.body.ApplyTorque(rot*7.0);
		}
		
		if (accel) {
			var a = this.obj.body.GetAngle() + Math.PI/2.0;
			accel *= 5.0;
			this.obj.body.SetAwake(true);
			var force = new b2Vec2(Math.cos(a)*accel, Math.sin(a)*accel);
			this.obj.body.ApplyForceToCenter(force);
		}

	},

};

BSWG.component_Blaster = {

	type: 'blaster',

	init: function(args) {

		var offsetAngle = this.offsetAngle = 0.0;

		var verts = [
			Math.rotVec2(new b2Vec2(-0.3, -0.3), offsetAngle),
			Math.rotVec2(new b2Vec2( 0.3, -0.3), offsetAngle),
			Math.rotVec2(new b2Vec2( 0.3,  0.3), offsetAngle),
			Math.rotVec2(new b2Vec2( 0.05,  1.5), offsetAngle),
			Math.rotVec2(new b2Vec2(-0.05,  1.5), offsetAngle),
			Math.rotVec2(new b2Vec2(-0.3,  0.3), offsetAngle)
		];

		this.obj = BSWG.physics.createObject('polygon', args.pos, args.angle || 0, {
			verts: verts
		});

		this.jpoints = [ new b2Vec2(0.0, -0.3),
						 new b2Vec2(-0.3, 0.0),
						 new b2Vec2(0.3, 0.0) ];

		this.fireKey = args.fireKey || BSWG.KEY.SPACE;
		this.thrustT = 0.0;

	},

	render: function(ctx, cam, dt) {

		ctx.fillStyle = '#600';
		BSWG.drawBlockPoly(ctx, this.obj, 0.5, null, BSWG.componentList.mouseOver === this && BSWG.game.editMode && !this.onCC);

	},

	update: function(dt) {

		if (this.fireT) {
			this.fireT -= dt;
			if (this.fireT <= 0)
				this.fireT = 0.0;
		}

	},

	openConfigMenu: function() {

		if (BSWG.compActiveConfMenu)
			BSWG.compActiveConfMenu.remove();

		var p = BSWG.game.cam.toScreen(BSWG.render.viewport, this.obj.body.GetWorldCenter());

		var self = this;
        BSWG.compActiveConfMenu = this.confm = new BSWG.uiControl(BSWG.control_KeyConfig, {
            x: p.x-100, y: p.y-25,
            w: 200, h: 50,
            key: this.fireKey,
            close: function (key) {
            	if (key)
                	self.fireKey = key;
            }
        });

	},

	closeConfigMenu: function() {

	},

	handleInput: function(keys) {

		var accel = 0;

		if (keys[this.fireKey] && !this.fireT) {

			var a = this.obj.body.GetAngle() - Math.PI/2.0;

			var pl = new b2Vec2(0.0,  1.5);
			var p = BSWG.physics.localToWorld([pl], this.obj.body);

			BSWG.blasterList.add(p[0], new b2Vec2(-Math.cos(a)*15.0, -Math.sin(a)*15.0));
			accel = 1;

			this.fireT = 0.5;
		}
		
		if (accel)
		{
			var a = this.obj.body.GetAngle() + Math.PI/2.0;
			accel *= -8.0;
			this.obj.body.SetAwake(true);
			var force = new b2Vec2(Math.cos(a)*accel, Math.sin(a)*accel);
			this.obj.body.ApplyForceToCenter(force);	
			this.thrustT = 0.3;
		}

	},

};

BSWG.component_Thruster = {

	type: 'thruster',

	init: function(args) {

		var offsetAngle = this.offsetAngle = 0.0;

		var verts = [
			Math.rotVec2(new b2Vec2(-0.2, -0.5), offsetAngle),
			Math.rotVec2(new b2Vec2( 0.2, -0.5), offsetAngle),
			Math.rotVec2(new b2Vec2( 0.4,  0.5), offsetAngle),
			Math.rotVec2(new b2Vec2(-0.4,  0.5), offsetAngle)
		];

		this.obj = BSWG.physics.createObject('polygon', args.pos, args.angle || 0, {
			verts: verts
		});

		this.jpoints = [ new b2Vec2(0.0, 0.5) ];

		this.thrustKey = args.thrustKey || BSWG.KEY.UP;
		this.thrustT = 0.0;

	},

	render: function(ctx, cam, dt) {

		ctx.fillStyle = '#282';
		BSWG.drawBlockPoly(ctx, this.obj, 0.65, new b2Vec2((this.obj.verts[2].x + this.obj.verts[3].x) * 0.5,
														   (this.obj.verts[2].y + this.obj.verts[3].y) * 0.5),
						   BSWG.componentList.mouseOver === this && BSWG.game.editMode && !this.onCC);

		if (this.thrustT > 0) {

			var tpl = [
				Math.rotVec2(new b2Vec2(-0.15, -0.4), this.offsetAngle),
				Math.rotVec2(new b2Vec2( 0.0, -0.5 - this.thrustT * (2.0 + Math.random())), this.offsetAngle),
				Math.rotVec2(new b2Vec2( 0.15, -0.4), this.offsetAngle)
			];

			ctx.globalAlpha = Math.min(this.thrustT / 0.3, 1.0);

			var r = Math.random();
			if (r<0.5)
				ctx.fillStyle = '#f40';
			else if (r<0.75)
				ctx.fillStyle = '#ff0';
			else
				ctx.fillStyle = '#fff';

			BSWG.drawBlockPoly(ctx, {
				body: this.obj.body,
				verts: tpl
			}, 0.5, new b2Vec2(
				(tpl[0].x + tpl[2].x) * 0.5,
				(tpl[0].y + tpl[2].y) * 0.5
			));

			ctx.globalAlpha = 1.0;

			this.thrustT -= dt;

		}
		else
			this.thrustT = 0.0;

	},

	update: function(dt) {

	},

	openConfigMenu: function() {

		if (BSWG.compActiveConfMenu)
			BSWG.compActiveConfMenu.remove();

		var p = BSWG.game.cam.toScreen(BSWG.render.viewport, this.obj.body.GetWorldCenter());

		var self = this;
        BSWG.compActiveConfMenu = this.confm = new BSWG.uiControl(BSWG.control_KeyConfig, {
            x: p.x-100, y: p.y-25,
            w: 200, h: 50,
            key: this.thrustKey,
            close: function (key) {
            	if (key)
                	self.thrustKey = key;
            }
        });

	},

	closeConfigMenu: function() {

	},

	handleInput: function(keys) {

		var accel = 0;

		if (keys[this.thrustKey]) accel += 1;
		
		if (accel)
		{
			var a = this.obj.body.GetAngle() + Math.PI/2.0;
			accel *= 20.0;
			this.obj.body.SetAwake(true);
			var force = new b2Vec2(Math.cos(a)*accel, Math.sin(a)*accel);
			this.obj.body.ApplyForceToCenter(force);
			this.thrustT = 0.3;
		}

	},

};

BSWG.component_Block = {

	type: 'block',

	init: function(args) {

		this.width    = args.width || 1;
		this.height   = args.height || 1;
		this.armour   = args.armour || false;
		this.triangle = args.triangle || 0;

		this.obj = BSWG.physics.createObject('box', args.pos, args.angle || 0, {
			width:    this.width,
			height:   this.height,
			triangle: this.triangle
		});

		this.jpoints = BSWG.createBoxJPoints(this.width, this.height, this.triangle);

	},

	render: function(ctx, cam, dt) {

		ctx.fillStyle = '#444';
		BSWG.drawBlockPoly(ctx, this.obj, 0.7, null, BSWG.componentList.mouseOver === this && BSWG.game.editMode && !this.onCC);

	},

	update: function(dt) {

	},

};

BSWG.nextCompID = 1;
BSWG.component = function (desc, args) {

	this.handleInput = function(key) {};

	for (var key in desc)
		this[key] = desc[key];

	this.id = BSWG.nextCompID++;
	this.jpoints = new Array();
	this.jmatch = new Array();
	this.jmatch = -1;
	this.welds = new Object();
	this.onCC = null;
	if (this.type === 'cc')
		this.onCC = this;

	this.init(args);

	if (this.jpoints && this.jpoints.length && this.obj) {

		for (var i=0; i<this.jpoints.length; i++) {
			this.jpoints[i].x *= 1.0025;
			this.jpoints[i].y *= 1.0025;
		}

		this.jpointsNormals = new Array(this.jpoints.length);
		for (var i=0; i<this.jpointsNormals.length; i++) {
			this.jpointsNormals[i] = BSWG.physics.getNormalAt(this.obj, this.jpoints[i]);
		}

	}

	this.remove = function() {

		BSWG.componentList.remove(this);

	};

	this.removeSafe = function() {

		BSWG.componentList.compRemove.push(this);

	};

	this.baseRenderOver = function(ctx, cam, dt) {

		// <-- Render wires here

		if (!this.jpointsw)
			return;

		var jp = cam.toScreenList(BSWG.render.viewport, this.jpointsw);

		var map = {};
		for (var i=0; i<this.jmatch.length; i++) {
			map[this.jmatch[i][0]] = true;
		}

		for (var i=0; i<jp.length; i++) {

			if (!BSWG.game.editMode && !this.welds[i])
				continue;

			ctx.beginPath();
			var r = map[i]?(this.jmhover===i?160:110):80;
			if (this.welds[i] && this.jmhover !== i) {
				r = 110;
			}
        	ctx.arc(jp[i].x, jp[i].y, r * cam.z, 0, 2*Math.PI);
        	ctx.fillStyle = map[i]?(this.jmhover===i?'#2f2':'#8f8'):'#aaa';
            ctx.globalAlpha = 0.9;
        	if (this.welds[i])
        	{
        		ctx.fillStyle = '#ccf';
        		ctx.globalAlpha = 1.0;
        		if (this.jmhover === i) {
        			ctx.fillStyle = '#f22';
        		}
        	}
            ctx.fill();

	   		ctx.globalAlpha = 1.0;
	   	}

	};

	this.cacheJPW = function() {
		if (this.jpointsw) {
			this.jpointsw = null;
		}
		this.jpointsw = BSWG.physics.localToWorld(this.jpoints, this.obj.body);
	};

	this.baseUpdate = function(dt) {

		if (!BSWG.game.editMode)
			return;

		if (!this.jpointsw)
			return;

		this.jmatch = new Array();
		this.jmhover = -1;

		var _p = this.obj.body.GetWorldCenter();
		var p = new b2Vec2(_p.x, _p.y);
		var cl = BSWG.componentList.withinRadius(p, this.obj.radius+0.5);

		var jpw = this.jpointsw;

        var mps = new b2Vec2(BSWG.input.MOUSE('x'), BSWG.input.MOUSE('y'));
        var mp = BSWG.game.cam.toWorld(BSWG.render.viewport, mps);

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
        if (mind > 0.075)
        	this.jmhover = -1;

		for (var i=0; i<cl.length; i++) {
			if (cl[i] !== this) {
				var jpw2 = cl[i].jpointsw;

				for (var k1=0; k1<jpw.length; k1++)
					for (var k2=0; k2<jpw2.length; k2++)
					{
						var p1 = jpw[k1];
						var p2 = jpw2[k2];
						var d2 = Math.pow(p1.x - p2.x, 2.0) +
								 Math.pow(p1.y - p2.y, 2.0);
						if (d2 < BSWG.component_minJMatch) {
							this.jmatch.push([
								k1, cl[i], k2
							]);
							break;
						}
					}
			}
		}

		if (this.jmhover >= 0 && BSWG.input.MOUSE_PRESSED('left')) {
			for (var i=0; i<this.jmatch.length; i++) {
				if (this.jmatch[i][0] === this.jmhover && this.jmatch[i][1].id > this.id) {
					if (!this.welds[this.jmatch[i][0]]) {
						var obj = BSWG.physics.createWeld(this.obj.body, this.jmatch[i][1].obj.body,
														  this.jpoints[this.jmatch[i][0]],
														  this.jmatch[i][1].jpoints[this.jmatch[i][2]],
														  true,
														  this.jpointsNormals[this.jmatch[i][0]],
														  this.jmatch[i][1].jpointsNormals[this.jmatch[i][2]]);

						if (this.onCC && !this.jmatch[i][1].onCC)
							this.jmatch[i][1].onCC = this.onCC;
						if (!this.onCC && this.jmatch[i][1].onCC)
							this.onCC = this.jmatch[i][1].onCC;

						this.welds[this.jmatch[i][0]] = { obj: obj, other: this.jmatch[i][1] };
						this.jmatch[i][1].welds[this.jmatch[i][2]] = { obj: obj, other: this };

						BSWG.updateOnCC(this, this.jmatch[i][1]);
					}
					else {
						BSWG.physics.removeWeld(this.welds[this.jmatch[i][0]].obj);
						this.welds[this.jmatch[i][0]].other = null;
						this.welds[this.jmatch[i][0]] = null;
						this.jmatch[i][1].welds[this.jmatch[i][2]].other = null;
						this.jmatch[i][1].welds[this.jmatch[i][2]] = null;	

						BSWG.updateOnCC(this, this.jmatch[i][1]);
					}
				}
			}
		}

	};

	this.pointIn = function(p) {

		return !!this.obj.fixture.TestPoint(p);

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

	BSWG.componentList.add(this);

};

BSWG.componentList = new function () {

	this.compList = new Array();
	this.compRemove = new Array();

	this.clear = function () {

		while (this.compList.length)
			this.compList[0].remove();

		this.compRemove.length = 0;

	};

	this.add = function (comp) {

		this.compList.push(comp);
		return true;

	};

	this.remove = function (comp) {

		for (var i=0; i<this.compList.length; i++)
			if (this.compList[i] === comp) {
				this.compList.splice(i, 1);
				return true;
			}
		return false;

	};

	this.handleInput = function (cc, keys) {

		var len = this.compList.length;
		for (var i=0; i<len; i++)
		{
			if (!cc || this.compList[i].onCC === cc)
			{
				this.compList[i].handleInput(keys);
			}
		}

		if (this.mouseOver && this.mouseOver.openConfigMenu && this.mouseOver.onCC && BSWG.input.MOUSE_PRESSED('right') && BSWG.game.editMode)
		 	this.mouseOver.openConfigMenu();

	};

	this.update = function (dt) {

		var len = this.compList.length;
		for (var i=0; i<len; i++) {
			this.compList[i].cacheJPW();
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

	};

	this.render = function (ctx, cam, dt) {

		var p = new b2Vec2(BSWG.input.MOUSE('x'), BSWG.input.MOUSE('y'));
		var pw = cam.toWorld(BSWG.render.viewport, p);
		this.mouseOver = this.atPoint(pw);

		var len = this.compList.length;
		for (var i=0; i<len; i++)
			this.compList[i].render(ctx, cam, dt);
		for (var i=0; i<len; i++)
			this.compList[i].baseRenderOver(ctx, cam, dt);
	};

	this.atPoint = function (p) {

		var len = this.compList.length;
		for (var i=0; i<len; i++)
			if (this.compList[i].pointIn(p))
				return this.compList[i];
		return null;

	};

	this.withinRadius = function (p, r) {
		var ret = new Array();
		var len = this.compList.length;
		for (var i=0; i<len; i++)
		{
			var p2 = this.compList[i].obj.body.GetWorldCenter();
			var dist = Math.pow(p2.x - p.x, 2.0) +
					   Math.pow(p2.y - p.y, 2.0);
			if (dist < Math.pow(r+this.compList[i].obj.radius, 2.0))
				ret.push(this.compList[i]);
		}
		return ret;
	}

}();