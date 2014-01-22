// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, DobyGrid*/

describe("Remote Data", function () {
	"use strict";

	var grid;

	// Replicates a server's database filter
	var remote_filter = function (options, item) {
		var result = true;
		if (!options.filters) return result;
		var f, value;
		for (var i = 0, l = options.filters.length; i < l; i++) {
			f = options.filters[i];
			value = item.data[f[0]];
			switch (f[1]) {
			case '=':
				result = value == f[2];
				break;
			case '!=':
				result = value !== f[2];
				break;
			case '>':
				result = value > f[2];
				break;
			case '<':
				result = value < f[2];
				break;
			case '>=':
				result = value >= f[2];
				break;
			case '<=':
				result = value <= f[2];
				break;
			case '~':
				result = value.toString().search(f[2].toString()) !== -1;
				break;
			case '!~':
				result = value.toString().search(f[2].toString()) === -1;
				break;
			case '~*':
				result = value.toString().toLowerCase().search(f[2].toString().toLowerCase()) !== -1;
				break;
			case '!~*':
				result = value.toString().toLowerCase().search(f[2].toString().toLowerCase()) === -1;
				break;
			}
			if (!result) break;
		}

		return result;
	};


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
						callback(_.filter(data, function (item) {
							return remote_filter(options, item);
						}).length);
					}
				};

				this.fetch = function (options, callback) {
					return setTimeout(function () {
						if (empty) {
							callback([]);
						} else {
							var mydata = JSON.parse(JSON.stringify(data));
							mydata = _.filter(mydata, function (item) {
								return remote_filter(options, item);
							});
							if (options.order.length) {
								mydata.sort(function (dataRow1, dataRow2) {
									var result = 0, column, value1, value2, val;

									// Loops through the columns by which we are sorting
									for (var i = 0, l = options.order.length; i < l; i++) {
										column = options.order[i].columnId;
										value1 = dataRow1.data[column];
										value2 = dataRow2.data[column];

										if (value1 !== value2) {
											val = options.order[i].sortAsc ? (value1 > value2) ? 1 : -1 : (value1 < value2) ? 1 : -1;
											if (val !== 0) return val;
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
						var results = [], column_id;
						var generateGroup = function (column_id, data, level, parent_group_value) {
							var groups = [], grouped;
							grouped = _.groupBy(data, function (item) {
								return item.data[column_id];
							});

							_.each(_.keys(grouped).sort(), function (group) {
								groups.push({
									_rows: grouped[group],
									count: grouped[group].length,
									parent: parent_group_value,
									value: group
								});
							});
							groups.sort(function (a, b) {
								var result = 0, val;
								for (var i = 0, l = options.order.length; i < l; i++) {
									if (!isNaN(parseInt(a.value, 10))) a.value = parseInt(a.value, 10);
									if (!isNaN(parseInt(b.value, 10))) b.value = parseInt(b.value, 10);

									if (a.value !== b.value) {
										val = options.order[i].sortAsc ? (a.value > b.value) ? 1 : -1 : (a.value < b.value) ? 1 : -1;
										if (val !== 0) return val;
									}
								}

								return result;
							});
							if (level && results[level]) {
								results[level].groups = results[level].groups.concat(groups);
							} else {
								results[level] = {
									column_id: column_id,
									groups: groups
								};
							}
						};
						var main_filter = function (item) {
							return remote_filter(options, item);
						};
						for (var i = 0, l = options.groups.length; i < l; i++) {
							column_id = options.groups[i].column_id;
							if (i === 0) {
								generateGroup(column_id, _.filter(data, main_filter), i);
							} else {
								for (var j = 0, m = results[i - 1].groups.length; j < m; j++) {
									generateGroup(column_id, results[i - 1].groups[j]._rows, i, results[i - 1].groups[j].value);
								}
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
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
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
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
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
					grid.collection.groups[0].rows.length;
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
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
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
				var expandedgroup = _.findWhere(grid.collection.groups[0].rows, {collapsed: 0});

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


		// ==========================================================================================


		it("should be able to sort grouped results", function () {
			var column_id = "city",
				sorting_column_id = "id",
				sorted = false,
				opened = false;

			// Add grouping
			runs(function () {
				grid.addGrouping(column_id);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
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

				grid.once('remotegroupsloaded', function () {
					sorted = true;
				});

				// Apply sorting by a column
				grid.sortBy(sorting_column_id);
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return sorted;
			});

			runs(function () {
				grid.once('remoteloaded', function () {
					opened = true;
				});

				// Expand the first group
				grid.$el.find('.doby-grid-group:first .doby-grid-cell:first').simulate('click', {});
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return opened;
			});

			runs(function () {
				// Get viewport height
				var viewportH = grid.$el.find('.doby-grid-viewport').height(),
					rowH = grid.$el.find('.doby-grid-row:first').outerHeight(),
					num_rows_visible = Math.floor(viewportH / rowH);

				// Make sure all visible rows have the correct data
				var rows = _.sortBy(grid.$el.find('.doby-grid-row:not(.doby-grid-group)'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				var $row;
				for (var i = 0; i < num_rows_visible; i++) {
					$row = $(rows[i]);

					if ($row.hasClass('doby-grid-group')) {
						expect($row).toHaveClass('expanded');
					} else {
						// Make sure we have at least some text rendered (ie. not a placeholder)
						expect($row.find('.doby-grid-cell.l0:first').first().text()).not.toEqual('');

						if (i > 1) {
							// Now make sure it's in the right sorting order
							var this_id = parseInt($row.find('.doby-grid-cell.l0:first').first().text(), 10),
								prev_id = parseInt($(rows[i - 1]).find('.doby-grid-cell:first').first().text(), 10);

							expect(this_id).toBeGreaterThan(prev_id);
						}
					}
				}
			});
		});


		// ==========================================================================================


		it("should be reverse grouped order when changing sort direction of column", function () {
			var column_id = "city",
				sorted = false;

			// Add grouping
			runs(function () {
				grid.addGrouping(column_id);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
			});

			runs(function () {
				// Apply sorting by a column
				grid.sortBy(column_id);

				grid.once('remotegroupsloaded', function () {
					sorted = true;
				});

				// Click on header to reverse sorting
				var $header = grid.$el.find('.doby-grid-header-column[id*="' + column_id + '"]:first').first();

				$header.simulate('click');
			});

			waitsFor(function () {
				return sorted;
			});

			runs(function () {
				var $groups = grid.$el.find('.doby-grid-group');
				$groups.each(function (i) {
					if (i > 0) {
						expect($(this).find('.doby-grid-group-title').text()).toBeLessThan($($groups[i - 1]).find('.doby-grid-group-title').text());
					}
				});
			});
		});


		// ==========================================================================================


		it("should be able to fetch grouped result rows when sorting in reverse order", function () {
			var column_id = "age",
				sorted = false,
				opened = false;

			// Add grouping
			runs(function () {
				grid.addGrouping(column_id);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
			});

			runs(function () {
				// Apply sorting by a column
				grid.sortBy(column_id);

				grid.once('remotegroupsloaded', function () {
					sorted = true;
				});

				// Click on header to reverse sorting
				var $header = grid.$el.find('.doby-grid-header-column[id*="' + column_id + '"]:first').first();

				$header.simulate('click');
			});

			waitsFor(function () {
				return sorted;
			});

			runs(function () {
				grid.once('remoteloaded', function () {
					opened = true;
				});

				// Expand the first group
				grid.$el.find('.doby-grid-group:first .doby-grid-cell:first').simulate('click', {});
			});

			waitsFor(function () {
				return opened;
			});

			runs(function () {
				var rows = _.sortBy(grid.$el.find('.doby-grid-row:not(.doby-grid-group)'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				// Make sure at least first 3 rows have visible data loaded
				_.each(rows, function (row, i) {
					if (i < 3) {
						expect($(row).find('.doby-grid-cell.l2')).toHaveText(27);
					}
				});
			});
		});


		// ==========================================================================================


		it("should be able to sort grouped results after a group has been expanded", function () {
			var column_id = "city",
				sorting_column_id = "age",
				sorted = false,
				opened = false;

			// Add grouping
			runs(function () {
				grid.addGrouping(column_id);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
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
			});

			runs(function () {
				grid.once('remoteloaded', function () {
					opened = true;
				});

				// Expand the second group
				grid.$el.find('.doby-grid-group:nth-child(2) .doby-grid-cell:first').simulate('click', {});
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return opened;
			});

			runs(function () {
				grid.once('remoteloaded', function () {
					sorted = true;
				});

				// Apply sorting by a column
				grid.sortBy(sorting_column_id);
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return sorted;
			});

			runs(function () {
				// Check to make sure all expanded rows have the correct data
				var rows = _.sortBy(grid.$el.find('.doby-grid-row:not(.doby-grid-group)'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				// Number of rows which we're expecting to be visible at this point
				var viewportH = grid.$el.find('.doby-grid-viewport').height(),
					rowH = grid.$el.find('.doby-grid-row:first').outerHeight(),
					num_rows_visible = Math.floor(viewportH / rowH);

				// Remove the extra collapsed group row above
				num_rows_visible--;

				_.each(rows, function (row, i) {
					if (i > num_rows_visible) return;

					expect($(row).children('.l2').text()).not.toEqual('');

					if (i > 0) {
						var left = $(row).children('.l2').text(),
							right = $(rows[i - 1]).children('.l2').text();

						expect(left).not.toBeLessThan(right);
					}
				});
			});
		});


		// ==========================================================================================


		it("should fetch the correct row data when grouped results are scrolled before being expanded", function () {
			var column_id = "id",
				scrolled = true,
				opened = false;

			// Add grouping
			runs(function () {
				grid.addGrouping(column_id);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length && grid.collection.groups[0].rows.length;
			});

			runs(function () {
				grid.once('remoteloaded', function () {
					scrolled = true;
				});

				// Scroll to the bottom
				grid.scrollToRow(grid.collection.length);
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return scrolled;
			});

			runs(function () {
				grid.once('remoteloaded', function () {
					opened = true;
				});

				// Expand a group in the middle of the last page
				grid.$el.find('.doby-grid-group:nth-child(10) .doby-grid-cell:first').simulate('click', {});
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return opened;
			});

			runs(function () {
				// Find the non-group row
				var $row = grid.$el.find('.doby-grid-row:not(.doby-grid-group)');

				// Should not be a placeholder
				expect($row.find('.l0')).not.toBeEmpty();
			});
		});


		// ==========================================================================================


		it("should be able to correctly fetch and render nested groupings", function () {
			var group1_column_id = "age",
				group2_column_id = "city",
				opened1 = false,
				opened2 = false;

			// Add grouping
			runs(function () {
				grid.setGrouping([{column_id: group1_column_id}, {column_id: group2_column_id}]);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length == 2 && grid.collection.groups[0].rows.length;
			});

			runs(function () {
				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(2);
				expect(grid.collection.groups[0].column_id).toEqual(group1_column_id);

				// Only group rows should be drawn
				var $rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				grid.once('remoteloaded', function () {
					opened1 = true;
				});

				var rows = _.sortBy(grid.$el.find('.doby-grid-group'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				// Expand the first group
				$(rows[0]).find('.doby-grid-cell:first').simulate('click', {});
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return opened1;
			});

			runs(function () {
				// All rows should still be groups
				var $rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				grid.once('remoteloaded', function () {
					opened2 = true;
				});

				var rows = _.sortBy(grid.$el.find('.doby-grid-group'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				// Expand the first group's first group
				$(rows[1]).find('.doby-grid-cell:first').simulate('click', {});
			});

			// Wait for some non-placeholder row data to be fetched
			waitsFor(function () {
				return opened2;
			});

			runs(function () {
				// At this point we should have one regular row visible
				var $rows = grid.$el.find('.doby-grid-row:not(.doby-grid-group)');


				// First make sure none of the opened rows are placeholders
				$rows.each(function () {
					expect($(this).find('.doby-grid-cell').html()).not.toBeEmpty();
				});

				// Make sure the right group was opened. Find the groups which are expanded
				// and use those to verify the data.
				var open_groups = [];
				_.each(grid.collection.groups[0].rows, function (g) {
					if (g.collapsed === 0) {
						open_groups.push({
							column: g.predef.column_id,
							value: g.value
						});

						_.each(g.groups, function (s) {
							if (s.collapsed === 0) {
								open_groups.push({
									column: s.predef.column_id,
									value: s.value
								});
							}
						});
					}
				});

				$rows.each(function () {
					expect($(this).find('.doby-grid-cell.l2').html()).toBe(open_groups[0].value.toString());
					expect($(this).find('.doby-grid-cell.l3').html()).toBe(open_groups[1].value.toString());
				});
			});
		});
	});


	// ==========================================================================================


	describe("Filtering", function () {

		it("should be able to filter remote results", function () {
			var column_id = "city",
				value = 'Vancouver',
				updated = 0;

			// Filter
			runs(function () {
				grid.on('remoteloaded', function () {
					updated++;
				});

				grid.filter([[column_id, '=', value]]);
			});

			// Wait for data to be refetched
			waitsFor(function () {
				return updated;
			});

			runs(function () {
				// Verify that only Vancouver rows are left visible
				var $rows = grid.$el.find('.doby-grid-row'), $cell;
				$rows.each(function () {
					$cell = $(this).children('.doby-grid-cell.l3');
					if ($cell.text() !== '') {
						expect($cell).toHaveText(value);
					}
				});
			});
		});


		// ==========================================================================================


		it("should be able to filter remote results when results are grouped", function () {
			var column_id = "city",
				value = 'Vancouver',
				updated = false;

			// Add grouping
			runs(function () {
				grid.setGrouping([{column_id: column_id}]);
			});

			// Wait for the groups to be fetched and calculated
			waitsFor(function () {
				return grid.collection.groups.length == 1 && grid.collection.groups[0].rows.length;
			});

			// Filter
			runs(function () {
				grid.on('remotegroupsloaded', function () {
					updated = true;
				});

				grid.filter([[column_id, '=', value]]);
			});

			// Wait for data to be refetched
			waitsFor(function () {
				return updated;
			});

			runs(function () {
				// Verify that only Vancouver rows are left visible
				var $rows = grid.$el.find('.doby-grid-row'), $cell;
				$rows.each(function () {
					$cell = $(this).find('.doby-grid-group-title:first').text();
					expect($cell).toContain(value);
				});
			});
		});
	});
});