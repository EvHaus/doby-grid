// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global _, $, describe, document, expect, DobyGrid, it, setFixtures*/

describe("Grid Options", function () {
	"use strict";


	// ==========================================================================================


	// Utilities for resetting the grid
	var defaultData = function () {
		return JSON.parse(JSON.stringify({
			columns: [
				{id: 'id', field: 'id', name: 'id'},
				{id: 'id', field: 'name', name: 'name'}
			],
			data: [
				{data: {id: 189, name: 'test'}, id: 189},
				{data: {id: 289, name: 'test2'}, id: 289}
			]
		}));
	};

	var resetGrid = function (options) {
		options = options || {};
		options.autoDestroy = false;
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0');

		grid.appendTo(fixture);
		return grid;
	};


	// ==========================================================================================


	describe("options.activateSelection", function () {
		it("should be enabled by default", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			expect(grid.options.activateSelection).toEqual(true);
		});


		// ==========================================================================================


		it("should set an active cell with options.activateSelection enabled", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:first');

			// Get the drag delta from the first cell
			var dy = lastcell.position().top - lastcell.position().top + lastcell.height();

			// Simulate a click and drag on the cell ranges
			firstcell.simulate('drag', {dx: 0, dy: dy});

			// Expect the first and last cells to be selected
			expect(grid.selection.length).toBeGreaterThan(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);

			// Expect active cell to be selected
			expect(grid.active.row).toEqual(1);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should not set an active cell with options.activateSelection disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				activateSelection: false
			}));

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:first');

			// Get the drag delta from the first cell
			var dy = lastcell.position().top - lastcell.position().top + lastcell.height();

			// Simulate a click and drag on the cell ranges
			firstcell.simulate('drag', {dx: 0, dy: dy});

			// Expect the first and last cells to be selected
			expect(grid.selection.length).toBeGreaterThan(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);

			// Expect no active cell be selected
			expect(grid.active).toEqual(null);
		});
	});


	// ==========================================================================================


	describe("options.clipboard", function () {
		it("should be able to convert selected data to CSV and JSON", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Select some cells
			grid.selectCells(0, 0, 1, 1);

			// Convert selection to JSON
			var jaysun = grid.selection[0].toJSON();
			expect(jaysun).toEqual([['189', 'test'], ['289', 'test2']]);

			// Convert selection to CSV
			var csv = grid.selection[0].toCSV();
			expect(csv).toEqual('"189","test"\n"289","test2"');
		});


		// ==========================================================================================


		it("should save data to user's clipboard on Ctrl + C", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Select some cells
			grid.selectCells(0, 0, 1, 1);

			// Make sure we're focused on the canvas
			grid.$el.find('.doby-grid-canvas').focus();

			// Simulate Ctrl + C
			var press = $.Event('keydown');
			press.ctrlKey = true;
			press.which = 67;
			$(document.activeElement).trigger(press);

			// Since we don't have access the actual clipboard, the
			// best we can do here is check to make sure the clipboard element was created and focused
			var clippy = grid.$el.find('.doby-grid-clipboard');
			expect(clippy).toBeDefined();
			expect(clippy.length).toEqual(1);
			expect(clippy[0]).toEqual(document.activeElement);
		});
	});
});