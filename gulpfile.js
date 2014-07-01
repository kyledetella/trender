var gulp = require('gulp');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var size = require('gulp-size');
var bump = require('gulp-bump');
var jshint = require('gulp-jshint');
var reporter = require('jshint-stylish');

var SRC = 'src/main.js';

gulp.task('compile', function () {
  gulp.src(SRC)
  .pipe(browserify({
    standalone: 'trender'
  }))
  .pipe(rename('trender.js'))
  .pipe(size())
  .pipe(gulp.dest('./dist'))
});

gulp.task('build', ['test', 'compile'], function () {
  gulp.src('dist/trender.js')
  .pipe(uglify())
  .pipe(rename('trender.min.js'))
  .pipe(size())
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
