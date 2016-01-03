// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, Backbone, DobyGrid*/

describe("Remote Data", function () {
	"use strict";

	// Disable underscore's debounce until https://github.com/pivotal/jasmine/pull/455 is fixed
	_.debounce = function (func) { return function () { func.apply(this, arguments);}; };

	// Will control variable row height mode results in the grid
	var variableRowHeightMode = false;

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

	describe("Basic Data", function () {

		var grid;

		beforeEach(function () {
			// Start Jasmine Clock
			jasmine.clock().install();

			var data = [],
				count = 100;

			for (var i = 0; i < count; i++) {
				data.push({
					id: i,
					data: {
						id: i,
						name: "Name " + i,
						age: _.sample(_.range(18, 28)),
						city: _.sample(["Vancouver", "New York", "Chicago", "London", null])
					}
				});
			}

			// Default options for the grid
			var options = {
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
						callback(_.filter(data, function (item) {
							return remote_filter(options, item);
						}).length);
					};

					this.fetch = function (options, callback) {
						return setTimeout(function () {
							var mydata = JSON.parse(JSON.stringify(data));
							mydata = _.filter(mydata, function (item) {
								if (variableRowHeightMode) item.height = 10;

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

										// Nulls always on the bottom
										if (value1 === null) return 1;
										if (value2 === null) return -1;

										if (value1 !== value2) {
											val = options.order[i].sortAsc ? (value1 > value2) ? 1 : -1 : (value1 < value2) ? 1 : -1;
											if (val !== 0) return val;
										}
									}

									return result;
								});
							}

							if (options.offset !== null && options.offset !== undefined) {
								if (options.limit !== null && options.limit !== undefined) {
									mydata = mydata.slice(options.offset, options.offset + options.limit);
								} else {
									mydata = mydata.slice(options.offset);
								}
							}

							// Apply fake offset and fake limit
							callback(mydata);
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
									var parentGroup;
									for (var j = 0, m = results[i - 1].groups.length; j < m; j++) {
										if (results[i - 1].groups[j].parent) {
											parentGroup = results[i - 1].groups[j].parent.concat([results[i - 1].groups[j].value]);
										} else {
											parentGroup = [results[i - 1].groups[j].value];
										}

										generateGroup(column_id, results[i - 1].groups[j]._rows, i, parentGroup);
									}
								}
							}
							callback(results);
						}, 5);
					};
				},
				quickFilter: true
			};

			// Create a new grid inside a fixture
			grid = new DobyGrid(options);
			var fixture = setFixtures();

			// This is needed for grunt-jasmine tests which doesn't read the CSS
			// from the HTML version of jasmine.
			fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:300px;width:300px');

			grid.appendTo(fixture);

			var loaded = jasmine.createSpy("remoteLoaded");
			grid.on('remoteloaded', loaded);

			// Wait for data load
			jasmine.clock().tick(2000);

			// Make sure remote data has been loaded
			expect(loaded).toHaveBeenCalled();
		});

		afterEach(function () {
			// Remove clock
			jasmine.clock().uninstall();
		});


		// ==========================================================================================


		it("should set the correct data length", function () {
			expect(grid.collection.length).toEqual(100);
		});


		// ==========================================================================================


		it("should throw an exception if a non-number is returned for the count() method", function () {
			// Remember old count
			var oldCount = grid.fetcher.count;
			grid.fetcher.count = function (options, callback) {
				callback("bad value");
			};

			// Try refetching
			expect(function () {
				grid.reset();
				grid.refetch();
			}).toThrowError('Your count() method must return a number. It returned a string of value "bad value" instead.');

			// Put value back
			grid.fetcher.count = oldCount;
		});


		// ==========================================================================================


		it("should generate placeholders for all rows", function () {
			expect(grid.collection.items.length).toEqual(100);
		});


		// ==========================================================================================


		it("should automatically load the first page", function () {
			expect(grid.collection.items[0].toString()).toEqual('[object Object]');
		});


		// ==========================================================================================


		it("should correctly load the second page", function () {
			// Scroll to second page
			grid.scrollToRow(20);

			// Wait for first page to load
			jasmine.clock().tick(500);

			// Check second page
			expect(grid.collection.items[20].toString()).toEqual('[object Object]');
		});


		// ==========================================================================================


		it("should correctly prefetch extra results", function () {
			grid.options.rowsToPrefetch = 10;

			// Scroll to second page. The initial load won't have extra results
			// because we set the rowsToFetch option late, but we can test with
			// subsequent fetches triggered by scrolling.
			grid.scrollToRow(20);

			// Wait for first page to load
			jasmine.clock().tick(500);

			// Check extra results past second page
			expect(grid.collection.items[40].toString()).toEqual('[object Object]');
		});


		// ==========================================================================================


		it("should allow the insertion of various row heights post initial render", function () {
			var row;

			// Insert a large row immediately as a child of the first
			grid.setItem(0, {
				rows: {
					0: {
						height: 200,
						formatter: function () {
							return 'test';
						},
						columns: {
							0: {
								colspan: '*'
							}
						}
					}
				}
			});

			// Wait for reload
			jasmine.clock().tick(500);

			// Confirm reload
			row = grid.$el.find('.doby-grid-row:nth-child(2)').first();
			expect(row.text().indexOf('test')).toBeGreaterThan(-1);

			// Make sure the inserted row is 200 pixels high
			expect(row.height()).toEqual(200);
		});


		// ==========================================================================================


		it("should refetch grid if it has been resized and gotten bigger", function () {
			var wrapper = grid.$el.parent();

			wrapper.css('height', 800);

			var loaded = jasmine.createSpy('remoteLoaded');

			// Listen for refetch event
			grid.on('remoteloaded', loaded);

			// Trigger resize
			grid.resize();

			// Wait for reload
			jasmine.clock().tick(500);

			expect(loaded).toHaveBeenCalled();
		});


		// ==========================================================================================


		it("should correctly handle situations where remote data fetching enabled variableRowHeight mode", function () {
			// Enable variable row heights
			variableRowHeightMode = true;

			var loaded = jasmine.createSpy('remoteLoaded');

			// Force refetch
			grid.reset();
			grid.resize(); // TODO: This is needed because reset() doesn't force reload for remote grids. Bug?

			// Listen for refetch event
			grid.on('remoteloaded', loaded);

			// Fetch again
			grid.refetch();

			// Go fetch stuff!
			jasmine.clock().tick(500);

			expect(loaded).toHaveBeenCalled();

			// Disable variable row heights
			variableRowHeightMode = false;
		});


		// ==========================================================================================


		describe("Grouping", function () {

			it("should be able to group results", function () {
				var column_id = "city";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(1);
				expect(grid.collection.groups[0].column_id).toEqual(column_id);

				// Only group rows should be drawn
				grid.$el.find('.doby-grid-row').each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});
			});


			// ==========================================================================================


			it("should be able to switch between different groupings (ensuring that the remote grouping cache is properly cleaned up)", function () {
				var column_id = "city",
					another_column_id = "age";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(1);
				expect(grid.collection.groups[0].column_id).toEqual(column_id);

				// Only group rows should be drawn
				grid.$el.find('.doby-grid-row').each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
					expect($(this).find('.doby-grid-group-title strong').first()).toHaveText('City:');
				});

				// Now group by another column
				grid.setGrouping([{column_id: another_column_id}]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(1);
				expect(grid.collection.groups[0].column_id).toEqual(another_column_id);

				// Only group rows should be drawn
				grid.$el.find('.doby-grid-row').each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
					expect($(this).find('.doby-grid-group-title strong').first()).toHaveText('Age:');
				});
			});


			// ==========================================================================================


			it("should be able to fetch group pages correctly when expanding grouped results", function () {
				var column_id = "city";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

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

				// Wait for some non-placeholder row data to be fetched
				jasmine.clock().tick(500);

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


			// ==========================================================================================


			it("should be able to sort grouped results", function () {
				var column_id = "city",
					sorting_column_id = "id";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(1);
				expect(grid.collection.groups[0].column_id).toEqual(column_id);

				// Only group rows should be drawn
				var $rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				// Apply sorting by a column
				grid.sortBy(sorting_column_id);

				// Wait for some non-placeholder row data to be fetched
				jasmine.clock().tick(500);

				// Expand the first group
				grid.$el.find('.doby-grid-group:first .doby-grid-cell:first').simulate('click', {});

				// Wait for some non-placeholder row data to be fetched
				jasmine.clock().tick(500);

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


			// ==========================================================================================


			it("should be reverse grouped order when changing sort direction of column", function () {
				var column_id = "city";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Apply sorting by a column
				grid.sortBy(column_id);

				// Click on header to reverse sorting
				var $header = grid.$el.find('.doby-grid-header-column[id*="' + column_id + '"]:first').first();

				$header.simulate('click');

				// Wait for reload
				jasmine.clock().tick(500);

				var groups = _.sortBy(grid.$el.find('.doby-grid-group'), function (row) {
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				var $group;
				_.each(groups, function (group, i) {
					$group = $(group);
					if (i > 0) {
						expect($group.find('.doby-grid-group-title').text()).toBeLessThan($(groups[i - 1]).find('.doby-grid-group-title').text());
					}
				});
			});


			// ==========================================================================================


			it("should be able to fetch grouped result rows when sorting in reverse order", function () {
				var column_id = "age";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Apply sorting by a column
				grid.sortBy(column_id);

				// Click on header to reverse sorting
				var $header = grid.$el.find('.doby-grid-header-column[id*="' + column_id + '"]:first').first();

				$header.simulate('click');

				// Wait for reload
				jasmine.clock().tick(500);

				// Expand the first group
				grid.$el.find('.doby-grid-group:first .doby-grid-cell:first').simulate('click', {});

				// Wait for reload
				jasmine.clock().tick(500);

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


			// ==========================================================================================


			it("should be able to sort grouped results after a group has been expanded", function () {
				var column_id = "city",
					sorting_column_id = "age";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(1);
				expect(grid.collection.groups[0].column_id).toEqual(column_id);

				// Only group rows should be drawn
				var $rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				// Expand the second group
				grid.$el.find('.doby-grid-group:nth-child(2) .doby-grid-cell:first').simulate('click', {});

				// Wait for reload
				jasmine.clock().tick(500);

				// Apply sorting by a column
				grid.sortBy(sorting_column_id);

				// Wait for reload
				jasmine.clock().tick(500);

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


			// ==========================================================================================


			it("should fetch the correct row data when grouped results are scrolled before being expanded", function () {
				var column_id = "id";

				// Add grouping
				grid.addGrouping(column_id);

				// Wait for reload
				jasmine.clock().tick(500);

				// Scroll to the bottom
				grid.scrollToRow(grid.collection.length);

				// Wait for reload
				jasmine.clock().tick(500);

				// Expand a group in the middle of the last page
				grid.$el.find('.doby-grid-group:nth-child(10) .doby-grid-cell:first').simulate('click', {});

				// Wait for reload
				jasmine.clock().tick(500);

				// Find the non-group row
				var $row = grid.$el.find('.doby-grid-row:not(.doby-grid-group)');

				// Should not be a placeholder
				expect($row.find('.l0')).not.toBeEmpty();
			});


			// ==========================================================================================


			it("should be able to correctly fetch and render nested groupings", function () {
				var group1_column_id = "age",
					group2_column_id = "city",
					rows;

				// Add grouping
				grid.setGrouping([{column_id: group1_column_id}, {column_id: group2_column_id}]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Groups should be generated
				expect(grid.collection.groups.length).toEqual(2);
				expect(grid.collection.groups[0].column_id).toEqual(group1_column_id);

				// Only group rows should be drawn
				var $rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				rows = _.sortBy(grid.$el.find('.doby-grid-group'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				// Expand the first group
				$(rows[0]).find('.doby-grid-cell:first').simulate('click', {});

				// Wait for some secondary group rows to be fetched
				jasmine.clock().tick(500);

				// All rows should still be groups
				$rows = grid.$el.find('.doby-grid-row');
				$rows.each(function () {
					expect($(this)).toHaveClass('doby-grid-group');
				});

				rows = _.sortBy(grid.$el.find('.doby-grid-group'), function (row) {
					// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
					// But attr('style') seems to return the right thing. Wat?
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});

				// Expand the first group's first group
				$(rows[1]).find('.doby-grid-cell:first').simulate('click', {});

				// Wait for some non-placeholder row data to be fetched
				jasmine.clock().tick(500);

				// At this point we should have one regular row visible
				$rows = grid.$el.find('.doby-grid-row:not(.doby-grid-group)');

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


			// ==========================================================================================


			it("should call fetch when setGrouping changes column values", function () {
				var column_id1 = "city",
					column_id2a = "age",
					column_id2b = "name",
					loaded = jasmine.createSpy('remoteLoaded');

				grid.on('remoteloaded', loaded);

				// Add grouping
				grid.setGrouping([
					{column_id: column_id1, collapsed: false},
					{column_id: column_id2a, collapsed: false}
				]);

				// Wait for reload
				jasmine.clock().tick(500);

				expect(loaded).toHaveBeenCalled();

				// Change grouping
				grid.setGrouping([
					{column_id: column_id1, collapsed: false},
					{column_id: column_id2b, collapsed: false}
				]);

				jasmine.clock().tick(500);

				// Should be called again
				expect(loaded).toHaveBeenCalled();
				expect(loaded.calls.count()).toEqual(2);
			});
		});


		// ==========================================================================================


		describe("Filtering", function () {

			it("should be able to filter remote results", function () {
				var column_id = "city",
					value = 'Vancouver';

				// Filter
				grid.filter([[column_id, '=', value]]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Verify that only Vancouver rows are left visible
				var $rows = grid.$el.find('.doby-grid-row'), $cell;
				$rows.each(function () {
					$cell = $(this).children('.doby-grid-cell.l3');
					if ($cell.text() !== '') {
						expect($cell).toHaveText(value);
					}
				});
			});


			// ==========================================================================================


			it("should be able to filter remote results when results are grouped", function () {
				var column_id = "city",
					value = 'Vancouver';

				// Add grouping
				grid.setGrouping([{column_id: column_id}]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Filter
				grid.filter([[column_id, '=', value]]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Verify that only Vancouver rows are left visible
				var $rows = grid.$el.find('.doby-grid-row'), $cell;
				$rows.each(function () {
					$cell = $(this).find('.doby-grid-group-title:first').text();
					expect($cell).toContain(value);
				});
			});


			// ==========================================================================================


			it("should not fire filter events when Quick Filter value has not changed", function () {
				var loaded = jasmine.createSpy('remoteLoaded');

				// Launch the grid context menu
				grid.$el.find('.doby-grid-cell').simulate('contextmenu');

				// Popup the Quick Filter menu
				$(document.body).find('.doby-grid-contextmenu .doby-grid-dropdown-menu .doby-grid-dropdown-menu .doby-grid-dropdown-item:first').each(function () {
					if ($(this).text().indexOf('Quick Filter') >= 0) {
						$(this).simulate('click');
					}
				});

				// Make sure the Quick Filter popped out
				expect(grid.$el).toContainElement('.doby-grid-header-filter');

				grid.on('remoteloaded', loaded);

				// Focus on the first filter input cell
				var $firstInput = grid.$el.find('.doby-grid-header-filter-cell input:first');
				$firstInput.simulate('click');

				// Simulate pressing down arrow
				$firstInput.simulate('keyup', {keyCode: 40});

				// Wait for reload
				jasmine.clock().tick(500);

				// Grid should not has been updated
				expect(loaded).not.toHaveBeenCalled();
			});


			// ==========================================================================================


			it("should only display an 'empty' message row when filters return 0 results", function () {
				var column_id = "city",
					value = 'BADVALUE--NORESULS';

				// Filter
				grid.filter([[column_id, '=', value]]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Verify that empty message comes up
				var $rows = grid.$el.find('.doby-grid-row');
				expect($rows.length).toEqual(0);
				expect(grid.$el).toContainElement('.doby-grid-empty');
			});


			// ==========================================================================================


			it("should be display an 'empty' message when filtering grouped results", function () {
				var column_id = "city",
					value = 'NoMatches';

				// Add grouping
				grid.setGrouping([{column_id: column_id}]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Filter
				grid.filter([[column_id, '=', value]]);

				// Wait for reload
				jasmine.clock().tick(500);

				// Confirm remote
				expect(grid.collection.remote_length).toEqual(0);

				// Verify that only 1 row is visible
				var $rows = grid.$el.find('.doby-grid-row');
				expect($rows.length).toEqual(0);
				expect(grid.$el).toContainElement('.doby-grid-empty');
			});
		});


		// ==========================================================================================


		describe("Sorting", function () {

			it("should be able to sort results", function () {
				var column_id = "id";

				// Sort
				grid.sortBy(column_id, false);

				// Wait for reload
				jasmine.clock().tick(500);

				// Wait for the groups to be fetched and calculated
				var rows = _.sortBy(grid.$el.find('.doby-grid-row'), function (row) {
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});
				expect($(rows[0]).children('.l0').text()).toEqual('99');
			});
		});

	});


	// ==========================================================================================


	describe("Backbone Collection Data", function () {

		var grid, data, count, adds;

		beforeEach(function () {
			// Start Jasmine Clock
			jasmine.clock().install();

			data = new Backbone.Collection();
			count = 100;
			adds = [];

			data.on('add', function (model) {
				adds.push(model);
			});

			var testdata = new Backbone.Collection();

			for (var i = 0; i < count; i++) {
				testdata.add({
					id: i,
					name: "Name " + i,
					age: _.sample(_.range(18, 28)),
					city: _.sample(["Vancouver", "New York", "Chicago", "London", "Paris"])
				});
			}

			data.DobyGridRemote = {
				count: function (options, callback) {
					callback(testdata.filter(function (item) {
						return remote_filter(options, item);
					}).length);
				},

				fetch: function (options, callback) {
					return setTimeout(function () {
						var mydata = testdata.filter(function (item) {
							return remote_filter(options, item);
						});
						if (options.order.length) {
							mydata.sort(function (dataRow1, dataRow2) {
								var result = 0, column, value1, value2, val;

								// Loops through the columns by which we are sorting
								for (var i = 0, l = options.order.length; i < l; i++) {
									column = options.order[i].columnId;
									value1 = dataRow1.get(column);
									value2 = dataRow2.get(column);

									if (value1 !== value2) {
										val = options.order[i].sortAsc ? (value1 > value2) ? 1 : -1 : (value1 < value2) ? 1 : -1;
										if (val !== 0) return val;
									}
								}

								return result;
							});
						}

						if (options.offset !== null && options.offset !== undefined) {
							if (options.limit !== null && options.limit !== undefined) {
								mydata = mydata.slice(options.offset, options.offset + options.limit);
							} else {
								mydata = mydata.slice(options.offset);
							}
						}

						// Apply fake offset and fake limit
						callback(mydata);
					}, 5);
				}
			};

			// Default options for the grid
			var options = {
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
				data: data
			};

			// Create a new grid inside a fixture
			grid = new DobyGrid(options);
			var fixture = setFixtures();

			// This is needed for grunt-jasmine tests which doesn't read the CSS
			// from the HTML version of jasmine.
			fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:300px;width:300px');

			grid.appendTo(fixture);

			// Wait for load
			jasmine.clock().tick(500);

			var rows = _.sortBy(grid.$el.find('.doby-grid-row'), function (row) {
				return parseInt($(row).attr('style').replace('top:', ''), 10);
			});

			// Confirm load
			expect($(rows[10]).children('.l0').text()).toEqual('10');
		});

		afterEach(function () {
			// End Jasmine Clock
			jasmine.clock().uninstall();
		});


		// ==========================================================================================


		it("should not set internal collection to a Backbone.Collection", function () {
			// This is a reminder for devs not to try to convert the internal collection items
			// into a Backbone.Collection because Backbone is horribly slow at generating Model objects
			// so inserting 100,000+ placeholders will freeze up the browser.
			expect(grid.collection.items instanceof Backbone.Collection).toEqual(false);
		});


		// ==========================================================================================


		it("should set the correct data length", function () {
			expect(grid.collection.length).toEqual(count);
		});


		// ==========================================================================================


		it("should generate placeholders for all rows", function () {
			expect(grid.collection.items.length).toEqual(count);
		});


		// ==========================================================================================


		it("should automatically load the first page", function () {
			expect(grid.collection.items[0].toString()).toEqual('[object Object]');
			expect(grid.collection.items.length).toEqual(count);

			var rows = _.sortBy(grid.$el.find('.doby-grid-row'), function (row) {
				return parseInt($(row).attr('style').replace('top:', ''), 10);
			});

			$(rows[0]).find('.doby-grid-cell').each(function () {
				expect($(this)).not.toBeEmpty();
			});
		});


		// ==========================================================================================


		it("should fire 'add' Backbone.Collection events when fetching data", function () {
			expect(adds.length).toBeGreaterThan(0);
		});


		// ==========================================================================================


		describe("Sorting", function () {
			it("should be able to sort results in Backbone.Collection sets", function () {
				var column_id = "id";

				// Sort
				grid.sortBy(column_id, false);

				// Wait for reload
				jasmine.clock().tick(500);

				// COnfirm sort
				var rows = _.sortBy(grid.$el.find('.doby-grid-row'), function (row) {
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});
				expect($(rows[0]).children('.l0').text()).toEqual('99');

				// Sort back to validate collection resets
				grid.sortBy(column_id, true);

				// Wait for reload
				jasmine.clock().tick(500);

				// Confirm reverse
				rows = _.sortBy(grid.$el.find('.doby-grid-row'), function (row) {
					return parseInt($(row).attr('style').replace('top:', ''), 10);
				});
				expect($(rows[0]).children('.l0').text()).toEqual('0');
			});
		});


		// ==========================================================================================


		describe("Exporting", function () {
			it("should be able to export the full set of grid results", function (done) {
				// Don't use a fake clock for this tests because it has nested timeouts,
				// and we have a callback we can use anyway.
				jasmine.clock().uninstall();

				// Automatically confirm the confirm() popup
				spyOn(window, 'confirm').and.returnValue(true);

				grid.export('csv', function (result) {
					// Should have the last row exported
					expect(result).toMatch('"99"');
					done();
				});
			});
		});

	});
});


// ==========================================================================================


describe("Remote Data Edge Cases", function () {
	"use strict";

	it("should display an empty row when remote data is empty", function () {
		// Render Grid
		var fetch;
		var grid = new DobyGrid({
			columns: [
				{id: 'id', field: 'id', name: 'id', width: 600},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: function () {
				this.count = function (options, callback) {
					callback(0);
				};
				this.fetch = function () {
					fetch = true;
				};
			}
		});

		var fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:300px;width:300px');

		grid.appendTo(fixture);

		var rows = grid.$el.find('.doby-grid-row');
		expect(rows.length).toEqual(0);
		expect(grid.$el).toContainElement('.doby-grid-empty');
	});


	// ==========================================================================================


	it("should not attempt to refetch data after changing filters if the grid hasn't been initialized yet", function () {
		// Start Clock
		jasmine.clock().install();

		// Render Grid
		var fetch = jasmine.createSpy('fetcher');
		var grid = new DobyGrid({
			columns: [
				{id: 'id', field: 'id', name: 'id', width: 600},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: function () {
				this.count = function (options, callback) {
					callback(10);
				};
				this.fetch = fetch;
			}
		});

		// Execute filter
		grid.filter([['id', '=', 189]]);

		jasmine.clock().tick(100);

		// Fetch should not be called
		expect(fetch).not.toHaveBeenCalled();

		// Remove Clock
		jasmine.clock().uninstall();
	});


	// ==========================================================================================


	// FIXME: This is actually an invalid unit test. The fetch SHOULD be called -- but only
	// if it's faster than the delay on the remote data sets. Here we need to test calling appendTo
	// immediately, vs. calling appendTo after several seconds of a delay.
	xit("should not attempt to fetch remote data after initialization if groupings are configured", function () {
		// Start Clock
		jasmine.clock().install();

		// Render Grid
		var fetch, fetchGroups;
		var grid = new DobyGrid({
			columns: [
				{id: 'id', field: 'id', name: 'id', width: 600},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: function () {
				this.count = function (options, callback) {
					callback(10);
				};
				this.fetch = function () {
					fetch = true;
				};
				this.fetchGroups = function (options, callback) {
					fetchGroups = true;
					callback([{
						column_id: 'name',
						groups: [{
							'count': 5,
							'value': 'bcd'
						}, {
							'count': 5,
							'value': 'adb'
						}]
					}]);
				};
			}
		}), fixture = setFixtures();

		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:300px;width:300px');

		// Set grouping
		grid.setGrouping([{column_id: 'name', collapsed: false}]);

		// Then initialize the grid
		grid.appendTo(fixture);

		jasmine.clock().tick(100);

		// Only fetchGroups should be called. 'fetch' should NOT be called here.
		expect(fetch).toEqual(null);
		expect(fetchGroups).toEqual(true);

		// Remove Clock
		jasmine.clock().uninstall();
	});
});
