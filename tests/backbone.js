// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, Backbone, DobyGrid*/

describe("Backbone Integration", function () {
	"use strict";

	var resetGrid = function (opts) {
		opts = opts || {};

		var collection = new Backbone.Collection();

		for (var i = 0; i < 3; i++) {
			collection.add({
				id: i + 1,
				name: "Name " + i,
				age: _.sample([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]),
				city: _.sample(["Vancouver", "New York", "Chicago", "London", "Paris"])
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
			data: collection
		};

		// Create a new grid inside a fixture
		options = $.extend(options, opts);
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:100px;width:100px');

		grid.appendTo(fixture);

		return [grid, collection];
	};


	// ==========================================================================================


	it("should automatically insert a new row when an item is added to the collection", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		var rows = grid.$el.find('.doby-grid-row');

		// Add an item to the collection
		collection.add({
			id: collection.length + 1,
			name: "Bobby McFerrin",
			age: "old",
			city: "Somewhere"
		});

		rows = grid.$el.find('.doby-grid-row');

		// New row should be inserted at the bottom of the grid
		expect(rows.length).toEqual(collection.length);
		expect(rows.last().children('.doby-grid-cell.l1.r1')).toHaveText('Bobby McFerrin');
	});


	// ==========================================================================================


	it("should automatically re-draw row when the collection model is updated", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		var rows = grid.$el.find('.doby-grid-row');

		// Add an item to the collection
		collection.set({
			id: 1,
			name: "Houdini",
			age: "dead",
			city: "Europe?"
		});

		rows = grid.$el.find('.doby-grid-row');

		// First row should be updated with new data
		expect(rows.first().children('.doby-grid-cell.l1.r1')).toHaveText('Houdini');
	});


	// ==========================================================================================


	it("should automatically remove row when it's removed from the collection", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		var rows = grid.$el.find('.doby-grid-row');

		// Add an item to the collection
		collection.remove(1);

		var newrows = grid.$el.find('.doby-grid-row');

		// Should be 1 row less
		expect(rows.length).toEqual(newrows.length + 1);

		// Show have removed the correct row
		expect(newrows.first().children('.doby-grid-cell.l0.r0')).toHaveText('2');
	});

});