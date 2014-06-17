var gulp = require('gulp');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');

// Basic usage
gulp.task('build', function() {
  gulp.src('src/main.js')
  .pipe(browserify({
    standalone: 'batchTransitions'
  }))
  .pipe(rename('batch-transitions.js'))
  .pipe(gulp.dest('./dist'))
});
