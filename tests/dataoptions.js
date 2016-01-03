// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, DobyGrid*/

describe("Data Options", function () {
	"use strict";


	// Disable underscore's debounce until https://github.com/pivotal/jasmine/pull/455 is fixed
	_.debounce = function (func) { return function () { func.apply(this, arguments);}; };


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
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.class).not.toBeDefined();
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


		// ==========================================================================================


		it("should be able to use a class function", function () {
			var myFunction = function (row, data) {
				return [row, data.id].join('-');
			}, data = [
				{data: {id: 189, name: 'test'}, id: 189, class: myFunction},
				{data: {id: 289, name: 'test2'}, id: 289, class: myFunction}
			], grid = resetGrid($.extend(defaultData(), {
				data: data
			}));

			grid.$el.find('.doby-grid-row').each(function (row) {
				expect($(this)).toHaveClass([
					row, grid.collection.items[row].id
				].join('-'));
			});
		});
	});


	// ==========================================================================================


	describe("options.columns", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.columns).not.toBeDefined();
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
						id: {
							formatter: function () {
								return "Success 0";
							}
						}
					}
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2,
					columns: {
						id: {
							formatter: function () {
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
						id: {
							colspan: "*"
						}
					}
				}, {
					data: {id: 2, name: 'test 1', city: 'asd 1', country: '123 1'},
					id: 2,
					columns: {
						id: {
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

				cells.each(function () {
					expect($(this).text()).toEqual((row + 1).toString());
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.data", function () {
		it("should be an empty array by default", function () {
			var grid = new DobyGrid();
			expect(grid.collection.items).toEqual([]);
		});
	});


	// ==========================================================================================


	describe("options.editable", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.editable).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should override any grid or column editable states for the cell", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id', editable: true},
					{id: 'name', field: 'name', name: 'name', editable: true}
				],
				data: [
					{data: {id: 189, name: 'test'}, id: 189, editable: true},
					{data: {id: 289, name: 'test2'}, id: 289, editable: false}
				],
				editable: true
			});

			var rows = grid.$el.find('.doby-grid-row');

			rows.each(function (i) {
				$(this).children('.doby-grid-cell').each(function () {
					if (i === 0) {
						// Make sure all cells in first row are editable
						$(this).simulate("dblclick");
						expect($(this)).toContainElement("input");
					} else {
						// But all cells in second row are not
						$(this).simulate("dblclick");
						expect($(this)).not.toContainElement("input");
					}
				});
			});

		});

	});


	// ==========================================================================================


	describe("options.exporter", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.exporter).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should be used for formatting data during data export", function (done) {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [{
					data: {id: 1, name: 'test 0'},
					id: 1,
					exporter: function (columnDef, data) {
						return "My Special Value " + columnDef.id + data.id;
					}
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2
				}]
			});

			// Export
			var result;
			grid.export('csv', function (r) {
				result = r;
				expect(result).toEqual('"id","name"\n"My Special Value id1","My Special Value name1"\n"2","test 1"');
				done();
			});
		});
	});


	// ==========================================================================================


	describe("options.focusable", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.focusable).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should not allow given cells to be activated when enabled", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [{
					data: {id: 1, name: 'test 0'},
					id: 1,
					focusable: false
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2
				}]
			});

			grid.$el.find('.doby-grid-row').each(function (row) {
				$(this).find('.doby-grid-cell').each(function (cell) {
					// Attempt to activate unfocusable row
					grid.activate(row, cell);

					if (row === 0) {
						// Expect nothing to get activated
						expect(grid.active).toEqual(null);
						expect($(this).attr('class')).not.toContain('active');
					} else {
						expect(grid.active.cell).toEqual(cell);
						expect(grid.active.row).toEqual(row);
						expect($(this).attr('class')).toContain('active');
					}
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.height", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.height).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should correctly render different heights for each row", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [{
					data: {id: 1, name: 'test 0'},
					id: 1,
					height: 50
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2,
					height: 100
				}]
			});

			grid.$el.find('.doby-grid-row').each(function (row) {
				expect($(this).height()).toEqual(grid.options.data[row].height);
			});
		});


		// ==========================================================================================


		it("should correctly handle the row metadata processing for group rows when in variable height mode", function () {
			// Reset
			var grid = resetGrid({
				columns: [{
					id: "id",
					name: "ID",
					field: "id"
				}, {
					id: "name",
					name: "Name",
					field: "name"
				}, {
					id: "category",
					name: "Category",
					field: "category"
				}],
				data: [
					{data: {id: 1, name: 'Asd3', category: 'a'}, id: 1, height: 50},
					{data: {id: 2, name: 'Asd2', category: 'b'}, id: 2, height: 100},
					{data: {id: 3, name: 'Asd1', category: 'b'}, id: 3, height: 150}
				]
			});

			// Group
			grid.setGrouping([{
				column_id: 'category'
			}]);

			// Make sure row has the right height
			grid.$el.find('.doby-grid-row:first-child').each(function () {
				expect($(this).height()).not.toEqual(50);
			});
		});


		// ==========================================================================================


		it("should correctly reset the canvas height when variable row height grids are grouped", function () {
			// Reset
			var data = _.map(_.range(0, 100), function (i) {
				return {
					data: {
						id: i,
						name: 'Asd' + i,
						category: _.sample(['a', 'b', 'c'])
					},
					id: i,
					height: _.sample([50, 100, 150, 200, 250])
				};
			});

			var grid = resetGrid({
				columns: [{
					id: "id",
					name: "ID",
					field: "id"
				}, {
					id: "name",
					name: "Name",
					field: "name"
				}, {
					id: "category",
					name: "Category",
					field: "category"
				}],
				data: data
			});

			// Check to make sure the canvas height is correct
			var rowheights = _.reduce(data, function (a, b) {
				return (a.height ? a.height : a) + b.height;
			});

			expect(grid.$el.find('.doby-grid-canvas').height()).toEqual(rowheights + data.length - 1);

			// Group
			grid.setGrouping([{
				column_id: 'id'
			}]);

			// Check to make sure the canvas height is correct
			expect(grid.$el.find('.doby-grid-canvas').height()).toEqual(data.length * grid.options.rowHeight + data.length - 1);
		});


		// ==========================================================================================


		it("should be able to define a height via function", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [{
					data: {id: 1, name: 'test 0'},
					id: 1,
					height: function () {
						return 50;
					}
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2,
					height: function () {
						return 100;
					}
				}]
			});

			grid.$el.find('.doby-grid-row').each(function (row) {
				expect($(this).height()).toEqual((row + 1) * 50);
			});
		});
	});


	// ==========================================================================================


	describe("options.resizable", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.resizable).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should correctly prevent row resizing when enabled", function () {
			var grid = resetGrid({
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'}
				],
				data: [{
					data: {id: 1, name: 'test 0'},
					id: 1,
					resizable: false
				}, {
					data: {id: 2, name: 'test 1'},
					id: 2,
					height: 100
				}],
				resizableRows: true
			});

			grid.$el.find('.doby-grid-row').each(function (row) {
				if (row === 0) {
					// Make sure handle is not available
					expect($(this).find('.doby-grid-row-handle').length).toEqual(0);
				} else {
					// Make sure handle is available
					expect($(this).find('.doby-grid-row-handle').length).toEqual(1);
				}
			});
		});
	});


	// ==========================================================================================


	describe("options.rows", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.rows).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should correctly render multiple rows when using nested rows", function () {
			var grid = resetGrid({
				columns: [{id: 'name', field: 'name'}, {id: 'category', field: 'category'}],
				data: [{
					data: {name: 'test1', category: 'a'},
					id: 1,
					rows: {
						0: {data: {name: 'test2', category: 'b'}, id: 2},
						1: {data: {name: 'test3', category: 'c'}, id: 3}
					}
				}]
			});

			// Make sure row has the right height
			var rows = grid.$el.find('.doby-grid-row');
			expect(rows.length).toEqual(3);
			expect(rows.first().children('.doby-grid-cell').first().html()).toEqual("test1");
			expect(rows.last().children('.doby-grid-cell').last().html()).toEqual("c");
		});


		// ==========================================================================================


		it("should correctly render recursively nested rows", function () {
			// Build an appropriate data set
			var data = [],
				formatter1 = function () {
					return '-Nested Level 1';
				},
				formatter2 = function () {
					return '--Nested Level 2';
				};

			for (var i = 0; i < 10; i++) {
				data.push({
					id: 'test_' + i,
					data: {
						id: 'test_' + i
					},
					rows: {
						0: {
							columns: {
								0: {
									colspan: "*",
									formatter: formatter1
								}
							},
							rows: {
								0: {
									colspan: "*",
									formatter: formatter2
								}
							}
						}
					}
				});
			}

			var grid = resetGrid($.extend(defaultData(), {
				columns: [{
					id: 'id',
					field: 'id'
				}],
				data: data
			}));

			// Check to make sure rows are rendered in the right order.
			var rows = _.sortBy(grid.$el.find('.doby-grid-row'), function (row) {
				return parseInt($(row).attr('style').replace('top:', ''), 10);
			});

			_.each(rows, function (row, i) {
				if (i === 0) {
					expect($(row).children('.l0')).toHaveText('test_0');
				} else if (i == 1) {
					expect($(row).children('.l0')).toHaveText('-Nested Level 1');
				} else if (i == 2) {
					expect($(row).children('.l0')).toHaveText('--Nested Level 2');
				}
			});
		});


		// ==========================================================================================


		it("should correctly calculate row diffs when using many nested rows", function () {
			var grid = resetGrid($.extend(defaultData(), {
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
				data: [{
					id: 1,
					data: {
						id: 1,
						name: 'row1',
						group: 'a'
					},
					rows: {
						0: {
							collapsed: true,
							id: 2,
							data: {
								id: 2,
								name: 'subrow2'
							}
						},
						1: {
							id: 3,
							data: {
								id: 3,
								name: 'subrow3'
							}
						}
					}
				}, {
					id: 4,
					data: {
						id: 4,
						name: 'row2',
						group: 'a'
					},
					rows: {
						0: {
							collapsed: true,
							id: 5,
							data: {
								id: 5,
								name: 'subrow6'
							}
						},
						1: {
							id: 6,
							data: {
								id: 6,
								name: 'subrow7'
							}
						}
					}
				}]
			}));


			// Group rows to force a row recalc
			grid.setGrouping([{column_id: 'group', collapsed: false}]);

			// Make sure all rows are rendered
			var rowsData = [];
			grid.$el.find('.doby-grid-row:not(.doby-grid-group) .r1').each(function () {
				rowsData.push($(this).text());
			});

			expect(rowsData).toEqual(['row1', 'subrow3', 'row2', 'subrow7']);
		});
	});


	// ==========================================================================================


	describe("options.selectable", function () {
		it("should be undefined by default", function () {
			var grid = resetGrid(defaultData());
			_.each(grid.collection.items, function (item) {
				expect(item.selectable).toEqual(undefined);
			});
		});


		// ==========================================================================================


		it("should not allow enabled row to be selectable", function () {
			var grid = resetGrid({
				columns: [{id: 'name', field: 'name'}, {id: 'category', field: 'category'}],
				data: [{
					data: {name: 'test1', category: 'a'},
					id: 1,
					selectable: false
				}, {
					data: {name: 'test2', category: 'b'},
					id: 2
				}]
			});

			// Attempt to select the unselectable row
			grid.selectCells(0, 0, 0, 1);

			// Should do nothing
			expect(grid.selection).toEqual(null);

			// But second row selection should be fine
			grid.selectCells(1, 0, 1, 1);
			expect(grid.selection.length).toEqual(1);
		});
	});
});