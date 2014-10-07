var gulp = require('gulp');
var es6ify = require('es6ify');
var browserify = require('browserify');
var fs = require('fs');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');

es6ify.traceurOverrides = {
	annotations: true,
	modules: 'commonjs'
}

gulp.task('default', function () {
	return browserify({ debug: true })
		.add(es6ify.runtime)
		.transform(es6ify)
		.require(require.resolve('./src/main.js'), { entry: true })
		.bundle()
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest('./dist'));
});