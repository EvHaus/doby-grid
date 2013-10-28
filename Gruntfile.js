/*global module, require*/
module.exports = function (grunt) {
	'use strict';

	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		copy: {
			main: {
				src: "src/<%= pkg.name %>.js",
				dest: "build/<%= pkg.version %>/<%= pkg.name %>.js"
			}
		},

		jasmine: {
			src: 'src/<%= pkg.name %>.js',
			options: {
				specs: 'tests/*.js',
				styles: 'build/<%= pkg.version %>/<%= pkg.name %>.min.css',
				vendor: [
					'libs/jquery.js',
					'libs/jquery-ui.js',
					'libs/jquery.simulate.js',
					'libs/jquery.event.drag.js',
					'libs/underscore.js',
                    'libs/backbone.js',
					'libs/less.js',
					'libs/jasmine/jasmine-jquery.js'
                ]
			}
		},

		jshint: {
			ignore_warning: {
				options: {
					'-W083': true,
					'-W030': true
				},
				src: ['src/<%= pkg.name %>.js']
			}
		},

		less: {
			compressed: {
				options: {
					yuicompress: true
				},
				files: {
					'build/<%= pkg.version %>/<%= pkg.name %>.min.css': 'src/<%= pkg.name %>.less'
				}
			},
			standard: {
				files: {
					'build/<%= pkg.version %>/themes/<%= pkg.name %>-light.css': 'src/themes/<%= pkg.name %>-light.less',
					'build/<%= pkg.version %>/themes/<%= pkg.name %>-dark.css': 'src/themes/<%= pkg.name %>-dark.less'
				}
			}
		},

		uglify: {
			options: {
				banner: [
					'// <%= pkg.name %>.js <%= pkg.version %>',
					'// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.',
					'// Doby may be freely distributed under the MIT license.',
					'// For all details and documentation:',
					'// https://github.com/globexdesigns/doby-grid\n'
				].join('\n'),
				mangle: {
					except: ['jQuery', 'Backbone']
				}
			},

			build: {
				src: 'src/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.version %>/<%= pkg.name %>.min.js'
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Run tasks
	grunt.registerTask('default', ['jshint', 'less', 'jasmine', 'uglify', 'copy']);
};
