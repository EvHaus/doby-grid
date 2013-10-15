// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global _, $, describe, document, expect, DobyGrid, it, setFixtures*/

describe("Methods and Data Manipulation", function () {
	"use strict";


	// ==========================================================================================


	// Utilities for resetting the grid
	var resetGrid = function (options) {
		options = options || {};
		options.autoDestroy = false;
		var grid = new DobyGrid(options);
		grid.appendTo(setFixtures('<div id="test-container"></div>'));
		return grid;
	};


	// ==========================================================================================


	describe("add()", function () {
		it("should be able to insert a new data item via add()", function () {
			var grid = resetGrid();

			var item = {data: {id: 100, name: 'test'}, id: 100};
			var originalItems = JSON.parse(JSON.stringify(grid.collection.items));
			var originalDataItems = _.filter(originalItems, function (i) { return !i.__nonDataRow; });
			grid.add(item);
			var newItems = grid.collection.items;
			var newDataItems = _.filter(newItems, function (i) { return !i.__nonDataRow; });
			expect(originalDataItems.length).toEqual(0);
			expect(newDataItems).toEqual([item]);
		});


		// ==========================================================================================


		it("should be able to insert a new data item via add() at a specific index", function () {
			var grid = resetGrid();

			var item = {data: {id: 101, name: 'test'}, id: 101};
			grid.add(item, {at: 0});
			var newItems = grid.collection.items;
			var newDataItems = _.filter(newItems, function (i) { return !i.__nonDataRow; });
			expect(newDataItems[0]).toEqual(item);
		});


		// ==========================================================================================


		it("should be able to merge data item via add() when adding item with the same id", function () {
			var grid = resetGrid({
				data: [{data: {id: 101, name: 'test'}, id: 101}]
			});

			// Execute
			var item = {data: {id: 101, name: 'updated'}, id: 101};
			grid.add(item, {merge: true});

			// Validate
			var newItem = grid.get(101);
			expect(JSON.stringify(item)).toEqual(JSON.stringify(newItem));
		});


		// ==========================================================================================


		it("should throw an exception when attempting to add() an item with a non-unique id", function () {
			var grid = resetGrid();

			var item = {data: {id: 101, name: 'updated'}, id: 101};
			expect(function () {
				grid.add(item);
				grid.add(item);
			}).toThrow('You are not allowed to add() items without a unique \'id\' value. A row with id \'' + item.data.id + '\' already exists.');
		});


		// ==========================================================================================


		it("should automatically render a new row when you use add()", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id'},
					{id: "name", field: 'name'},
					{id: "category", field: "category"}
				]
			});
			var newrow = {data: {id: 2, name: "adding a new row", category: "oohlala"}, id: 2};
			grid.add(newrow);
			var lastcell = grid.$el.find('.doby-grid-row:last-child .doby-grid-cell:last-child').text();
			expect(lastcell).toEqual(newrow.data.category);
		});


		// ==========================================================================================


		it("should enable variable row height mode when an item is add()ed with a custom height", function () {
			// Reset
			var grid = resetGrid({
				data: [{data: {id: 1, name: 'test'}, id: 1}]
			});

			// Insert
			grid.add({data: {id: 2, name: 'test'}, id: 2, height: 1500});

			// Make sure row has the right height
			grid.$el.find('.doby-grid-row:last-child').each(function () {
				expect($(this).height()).toEqual(1500);
			});
		});
	});


	// ==========================================================================================


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


		// ==========================================================================================


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


		// ==========================================================================================


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


		// ==========================================================================================


		it("should throw an error if attempting to addColumn() with 'id' that already exists", function () {
			var grid = resetGrid();

			var col_def = {
				id: "addColumnTest4",
				field: "addColumnTest4"
			};

			grid.addColumn(col_def);

			expect(function () {
				grid.addColumn(col_def);
			}).toThrow("Unable to addColumn() because a column with id '" + col_def.id + "' already exists. Did you want to {merge: true} maybe?");
		});


		// ==========================================================================================


		it("should throw an error if attempting to addColumn() with non data objects", function () {
			var grid = resetGrid();

			var bad_data = [[], 'asd', 123, document.body];
			_.each(bad_data, function (bd) {
				expect(function () {
					grid.addColumn(bd);
				}).toThrow("Unable to addColumn() because the given 'data' param is invalid.");
			});
		});
	});


	// ==========================================================================================


	describe("addGrouping()", function () {
		it("should throw an error if attempt to addGrouping() by null", function () {
			var grid = resetGrid();
			expect(function () {
				grid.addGrouping();
			}).toThrow("Unable to add grouping to grid because the 'column_id' value is missing.");
		});


		// ==========================================================================================


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


		// ==========================================================================================


		it("should be able to create nested groups with multiple addGrouping() calls", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID'
				}, {
					aggregator: function (column) {
						this.formatter = function () { return "test"; };
						this.process = function (item) {};
					},
					id: 'category',
					name: 'Category',
					field: 'cateogory'
				}, {
					aggregator: function (column) {
						this.formatter = function () { return "test"; };
						this.process = function (item) {};
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

			// Reset
			grid.setGrouping();
		});
	});


	// ==========================================================================================


	describe("appendTo()", function () {
		it("should append the grid to a container via appendTo()", function () {
			var grid = resetGrid();
			var fixture = setFixtures('<div class="test"></div>');
			grid.appendTo(fixture);
			expect(fixture).toContain('div.doby-grid');
		});


		// ==========================================================================================


		it("should return a DobyGrid object via appendTo()", function () {
			var grid = resetGrid();
			var fixture = setFixtures('<div class="test"></div>');
			grid.appendTo(fixture);
			expect(grid instanceof DobyGrid).toEqual(true);
			expect(typeof grid).toEqual('object');
		});
	});


	// ==========================================================================================


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


		// ==========================================================================================


		it("should be able to get() model by reference", function () {
			var item = {data: {id: 103, name: 'updated'}, id: 103};
			var grid = resetGrid({
				data: [item]
			});

			// Validate
			var gotten = grid.get({data: {id: 103, name: 'updated'}, id: 103});
			expect(gotten.data.id).toEqual(103);
		});
	});


	// ==========================================================================================


	describe("reset()", function () {
		it("should be able to reset() the grid with a new set of data", function () {
			var grid = resetGrid();
			var newdata = [{data: {id: 1, name: 'test'}, id: 1}, {data: {id: 2, name: 'test2'}, id: 2}];
			grid = grid.reset(newdata);
			expect(grid.collection.items).toEqual(newdata);
		});


		// ==========================================================================================


		it("should be able to empty the grid via reset()", function () {
			var grid = resetGrid({emptyNotice: false});
			grid = grid.reset();
			expect(grid.collection.items).toEqual([]);
		});


		// ==========================================================================================


		it("should re-render rows with the same id when using reset()", function () {
			var grid = resetGrid({columns: [{id: 'test', field: 'name'}]});
			grid.add({id: 1, data: {name: "bob"}});
			grid.reset([{id: 1, data: {name: "steve"}}]);
			var cell = grid.$el.find('.doby-grid-cell').first();
			expect(cell.html()).toEqual("steve");
		});


		// ==========================================================================================


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


		// ==========================================================================================


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


	// ==========================================================================================


	describe("remove()", function () {
		it("should be able to remove() an item from the grid", function () {
			var newdata = [{data: {id: 1, name: 'test'}, id: 1}, {data: {id: 2, name: 'test2'}, id: 2}];
			var grid = resetGrid({
				data: newdata
			});

			grid = grid.remove(2);
			expect(grid.collection.items).toEqual([newdata[0]]);
		});


		// ==========================================================================================


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
	});


	// ==========================================================================================


	describe("selectCells()", function () {
		it("should be able to selectCells()", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'id', field: 'name', name: 'name'}
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


		// ==========================================================================================


		it("should be able to deselect all cells with an empty selectCells() call", function () {
			// Prepare for test
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'id', field: 'name', name: 'name'}
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


	// ==========================================================================================


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


		// ==========================================================================================


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
	});


	// ==========================================================================================


	describe("setOptions()", function () {
		it("should be able to reload data using setOptions()", function () {
			var grid = resetGrid();

			grid.setOptions({
				data: [{data: {id: 189, name: 'test'}, id: 189}, {data: {id: 289, name: 'test2'}, id: 289}]
			});

			expect(_.pluck(grid.collection.items, 'id')).toEqual([189, 289]);
		});


		// ==========================================================================================


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
	});


	// ==========================================================================================


	describe("destroy()", function () {
		it("should be able to destroy() the grid", function () {
			var grid = resetGrid();
			grid.destroy();
			expect(grid.$el).toEqual(null);
		});
	});

});