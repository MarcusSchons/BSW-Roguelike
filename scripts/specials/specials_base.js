BSWG.specialList = new (function(){

    this.contList = [];
    this.effectList = [];

    this.updateRender = function(ctx, dt) {

        for (var i=0; i<this.contList.length; i++) {
            if (this.contList[i])
            this.contList[i].updateRender(ctx, dt);
        }
        for (var i=0; i<this.effectList.length; i++) {
            this.effectList[i].updateRender(ctx, dt);
        }

    };

    this.typeMapC = {};
    this.typeMapE = {};

    this.init = function () {

        while (this.contList.length) {
            this.contList[0].destroy();
        }
        while (this.effectList.length) {
            this.effectList[0].destroy();
        }

        this.typeMapC = {};
        this.typeMapE = {};

        //this.typeMapC['key'] = BSWG.specialControl_Desc1
        //this.typeMapC['key'] = BSWG.specialControl_Desc2
        // ...

        //this.typeMapE['key'] = BSWG.specialEffect_Desc1
        //this.typeMapE['key'] = BSWG.specialEffect_Desc2
        // ...

        /*new BSWG.specialControl(BSWG.specialCont_circleRange, {
            color: new THREE.Vector4(0, 1, 0, 0.75),
            minRadius: 5,
            maxRadius: 5,
            speed: 0.5,
            polys: BSWG.SCCR_healPoly,
            callback: function(data){
                console.log(data)
            }
        });*/
        BSWG.SCCR_healPoly = [
            [
                new b2Vec2(-.3, .15/2),
                new b2Vec2(-.3, -.15/2),
                new b2Vec2(-.15/2, -.15/2),
                new b2Vec2(-.15/2, -.3),
                new b2Vec2(.15/2, -.3),
                new b2Vec2(.15/2, -.15/2),
                new b2Vec2(.3, -.15/2),
                new b2Vec2(.3, .15/2),
                new b2Vec2(.15/2, .15/2),
                new b2Vec2(.15/2, .3),
                new b2Vec2(-.15/2, .3),
                new b2Vec2(-.15/2, .15/2)
            ]
        ];

    };

    this.getCDesc = function(key) {
        return this.typeMapC[key] || null;
    };

    this.getEDesc = function(key) {
        return this.typeMapE[key] || null;
    };

    this.getControl = function(key, args) {
        if (!args) {
            var ret = [];
            for (var i=0; i<this.contList.length; i++) {
                if (this.contList[i].type === key) {
                    ret.push(this.contList[i]);
                }
            }
            return ret;
        }
        else {
            for (var i=0; i<this.contList.length; i++) {
                if (this.contList[i].type === key) {
                    var valid = true;
                    for (var key in args) {
                        if (this.contList[i][key] !== args[key]) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) {
                        return this.contList[i];
                    }
                }
            }
            return null;
        }
    };

    this.serialize = function() {

        var ret = {
            list: []
        };

        for (var i=0; i<this.contList.length; i++) {
            ret.list.push(this.contList[i].serialize());
        }

        return ret;

    };

    this.load = function(obj) {

        this.init();
        if (obj) {
            for (var i=0; i<obj.list.length; i++) {
                var it = obj.list[i];
                new BSWG.specialControl(this.getCDesc(it.type), it.args);
            }
        }
    };

});

// For player use of specials (player input)
BSWG.specialControl = function(desc, args) {

    if (!desc) {
        desc = {};
    }
    if (!args) {
        args = {};
    }

    for (var key in desc) {
        this["_" + key] = this[key] || null;
        this[key] = desc[key];
    }

    this.output = null;
    this.userAction = false;

    var ret = this.init(args);

    BSWG.specialList.contList.push(this);

    if (!ret) {
        this.destroy();
    }

};

BSWG.specialControl.prototype.serialize = function () {

    var type = this.type;
    var args = {};
    if (this.serialKey) {
        for (var i=0; i<this.serialKey.length; i++) {
            var key = this.serialKey[i];
            args[key] = this[key];
        }
    }
    return {
        type: type,
        args: args
    };

};

BSWG.specialControl.prototype.init = function(args) {

    if (args.callback) {
        this.callback = args.callback;
    }

    return true;

};

BSWG.specialControl.prototype.destroy = function() {

    for (var i=0; i<BSWG.specialList.contList.length; i++) {
        if (BSWG.specialList.contList[i] === this) {
            BSWG.specialList.contList.splice(i, 1);
            return true;
        }
    }

    return false;

};

BSWG.specialControl.prototype.updateRender = function(ctx, dt) {

    if ((this.output || BSWG.input.KEY_DOWN(BSWG.KEY.ESC)) && !this.userAction) {
        BSWG.input.EAT_KEY(BSWG.KEY.ESC);
        this.userAction = true;
        if (this.callback) {
            this.callback(this.output);
        }
        return false;
    }

    return true;

};

// Created at the instant of special usage (player or ai)
BSWG.specialEffect = function(desc, args) {

    if (!desc) {
        desc = {};
    }
    if (!args) {
        args = {};
    }

    for (var key in desc) {
        this["_" + key] = this[key] || null;
        this[key] = desc[key];
    }

    this.init(args);

    BSWG.specialList.effectList.push(this);

};

BSWG.specialEffect.prototype.init = function(args) {

};

BSWG.specialEffect.prototype.destroy = function() {

    for (var i=0; i<BSWG.specialList.effectList.length; i++) {
        if (BSWG.specialList.effectList[i] === this) {
            BSWG.specialList.effectList.splice(i, 1);
            return true;
        }
    }

    return false;

};

BSWG.specialEffect.prototype.updateRender = function(ctx, dt) {

};