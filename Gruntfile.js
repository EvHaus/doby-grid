/*global module*/
module.exports = function (grunt) {
	'use strict';

	var banner = [
		'// <%= pkg.name %>.js <%= pkg.version %>',
		'// (c) 2014 Evgueni Naverniouk, Globex Designs, Inc.',
		'// Doby may be freely distributed under the MIT license.',
		'// For all details and documentation:',
		'// https://github.com/globexdesigns/doby-grid\n'
	].join('\n');

	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		browserify: {
			options: {
				banner: banner,
				browserifyOptions: {
					standalone: 'DobyGrid'
				}
			},
			files: {
				src: 'src/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.version %>/<%= pkg.name %>.js'
			}
		},

		clean: ['build/latest'],

		copy: {
			latest: {
				expand: true,
				cwd: "build/<%= pkg.version %>/",
				src: "**",
				dest: "build/latest/"
			}
		},

		csslint: {
			options: grunt.file.readJSON('.csslintrc')
		},

		jasmine: {
			src: 'build/<%= pkg.version %>/<%= pkg.name %>.js',
			options: {
				specs: 'tests/*.js',
				styles: 'build/<%= pkg.version %>/<%= pkg.name %>.min.css',
				vendor: [
					'libs/jquery/dist/jquery.js',
					'libs/jquery-ui/jquery-ui.js',
					'libs/jquery.event.drag-drop/event.drag/jquery.event.drag.js',
					'libs/jquery.simulate/libs/jquery.simulate.js',
					'libs/FileSaver/FileSaver.js',
					'libs/underscore/underscore.js',
                    'libs/backbone/backbone.js',
					'libs/less/dist/less-1.7.4.js',
					'libs/jasmine-jquery/lib/jasmine-jquery.js'
                ]
			}
		},

		jscs: {
			src: "src/**/*.js",
			options: {
				config: ".jscsrc"
			}
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc',
			},
			src: ['src/**/*.js']
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

		lesslint: {
			src: [
				'src/doby-grid.less',
				'src/themes/*.less'
			]
		},

		uglify: {
			options: {
				banner: banner,
				mangle: {
					except: ['jQuery', 'Backbone', 'FileSaver']
				}
			},

			build: {
				src: 'build/<%= pkg.version %>/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.version %>/<%= pkg.name %>.min.js'
			}
		},

		watch: {
			scripts: {
				files: 'src/**/*.js',
				tasks: ['browserify', 'clean', 'copy']
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-lesslint');

	// Grunt "default" task (validation and unit tests only)
	grunt.registerTask('default', [
		'lesslint',
		'less',
		'jshint',
		'jscs',
		'browserify',
		'jasmine'
	]);

	// Grunt "build" task
	grunt.registerTask('build', [
		'lesslint',
		'less',
		'jshint',
		'jscs',
		'browserify',
		'uglify',
		'clean',
		'copy',
		'jasmine'
	]);
};
