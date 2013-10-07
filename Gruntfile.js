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
				vendor: [
					'libs/jquery.js',
					'libs/jquery-ui.js',
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
			options: {
				yuicompress: true
			},
			production: {
				files: {
					'build/<%= pkg.version %>/<%= pkg.name %>.min.css': 'src/<%= pkg.name %>.less',
					'build/<%= pkg.version %>/themes/<%= pkg.name %>-light.css': 'src/themes/<%= pkg.name %>-light.less',
					'build/<%= pkg.version %>/themes/<%= pkg.name %>-dark.css': 'src/themes/<%= pkg.name %>-dark.less'
				}
			}
		},

		uglify: {
			options: {
				banner: '// <%= pkg.name %>.js <%= pkg.version %>\n\
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.\n\
// Doby may be freely distributed under the MIT license.\n\
// For all details and documentation:\n\
// https://github.com/globexdesigns/doby-grid\n',
				mangle: {
					except: ['jQuery', 'Backbone', '_']
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

	// Run tasks.
	// TODO: jasmine is temporarily disabled because it doesn't behave
	// as expected when testing the rendering of elements
	grunt.registerTask('default', ['jshint', 'uglify', 'less', 'copy']);
};
