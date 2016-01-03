// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, Backbone, DobyGrid*/

describe("Backbone Integration", function () {
	"use strict";

	// Disable underscore's debounce until https://github.com/pivotal/jasmine/pull/455 is fixed
	_.debounce = function (func) { return function () { func.apply(this, arguments);}; };

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


	it("should automatically insert a new row when an item is added to the Backbone.Collection", function () {
		var results, grid, collection, timeout = false;

		results = resetGrid();
		grid = results[0];
		collection = results[1];

		// Add an item to the collection
		collection.add({
			id: collection.length + 1,
			name: "Bobby McFerrin",
			age: "old",
			city: "Somewhere"
		});

		var rows = grid.$el.find('.doby-grid-row');

		// New row should be inserted at the bottom of the grid
		expect(rows.length).toEqual(collection.length);
		expect(rows.last().children('.doby-grid-cell.l1.r1')).toHaveText('Bobby McFerrin');
	});


	// ==========================================================================================


	it("should update the grid with the Backbone.Collection is sorted", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		// Set a new comparator function on the collection
		collection.comparator = function (item) {
			return -item.id;
		};

		// Sort collection using the new comparator
		collection.sort();

		// Make sure rows are sorted by their position
		var rows = $(_.sortBy(grid.$el.find('.doby-grid-row'), function (item) {
			return parseInt($(item).css('top'), 10);
		}));

		expect($(rows[0]).children('.l0').text().indexOf(collection.length)).toBeGreaterThan(-1);
	});


	// ==========================================================================================


	it("should respect the given Backbone.Collection's comparator and insert the row into the right spot", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		// Set a new comparator function on the collection
		collection.comparator = function (item) {
			return -item.id;
		};

		// Sort collection using the new comparator
		collection.sort();

		// Add an item to the collection
		collection.add({
			id: collection.length + 1,
			name: "Robert Miles",
			age: "not that old",
			city: "American City"
		});

		var newrows = grid.$el.find('.doby-grid-row');

		// Make sure rows are sorted by their position
		newrows = $(_.sortBy(newrows, function (item) {
			return parseInt($(item).css('top'), 10);
		}));

		// New row should be inserted at the top of the grid
		expect(grid.$el.find('.doby-grid-row').length).toEqual(collection.length);

		newrows = grid.$el.find('.doby-grid-row');

		// Make sure rows are sorted by their position
		newrows = $(_.sortBy(newrows, function (item) {
			return parseInt($(item).css('top'), 10);
		}));

		expect(newrows.first().children('.doby-grid-cell.l1.r1')).toHaveText('Robert Miles');
	});


	// ==========================================================================================


	it("should automatically re-draw row when the Backbone.Collection model is updated", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		// Update the first item
		collection.get(1).set({
			name: "Houdini",
			age: "dead",
			city: "Europe?"
		});

		var rows = grid.$el.find('.doby-grid-row');

		// Make sure rows are sorted by their position
		rows = $(_.sortBy(rows, function (item) {
			return parseInt($(item).css('top'), 10);
		}));

		// First row should be updated with new data
		expect(rows.first().children('.doby-grid-cell.l1.r1').text().indexOf('Houdini')).toBeGreaterThan(-1);
	});


	// ==========================================================================================


	it("should automatically remove row when it's removed from the Backbone.Collection", function () {
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


	// ==========================================================================================


	it("should correctly generate an empty row when the Backbone.Collection is empty", function () {
		var results = resetGrid({data: new Backbone.Collection()}),
			grid = results[0];

		// Should have "empty message" row, with one cell
		var $rows = grid.$el.find('.doby-grid-row');
		expect($rows.length).toEqual(0);
		expect(grid.$el).toContainElement('.doby-grid-empty');
	});


	// ==========================================================================================


	it("should correctly generate an empty row when the Backbone.Collection is reset", function () {
		var results = resetGrid(),
			grid = results[0],
			collection = results[1];

		// Reset collection
		collection.reset();

		// Should have "empty message" row, with one cell
		var $rows = grid.$el.find('.doby-grid-row');
		expect($rows.length).toEqual(0);
		expect(grid.$el).toContainElement('.doby-grid-empty');
	});


	// ==========================================================================================


	it("should remove empty row once an item has been added to an empty Backbone.Collection", function () {
		var collection = new Backbone.Collection(),
			results = resetGrid({data: collection}),
			grid = results[0];

		// Reset collection
		collection.add({
			id: '20',
			name: "Bobby McFerrin",
			age: "old",
			city: "Somewhere"
		});

		// Should have 1 row
		var $rows = grid.$el.find(".doby-grid-row:not('.doby-grid-alert')");
		expect($rows.length).toEqual(1);

		expect(grid.$el.find('.doby-grid-row:first .doby-grid-cell:first').first()).toHaveText(20);
	});


	// ==========================================================================================


	it("should not fail attempting to use existing comparator of Backbone.Collection", function () {
		var collection = new Backbone.Collection();

		collection.comparator = function () {
			return true;
		};

		var results = resetGrid({data: collection}),
			grid = results[0];

		// Reset collection
		collection.add({
			id: '20',
			name: "Bobby McFerrin",
			age: "old",
			city: "Somewhere"
		});

		// Should have 1 row
		var $rows = grid.$el.find(".doby-grid-row:not('.doby-grid-alert')");
		expect($rows.length).toEqual(1);

		expect(grid.$el.find('.doby-grid-row:first .doby-grid-cell:first').first()).toHaveText(20);
	});


	// ==========================================================================================


	it("should be able to update item that isn't visible on screen due to collapsed grouping", function () {
		var data = _.map(_.range(0, 100), function (i) {
			return {
				id: i,
				name: "Bobby McFerrin",
				age: "old",
				city: _.sample(["Somewhere", "Nowhere"])
			};
		}), collection = new Backbone.Collection(data),
			results = resetGrid({
				columns: [{
					id: 'city',
					name: 'City',
					field: 'city'
				}],
				data: collection
			}),
			grid = results[0];

		// Wait until rows are rendered
		var $rows = grid.$el.find(".doby-grid-row:not('.doby-grid-alert')");
		expect($rows.length).toBeGreaterThan(1);

		// Add some grouping
		grid.addGrouping('city', {collapsed: true});

		// Wait until groups are collapsed
		$rows = grid.$el.find(".doby-grid-row");
		expect($rows.length).toEqual(2);
		expect($rows).toHaveClass('doby-grid-group');

		// Now try to update an item
		var model = collection.at(45);
		model.set({age: 'veryold'});
	});


	// ==========================================================================================


	it("should be able to render Backbone data when using a custom 'idProperty'", function () {
		var data = [{
			id: 1,
			name: "Bobby McFerrin",
			age: "old",
			city: _.sample(["Somewhere", "Nowhere"])
		}], collection = new Backbone.Collection(),
			results = resetGrid({
				columns: [{
					id: 'city',
					name: 'City',
					field: 'city'
				}],
				idProperty: 'cid',
				data: collection
			}),
			grid = results[0];

		// Add data to collection after the grid has been rendered
		collection.add(data);

		// Wait until rows are rendered
		var $rows = grid.$el.find(".doby-grid-row:not('.doby-grid-alert')");
		expect($rows.length).toEqual(1);

		// Make sure data is rendered
		expect(grid.collection.items.length).toEqual(1);
	});


	// ==========================================================================================


	it("should be able to re-render Backbone data calling reset() on the collection", function () {
		var data = [{
			id: 1,
			name: "Bobby McFerrin",
			age: "old",
			city: _.sample(["Somewhere", "Nowhere"])
		}], collection = new Backbone.Collection(),
			results = resetGrid({
				columns: [{
					id: 'city',
					name: 'City',
					field: 'city'
				}],
				data: collection
			}),
			grid = results[0];

		// Add data to collection after the grid has been rendered
		collection.reset(data);

		// Wait until rows are rendered
		var $rows = grid.$el.find(".doby-grid-row:not('.doby-grid-alert')");
		expect($rows.length).toEqual(1);

		// Make sure data is rendered
		expect(grid.collection.items.length).toEqual(1);
	});

});
