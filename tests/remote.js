// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, DobyGrid*/

describe("Remote Data", function () {
	"use strict";

	var resetGrid = function (opts) {
		opts = opts || {};

		var data = [];
		for (var i = 0; i < 1000; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: "Name " + i,
					age: _.sample([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]),
					city: _.sample(["Vancouver", "New York", "Chicago", "London", "Paris"])
				}
			});
		}

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
			}],
			data: function () {
				this.count = function (options, callback) {
					callback(100);
				};

				// The following options will be passed in:
				//
				// @param		filters		object		Filters that are applied by the user
				// @param		limit		integer		The number of items needed
				// @param		offset		integer		On which row to start fetching
				//
				this.fetch = function (options, callback) {
					callback(data.slice(options.offset, options.offset + options.limit));
				};

				this.fetchGroups = function (options, callback) {
					callback([]);
				};
			}
		};

		// Create a new grid inside a fixture
		options = $.extend(options, opts);
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:100px;width:100px');

		grid.appendTo(fixture);

		return grid;
	};


	// ==========================================================================================


	it("should set the correct data length", function () {
		var grid = resetGrid();
		expect(grid.collection.length).toEqual(100);
	});


	// ==========================================================================================


	it("should generate placeholders for all rows", function () {
		var grid = resetGrid();
		expect(grid.collection.items.length).toEqual(100);
	});


	// ==========================================================================================


	it("should automatically load the first page", function () {
		var grid = resetGrid();
		waitsFor(function () {
			return grid.collection.items[0].toString() !== 'Placeholder';
		}, "Fetching the first page", 200);

		runs(function () {
			expect(grid.collection.items[0].toString()).toEqual('[object Object]');
		});
	});


	// ==========================================================================================


	it("should correctly load the second page", function () {
		var grid = resetGrid();

		// Wait for first page to load
		waitsFor(function () {
			return grid.collection.items[0].toString() !== 'Placeholder';
		}, "Fetching the first page", 200);

		// Scroll to second page
		runs(function () {
			grid.scrollToRow(20);
		});

		// Wait for first page to load
		waitsFor(function () {
			return grid.collection.items[20].toString() !== 'Placeholder';
		}, "Fetching the second page", 200);

		runs(function () {
			expect(grid.collection.items[20].toString()).toEqual('[object Object]');
		});
	});
});