var NwBuilder = require('nw-builder');
var gulp = require('gulp');
var gutil = require('gulp-util');
var glob = require('simple-glob');
var exec = require('child_process').execSync;
 
var getNW = function (run) {

    var files = [ 'package.json', 'index.html', 'scripts/**', 'shaders/*', 'images/*', 'fonts/*', 'css/*', 'sounds/*', 'music/*' ];

    files.push('node_modules/lowdb/**');
    files.push('node_modules/open/**');

    var nw = new NwBuilder({
        version: '0.15.0',
        files: glob(files),
        platforms: run ? ['win64'] : ['win64', 'osx64', 'linux64'] // change this to 'win' for/on windows
    });

    // Log stuff you want
    nw.on('log', function (msg) {
        gutil.log('nw-builder', msg);
    });

    return nw;

};

gulp.task('build', function () {

    var nw = getNW();
 
    // Build returns a promise, return it so the task isn't called in parallel
    return nw.build().catch(function (err) {
        gutil.log('nw', err);
    });

});

gulp.task('run', function () {

    var nw = getNW(true);
 
    return nw.build().then(function(){
        exec("BSWR.exe", {
            'cwd': 'build/BSWR/win64/'
        });
    }).catch(function (err) {
        gutil.log('nw', err);
    });

});