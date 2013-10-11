// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global _, $, describe, document, expect, DobyGrid, it, setFixtures*/

describe("Rendering", function () {
	"use strict";

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
	var grid = new DobyGrid(options);
	var fixture = setFixtures('<div id="text-container"></div>');
	grid.appendTo(fixture);


	// ==========================================================================================


	describe("Column Headers", function () {
		it("should render the expected number of column headers", function () {
			expect(grid.$el.find('.doby-grid-header-column').length).toEqual(options.columns.length);
		});
	});


	// ==========================================================================================


	describe("Grid Body", function () {
		it("should render the expected number of columns for every row", function () {
			expect(grid.$el.find('.doby-grid-row:first .doby-grid-cell').length).toEqual(options.columns.length);
		});


		// ==========================================================================================


		it("should render an empty notice when there is no data", function () {
			// Ensure empty notice is on
			grid.setOptions({emptyNotice: true});

			// Empty the grid
			grid.reset();

			// Check to see if alert was rendered
			expect(grid.$el).toContain('.doby-grid-alert');

			// Disable empty notice
			grid.setOptions({emptyNotice: false});
		});


		// ==========================================================================================


		it("should remove the relevant row from the DOM when calling remove()", function () {
			// Prepare the grid for testing
			grid.reset([{data: {id: 1}, id: 1}, {data: {id: 2}, id: 2}]);

			// Remove the second row
			grid.remove(2);

			// Check to see if the right row was removed
			var rows = grid.$el.find('.doby-grid-row'),
				cell = $(rows[0]).children('.doby-grid-cell:first').first();

			expect(rows.length).toEqual(1);

			// Make sure the first row is left behind
			expect(cell.text()).toEqual('1');
		});


		// ==========================================================================================


		it("should render a special row at the end of the grid when using 'addRow'", function () {
			// Prepare data for test
			grid.setOptions({
				addRow: true,
				data: [{data: {id: 1, name: "one"}, id: 1}, {data: {id: 2, name: "two", category: "asd"}, id: 2}],
				editable: true
			});

			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').each(function () {
				expect(this).toBeEmpty();
			});

			// Disable to prevent conflict with other tests
			grid.setOptions({addRow: false, editable: false});

			// Make sure row is removed
			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').each(function () {
				expect(this).not.toBeEmpty();
			});
		});


		// ==========================================================================================


		it("should enable variable row height mode when an item is add()ed with a custom height", function () {
			// Reset
			grid.reset([{data: {id: 1, name: 'test'}, id: 1}]);

			// Insert
			grid.add({data: {id: 2, name: 'test'}, id: 2, height: 1500});

			// Make sure row has the right height
			grid.$el.find('.doby-grid-row:last-child').each(function () {
				expect($(this).height()).toEqual(1500);
			});
		});


		// ==========================================================================================


		it("should correctly handle the row metadata processing for group rows when in variable height mode", function () {
			// Reset
			grid.setOptions({
				data: [
					{data: {id: 1, name: 'Asd3', category: 'a'}, id: 1, height: 50},
					{data: {id: 2, name: 'Asd2', category: 'b'}, id: 2, height: 100},
					{data: {id: 3, name: 'Asd1', category: 'b'}, id: 3, height: 150}
				]
			});

			// Group
			grid.setGrouping(['category']);

			// Make sure row has the right height
			grid.$el.find('.doby-grid-row:first-child').each(function () {
				expect($(this).height()).not.toEqual(50);
			});

			// Reset
			grid.setGrouping();
		});


		// ==========================================================================================


		it("should correctly render multiple rows when using nested rows", function () {
			// Reset
			grid.setOptions({
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
			console.log(rows, grid)
			expect(rows.length).toEqual(3);
			expect(rows.first().children('.doby-grid-cell').first().html()).toEqual("test1");
			expect(rows.last().children('.doby-grid-cell').last().html()).toEqual("c");
		});
	});
});