// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, DobyGrid*/

describe("Remote Data", function () {
	"use strict";

	var grid;


	// ==========================================================================================


	beforeEach(function () {
		var data = [],
			count = 100;

		for (var i = 0; i < count; i++) {
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
			}, {
				id: "age",
				name: "Age",
				field: "age"
			}, {
				id: "city",
				name: "City",
				field: "city"
			}],
			data: function () {
				this.count = function (options, callback) {
					callback(count);
				};

				this.fetch = function (options, callback) {
					return setTimeout(function () {
						var mydata = JSON.parse(JSON.stringify(data));
						if (options.order.length) {
							mydata.sort(function (dataRow1, dataRow2) {
								var result = 0, column, value1, value2;
								for (var i = 0, l = options.order.length; i < l; i++) {
									column = options.order[i].columnId;
									value1 = dataRow1.data[column];
									value2 = dataRow2.data[column];
									if (value1 === value2) result += 0;
									else result += options.order[i].sortAsc ? (value1 > value2) : (value1 < value2);
								}
								return result;
							});
						}
						// Apply fake offset and fake limit
						callback(mydata.slice(options.offset, options.offset + options.limit));
					}, 5);
				};

				this.fetchGroups = function (options, callback) {
					return setTimeout(function () {
						var c_idx = 0,
							column_id = options.groups[c_idx].column_id,
							grouped = _.groupBy(data, function (item) {
								return item.data[column_id];
							}),
							results = [];
						for (var group in grouped) {
							results.push({
								column_id: column_id,
								count: grouped[group].length,
								groups: null,
								value: group
							});
						}
						callback(results);
					}, 5);
				};
			}
		};

		// Create a new grid inside a fixture
		grid = new DobyGrid(options);
		var fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:100px;width:100px');

		grid.appendTo(fixture);

		waitsFor(function () {
			return grid.collection.items[0].toString() !== 'Placeholder';
		}, "Fetching the first page", 2000);
	});


	// ==========================================================================================


	it("should set the correct data length", function () {
		expect(grid.collection.length).toEqual(100);
	});


	// ==========================================================================================


	it("should generate placeholders for all rows", function () {
		expect(grid.collection.items.length).toEqual(100);
	});


	// ==========================================================================================


	it("should automatically load the first page", function () {
		runs(function () {
			expect(grid.collection.items[0].toString()).toEqual('[object Object]');
		});
	});


	// ==========================================================================================


	it("should correctly load the second page", function () {
		// Scroll to second page
		runs(function () {
			grid.scrollToRow(20);
		});

		// Wait for first page to load
		waitsFor(function () {
			return grid.collection.items[20].toString() !== 'Placeholder';
		}, "Fetching the second page", 2000);

		runs(function () {
			expect(grid.collection.items[20].toString()).toEqual('[object Object]');
		});
	});


	// ==========================================================================================


	it("should be able to group results", function () {
		var column_id = "city";

		// Add grouping
		runs(function () {
			grid.addGrouping(column_id);
		});

		// Wait for the groups to be fetched and calculated
		waitsFor(function () {
			return grid.collection.groups.length && grid.collection.groups[0].grouprows.length;
		});

		runs(function () {
			// Groups should be generated
			expect(grid.collection.groups.length).toEqual(1);
			expect(grid.collection.groups[0].column_id).toEqual(column_id);

			// Only group rows should be drawn
			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this)).toHaveClass('doby-grid-group');
			});
		});
	});
});