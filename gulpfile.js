var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var watchify = require('watchify');
var notify = require('gulp-notify');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var es6ify = require('es6ify');
var fs = require('fs');
var connect = require('gulp-connect');
var rimraf = require('gulp-rimraf');
var watch = require('gulp-watch');

var appDir = './app';
var srcDir = appDir + '/src';
var distDir = appDir + '/dist';

es6ify.traceurOverrides = {
	annotations: true,
	modules: 'commonjs'
}

function handleErrors () {
	var args = Array.prototype.slice.call(arguments);
	
	notify.onError({
		title: 'Compile Error',
		message: '<%= error.message %>'
	}).apply(this, args);

	this.emit('end');
}

function buildScript (file, watch, minify) {
	var bundler = browserify({ debug: true });

	bundler
		.add(es6ify.runtime)
		.require(require.resolve(srcDir + '/' + file), { entry: true })
		.transform(es6ify)
	
	if (watch) {
		bundler = watchify(bundler, {})
	}

	bundler.on('error', handleErrors);
	bundler.on('update', rebundle);

	function rebundle () {
		var stream = bundler.bundle();
		
		gutil.log('Rebundling...');

		stream = stream
			.on('error', handleErrors)
			.pipe(source(file));

		if (minify) {
			stream = stream
				.pipe(buffer())
				.pipe(uglify());
		}
			
		stream = stream
			.pipe(gulp.dest(distDir))
			.pipe(connect.reload());

		return stream;
	}

	return rebundle();
}

gulp.task('connect', function () {
	return connect.server({  
		root: ['app'],
		port: 8888,
		livereload: true
	});
});

gulp.task('clean:dist', function () {
	return gulp.src(distDir, { read: false })
		.pipe(rimraf({ force: true }));
});

gulp.task('build', ['clean:dist'], function () {
	return buildScript('main.js', false, true);
});

gulp.task('default', ['clean:dist', 'connect'], function () {
	//watch(appDir + '/**/*.html', function () {
	//	connect.reload();
	//});

	return buildScript('main.js', true, true);
});