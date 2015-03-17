// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    minify = require('gulp-minify'),
    pkg = require('./package.json');
    
// Minify JS
gulp.task('scripts', function() {
    return gulp.src('JsValidation/js/*.js')
        .pipe(rename(pkg.name + '-' + pkg.version + '.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename(pkg.name + '-' + pkg.version + '.js'))
        .pipe(minify())
        .pipe(gulp.dest('dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('js/**/*.js', ['scripts']);
});

// Default Task
gulp.task('default', ['scripts', 'watch']);
