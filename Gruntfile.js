'use strict';
module.exports = function (grunt) {
	grunt.registerTask('amalia:bower', function() {
	    var cb = this.async();
	    var child = grunt.util.spawn({
	        cmd: 'bower',
	        args: ['install'],
	        opts: {
	            cwd: 'bower_components/amalia.js'
	        }
	    }, function(error, result, code) {
	        cb();
	    });
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	});	
	grunt.registerTask('amalia:npm', function() {
	    var cb = this.async();
	    var child = grunt.util.spawn({
	        cmd: 'npm',
	        args: ['install'],
	        opts: {
	            cwd: 'bower_components/amalia.js'
	        }
	    }, function(error, result, code) {
	        cb();
	    });
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	});
	grunt.registerTask('amalia:grunt', function() {
	    var cb = this.async();
	    var child = grunt.util.spawn({
	        grunt: true,
	        args: ['clean:build',
        			'jshint',
        			'qunit:build',
        			'uglify:build',
					'less:build',
					'copy:build'
					],
	        opts: {
	            cwd: 'bower_components/amalia.js'
	        }
	    }, function(error, result, code) {
	        cb();
	    });
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	});	
    //Default
    grunt.registerTask('default', [
        'amalia:bower',
		'amalia:npm',
        'amalia:grunt',
    ]);
};
