// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global $, DobyGrid*/

describe("Initialization and validation", function () {
	"use strict";

	it("should be accessible via browser script import", function () {
		expect(DobyGrid).toBeDefined();
		expect(typeof(DobyGrid)).toEqual('function');
	});


	// ==========================================================================================


	it("should be able to initialize a grid with default options", function () {
		expect(function () { new DobyGrid(function () {}); }).toThrow();
	});


	// ==========================================================================================


	it("should throw a TypeError if the given options param is not an object", function () {
		var tp = new TypeError('The "options" param must be an object.');
		expect(function () { new DobyGrid(1); }).toThrow(tp);
		expect(function () { new DobyGrid('testing'); }).toThrow(tp);
		expect(function () { new DobyGrid([]); }).toThrow(tp);
		expect(function () { new DobyGrid(function () {}); }).toThrow(tp);
	});
});


// ==========================================================================================


describe("Rendering", function () {
	"use strict";

	it("should correctly render each row and cell when a horizontal scrollbar is invoked", function () {
		// Render Grid
		var grid = new DobyGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id', width: 600},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: 'test2'}, id: 289}
				]
			}),
			fixture = setFixtures();

		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:300px;width:300px');
		grid.appendTo(fixture);

		var $canvas = grid.$el.find('.doby-grid-canvas'),
			$rows = grid.$el.find('.doby-grid-row');

		// Check to make sure a horizontal scrollbar is present
		expect(grid.$el.width()).toBeLessThan($canvas.width());

		// Check to make sure canvas, rows and cells all come out to the same width value
		// for pixel perfect accuracy.
		$rows.each(function () {
			// Check row width
			expect($(this).outerWidth()).toEqual($canvas.width());

			// Get last cell and make sure it's flush against the right edge
			var lastcell = $(this).children('.doby-grid-cell').last();

			// Check cell width
			expect(lastcell.position().left + lastcell.outerWidth()).toEqual($canvas.width());
		});
	});
});