var gulp = require('gulp');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('compile', function () {
  gulp.src('src/main.js')
  .pipe(browserify({
    standalone: 'trender'
  }))
  .pipe(rename('trender.js'))
  .pipe(gulp.dest('./dist'))
});

gulp.task('build', ['compile'], function () {
  gulp.src('dist/trender.js')
  .pipe(uglify())
  .pipe(rename('trender.min.js'))
  .pipe(gulp.dest('./dist'));
});
