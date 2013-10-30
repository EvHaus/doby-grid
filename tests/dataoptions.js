// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: false, nomen: true, indent: 4, maxerr: 50*/
/*global _, $, describe, document, expect, DobyGrid, Image, it, runs, setFixtures, waitsFor, window*/

describe("Data Options", function () {
	"use strict";


	// ==========================================================================================


	// Utilities for resetting the grid
	var defaultData = function () {
		return JSON.parse(JSON.stringify({
			columns: [
				{id: 'id', field: 'id', name: 'id'},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: [
				{data: {id: 189, name: 'test'}, id: 189},
				{data: {id: 289, name: 'test2'}, id: 289}
			]
		}));
	};

	var resetGrid = function (options) {
		options = options || {};
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;width:500px');

		grid.appendTo(fixture);
		return grid;
	};


	// ==========================================================================================


	describe("options.class", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.class).toEqual(null);
			});
		});


		// ==========================================================================================


		it("should apply a custom CSS class to the given row", function () {
			var grid = resetGrid($.extend(defaultData(), {
				data: [
					{data: {id: 1, name: 'test'}, id: 1, class: "class-0"},
					{data: {id: 2, name: 'test2'}, id: 2, class: "class-1"}
				]
			}));

			// Check the row classes
			grid.$el.find('.doby-grid-row').each(function (i) {
				expect($(this).attr('class')).toContain('class-' + i);
			});
		});
	});


	// ==========================================================================================


	describe("options.columns", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.columns).toEqual(null);
			});
		});


		// ==========================================================================================


		it("should allow for formatter overrides", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [{
					data: {id: 1, name: 'test 0'},
					id: 1,
					columns: {
						0: {
							formatter: function() {
								return "Success 0";
							}
						}
					}
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2,
					columns: {
						0: {
							formatter: function() {
								return "Success 1";
							}
						}
					}
				}]
			});

			grid.$el.find('.doby-grid-row').each(function (row) {
				$(this).find('.doby-grid-cell').each(function (cell) {
					if (cell === 0) {
						expect($(this).text()).toEqual('Success ' + row);
					} else {
						expect($(this).text()).toEqual('test ' + row);
					}
				});
			});
		});


		// ==========================================================================================


		it("should support '*' colspan values for full rows", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'},
					{id: 'city', field: 'city', name: 'city'},
					{id: 'country', field: 'country', name: 'country'}
				],
				data: [{
					data: {id: 1, name: 'test 0', city: 'asd 0', country: '123 0'},
					id: 1,
					columns: {
						0: {
							colspan: "*"
						}
					}
				}, {
					data: {id: 2, name: 'test 1', city: 'asd 1', country: '123 1'},
					id: 2,
					columns: {
						0: {
							colspan: "*"
						}
					}
				}]
			});

			var cells;
			grid.$el.find('.doby-grid-row').each(function (row) {
				cells = $(this).find('.doby-grid-cell');

				// Colspan should work
				expect(cells.length).toEqual(1);

				// The correct value should be written

				cells.each(function (cell) {
					expect($(this).text()).toEqual((row + 1).toString());
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.data", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.data).toEqual(null);
			});
		});

		// TODO: Write me
	});


	// ==========================================================================================


	describe("options.exporter", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.exporter).toEqual(null);
			});
		});

		// TODO: Write me
	});


	// ==========================================================================================


	describe("options.focusable", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.focusable).toEqual(null);
			});
		});

		// TODO: Write me
	});


	// ==========================================================================================


	describe("options.height", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.height).toEqual(null);
			});
		});

		// TODO: Write me
	});


	// ==========================================================================================


	describe("options.resizable", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.resizable).toEqual(null);
			});
		});

		// TODO: Write me
	});


	// ==========================================================================================


	describe("options.rows", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.rows).toEqual(null);
			});
		});

		// TODO: Write me
	});


	// ==========================================================================================


	describe("options.selectable", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.item, function (item) {
				expect(item.selectable).toEqual(null);
			});
		});

		// TODO: Write me
	});
});