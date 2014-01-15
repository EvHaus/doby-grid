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
			count = 100,
			empty = this.description == 'should display an empty row when remote data is empty';

		for (var i = 0; i < count; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: "Name " + i,
					age: _.sample(_.range(18, 28)),
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
					if (empty) {
						callback(0);
					} else {
						callback(count);
					}
				};

				this.fetch = function (options, callback) {
					return setTimeout(function () {
						if (empty) {
							callback([]);
						} else {
							var mydata = JSON.parse(JSON.stringify(data));
							if (options.order.length) {
								mydata.sort(function (dataRow1, dataRow2) {
									var result = 0, column, value1, value2;

									// Loops through the columns by which we are sorting
									for (var i = 0, l = options.order.length; i < l; i++) {
										column = options.order[i].columnId;
										value1 = dataRow1.data[column];
										value2 = dataRow2.data[column];

										if (value1 !== value2) {
											result += options.order[i].sortAsc ? (value1 > value2) ? 1 : -1 : (value1 < value2) ? 1 : -1;
										}
									}

									return result;
								});
							}
							// Apply fake offset and fake limit
							callback(mydata.slice(options.offset, options.offset + options.limit));
						}
					}, 5);
				};

				this.fetchGroups = function (options, callback) {
					return setTimeout(function () {
						var generateGrouping = function (dataset, column_id) {
							var groups = [],
								grouped = _.groupBy(dataset, function (item) {
									return item.data[column_id];
								});

							_.each(_.keys(grouped).sort(), function (group) {
								groups.push({
									column_id: column_id,
									count: grouped[group].length,
									groups: [],
									grouprows: grouped[group],
									value: group
								});
							});

							return groups;
						};

						var results = [], column_id, level;
						for (var i = 0, l = options.groups.length; i < l; i++) {
							column_id = options.groups[i].column_id;
							if (i === 0) {
								results = generateGrouping(data, column_id);
								level = results;
							} else {
								var newLevel = [];
								for (var j = 0, m = level.length; j < m; j++) {
									level[j].groups = generateGrouping(level[j].grouprows, column_id);
									newLevel.push(level);
								}
								level = newLevel;
							}
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
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:300px;width:300px');

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


	it("should display an empty row when remote data is empty", function () {
		var rows = grid.$el.find('.doby-grid-row');
		expect(rows.length).toEqual(1);
		expect(rows.eq(0)).toHaveClass('doby-grid-alert');
	});


	// ==========================================================================================


	describe("Grouping", function () {

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


		// ==========================================================================================


		it("should be able to switch between different groupings (ensuring that the remote grouping cache is properly cleaned up)", function () {
			var column_id = "city",
				another_column_id = "age";

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
					expect($(this).find('.doby-grid-group-title strong').first()).toHaveText('City:');
				});
			});

			// Now group by another column
			runs(function () {
				grid.setGrouping([{column_id: another_column_id}]);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length &&
					grid.collection.groups[0].column_id == another_column_id &&
					grid.collection.groups[0].grouprows.length;
			});

			runs(function () {
				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(1);
				expect(grid.collection.groups[0].column_id).toEqual(another_column_id);

				// Only group rows should be drawn
				grid.$el.find('.doby-grid-row').each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
					expect($(this).find('.doby-grid-group-title strong').first()).toHaveText('Age:');
				});
			});
		});


		// ==========================================================================================


		it("should be able to fetch group pages correctly when expanding grouped results", function () {
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
				var $rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				// Expand the second row
				$rows.eq(0).find('.doby-grid-cell').simulate('click');
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return _.filter(grid.collection.items, function (item) {
					return !item.__nonDataRow;
				}).length;
			});

			runs(function () {
				// Find the group row that got expanded
				var expandedgroup = _.findWhere(grid.collection.groups[0].grouprows, {collapsed: 0});

				// Expect the correct grid.collection item values to have been fetched
				_.each(grid.collection.items, function (item) {
					if (!item.__nonDataRow) {
						expect(item.data[column_id]).toEqual(expandedgroup.value);
					}
				});

				// And expect only those rows to have been rendered
				grid.$el.find('.doby-grid-row').each(function () {
					if (!$(this).hasClass('doby-grid-group')) {
						var $cell = $(this).find('.doby-grid-cell').last();
						if ($cell.text()) expect($cell).toHaveText(expandedgroup.value);
					}
				});
			});
		});



	});
});