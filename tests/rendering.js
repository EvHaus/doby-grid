// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global _, $, describe, document, expect, DobyGrid, it, setFixtures*/

describe("Rendering", function () {
	"use strict";

	var resetGrid = function (opts) {
		opts = opts || {};

		// Default options for the grid
		var options = {
			autoDestroy: false,
			columns: [{
				id: "id",
				name: "ID",
				field: "id"
			}, {
				id: "name",
				name: "Name",
				field: "name"
			}, {
				id: "category",
				name: "Category",
				field: "category"
			}],
			data: [{
				id: 1,
				data: {
					id: 1,
					name: "Some Name",
					category: _.random(["a", "b", "c"])
				}
			}]
		};

		// Create a new grid inside a fixture
		options = $.extend(options, opts);
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0');

		grid.appendTo(fixture);

		// Make sure grid is big enough to render the columns we need
		grid.$el.width(500);

		return grid;
	};


	// ==========================================================================================


	describe("Column Headers", function () {
		it("should render the expected number of column headers", function () {
			var grid = resetGrid();
			expect(grid.$el.find('.doby-grid-header-column').length).toEqual(3);
		});


		// ==========================================================================================


		it("should correctly resize all columns to their minimal width when double-clicking header handles", function () {

			var colwidths = [80, 300];

			// Create grid with some specific width items
			var grid = resetGrid({
				columns: [{
					"class": 'nopad',
					id: 'id',
					field: 'id',
					formatter: function(row, cell, value) {
						return '<div style="width:' + colwidths[0] + 'px"></div>';
					},
					width: 50
				}, {
					"class": 'nopad',
					id: 'width',
					field: 'width',
					formatter: function(row, cell, value) {
						return '<div style="width:' + value + 'px"></div>';
					},
					width: 50
				}],
				data: [{
					id: 1,
					data: {
						id: 1,
						width: colwidths[1] - 20
					}
				}, {
					id: 2,
					data: {
						id: 2,
						width: colwidths[1] - 10
					}
				}, {
					id: 3,
					data: {
						id: 3,
						width: colwidths[1]
					}
				}]
			});

			// Click on each handle
			grid.$el.find('.doby-grid-header-column .doby-grid-resizable-handle').each(function (i) {
				$(this).simulate('dblclick');
			});

			// Get header padding - as that goes into the calculation
			var header = grid.$el.find('.doby-grid-header-column:first').first(),
				headerpadding = parseInt(header.css('paddingLeft'), 10) + parseInt(header.css('paddingRight'), 10);

			// Get cell padding - for the same reason
			var cell = grid.$el.find('.doby-grid-cell:first').first(),
				cellpadding = parseInt(cell.css('paddingLeft'), 10) + parseInt(cell.css('paddingRight'), 10);

			// Use the largest padding
			var padding = Math.max(headerpadding, cellpadding),
				weirdoffset = 10,		// FIXME: Tests seem to have this extra offset for some reason.
				marginoferror = 5;		// FIXME: Can't find a way to reliable test pixel-perfect resizing
										// here, so check to see that things at least get resized in the
										// a relative margin of error.

			// Verify the widths
			_.each(grid.options.columns, function(col, i) {
				expect(col.width).toBeGreaterThan(colwidths[i] + padding - weirdoffset - marginoferror);
				expect(col.width).toBeLessThan(colwidths[i] + padding - weirdoffset + marginoferror);
			});
		});
	});


	// ==========================================================================================


	describe("Grid Body", function () {

		describe("Columns", function () {
			it("should render the expected number of columns for every row", function () {
				var grid = resetGrid();
				expect(grid.$el.find('.doby-grid-row:first .doby-grid-cell').length).toEqual(3);
			});
		});


		// ==========================================================================================


		describe("Variable Row Heights", function () {
			it("should correctly handle the row metadata processing for group rows when in variable height mode", function () {
				// Reset
				var grid = resetGrid({
					data: [
						{data: {id: 1, name: 'Asd3', category: 'a'}, id: 1, height: 50},
						{data: {id: 2, name: 'Asd2', category: 'b'}, id: 2, height: 100},
						{data: {id: 3, name: 'Asd1', category: 'b'}, id: 3, height: 150}
					]
				});

				// Group
				grid.setGrouping([{
					column_id: 'category'
				}]);

				// Make sure row has the right height
				grid.$el.find('.doby-grid-row:first-child').each(function () {
					expect($(this).height()).not.toEqual(50);
				});

				// Reset
				grid.setGrouping();
			});
		});


		// ==========================================================================================


		describe("Nested Row", function () {
			it("should correctly render multiple rows when using nested rows", function () {
				// Reset
				var grid = resetGrid({
					columns: [{id: 'name', field: 'name'}, {id: 'category', field: 'category'}],
					data: [{
						data: {name: 'test1', category: 'a'},
						id: 1,
						rows: {
							0: {data: {name: 'test2', category: 'b'}, id: 2},
							1: {data: {name: 'test3', category: 'c'}, id: 3}
						}
					}]
				});

				// Make sure row has the right height
				var rows = grid.$el.find('.doby-grid-row');
				expect(rows.length).toEqual(3);
				expect(rows.first().children('.doby-grid-cell').first().html()).toEqual("test1");
				expect(rows.last().children('.doby-grid-cell').last().html()).toEqual("c");
			});
		});
	});
});