// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/

describe("Initialization and validation", function () {

	it("should be accessible via browser script import", function () {
		expect(DobyGrid).toBeDefined();
		expect(typeof(DobyGrid)).toEqual('function')
	})


	// ==========================================================================================


	it("should be AMD compatible", function () {
		var loaded = false;
		runs(function () {
			$('<script src="../libs/require.js"></script>').appendTo(document.head);
			require.config({
				baseUrl: "../libs/",
				shim: {
					'backbone': {
						deps: ['underscore'],
						exports: 'Backbone'
					},
					'underscore': {
						exports: '_'
					},
					'jquery-ui': {
						deps: ['jquery']
					},
					'jquery.event.drag': {
						deps: ['jquery']
					}
				}
			});
			require([
				'../src/doby-grid'
			], function (dbgrd) {
				loaded = dbgrd;
			})
		})

		waitsFor(function () {
			return loaded;
		}, "Module was never imported via require.js", 150);

		runs(function () {
			expect(loaded).toBeDefined();
			expect(typeof(loaded)).toEqual('function')
		})
	})


	// ==========================================================================================


	it("should be able to initialize a grid with default options", function () {
		expect(function () {new DobyGrid(function () {})}).toThrow();
	})


	// ==========================================================================================


	it("should throw a TypeError the given options param is not an object", function () {
		var tp = new TypeError('The "options" param must be an object.');
		expect(function () {new DobyGrid(1)}).toThrow(tp);
		expect(function () {new DobyGrid('testing')}).toThrow(tp);
		expect(function () {new DobyGrid([])}).toThrow(tp);
		expect(function () {new DobyGrid(function () {})}).toThrow(tp);
	})


	// ==========================================================================================


	it("should throw a TypeError if the given columns object is not an array", function () {
		var tp = new TypeError('The "columns" option must be an array.');
		expect(function () {
			new DobyGrid({
				columns: {}
			})
		}).toThrow(tp);
	})


	// ==========================================================================================


	it("should throw a TypeError if the given data object is not an array", function () {
		var tp = new TypeError('The "data" option must be an array.');
		expect(function () {
			new DobyGrid({
				data: {}
			})
		}).toThrow(tp);
	})

})