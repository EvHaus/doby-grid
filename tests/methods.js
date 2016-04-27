// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, Backbone, document, DobyGrid*/

describe("Methods and Data Manipulation", function () {
	"use strict";

	// Disable underscore's debounce until https://github.com/pivotal/jasmine/pull/455 is fixed
	_.debounce = function (func) { return function () { func.apply(this, arguments);}; };

	// Utilities for resetting the grid
	var resetGrid = function (options) {
		options = options || {};
		options.autoDestroy = false;
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

		grid.appendTo(fixture);
		return grid;
	};


	// =====================================================================


	describe("activate()", function () {
		it("should be able to activate a cell given cell and row indexes", function () {
			// Prepare grid
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'},
				],
				data: [
					{id: 1, data: {id: 1, name: 'asd1'}},
					{id: 2, data: {id: 2, name: 'asd2'}},
					{id: 3, data: {id: 3, name: 'asd3'}}
				]
			});

			// Activate first cell
			grid.activate(0, 0);

			// Ensure cell is selected
			expect(grid.active).toBeDefined();
			expect(grid.active.cell).toEqual(0);
			expect(grid.active.row).toEqual(0);

			// Ensure cell and row is rendered with the right class
			var $row = grid.$el.find('.doby-grid-row:first');
			var $cell = grid.$el.find('.doby-grid-cell:first');
			expect($row.hasClass('active')).toEqual(true);
			expect($cell.hasClass('active')).toEqual(true);
		});


		// =====================================================================


		it("should be able to deactivate cells via blank arguments", function () {
			// Prepare grid
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'},
				],
				data: [
					{id: 1, data: {id: 1, name: 'asd1'}},
					{id: 2, data: {id: 2, name: 'asd2'}},
					{id: 3, data: {id: 3, name: 'asd3'}}
				]
			});

			// Activate first cell
			grid.activate(0, 0);

			// Ensure cell is selected
			expect(grid.active).toBeDefined();
			expect(grid.active.cell).toEqual(0);
			expect(grid.active.row).toEqual(0);

			// Deactivate cell
			grid.activate();
		});
	});


	// =====================================================================


	describe("add()", function () {
		it("should be able to insert a new data item via add()", function () {
			var grid = resetGrid();

			var item = {data: {id: 100, name: 'test'}, id: 100};
			var originalItems = JSON.parse(JSON.stringify(grid.collection.items));
			var originalDataItems = _.filter(originalItems, function (i) { return !i.__nonDataRow; });
			grid.add(item, {forced: true});
			var newItems = grid.collection.items;
			var newDataItems = _.filter(newItems, function (i) { return !i.__nonDataRow; });
			expect(originalDataItems.length).toEqual(0);
			expect(newDataItems).toEqual([item]);
		});


		// =====================================================================


		it("should be able to insert a new data item via add() at a specific index", function () {
			var grid = resetGrid();

			var item = {data: {id: 101, name: 'test'}, id: 101};
			grid.add(item, {at: 0, forced: true});
			var newItems = grid.collection.items;
			var newDataItems = _.filter(newItems, function (i) { return !i.__nonDataRow; });
			expect(newDataItems[0]).toEqual(item);
		});


		// =====================================================================


		it("should be able to merge data item via add() when adding item with the same id", function () {
			var grid = resetGrid({
				data: [{data: {id: 101, name: 'test'}, id: 101}]
			});

			// Execute
			var item = {data: {id: 101, name: 'updated'}, id: 101};
			grid.add(item, {merge: true, forced: true});

			// Validate
			var newItem = grid.get(101);
			expect(JSON.stringify(item)).toEqual(JSON.stringify(newItem));
		});


		// =====================================================================


		it("should throw an exception when attempting to add() an item with a non-unique id", function () {
			var grid = resetGrid();

			var item = {data: {id: 101, name: 'updated'}, id: 101};
			expect(function () {
				grid.add(item, {forced: true});
				grid.add(item, {forced: true});
			}).toThrowError('You are not allowed to add() items without a unique \'id\' value. A row with id \'' + item.data.id + '\' already exists.');
		});


		// =====================================================================


		it("should automatically render a new row when you use add()", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: "name", field: 'name'},
					{id: "category", field: "category"}
				]
			});
			var newrow = {data: {id: 2, name: "adding a new row", category: "oohlala"}, id: 2};
			grid.add(newrow, {forced: true});
			var lastcell = grid.$el.find('.doby-grid-row:last-child .doby-grid-cell:last-child').text();
			expect(lastcell).toEqual(newrow.data.category);
		});


		// =====================================================================


		it("should enable variable row height mode when an item is add()ed with a custom height", function () {
			// Reset
			var grid = resetGrid({
				data: [{data: {id: 1, name: 'test'}, id: 1}]
			});

			// Insert
			grid.add({data: {id: 2, name: 'test'}, id: 2, height: 1500}, {forced: true});

			// Make sure row has the right height
			grid.$el.find('.doby-grid-row:last-child').each(function () {
				expect($(this).height()).toEqual(1500);
			});
		});
	});


	// =====================================================================


	describe("addColumn()", function () {
		it("should be able to push a new column via addColumn()", function () {
			var grid = resetGrid();

			var col_def = {
				id: "addColumnTest1",
				field: "addColumnTest1"
			};

			grid.addColumn(col_def);

			var lastcol = grid.options.columns[grid.options.columns.length - 1];
			expect(lastcol.id).toEqual(col_def.id);
		});


		// =====================================================================


		it("should be able to push a new column via addColumn() 'at' a specific index", function () {
			var grid = resetGrid();

			var col_def = {
				id: "addColumnTest1",
				field: "addColumnTest1"
			};

			var col_def2 = {
				id: "addColumnTest2",
				field: "addColumnTest2"
			};

			grid.addColumn(col_def);
			grid.addColumn(col_def2, {at: 0});

			var firstcol = grid.options.columns[0];
			expect(firstcol.id).toEqual(col_def2.id);
		});


		// =====================================================================


		it("should be able to push a column update via addColumn() using merge", function () {
			var grid = resetGrid();

			var col_def = {
				id: "addColumnTest3",
				field: "addColumnTest3"
			};

			grid.addColumn(col_def);

			col_def = JSON.parse(JSON.stringify(col_def));
			col_def.field = 'CHANGED!';

			grid.addColumn(col_def, {merge: true});

			var lastcol = grid.options.columns[grid.options.columns.length - 1];
			expect(lastcol.id).toEqual(col_def.id);
			expect(lastcol.field).toEqual(col_def.field);
		});


		// =====================================================================


		it("should throw an error if attempting to addColumn() with 'id' that already exists", function () {
			var grid = resetGrid();

			var col_def = {
				id: "addColumnTest4",
				field: "addColumnTest4"
			};

			grid.addColumn(col_def);

			expect(function () {
				grid.addColumn(col_def);
			}).toThrowError("Unable to addColumn() because a column with id '" + col_def.id + "' already exists. Did you want to {merge: true} maybe?");
		});


		// =====================================================================


		it("should throw an error if attempting to addColumn() with non data objects", function () {
			var grid = resetGrid();

			var bad_data = [[], 'asd', 123, document.body];
			_.each(bad_data, function (bd) {
				expect(function () {
					grid.addColumn(bd);
				}).toThrowError("Unable to addColumn() because the given 'data' param is invalid.");
			});
		});
	});


	// =====================================================================


	describe("addGrouping()", function () {
		it("should throw an error if attempting to addGrouping() by null", function () {
			var grid = resetGrid();
			expect(function () {
				grid.addGrouping();
			}).toThrowError("Unable to add grouping to grid because the 'column_id' value is missing.");
		});


		// =====================================================================


		it("should throw an error if attempting to addGrouping() by an invalid column", function () {
			var grid = resetGrid();
			expect(function () {
				grid.addGrouping('armadillo');
			}).toThrowError("Cannot add grouping for column \"armadillo\" because no such column could be found.");
		});


		// =====================================================================


		it("should be able to apply grouping via addGrouping()", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID'
				}, {
					id: 'category',
					name: 'Category'
				}],
				data: [
					{data: {category: 'A'}, id: 1},
					{data: {category: 'A'}, id: 2},
					{data: {category: 'B'}, id: 3}
				]
			});

			grid.addGrouping("category");

			expect(grid.collection.groups[0].column_id).toEqual("category");

			// Reset
			grid.setGrouping();
		});


		// =====================================================================


		it("should be able to create nested groups with multiple addGrouping() calls", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID'
				}, {
					aggregator: function () {
						this.formatter = function () { return "test"; };
						this.process = function () {};
					},
					id: 'category',
					name: 'Category',
					field: 'cateogory'
				}, {
					aggregator: function () {
						this.formatter = function () { return "test"; };
						this.process = function () {};
					},
					id: 'subcategory',
					name: 'SubCategory',
					field: 'subcategory'
				}],
				data: [
					{data: {category: 'A', subcategory: 'Q'}, id: 1},
					{data: {category: 'A', subcategory: 'D'}, id: 2},
					{data: {category: 'B', subcategory: 'A'}, id: 3}
				]
			});

			grid.addGrouping("category");

			// Make sure we're expanded
			grid.collection.expandAllGroups();

			grid.addGrouping("subcategory");

			expect(grid.collection.groups[0].column_id).toEqual("category");
			expect(grid.collection.groups[1].column_id).toEqual("subcategory");
		});


		// =====================================================================


		it("should be able to specify custom grouping options for addGrouping() item", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID'
				}, {
					id: 'category',
					name: 'Category',
					field: 'category'
				}, {
					id: 'subcategory',
					name: 'SubCategory',
					field: 'subcategory'
				}],
				data: [
					{data: {category: 'A', subcategory: 'Q'}, id: 1},
					{data: {category: 'A', subcategory: 'D'}, id: 2},
					{data: {category: 'B', subcategory: 'A'}, id: 3}
				]
			});

			// Group by category and make sure it's expanded
			grid.addGrouping("category", {collapsed: false});

			var rows = grid.$el.find('.doby-grid-row');

			// Make sure first row is a group row
			expect(rows.eq(0).hasClass('doby-grid-group')).toEqual(true);

			// Make sure other rows are expanded
			expect(rows.length).toBeGreaterThan(1);
		});


		// =====================================================================


		it("should keep expanded groups expanded when adding new groupings", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID'
				}, {
					id: 'category',
					name: 'Category',
					field: 'category'
				}, {
					id: 'subcategory',
					name: 'SubCategory',
					field: 'subcategory'
				}],
				data: [
					{data: {category: 'A', subcategory: 'Q'}, id: 1},
					{data: {category: 'A', subcategory: 'D'}, id: 2},
					{data: {category: 'B', subcategory: 'A'}, id: 3}
				]
			});

			// Group by category and make sure it's expanded
			grid.addGrouping("category", {collapsed: false});

			// Add group by id
			grid.addGrouping("subcategory");

			var rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are sorted by their top offset
			rows = _.sortBy(rows, function (row) {
				// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
				// But attr('style') seems to return the right thing. Wat?
				return parseInt($(row).attr('style').replace('top:', ''), 10);
			});

			// Make sure first row is a group row and is still expanded
			expect($(rows[0]).hasClass('doby-grid-group')).toEqual(true);
			expect($(rows[0]).hasClass('expanded')).toEqual(true);
			expect($(rows[0]).text()).toEqual("Category: A (2 items)");

			// Make sure the second row is a group row for the first subcategory
			expect($(rows[1]).hasClass('doby-grid-group')).toEqual(true);
			expect($(rows[1]).hasClass('collapsed')).toEqual(true);
			expect($(rows[1]).text()).toEqual("SubCategory: D (1 item)");

			// Make sure the third row is a data row for the other subcategory
			expect($(rows[2]).hasClass('doby-grid-group')).toEqual(true);
			expect($(rows[2]).children('.doby-grid-cell').length).toBeGreaterThan(0);
			expect($(rows[2]).text()).toEqual("SubCategory: Q (1 item)");
		});


		// =====================================================================


		it("should keep global grid Aggregate rows at the bottom of the grid when adding grouping (seems to only happen if you have at least 10 items in the collection)", function () {

			var grid = resetGrid({
				columns: [{
					id: "id",
					name: "ID",
					field: "id"
				}, {
					id: "name",
					name: "Name",
					field: "name",
					minWidth: 100
				}, {
					id: "city",
					name: "City",
					field: "city"
				}, {
					id: "rating",
					name: "Rating",
					field: "rating",
					aggregators: [{
						fn: function () {
							this.exporter = function () {
								var avg = this.total.reduce(function (a, b) { return a + b; });
								return Math.round(avg / this.total.length);
							};
							this.formatter = function () {
								var avg = this.total.reduce(function (a, b) { return a + b; });
								return "Avg: <strong>" + Math.round(avg / this.total.length) + "</strong>";
							};
							this.process = function (item) {
								this.total.push(item.data.rating);
							};
							this.reset = function () {
								this.total = [];
							};
							return this;
						}
					}]
				}],
				data: [
					{data: {name: 'Andy Duguid', city: "Amsterdam", rating: 9}, id: 1},
					{data: {name: 'Dr. Daniel Kandi', city: "Ibiza", rating: 6}, id: 2},
					{data: {name: 'Tom Fall', city: "San Francisco", rating: 8}, id: 3},
					{data: {name: 'Yenn', city: "San Francisco", rating: 8}, id: 4},
					{data: {name: 'Dr. Lonnie Smith', city: "Vancouver", rating: 8}, id: 5},
					{data: {name: 'Tiesto', city: "Amsterdam", rating: 1}, id: 6},
					{data: {name: 'Bart Claessen', city: "Cologne", rating: 8}, id: 7},
					{data: {name: 'Arty', city: "Moscow", rating: 8}, id: 8},
					{data: {name: 'Mike Sonar', city: "Los Angeles", rating: 2}, id: 9},
					{data: {name: 'Dinka', city: "Stockholm", rating: 8}, id: 10}
				]
			});

			// First make sure the aggregate row is at the bottom of the grid
			var rows = grid.$el.find('.doby-grid-row');

			// Get the lowest row
			var lastrow = _.sortBy(rows, function (item) {
				return -parseInt($(item).css('top'), 10);
			})[0];

			// Last row should be an aggregate
			expect(lastrow).toHaveClass('doby-grid-row-total');

			// Now group by "category"
			grid.addGrouping("name");

			// Make sure last row is still the aggregate row from before
			rows = grid.$el.find('.doby-grid-row');
			lastrow = _.sortBy(rows, function (item) {
				return -parseInt($(item).css('top'), 10);
			})[0];

			// Last row should be the same aggregate row as before
			expect(lastrow).toHaveClass('doby-grid-row-total');
		});


		// =====================================================================


		it("should be able to sort grouped columns", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID'
				}, {
					id: 'category',
					name: 'Category',
					field: 'category'
				}, {
					id: 'subcat',
					name: 'SubCategory',
					field: 'subcat'
				}],
				data: [
					{data: {category: 'A', subcat: 'Q'}, id: 1},
					{data: {category: 'A', subcat: 'D'}, id: 2},
					{data: {category: 'B', subcat: 'A'}, id: 3}
				]
			});

			// Group by category
			grid.addGrouping("category");

			// Make sure the sorting object was updated
			expect(grid.sorting).toEqual([{columnId: "category", sortAsc: true, group: true}]);

			// Check to make sure groups are sorted in the right direction
			expect(grid.$el.find('.doby-grid-group-title').eq(0).text()).toContain('Category: A');
			expect(grid.$el.find('.doby-grid-group-title').eq(1).text()).toContain('Category: B');

			// Click on the column header to reverse the sort direction
			var $header = grid.$el.find('.doby-grid-header-column[id*="category"]');
			$header.simulate('click');

			// Make sure the sorting object was updated
			expect(grid.sorting).toEqual([{columnId: "category", sortAsc: true}]);

			// Should still be sorted in the same direction
			expect(grid.$el.find('.doby-grid-group-title').eq(0).text()).toContain('Category: A');
			expect(grid.$el.find('.doby-grid-group-title').eq(1).text()).toContain('Category: B');

			// Now click it again and the sort should be reversed
			$header.simulate('click');

			expect(grid.sorting).toEqual([{columnId: "category", sortAsc: false}]);
			expect(grid.$el.find('.doby-grid-group-title').eq(0).text()).toContain('Category: B');
			expect(grid.$el.find('.doby-grid-group-title').eq(1).text()).toContain('Category: A');
		});
	});


	// =====================================================================


	describe("appendTo()", function () {
		it("should append the grid to a container via appendTo()", function () {
			var grid = resetGrid();
			var fixture = setFixtures('<div class="test"></div>');
			grid.appendTo(fixture);
			expect(fixture).toContainElement('div.doby-grid');
		});


		// =====================================================================


		it("should return a DobyGrid object via appendTo()", function () {
			var grid = resetGrid();
			var fixture = setFixtures('<div class="test"></div>');
			grid.appendTo(fixture);
			expect(grid instanceof DobyGrid).toEqual(true);
			expect(typeof grid).toEqual('object');
		});
	});


	// =====================================================================


	describe("export()", function () {
		it("should only accept 'csv' and 'html' as a valid format param for export()", function () {
			var grid = resetGrid(),
				bad_tests = ['blah', 123, {}, 'html17', []],
				good_tests = ['csv', 'html'];

			// Invalid exports
			_.each(bad_tests, function (format) {
				expect(function () {
					grid.export(format);
				}).toThrowError('Sorry, "' + format + '" is not a supported format for export.');
			});

			// Valid exports
			_.each(good_tests, function (format) {
				expect(function () {
					grid.export(format);
				}).not.toThrow();
			});
		});


		// =====================================================================


		it("should correctly export() to CSV", function (done) {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}
				],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}]
			});

			// Export
			grid.export('csv', function (result) {
				expect(result).toEqual('"ID","Name"\n"1","one"\n"2","two"');
				done();
			});
		});


		// =====================================================================


		it("should correctly export() to HTML", function (done) {
			// Prepare for test
			var grid = resetGrid({
				columns: [{id: 'id', name: 'ID', field: 'id'}, {id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}]
			});

			// Export
			grid.export('html', function (result) {
				expect(result).toEqual('<table><thead><tr><th>ID</th><th>Name</th></tr></thead><tbody><tr><td>1</td><td>one</td></tr><tr><td>2</td><td>two</td></tr></tbody></table>');
				done();
			});
		});


		// =====================================================================


		it("should correctly escape HTML tags when doing export() to HTML", function (done) {
			// Prepare for test
			var grid = resetGrid({
				columns: [{id: 'id', name: 'ID', field: 'id'}, {id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: '<span>Something</span>'}
				}, {
					id: 2,
					data: {id: 2, name: '<div>\'"%/</div>'}
				}]
			});

			// Export
			grid.export('html', function (result) {
				expect(result).toEqual('<table><thead><tr><th>ID</th><th>Name</th></tr></thead><tbody><tr><td>1</td><td>&lt;span&gt;Something&lt;&#x2F;span&gt;</td></tr><tr><td>2</td><td>&lt;div&gt;&#39;&quot;%&#x2F;&lt;&#x2F;div&gt;</td></tr></tbody></table>');
				done();
			});
		});


		// =====================================================================


		it("should correctly export group", function (done) {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'},
					{id: 'category', name: 'Category', field: 'category'}
				],
				data: [{
					id: 1,
					data: {id: 1, name: 'one', category: 'odd'}
				}, {
					id: 2,
					data: {id: 2, name: 'two', category: 'even'}
				}, {
					id: 3,
					data: {id: 3, name: 'three', category: 'odd'}
				}]
			});

			// Group by category (odd and even numbers)
			grid.addGrouping('category');

			// We want the "odd" group, which will appear last and as the second row.
			var groupRow = 1;

			// Export
			grid.export('csv', function (result) {
				expect(result).toEqual('"ID","Name","Category"\n"1","one","odd"\n"3","three","odd"');
				done();
			}, groupRow);
		});


		// =====================================================================


		it("should correctly handle Backbone Collection data", function (done) {
			var collection = new Backbone.Collection([
				{id: 'asd1', name: 'one'},
				{id: 'asd2', name: 'two'}
			]);

			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}
				],
				data: collection
			});

			// Export
			grid.export('csv', function (result) {
				expect(result).toEqual('"ID","Name"\n"asd1","one"\n"asd2","two"');
				done();
			});
		});
	});


	// =====================================================================


	describe("filter()", function () {
		var grid;

		beforeEach(function () {
			grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}
				],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}, {
					id: 3,
					data: {id: null, name: null}
				}]
			});
		});


		// =====================================================================


		it("should be throw an error if attempting to filter() using an invalid param", function () {
			var tests = [
				{test: 1, error: 'Cannot apply filter to grid because given filter must be an array or a function, but given number.'},
				{test: 'a', error: 'Cannot apply filter to grid because given filter must be an array or a function, but given string.'},
				{test: {}, error: 'Cannot apply filter to grid because given filter must be an array or a function, but given object.'}
			];

			_.each(tests, function (test) {
				expect(function () {
					grid.filter(test.test);
				}).toThrowError(test.error);
			});
		});


		// =====================================================================


		it("should be able to filter() grid via a function", function () {
			// Filter using a function just to a single item
			grid.filter(function (item) {
				return item.id === 1;
			});

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(1);
		});


		// =====================================================================


		it("should be able to detect invalid filter() sets", function () {
			var bad_filters = [
				['a', '=', 'c'],
				[['a', 'c']]
			];

			// Filter using a function just to a single item
			_.each(bad_filters, function (bad_filter) {
				expect(function () {
					grid.filter(bad_filter);
				}).toThrowError('Cannot apply filter because the give filter set contains an invalid filter item: ' + JSON.stringify(bad_filter[0]) + '.');
			});
		});


		// =====================================================================


		it("should not be able to filter() by invalid columns", function () {
			expect(function () {
				grid.filter([['mama-mia', '=', 'a']]);
			}).toThrowError('Unable to filter by "mama-mia" because no such columns exists in the grid.');
		});


		// =====================================================================


		it("should not be able to filter() by invalid operators", function () {
			var bad_operators = ['a', [], '!', '0', {}];

			_.each(bad_operators, function (bo) {
				expect(function () {
					grid.filter([['id', bo, 1]]);
				}).toThrowError('Unable to filter by "id" because "' + bo + '" is not a valid operator.');
			});
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the = operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '=', 2]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(2);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the != operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '!=', 2]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(2);
			expect($rows.eq(0).find('.l0')).toHaveText(1);
			expect($rows.eq(1).find('.l0')).toHaveText('');
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the IN operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', 'IN', [2]]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(2);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the in operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', 'in', [2]]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(2);
		});


		// =====================================================================


		it("should throw an error if attempting to use filter() with the IN operator and a non-array value", function () {
			// Filter using a function just to a single item
			_.each(['test', 1, {}, null, undefined], function (v) {
				expect(function () {
					grid.filter([['id', 'IN', v]]);
				}).toThrowError('The "IN" filter operator must be used with an array. ' + v + ' was given instead.');
			});
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the > operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '>', 1]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(2);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the < operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '<', 2]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(1);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the >= operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '>=', 2]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(2);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the <= operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '<=', 1]
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(1);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the ~ operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '~', '1']
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(1);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the !~ operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['id', '!~', '1']
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(2);
			expect($rows.eq(0).find('.l0')).toHaveText(2);
			expect($rows.eq(1).find('.l0')).toHaveText('');
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the ~* operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['name', '~*', 'ONE']
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(1);
		});


		// =====================================================================


		it("should be able to filter() grid via an array filter set using the !~* operator", function () {
			// Filter using a function just to a single item
			grid.filter([
				['name', '!~*', 'ONE']
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(2);
			expect($rows.eq(0).find('.l0')).toHaveText(2);
			expect($rows.eq(1).find('.l0')).toHaveText('');
		});


		// =====================================================================


		it("should be able to reset active filter() with a null param", function () {
			// First first by something
			grid.filter([['id', '~', '1']]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.l0')).toHaveText(1);

			// Reset flter
			grid.filter();

			// Verify that the grid has been un-filtered
			$rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(grid.options.data.length);
		});


		// =====================================================================


		it("should show the correct count in group rows when using filters", function () {
			// Need a special data set
			grid.setOptions({
				columns: [{
					name: 'name',
					field: 'name',
					id: 'name'
				}, {
					name: 'foo',
					field: 'foo',
					id: 'foo'
				}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one', foo: 'bar'}
				}, {
					id: 2,
					data: {id: 2, name: 'one', foo: 'non-bar'}
				}]
			});

			// Add grouping
			grid.addGrouping('name');

			// Add filter
			grid.filter([
				['foo', '=', 'bar']
			]);

			// Verify that the grid has been filtered
			var $rows = grid.$el.find('.doby-grid-group .count');
			expect($rows.text()).toEqual('(1 item)');
		});


		// =====================================================================


		it("should correctly update aggregators to use filtered data", function () {
			// Need a special data set
			grid.setOptions({
				columns: [{
					name: 'name',
					field: 'name',
					id: 'name'
				}, {
					name: 'quantity',
					field: 'quantity',
					id: 'quantity',
					aggregators: [{
						active: true,
						name: "Sum",
						fn: function (column) {
							this.formatter = function () {
								return this.sum;
							};
							this.process = function (item) {
								this.sum += (item.data[column.field] || 0);
							};
							this.reset = function () {
								this.sum = 0;
							};
							return this;
						}
					}]
				}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one', quantity: 1}
				}, {
					id: 2,
					data: {id: 2, name: 'one', quantity: 2}
				}]
			});

			// Aggregator should display correct value
			expect(grid.$el.find('.doby-grid-row-total .l1')).toHaveText(3);

			// Now filter the data
			grid.filter([['quantity', '=', 1]]);

			// Aggregator should display correct value
			expect(grid.$el.find('.doby-grid-row-total .l1')).toHaveText(1);
		});


		// =====================================================================


		it("should display an 'empty' message when filters return 0 results", function () {
			grid.filter([['id', '=', 'asd']]);

			var rows = grid.$el.find('.doby-grid-row');

			// Aggregator should display correct value
			expect(rows.length).toEqual(0);
			expect(grid.$el).toContainElement('.doby-grid-empty');
		});
	});


	// =====================================================================


	describe("get()", function () {
		it("should be able to get() model by id", function () {
			var item = {data: {id: 102, name: 'updated'}, id: 102};
			var grid = resetGrid({
				data: [item]
			});

			// Validate
			var gotten = grid.get(102);
			expect(gotten.data.id).toEqual(102);
		});


		// =====================================================================


		it("should be able to get() model by reference", function () {
			var item = {data: {id: 103, name: 'updated'}, id: 103};
			var grid = resetGrid({
				data: [item]
			});

			// Validate
			var gotten = grid.get({data: {id: 103, name: 'updated'}, id: 103});
			expect(gotten.data.id).toEqual(103);
		});


		// =====================================================================


		it("should be able to get() an items via the id of a subrow", function () {
			var item = {
				data: {id: 1, name: 'one'},
				rows: {
					1: {
						id: 2,
						data: {id: 2, name: 'two'}
					}
				},
				id: 1
			};
			var grid = resetGrid({
				data: [item]
			});

			// Validate
			var gotten = grid.get(2);
			expect(gotten.data.id).toEqual(2);
		});
	});


	// =====================================================================


	describe("getIndex()", function () {
		it("should be able to getIndex() model by id", function () {
			var item = {data: {id: 102, name: 'updated'}, id: 102};
			var grid = resetGrid({
				data: [item]
			});

			// Validate
			var gotten = grid.getIndex(102);
			expect(gotten).toEqual(0);
		});
	});


	// =====================================================================


	describe("getRowFromEvent()", function () {
		it("should be able to getRowFromEvent()", function () {
			var item = {data: {id: 101, name: 'dat row!'}, id: 101};
			var grid = resetGrid({
				data: [item]
			});

			// Click row
			var $row = grid.$el.find('.doby-grid-row:first').first();

			var event;

			$row.on('click', function (e) {
				event = e;
			});

			$row.simulate('click');

			expect(grid.getRowFromEvent(event)).toEqual(item);
		});
	});


	// =====================================================================


	describe("getRowFromIndex()", function () {
		it("should be able to getRowFromIndex()", function () {
			var item = {data: {id: 101, name: 'dat row!'}, id: 101};
			var grid = resetGrid({
				data: [item]
			});

			expect(grid.getRowFromIndex(0)).toEqual(item);
		});
	});


	// =====================================================================


	describe("getSelectedRows()", function () {
		it("should return a list of selected row objects", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}]
			});

			// Select one (not all) cell in a row
			grid.selectCells(0, 0, 0, 0);

			// Ensure the cells got selected
			expect(grid.selection.length).toEqual(1);

			// Retrieve selected row
			expect(grid.getSelectedRows()).toEqual([{
				id: 1,
				data: {id: 1, name: 'one'}
			}]);
		});


		// =====================================================================


		it("should return an empty array when nothing is selected", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}]
			});

			// Get selected rows when nothing is selected
			expect(grid.getSelectedRows()).toEqual([]);
		});
	});


	// =====================================================================


	describe("getState()", function () {
		it("should be get the state of the grid", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					name: "NO!!",
					removable: true
				}]
			});

			var state = grid.getState();

			expect(state).toEqual({
				autoColumnWidth: false,
				columns: [{
					id: 1,
					width: 80
				}],
				filters: [],
				grouping: [],
				sort: [],
				resizedRows: []
			});
		});


		// =====================================================================


		it("should be able to get state for additional properties", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					name: "Excellent!",
					removable: true
				}]
			});

			var state = grid.getState({
				column_properties: ['name']
			});

			expect(state).toEqual({
				autoColumnWidth: false,
				columns: [{
					id: 1,
					name: "Excellent!",
					width: 80
				}],
				filters: [],
				grouping: [],
				sort: [],
				resizedRows: []
			});
		});
	});


	// =====================================================================


	describe("hideColumn()", function () {
		it("should be able to hideColumn() by id", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					name: "NO!!",
					removable: true
				}, {
					id: 2,
					name: "YES!!"
				}]
			});

			grid.hideColumn(1);

			expect(grid.options.columns.length).toEqual(2);
			expect(grid.options.columns[0].visible).toEqual(false);
			expect(grid.$el.find('.doby-grid-header-column').length).toEqual(1);
			expect(grid.$el.find('.doby-grid-header-column').text()).toEqual('YES!!');
		});


		// =====================================================================


		it("should not be able to hide columns that don't exist", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					removable: true
				}, {
					id: 2
				}]
			});

			expect(function () {
				grid.hideColumn(3);
			}).toThrowError('Unable to hide column "3" because no such column could be found.');
		});
	});


	// =====================================================================


	describe("hideOverlay()", function () {
		it("should re-draw all rows and hide the overlay", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'}
				],
				data: [
					{id: 1, data: {id: 1, name: 'one'}},
					{id: 2, data: {id: 2, name: 'two'}}
				]
			});

			// Execute
			grid.showOverlay();
			grid.hideOverlay();

			// Should clear the canvas and show the custom overlay
			var $viewport = grid.$el.find('.doby-grid-canvas').eq(0);
			expect($viewport).not.toContainElement('.doby-grid-overlay');
			expect($viewport).toContainElement('.doby-grid-row');
		});
	});


	// =====================================================================


	describe("refetch()", function () {
		it("should not allow you to refetch non-remote grids", function () {
			var grid = resetGrid();

			expect(function () {
				grid.refetch();
			}).toThrowError('The "refetch" method can only be used with Doby Grid instances which use a remote data set.');
		});
	});


	// =====================================================================


	describe("reset()", function () {
		it("should be able to reset() the grid with a new set of data", function () {
			var grid = resetGrid();
			var newdata = [{data: {id: 1, name: 'test'}, id: 1}, {data: {id: 2, name: 'test2'}, id: 2}];
			grid = grid.reset(newdata);
			expect(grid.collection.items).toEqual(newdata);
		});


		// =====================================================================


		it("should be able to empty the grid via reset()", function () {
			var grid = resetGrid({emptyNotice: false});
			grid = grid.reset();
			expect(grid.collection.items).toEqual([]);
		});


		// =====================================================================


		it("should re-render rows with the same id when using reset()", function () {
			var grid = resetGrid({columns: [{id: 'test', field: 'name'}]});
			grid.add({id: 1, data: {name: "bob"}});
			grid.reset([{id: 1, data: {name: "steve"}}]);
			var cell = grid.$el.find('.doby-grid-cell').first();
			expect(cell.html()).toEqual("steve");
		});


		// =====================================================================


		it("should re-render nested rows when using reset()", function () {
			var grid = resetGrid({columns: [{id: 'test', field: 'name'}]});
			grid.add({
				id: 1,
				data: {name: "bob"},
				rows: {
					0: {
						id: 2,
						data: {name: "bob jr"}
					}
				}
			});

			grid.reset([{
				id: 1,
				data: {name: "steve"},
				rows: {
					0: {
						id: 2,
						data: {name: "steve jr"}
					}
				}
			}]);

			var firstcell = grid.$el.find('.doby-grid-cell').first();
			var lastcell = grid.$el.find('.doby-grid-cell').last();
			expect(firstcell.html()).toEqual("steve");
			expect(lastcell.html()).toEqual("steve jr");
		});


		// =====================================================================


		it("should re-render correctly when using reset() and switching between normal and nested rows", function () {
			var grid = resetGrid({
				columns: [{id: 'test', field: 'name'}],
				data: [{
					id: 1,
					data: {name: "bob"}
				}, {
					id: 2,
					data: {name: "bob jr"}
				}]
			});

			grid.reset([{
				id: 1,
				data: {name: "steve"},
				rows: {
					0: {
						id: 2,
						data: {name: "steve jr"}
					}
				}
			}]);

			var firstcell = grid.$el.find('.doby-grid-cell').first();
			var lastcell = grid.$el.find('.doby-grid-cell').last();
			expect(firstcell.html()).toEqual("steve");
			expect(lastcell.html()).toEqual("steve jr");
		});
	});


	// =====================================================================


	describe("resize()", function () {
		it("should not throw any error when trying to resize() a destroyed grid", function () {
			var grid = new DobyGrid({});
			grid.destroy();
			expect(function () {
				grid.resize();
			}).not.toThrow();
		});
	});


	// =====================================================================


	describe("resizeColumnsToContent()", function () {
		it("should resize columns based on their content", function () {
			var newdata = [
				{data: {id: 1, name: 'test'}, id: 1},
				{data: {id: 2, name: 'veryveryveryveryveryveryveryverylong'}, id: 2}
			];

			var grid = resetGrid({
				columns: [{field: 'name', id: 'name'}],
				data: newdata
			});

			var prevWidth = grid.options.columns[0].width;

			grid.resizeColumnsToContent();

			var newWidth = grid.options.columns[0].width;

			expect(newWidth).toBeGreaterThan(prevWidth);
		});
	});


	// =====================================================================


	describe("remove()", function () {
		it("should be able to remove() an item from the grid", function () {
			var newdata = [{data: {id: 1, name: 'test'}, id: 1}, {data: {id: 2, name: 'test2'}, id: 2}];
			var grid = resetGrid({
				data: newdata
			});

			grid = grid.remove(2);
			expect(grid.collection.items).toEqual([newdata[0]]);
		});


		// =====================================================================


		it("should remove the relevant row from the DOM when calling remove()", function () {
			// Prepare the grid for testing
			var grid = resetGrid({
				columns: [{id: 'id', field: 'id'}],
				data: [{data: {id: 1}, id: 1}, {data: {id: 2}, id: 2}]
			});

			// Remove the second row
			grid.remove(2);

			// Check to see if the right row was removed
			var rows = grid.$el.find('.doby-grid-row'),
				cell = $(rows[0]).children('.doby-grid-cell:first').first();

			expect(rows.length).toEqual(1);

			// Make sure the first row is left behind
			expect(cell.text()).toEqual('1');
		});

		// =====================================================================


		it("should be able to remove() an item from a grouped grid", function () {
			var newdata = [{data: {id: 1, name: 'test'}, id: 1}, {data: {id: 2, name: 'test2'}, id: 2}];
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'}
				],
				data: newdata
			});

			grid.addGrouping('name', {collapsed: false});

			grid = grid.remove(2);
			expect(grid.collection.items).toEqual([newdata[0]]);

			expect(grid.$el.find('.doby-grid-row').length).toEqual(2);
		});
	});


	// =====================================================================


	describe("removeColumn()", function () {
		it("should be able to removeColumn() by id", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					removable: true
				}, {
					id: 2
				}]
			});

			grid.removeColumn(1);

			expect(grid.options.columns.length).toEqual(1);
			expect(grid.options.columns[0].id).toEqual(2);
		});


		// =====================================================================


		it("should not be able to remove columns that don't exist", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					removable: true
				}, {
					id: 2
				}]
			});

			expect(function () {
				grid.removeColumn(3);
			}).toThrowError('Cannot remove column "3" because no such column exists.');
		});


		// =====================================================================


		it("should remove the sort value for a column when that column is removed", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					removable: true
				}, {
					id: 2
				}]
			});

			// Sort by first column
			grid.sortBy(1);

			// Remove first column
			grid.removeColumn(1);

			expect(grid.sorting).toEqual([]);
		});
	});


	// =====================================================================


	describe("removeGrouping()", function () {
		it("should be able to removeGrouping()", function () {
			// Prepare the grid for testing
			var grid = resetGrid({
				columns: [{id: 'id', field: 'id'}, {id: 'name', field: 'name'}],
				data: [{data: {id: 1}, id: 1}, {data: {id: 2}, id: 2}]
			});

			// Group by id and name
			grid.addGrouping('id');
			grid.addGrouping('name');

			// Remove grouping
			grid.removeGrouping('id');

			// Make sure only name grouping is left
			expect(grid.collection.groups.length).toEqual(1);
			expect(grid.collection.groups[0].column_id).toEqual('name');
		});
	});


	// =====================================================================


	describe("restoreState()", function () {
		it("should be able to restore autoColumnWidth", function () {
			var options = {
				autoColumnWidth: false,
				autoDestroy: false,
				columns: [{
					id: 1,
					name: "One",
					field: 'one',
					width: 10
				}, {
					id: 2,
					name: "Two",
					field: 'two',
					width: 20
				}, {
					id: 3,
					name: "Three",
					field: 'three',
					width: 30
				}],
				data: [
					{data: {one: 'This One', two: 'B', three: 'C'}, id: 1},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 2},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 3}
				]
			}, grid = new DobyGrid(options), fixture = setFixtures();

			fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

			// Restore
			grid.restoreState({
				autoColumnWidth: true
			});

			// Append
			grid.appendTo(fixture);

			// Should only two columns rendered
			expect(grid.options.autoColumnWidth).toEqual(true);
		});


		// =====================================================================


		it("should be able to restore column visibility, order and widths", function () {
			var options = {
				autoDestroy: false,
				columns: [{
					id: 1,
					name: "One",
					field: 'one',
					width: 10
				}, {
					id: 2,
					name: "Two",
					field: 'two',
					width: 20
				}, {
					id: 3,
					name: "Three",
					field: 'three',
					width: 30
				}],
				data: [
					{data: {one: 'A', two: 'B', three: 'C'}, id: 1},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 2},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 3}
				]
			}, grid = new DobyGrid(options), fixture = setFixtures();

			fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

			// Restore
			grid.restoreState({
				columns: [
					{id: 3, width: 300},
					{id: 1, width: 100}
				]
			});

			// Append
			grid.appendTo(fixture);

			// Should only two columns rendered
			var $cols = grid.$el.find('.doby-grid-header-column');
			expect($cols.length).toEqual(2);

			$cols.each(function (i) {
				if (i === 0) {
					expect($(this)).toHaveText('Three');
					expect($(this).outerWidth()).toEqual(300);
				} else {
					expect($(this)).toHaveText('One');
					expect($(this).outerWidth()).toEqual(100);
				}
			});
		});


		// =====================================================================


		it("should be able to restore filters", function () {
			var options = {
				autoDestroy: false,
				columns: [{
					id: 1,
					name: "One",
					field: 'one',
					width: 10
				}, {
					id: 2,
					name: "Two",
					field: 'two',
					width: 20
				}, {
					id: 3,
					name: "Three",
					field: 'three',
					width: 30
				}],
				data: [
					{data: {one: 'This One', two: 'B', three: 'C'}, id: 1},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 2},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 3}
				]
			}, grid = new DobyGrid(options), fixture = setFixtures();

			fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

			// Restore
			grid.restoreState({
				filters: [
					[1, '=', 'This One']
				]
			});

			// Append
			grid.appendTo(fixture);

			// Should only two columns rendered
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.length).toEqual(1);
			expect($rows.find('.doby-grid-cell:first')).toHaveText('This One');
		});


		// =====================================================================


		it("should be able to restore grouping", function () {
			var options = {
				autoDestroy: false,
				columns: [{
					id: 1,
					name: "One",
					field: 'one',
					width: 10
				}, {
					id: 2,
					name: "Two",
					field: 'two',
					width: 20
				}, {
					id: 3,
					name: "Three",
					field: 'three',
					width: 30
				}],
				data: [
					{data: {one: 'This One', two: 'B', three: 'C'}, id: 1},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 2},
					{data: {one: 'A', two: 'B', three: 'C'}, id: 3}
				]
			}, grid = new DobyGrid(options), fixture = setFixtures();

			fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

			// Restore
			grid.restoreState({
				grouping: [
					{column_id: 2}
				]
			});

			// Append
			grid.appendTo(fixture);

			// Should only two columns rendered
			var $rows = grid.$el.find('.doby-grid-group');
			expect($rows.length).toEqual(1);
		});


		// =====================================================================


		it("should be able to restore sorting", function () {
			var options = {
				autoDestroy: false,
				columns: [{
					id: 1,
					name: "One",
					field: 'one',
					width: 10
				}, {
					id: 2,
					name: "Two",
					field: 'two',
					width: 20
				}, {
					id: 3,
					name: "Three",
					field: 'three',
					width: 30
				}],
				data: [
					{data: {one: 'A', two: 'B', three: 'C'}, id: 1},
					{data: {one: 'B', two: 'B', three: 'C'}, id: 2},
					{data: {one: 'C', two: 'B', three: 'C'}, id: 3}
				]
			}, grid = new DobyGrid(options), fixture = setFixtures();

			fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

			// Restore
			grid.restoreState({
				sort: [
					{columnId: 1, sortAsc: false}
				]
			});

			// Append
			grid.appendTo(fixture);

			// Should only two columns rendered
			var $rows = grid.$el.find('.doby-grid-row');

			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			$($rows).each(function (i) {
				if (i === 0) {
					expect($(this).find('.doby-grid-cell:first')).toHaveText('C');
				} else if (i === 1) {
					expect($(this).find('.doby-grid-cell:first')).toHaveText('B');
				} else {
					expect($(this).find('.doby-grid-cell:first')).toHaveText('A');
				}
			});
		});


		// =====================================================================


		it("should not resize columns if state has autoColumnWidth disabled", function () {
			var options = {
				autoColumnWidth: false,
				columns: [{
					id: 1,
					name: "One",
					field: 'one',
					width: 10
				}, {
					id: 2,
					name: "Two",
					field: 'two',
					width: 20
				}, {
					id: 3,
					name: "Three",
					field: 'three',
					width: 30
				}],
				data: [
					{data: {one: 'A', two: 'B', three: 'C'}, id: 1},
					{data: {one: 'B', two: 'B', three: 'C'}, id: 2},
					{data: {one: 'C', two: 'B', three: 'C'}, id: 3}
				]
			}, grid = new DobyGrid(options), fixture = setFixtures();

			fixture.attr('style', 'height:600px;position:absolute;top:0;left:0;opacity:0;width:500px');

			// Append
			grid.appendTo(fixture);

			// Get column widths
			var widths = grid.$el.find('.doby-grid-header-column').map(function () {
				return $(this).width();
			});

			// Restore current state
			grid.restoreState(grid.getState());

			var newWidths = grid.$el.find('.doby-grid-header-column').map(function () {
				return $(this).width();
			});

			// Widths should stay the same
			expect(widths).toEqual(newWidths);
		});
	});


	// =====================================================================


	describe("scrollToRow()", function () {
		it("should be able to scrollToRow() to a specific row", function () {
			// Prepare grid for test
			var data = [];
			for (var i = 0; i < 1000; i++) {
				data.push({
					data: {id: i, name: 'test' + i},
					id: i
				});
			}

			var grid = resetGrid({
				columns: [{id: 'name', field: 'name'}],
				data: data
			});

			// Scroll to row
			grid.scrollToRow(50);

			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first');

			// TODO: The unit tests always scroll to a row 3 less than actual, probably
			// due to the way the grid is loaded in the fixture. Find a way to fix this.
			expect(firstcell.text()).toEqual('test47');
		});


		// =====================================================================


		it("should be able to scrollToRow() to a specific row when variable row heights are used", function () {
			// Prepare grid for test
			var data = [];
			for (var i = 0; i < 1000; i++) {
				data.push({
					data: {id: i, name: 'test' + i},
					id: i,
					height: (i + 10)
				});
			}

			var grid = resetGrid({
				columns: [{id: 'name', field: 'name'}],
				data: data
			});

			// Scroll to row
			grid.scrollToRow(50);

			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first');

			// TODO: The unit tests always scroll to a row 3 less than actual, probably
			// due to the way the grid is loaded in the fixture. Find a way to fix this.
			expect(firstcell.text()).toEqual('test47');
		});


		// =====================================================================


		it("should be able to scrollToRow() to a specific row when rowSpacing is used", function () {
			// Prepare grid for test
			var data = [],
				rowSpacing = function () {
					return i + 10;
				};

			for (var i = 0; i < 1000; i++) {
				data.push({
					data: {id: i, name: 'test' + i},
					id: i,
					height: (i + 10),
					rowSpacing: rowSpacing
				});
			}

			var grid = resetGrid({
				columns: [{id: 'name', field: 'name'}],
				data: data
			});

			// Scroll to row
			grid.scrollToRow(50);

			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first');

			// TODO: The unit tests always scroll to a row 3 less than actual, probably
			// due to the way the grid is loaded in the fixture. Find a way to fix this.
			expect(firstcell.text()).toEqual('test47');
		});
	});


	// =====================================================================


	describe("selectCells()", function () {
		it("should be able to selectCells()", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: 'test2'}, id: 289}
				]
			});

			// Select all cells
			grid.selectCells(0, 0, 1, 1);

			// Expect selection to be set
			expect(grid.selection).toBeDefined();
			expect($.isArray(grid.selection)).toEqual(true);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);
		});


		// =====================================================================


		it("should be able to deselect all cells with an empty selectCells() call", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: 'test2'}, id: 289}
				]
			});

			// Select all cells
			grid.selectCells(0, 0, 1, 1);

			// Expect selection to be set
			expect(grid.selection).toBeDefined();
			expect($.isArray(grid.selection)).toEqual(true);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);

			// Deselect cells
			grid.selectCells();

			// Expect selection to be empty
			expect(grid.selection).toEqual(null);
		});
	});


	// =====================================================================


	describe("selection", function () {
		it("should be able to convert a Range object into a list of selected items", function () {
			var data = [
				{data: {id: 189, name: 'test'}, id: 189},
				{data: {id: 289, name: 'test2'}, id: 289}
			];
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: data
			});

			// Select all cells
			grid.selectCells(0, 0, 1, 1);

			// Convert selection to rows
			var result = grid.selection[0].toRows();
			expect(result).toEqual(data);
		});
	});


	// =====================================================================


	describe("selectRows()", function () {
		it("should be able to select a single row", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}],
				selectable: true
			});

			// Select a single row
			grid.selectRows(0, 0);

			// Ensure the row got selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);
		});


		// =====================================================================


		it("should be able to select a range of rows", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}],
				selectable: true
			});

			// Select range of rows
			grid.selectRows(0, 1);

			// Ensure the rows got selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);
		});


		// =====================================================================


		it("should replace existing selection when using 'add' false", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}],
				selectable: true
			});

			// Select a single row
			grid.selectRows(0, 0);

			// Ensure the row got selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);

			// Select a different row
			grid.selectRows(1, 1);

			// Ensure the selection got replaced
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromRow).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);
		});


		// =====================================================================


		it("should add to existing selection when using 'add' true", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', name: 'ID', field: 'id'},
					{id: 'name', name: 'Name', field: 'name'}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one'}
				}, {
					id: 2,
					data: {id: 2, name: 'two'}
				}],
				selectable: true
			});

			// Select a single row
			grid.selectRows(0, 0);

			// Ensure the row got selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);

			// Select a different row as an addition
			grid.selectRows(1, 1, true);

			// Ensure the selection got added
			expect(grid.selection.length).toEqual(2);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);
			expect(grid.selection[1].fromRow).toEqual(1);
			expect(grid.selection[1].fromCell).toEqual(0);
			expect(grid.selection[1].toRow).toEqual(1);
			expect(grid.selection[1].toCell).toEqual(1);
			expect(grid.selection[1].exclusions.length).toEqual(0);
		});
	});


	// =====================================================================


	describe("setColumns()", function () {
		it("should be able to create columns using setColumns()", function () {
			var grid = resetGrid({
				data: [
					{id: 1, data: {id: 1, name: 'one'}},
					{id: 2, data: {id: 2, name: 'two'}}
				]
			});

			grid.setColumns([
				{id: 'id', field: 'id'},
				{id: 'name', field: 'name'}
			]);

			// Confirm data
			expect(grid.options.columns.length).toEqual(2);
			expect(grid.options.columns[0].id).toEqual('id');
			expect(grid.options.columns[1].id).toEqual('name');

			// Confirm header render
			var headers = grid.$el.find('.doby-grid-header-column');
			expect(headers.length).toEqual(2);
			expect(headers.first().attr('id')).toContain('id');
			expect(headers.last().attr('id')).toContain('name');

			// Confirm body render
			var cells = grid.$el.find('.doby-grid-cell');
			expect(cells.eq(0).html()).toEqual('1');
			expect(cells.eq(1).html()).toEqual('one');
			expect(cells.eq(2).html()).toEqual('2');
			expect(cells.eq(3).html()).toEqual('two');
		});


		// =====================================================================


		it("should be able to reset columns using setColumns()", function () {
			var grid = resetGrid({
				columns: [
					{id: 'asd', field: 'asd'},
					{id: 'dsa', field: 'dsa'}
				],
				data: [
					{id: 1, data: {id: 1, name: 'one', middle: 'm1'}},
					{id: 2, data: {id: 2, name: 'two', middle: 'm2'}}
				]
			});

			grid.setColumns([
				{id: 'id', field: 'id'},
				{id: 'middle', field: 'middle'},
				{id: 'name', field: 'name'}
			]);

			// Confirm data
			expect(grid.options.columns.length).toEqual(3);
			expect(grid.options.columns[0].id).toEqual('id');
			expect(grid.options.columns[2].id).toEqual('name');

			// Confirm render
			var headers = grid.$el.find('.doby-grid-header-column');
			expect(headers.length).toEqual(3);
			expect(headers.first().attr('id')).toContain('id');
			expect(headers.last().attr('id')).toContain('name');

			// Confirm body render
			var cells = grid.$el.find('.doby-grid-cell');
			expect(cells.eq(0).html()).toEqual('1');
			expect(cells.eq(1).html()).toEqual('m1');
			expect(cells.eq(2).html()).toEqual('one');
			expect(cells.eq(3).html()).toEqual('2');
			expect(cells.eq(4).html()).toEqual('m2');
			expect(cells.eq(5).html()).toEqual('two');
		});


		// =====================================================================


		it("should remove the sort value for a column when that column is removed", function () {
			var grid = resetGrid({
				columns: [{
					id: 1,
					removable: true
				}, {
					id: 2
				}]
			});

			// Sort by first column
			grid.sortBy(1);

			// Remove first column
			grid.setColumns([{
				id: 2
			}]);

			expect(grid.sorting).toEqual([]);
		});
	});


	// =====================================================================


	describe("setItem()", function () {
		it("should be to change a row's id via setItem()", function () {
			var grid = resetGrid({
				columns: [{name: 'id', id: 'id', field: 'id'}],
				data: [{data: {id: 1, name: 'test'}, id: 1}]
			});

			// Cell's value should be 1
			expect(grid.$el.find('.doby-grid-cell').text()).toEqual('1');

			// Change the row's id
			grid.setItem(1, {id: 2, data: {id: 2}});

			// Cell's value should be 2
			expect(grid.$el.find('.doby-grid-cell').text()).toEqual('2');
		});


		// =====================================================================


		it("should only accept Backbone Models when using setItem() on a Backbone Collection", function () {
			var grid = resetGrid({
				columns: [{name: 'id', id: 'id', field: 'id'}],
				data: new Backbone.Collection([{name: 'test', id: 1}])
			});

			// Try to give setItem a non Model
			expect(function () {
				grid.setItem(1, {rows: []});
			}).toThrowError("Sorry, Backbone.Collection data sets must be given a valid Backbone.Model in the setItem() method.");
		});


		// =====================================================================


		it("should correctly handle Backbone Model changes via setItem()", function () {
			var grid = resetGrid({
				columns: [{name: 'name', id: 'name', field: 'name'}],
				data: new Backbone.Collection([{name: 'test', id: 1}])
			});

			expect(grid.$el.find('.doby-grid-cell').text()).toEqual('test');

			grid.setItem(1, new Backbone.Model({id: 1, name: 'aloha!'}));

			expect(grid.$el.find('.doby-grid-cell').text()).toEqual('aloha!');
		});


		// =====================================================================


		it("should not allow 'id' changes via setItem() when using Backbone Models", function () {
			var grid = resetGrid({
				columns: [{name: 'id', id: 'id', field: 'id'}],
				data: new Backbone.Collection([{name: 'test', id: 1}])
			});

			// Change the row's id
			expect(function () {
				grid.setItem(1, new Backbone.Model({id: 200}));
			}).toThrowError("Sorry, but Backbone does not support changing a model's id value, and as a result, this is not supported in Doby Grid either.");
		});


		// =====================================================================


		it("should be able to use setItem() to update a Backbone Model object that has child rows", function () {
			var model = new Backbone.Model({name: 'test', id: 1});

			model.rows = {
				0: new Backbone.Model({name: 'sub-test', id: 2})
			};

			var collection = new Backbone.Collection(model);

			var grid = resetGrid({
				columns: [{name: 'name', id: 'name', field: 'name'}],
				data: collection
			});

			var update = model;
			update.rows[0] = new Backbone.Model({name: 'NEW ONE', id: 2});

			grid.setItem(1, update);

			expect(grid.$el.find('.doby-grid-cell').eq(1).text()).toEqual('NEW ONE');
		});


		// =====================================================================


		it("should correctly insert nested rows into a Backbone.Collection without re-arranging elements using setItem() while grouping is enabled", function () {
			var collection = new Backbone.Collection();

			// Add collection events
			collection.on('add', function (model) {
				// Once items are added to the collection, create a nested row for it
				var subtaskModel = new Backbone.Model({
					id: 'subrow' + model.id,
					name: 'row' + model.id + '-subrow1'
				});

				subtaskModel.collapsed = true;

				model.rows = {
					0: subtaskModel
				};
			});

			// Add collection data
			collection.add([
				{id: 1, name: 'row1', group: 'a'},
				{id: 2, name: 'row2', group: 'a'},
				{id: 3, name: 'row3', group: 'a'}
			]);

			var grid = resetGrid({
				columns: [{
					id: 'id',
					field: 'id'
				}, {
					id: 'name',
					field: 'name'
				}, {
					id: 'group',
					field: 'group'
				}],
				data: collection
			});

			grid.setGrouping([{column_id: 'group', collapsed: false}]);

			// Toggle the second row's nested column via setItem
			var secondModel = collection.at(1);
			secondModel.rows[0].collapsed = false;
			grid.setItem(secondModel.id, secondModel);

			expect(grid.$el.find('.doby-grid-row').length).toEqual(5);


			// Ensure that all rows are in the order expected
			var rows = grid.$el.find('.doby-grid-row:not(.doby-grid-group)');

			// Make sure rows are sorted by their top offset
			rows = _.sortBy(rows, function (row) {
				// For some reason jasmine-grunt doesn't like .css('top') here, which returns NaN
				// But attr('style') seems to return the right thing. Wat?
				return parseInt($(row).attr('style').replace('top:', ''), 10);
			});

			_.each(rows, function (row, i) {
				if (i === 0) {
					expect($(row).find('.l1')).toHaveText('row1');
				} else if (i === 1) {
					expect($(row).find('.l1')).toHaveText('row2');
				} else if (i === 2) {
					expect($(row).find('.l1')).toHaveText('row2-subrow1');
				} else if (i === 3) {
					expect($(row).find('.l1')).toHaveText('row3');
				}
			});
		});


		// =====================================================================


		it("should not get into a recursive loop when using setItem() on an object that references itself", function () {
			var items = [];
			items[0] = {
				id: 1,
				data: {
					id: 1,
				},
				self_ref: items
			};

			var grid = resetGrid({
				data: items
			});

			expect(function () {
				grid.setItem(1, {
					id: 1,
					self_ref_2: items
				});
			}).not.toThrow();
		});
	});


	// =====================================================================


	describe("setGrouping()", function () {
		it("when `groupNulls` is set to false, should keep null values at the bottom without a grouping row", function () {
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			// Add grouping
			grid.addGrouping('name', {
				groupNulls: false
			});


			// Rows should sorted in the right direction
			var $rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			// Check the rows that got rendered
			$.each($rows, function (i, row) {
				if (i === 0) {
					expect($(row)).toHaveClass('doby-grid-group');
				} else {
					expect($(row).find('.doby-grid-cell:first')).toHaveText(289);
				}
			});
		});


		// =====================================================================


		it("when `class` is set on a grouping object, the grouping rows should inherit it", function () {
			var custom_class = 'hello';
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			// Add grouping
			grid.addGrouping('name', {
				class: custom_class
			});

			// Rows should sorted in the right direction
			grid.$el.find('.doby-grid-group').each(function () {
				expect($(this)).toHaveClass(custom_class);
			});
		});


		// =====================================================================


		it("when `class` method is set on a grouping object, the grouping rows should inherit it", function () {
			var custom_class = function () {
				return 'hello';
			};

			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			// Add grouping
			grid.addGrouping('name', {
				class: custom_class
			});

			// Rows should sorted in the right direction
			grid.$el.find('.doby-grid-group').each(function () {
				expect($(this)).toHaveClass(custom_class());
			});
		});


		// =====================================================================


		it("should be able to set group row heights via a custom function", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			grid.addGrouping('id', {
				height: function (item) {
					return (item.level + 1)	* 100;
				}
			});

			// Find the group rows and ensure they have the HTML we're expecting
			grid.$el.find('.doby-grid-group').each(function () {
				expect($(this).height()).toEqual(100);
			});
		});


		// =====================================================================


		it("should allow you to set group row heights to 0 via a function", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			grid.addGrouping('id', {
				height: function () {
					return 0;
				}
			});

			// Find the group rows and ensure they have the HTML we're expecting
			grid.$el.find('.doby-grid-group').each(function () {
				expect($(this).height()).toEqual(0);
			});
		});


		// =====================================================================


		it("should be able to use `height` and `rowSpacing` functions for group header rows", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			var ensureHeightGroup = false,
				ensureRowSpacingGroup = false;


			grid.setGrouping([{
				column_id: 'id',
				collapsed: false
			}, {
				class: 'thisone',
				column_id: 'name',
				collapsed: true,
				height: function (item) {
					if (item.parentGroup.groups.length) {
						ensureHeightGroup = true;
					}
					return 10;
				},
				rowSpacing: function (item) {
					if (item.parentGroup.groups.length) {
						ensureRowSpacingGroup = true;
					}
					return 20;
				}
			}]);

			// Find the group rows and ensure they have the HTML we're expecting
			grid.$el.find('.doby-grid-group').each(function (n) {
				if (n % 2) {
					expect($(this)).toHaveClass('thisone');
					expect($(this).height()).toEqual(10);
					if (n === 1) {
						expect($(this).css('top')).toEqual('49px');
					} else {
						expect($(this).css('top')).toEqual('109px');
					}
				}
			});

			expect(ensureHeightGroup).toEqual(true);
			expect(ensureRowSpacingGroup).toEqual(true);
		});


		// =====================================================================


		it("should allow you to remove the colspan for group rows", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			grid.addGrouping('id', {
				colspan: false
			});

			// Ensure group rows have 2 cells
			grid.$el.find('.doby-grid-group').each(function () {
				expect($(this).children('.doby-grid-cell').length).toEqual(2);
			});
		});


		// =====================================================================


		it("should allow you to specify a custom dataExtractor for group rows", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{name: 'ID', field: 'id', id: 'id'},
					{name: 'Name', field: 'name', id: 'name'}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: null}, id: 289}
				]
			});

			grid.addGrouping('id', {
				colspan: false,
				dataExtractor: function (item, columnDef) {
					return columnDef.id;
				}
			});

			// Ensure group rows have correct values in the cells
			grid.$el.find('.doby-grid-group').each(function () {
				$(this).children('.doby-grid-cell').each(function (i) {
					if (i % 2) {
						expect($(this)).toHaveText('name');
					} else {
						expect($(this)).toHaveText('id');
					}
				});
			});
		});
	});


	// =====================================================================


	describe("setOptions()", function () {
		it("should be able to reload data using setOptions()", function () {
			var grid = resetGrid();

			grid.setOptions({
				data: [{data: {id: 189, name: 'test'}, id: 189}, {data: {id: 289, name: 'test2'}, id: 289}]
			});

			expect(_.pluck(grid.collection.items, 'id')).toEqual([189, 289]);
		});


		// =====================================================================


		it("should be able to re-render columns setOptions()", function () {
			var grid = resetGrid({
				columns: [{id: 'id', field: 'id'}],
				data: [
					{id: 3, data: {id: 3, name: 'asd'}},
					{id: 4, data: {id: 4, name: 'dsa'}}
				]
			});

			grid.setOptions({
				columns: [{id: 'name', field: 'name'}, {id: 'id', field: 'id'}],
				data: [
					{id: 1, data: {id: 1, name: 'one'}},
					{id: 2, data: {id: 2, name: 'two'}}
				]
			});

			// Confirm data
			expect(grid.options.columns.length).toEqual(2);
			expect(grid.options.columns[0].id).toEqual('name');
			expect(grid.options.columns[1].id).toEqual('id');

			// Confirm render
			var headers = grid.$el.find('.doby-grid-header-column');
			expect(headers.length).toEqual(2);
			expect(headers.first().attr('id')).toContain('name');
			expect(headers.last().attr('id')).toContain('id');

			// Confirm body render
			var cells = grid.$el.find('.doby-grid-cell');
			expect(cells.eq(0).html()).toEqual('one');
			expect(cells.eq(1).html()).toEqual('1');
			expect(cells.eq(2).html()).toEqual('two');
			expect(cells.eq(3).html()).toEqual('2');
		});


		// =====================================================================


		it("should re-render aggregators if they are change via setOptions()", function () {
			var grid = resetGrid({
				columns: [{id: 'id', field: 'id'}],
				data: [
					{id: 3, data: {id: 3, name: 'asd'}},
					{id: 4, data: {id: 4, name: 'dsa'}}
				]
			});

			// Ensure there are no aggregator rows
			expect(grid.$el.find('.doby-grid-row-total').length).toEqual(0);

			// Change data, columns and aggregators
			grid.setOptions({
				columns: [{
					name: 'name',
					field: 'name',
					id: 'name'
				}, {
					name: 'quantity',
					field: 'quantity',
					id: 'quantity',
					aggregators: [{
						active: true,
						name: "Sum",
						fn: function (column) {
							this.formatter = function () {
								return this.sum;
							};
							this.process = function (item) {
								this.sum += (item.data[column.field] || 0);
							};
							this.reset = function () {
								this.sum = 0;
							};
							return this;
						}
					}]
				}],
				data: [{
					id: 1,
					data: {id: 1, name: 'one', quantity: 1}
				}, {
					id: 2,
					data: {id: 2, name: 'one', quantity: 2}
				}]
			});

			// Make sure there is 1 aggregator
			expect(grid.$el.find('.doby-grid-row-total').length).toEqual(1);
		});


		// =====================================================================


		it("should fire the 'columnresize' event when 'autoColumnWidth' is toggled via setOptions()", function () {
			var grid = resetGrid({
				columns: [{id: 'id', field: 'id'}, {id: 'id2', field: 'id2'}]
			});

			var columnResizeCallback = jasmine.createSpy('columnResizeCallback');

			// Bind and spy on event callback
			grid.on('columnresize', columnResizeCallback);

			// Toggle
			grid.setOptions({
				autoColumnWidth: !grid.options.autoColumnWidth
			});

			expect(columnResizeCallback).toHaveBeenCalled();
			expect(columnResizeCallback.calls.count()).toEqual(1);

			// Toggle back
			grid.setOptions({
				autoColumnWidth: !grid.options.autoColumnWidth
			});

			expect(columnResizeCallback).toHaveBeenCalled();
			expect(columnResizeCallback.calls.count()).toEqual(2);
		});


		// =====================================================================


		it("should re-render the grid when changing 'rowHeight' via setOptions()", function () {
			var grid = resetGrid({
				data: [{
					id: 1,
					data: {id: 1, name: 'one', quantity: 1}
				}, {
					id: 2,
					data: {id: 2, name: 'one', quantity: 2}
				}]
			});

			// Make sure we have rows to test
			expect(grid.$el.find('.doby-grid-row').length).toBeGreaterThan(0);

			// Check initial row heights
			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this).height()).toEqual(grid.options.rowHeight);
			});

			// Set new row heights
			grid.setOptions({rowHeight: 151});

			// Verify row heights were re-rendered
			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this).height()).toEqual(151);
			});
		});


		// =====================================================================


		// FIXME: Make this work
		xit("should clear grouping by column if it is removed via setOptions", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'}
				],
				data: [
					{id: 1, data: {id: 1, id2: 2}}
				]
			});

			// Group by id
			grid.addGrouping('id');

			// Change columns
			grid.setOptions({
				columns: [
					{id: 'id2', field: 'id2'}
				]
			});

			expect(grid.$el.find('.doby-grid-cell')).toHaveText(2);
		});
	});


	// =====================================================================


	describe("showOverlay()", function () {
		it("should hide all rows and display an overlay", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'}
				],
				data: [
					{id: 1, data: {id: 1, name: 'one'}},
					{id: 2, data: {id: 2, name: 'two'}}
				]
			});

			// Execute
			grid.showOverlay({
				html: 'Hi There'
			});

			// Should clear the canvas and show the custom overlay
			var $viewport = grid.$el.find('.doby-grid-canvas');
			expect($viewport.html()).toEqual('<div class="doby-grid-overlay">Hi There</div>');
		});
	});


	// =====================================================================


	describe("showQuickFilter()", function () {
		it("should show the Quick Filter bar", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'}
				],
				data: [
					{id: 1, data: {id: 1, name: 'one'}},
					{id: 2, data: {id: 2, name: 'two'}}
				],
				quickFilter: true
			});

			// Execute
			grid.showQuickFilter('id');

			// Should clear the canvas and show the custom overlay
			expect(grid.$el).toContainElement('.doby-grid-header-filter');
		});


		// =====================================================================


		it("should hide the Quick Filter bar when 'column_id' is null", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'}
				],
				data: [
					{id: 1, data: {id: 1, name: 'one'}},
					{id: 2, data: {id: 2, name: 'two'}}
				],
				quickFilter: true
			});

			// Show
			grid.showQuickFilter('id');

			// Ensure the quick filter is shown
			expect(grid.$el).toContainElement('.doby-grid-header-filter');

			// Hide
			grid.showQuickFilter();

			// Ensure the quick filter is removed
			expect(grid.$el).not.toContainElement('.doby-grid-header-filter');
		});
	});


	// =====================================================================


	describe("destroy()", function () {
		it("should be able to destroy() the grid", function () {
			var grid = resetGrid();
			grid.destroy();
			expect(grid.$el).toEqual(null);
		});


		// =====================================================================


		it("should not throw an error when calling destroy() more than once", function () {
			var grid = resetGrid();
			expect(function () {
				grid.destroy();
				grid.destroy();
			}).not.toThrow();
		});


		// =====================================================================


		it("should also destroy any open context menus", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: 'name', field: 'name'},
				],
				data: [
					{id: 1, data: {id: 1, name: 'asd1'}},
					{id: 2, data: {id: 2, name: 'asd2'}},
					{id: 3, data: {id: 3, name: 'asd3'}}
				]
			});

			// Start clock
			jasmine.clock().install();

			// Simulate context click on the grid
			grid.$el.find('.doby-grid-cell:first').simulate('contextmenu');

			// Make sure the context menu comes up
			expect($(document.body)).toContainElement('.doby-grid-dropdown');

			// Now destroy the grid
			grid.destroy();

			// Step forward in time
			jasmine.clock().tick(500);

			// Wait for the dropdown to disappear (it's on a timeout)
			expect($(document.body).find('.doby-grid-dropdown').length).toEqual(0);

			// Remove
			jasmine.clock().uninstall();
		});
	});

});
