var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var size = require('gulp-size');
var bump = require('gulp-bump');
var jshint = require('gulp-jshint');
var reporter = require('jshint-stylish');

var SRC = './src/main.js';

gulp.task('compile', function () {
  return browserify(SRC)
    .transform(babelify)
    .bundle()
    .pipe(source('trender.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['test', 'compile'], function () {
  return gulp.src('dist/trender.js')
  .pipe(size({showFiles: true}))
  .pipe(uglify())
  .pipe(rename('trender.min.js'))
  .pipe(size({showFiles: true}))
  .pipe(size({gzip: true, showFiles: true}))
  .pipe(gulp.dest('./dist'));
});

gulp.task('test', function () {
  gulp.src(SRC)
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter(reporter));
});

gulp.task('bump', function (){
  gulp.src('./package.json')
  .pipe(bump({ type:'point' }))
  .pipe(gulp.dest('./'));
});
