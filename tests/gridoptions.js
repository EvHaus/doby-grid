// (c) 2014 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global _, $, Backbone, document, DobyGrid, Image */

describe("Grid Options", function () {
	"use strict";


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
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;height:500px;width:500px');

		grid.appendTo(fixture);
		return grid;
	};


	// ==========================================================================================


	describe("options.activeFollowsPage", function () {
		it("should be disabled by default", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			expect(grid.options.activeFollowsPage).toEqual(false);
		});


		// ==========================================================================================


		it("should change the active cell when page jumped when enabled", function () {
			// Prepare for test
			var data = [];
			for (var i = 0; i < 100; i++) {
				data.push({data: {id: i, name: 'test'}, id: 189});
			}
			var grid = resetGrid($.extend(defaultData(), {
				activeFollowsPage: true,
				data: data
			}));

			// Activate a cell
			grid.$el.find('.doby-grid-cell:first').first().click();

			// Grab the active cell
			var prevActive = grid.active.row;
			expect(grid.active.cell).toEqual(0);
			expect(grid.active.row).toEqual(0);

			// Scroll page down
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 34});

			// Expect active cell to change
			expect(grid.active.row).not.toEqual(prevActive);
		});


		// ==========================================================================================


		it("should not change the active cell when page jumped when disabled", function () {
			// Prepare for test
			var data = [];
			for (var i = 0; i < 100; i++) {
				data.push({data: {id: i, name: 'test'}, id: 189});
			}
			var grid = resetGrid($.extend(defaultData(), {
				activeFollowsPage: true,
				data: data
			}));

			// Activate a cell
			grid.$el.find('.doby-grid-cell:first').first().click();

			// Grab the active cell
			var prevActive = grid.active.row;
			expect(grid.active.cell).toEqual(0);
			expect(grid.active.row).toEqual(0);

			// Scroll page down
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {which: 34});

			// Expect active cell to change
			expect(grid.active.row).toEqual(prevActive);
		});
	});


	// ==========================================================================================


	describe("options.activateSelection", function () {
		it("should be enabled by default", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			expect(grid.options.activateSelection).toEqual(true);
		});


		// ==========================================================================================


		it("should set an active cell with options.activateSelection enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				activateSelection: true,
				selectable: true
			}));

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:first');

			// Get the drag delta from the first cell
			var dy = firstcell.position().top - lastcell.position().top + lastcell.height();

			// Simulate a click and drag on the cell ranges
			firstcell.simulate('drag', {dx: 0, dy: dy});

			// Expect the first and last cells to be selected
			expect(grid.selection.length).toBeGreaterThan(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);

			// Expect active cell to be selected
			expect(grid.active.row).toEqual(1);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should not set an active cell with options.activateSelection disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				activateSelection: false
			}));

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:first');

			// Get the drag delta from the first cell
			var dy = lastcell.position().top - lastcell.position().top + lastcell.height();

			// Simulate a click and drag on the cell ranges
			firstcell.simulate('drag', {dx: 0, dy: dy});

			// Expect the first and last cells to be selected
			expect(grid.selection.length).toBeGreaterThan(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);

			// Expect no active cell be selected
			expect(grid.active).toEqual(null);
		});
	});


	// ==========================================================================================


	describe("options.addRow", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.addRow).toEqual(false);
		});


		// ==========================================================================================


		it("should render a special row at the end of the grid when using options.addRow", function () {
			// Prepare data for test
			var grid = resetGrid($.extend(defaultData(), {
				addRow: true,
				data: [{data: {id: 1, name: "one"}, id: 1}, {data: {id: 2, name: "two", category: "asd"}, id: 2}],
				editable: true
			}));

			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').each(function () {
				expect(this).toBeEmpty();
			});

			// Disable to prevent conflict with other tests
			grid.setOptions({addRow: false, editable: false});

			// Make sure row is removed
			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').each(function () {
				expect(this).not.toBeEmpty();
			});
		});
	});


	// ==========================================================================================


	describe("options.asyncEditorLoadDelay and options.asyncEditorLoading", function () {
		it("options.asyncEditorLoadDelay should be 100 by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.asyncEditorLoadDelay).toEqual(100);
		});


		// ==========================================================================================


		it("options.asyncEditorLoading should be false by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.asyncEditorLoading).toEqual(false);
		});


		// ==========================================================================================


		it("should draw a cell editor immediately if options.asyncEditorLoading is disabled", function () {
			// Prepare data for test
			var grid = resetGrid($.extend(defaultData(), {
				asyncEditorLoading: false,
				editable: true
			}));

			// Find the first cell
			var firstCell = grid.$el.find('.doby-grid-cell:first').first();

			// Double-click a cell to enable editor
			firstCell.simulate('dblclick');

			// Nothing should happen immediately
			expect(firstCell.find('input').length).toEqual(1);
		});


		// ==========================================================================================


		it("should correctly delay the editor loading", function () {
			var delay = 500;

			// Prepare data for test
			var grid = resetGrid($.extend(defaultData(), {
				asyncEditorLoading: true,
				asyncEditorLoadDelay: delay,
				editable: true
			}));

			// Find the first cell
			var firstCell = grid.$el.find('.doby-grid-cell:first').first(),
				originalValue = firstCell.html();

			// Double-click a cell to enable editor
			firstCell.simulate('dblclick');

			// Nothing should happen immediately
			expect(firstCell.html()).toEqual(originalValue);

			waitsFor(function () {
				return firstCell.find('input').length;
			}, "Cell editor was never generated.", delay);

			runs(function () {
				expect(firstCell.find('input').length).toEqual(1);
			});
		});
	});


	// ==========================================================================================


	describe("options.asyncPostRenderDelay", function () {
		it("should be 25 by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.asyncPostRenderDelay).toEqual(25);
		});


		// ==========================================================================================


		it("options.asyncPostRenderDelay should correctly affect the delay of postprocess", function () {
			var delay = 500;

			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				asyncPostRenderDelay: delay,
				columns: [{
					id: 'postprocess',
					name: 'postprocess',
					postprocess: function (data, callback) {
						var img = new Image();
						data.$cell.html(img);
						callback();
					}
				}]
			}));

			// Expect cells to be empty at first
			var cells = grid.$el.find('.doby-grid-cell');
			_.each(cells, function (cell) {
				expect($(cell).html()).toEqual('');
			});

			// But expect an image to be there after the delay
			waitsFor(function () {
				return cells.last().find('img').length;
			}, "Postprocessor never generated an image", (delay * cells.length));

			runs(function () {
				// Expect cells to have an image
				var cells = grid.$el.find('.doby-grid-cell');
				_.each(cells, function (cell) {
					expect($(cell).find('img').length).toEqual(1);
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.autoColumnWidth", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.autoColumnWidth).toEqual(false);
		});


		// ==========================================================================================


		it("should correctly have columns fill up the width of viewport when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				autoColumnWidth: true
			}));

			// Get column elements
			var headerEls = grid.$el.find('.doby-grid-header-column'),
				cellEls = grid.$el.find('.doby-grid-row:first .doby-grid-cell'),
				canvas = grid.$el.find('.doby-grid-canvas');

			var columnsW = [],
				headerW = [],
				cellsW = [],
				canvasW = canvas.width();

			// Collect widths
			_.each(grid.options.columns, function (c) { columnsW.push(c.width); });
			headerEls.each(function () { headerW.push($(this).outerWidth()); });
			cellEls.each(function () { cellsW.push($(this).outerWidth()); });

			// Calculate sums
			columnsW = columnsW.reduce(function (a, b) { return a + b; });
			headerW = headerW.reduce(function (a, b) { return a + b; });
			cellsW = cellsW.reduce(function (a, b) { return a + b; });

			// Account for cell spacing
			headerW += grid.options.columns.length;
			columnsW += grid.options.columns.length;
			cellsW -= grid.options.columns.length;

			// Expect widths to be correct for headers and cells
			expect(columnsW).toEqual(canvasW);
			expect(headerW).toEqual(canvasW);
			expect(cellsW).toEqual(canvasW);
		});
	});


	// ==========================================================================================


	describe("options.autoDestroy", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.autoDestroy).toEqual(true);
		});


		// ==========================================================================================


		it("should correctly call destroy() when enabled", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Main element should exist
			expect(grid.$el).toBeDefined();

			// Remove parent
			grid.$el.parent().remove();

			// Main element should not exist
			expect(grid.$el).toEqual(null);
		});


		// ==========================================================================================


		it("should not call destroy() when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {autoDestroy: false}));

			// Main element should exist
			expect(grid.$el).toBeDefined();

			// Remove parent
			grid.$el.parent().remove();

			// Main element should not exist
			expect(grid.$el).not.toEqual(null);
		});
	});


	// ==========================================================================================


	describe("options.autoEdit", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.autoEdit).toEqual(true);
		});


		// ==========================================================================================


		it("should create an editor on single click when autoEdit is enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {editable: true}));

			// Find the first cell
			var firstCell = grid.$el.find('.doby-grid-cell:first').first();

			// Double-click a cell to enable editor
			firstCell.simulate('click');

			// Nothing should happen immediately
			expect(firstCell.find('input').length).toEqual(1);
		});
	});


	// ==========================================================================================


	describe("options.autoHeight", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.autoHeight).toEqual(false);
		});


		// ==========================================================================================


		it("should cause the grid's container to grow when adding rows", function () {
			var grid = resetGrid({
				autoHeight: true
			});

			grid.add({id: 1, data: {id: 1}});

			waitsFor(function () {
				return grid.$el.find('.doby-grid-row').length === 1;
			}, 100);

			var oldHeight;

			runs(function () {
				oldHeight = grid.$el.height();
				grid.add({id: 2, data: {id: 2}});
			});

			waitsFor(function () {
				return grid.$el.find('.doby-grid-row').length === 2;
			}, 100);

			runs(function () {
				var newHeight = grid.$el.height();
				expect(oldHeight).toBeLessThan(newHeight);
			});
		});
	});


	// ==========================================================================================


	describe("options.class", function () {
		it("should correctly apply classes to the grid element", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {class: 'one two three'}));

			expect(grid.$el.hasClass('one')).toEqual(true);
			expect(grid.$el.hasClass('two')).toEqual(true);
			expect(grid.$el.hasClass('three')).toEqual(true);
		});
	});


	// ==========================================================================================


	describe("options.clipboard", function () {
		it("should be able to convert selected data to CSV and JSON", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Select some cells
			grid.selectCells(0, 0, 1, 1);

			// Convert selection to JSON
			var jaysun = grid.selection[0].toJSON();
			expect(jaysun).toEqual([[189, 'test'], [289, 'test2']]);

			// Convert selection to CSV
			var csv = grid.selection[0].toCSV();
			expect(csv).toEqual('"189","test"\n"289","test2"');
		});


		// ==========================================================================================


		it("should save data to user's clipboard on Ctrl + C", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Select some cells
			grid.selectCells(0, 0, 1, 1);

			// Make sure we're focused on the canvas
			grid.$el.find('.doby-grid-canvas').focus();

			// Simulate Ctrl + C
			var press = $.Event('keydown');
			press.ctrlKey = true;
			press.which = 67;
			grid.$el.find('.doby-grid-canvas').trigger(press);

			// Since we don't have access the actual clipboard, the
			// best we can do here is check to make sure the clipboard element was created and focused
			var clippy = grid.$el.find('.doby-grid-clipboard');
			expect(clippy).toBeDefined();
			expect(clippy.length).toEqual(1);
			expect(clippy[0]).toEqual(document.activeElement);
		});


		// ==========================================================================================


		it("should throw an alert when trying to copy multiple selections", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Select some cells
			grid.selectCells(0, 0, 0, 1);

			// Duplicate selection
			grid.selection.push(grid.selection[0]);

			// Replace 'alert' for a second
			var alertSpy = spyOn(window, "alert");

			// Simulate Ctrl + C
			var press = $.Event('keydown');
			press.ctrlKey = true;
			press.which = 67;
			grid.$el.find('.doby-grid-canvas').trigger(press);

			expect(alertSpy).toHaveBeenCalledWith('Sorry, you cannot copy multiple selections.');
		});
	});


	// ==========================================================================================


	describe("options.collapsible", function () {
		it("should be true by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.collapsible).toEqual(true);
		});


		// ==========================================================================================


		it("should not allow you to expand groups if disabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				collapsible: false,
				columns: [{
					id: 'id',
					field: 'id',
					name: 'id'
				}, {
					id: 'name',
					field: 'name',
					name: 'name'
				}]
			}));

			// Add grouping by Name, then by Id
			grid.addGrouping('name');

			// The group row should not have a toggle class
			expect(grid.$el.find('.doby-grid-group')).not.toHaveClass('doby-grid-group-toggle');

			// Try to expand the first group
			var $grouptoggle = grid.$el.find('.doby-grid-group').first().children('.doby-grid-cell').first();
			$grouptoggle.simulate('click', {
				clientX: $grouptoggle.offset().left,
				clientY: $grouptoggle.offset().top
			});

			// Confirm that the group did not get expanded
			expect(grid.$el.find('.doby-grid-row:not(.doby-grid-group)').length).toEqual(0);
		});


		// ==========================================================================================


		it("should allow you to expand groups if enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				collapsible: true,
				columns: [{
					id: 'id',
					field: 'id',
					name: 'id'
				}, {
					id: 'name',
					field: 'name',
					name: 'name'
				}]
			}));

			// Add grouping by Name, then by Id
			grid.addGrouping('name');

			// The group row should not have a toggle class
			expect(grid.$el.find('.doby-grid-group')).toHaveClass('doby-grid-group-toggle');

			// Try to expand the first group
			var $grouptoggle = grid.$el.find('.doby-grid-group').first().children('.doby-grid-cell').first();
			$grouptoggle.simulate('click', {
				clientX: $grouptoggle.offset().left,
				clientY: $grouptoggle.offset().top
			});

			// Confirm that the group did not get expanded
			expect(grid.$el.find('.doby-grid-row:not(.doby-grid-group)').length).toEqual(1);
		});
	});


	// ==========================================================================================


	describe("options.columns", function () {
		it("should throw a TypeError if the given columns object is not an array", function () {
			var tp = new TypeError('The "columns" option must be an array.');
			expect(function () {
				new DobyGrid({
					columns: {}
				});
			}).toThrow(tp);
		});


		// ==========================================================================================


		it("should throw an exception if two columns have the same 'id' value", function () {
			var column = 'asd';
			var tp = new Error("You cannot have two columns with the same 'id' value. Please change one of the '" + column + "' column 'id' values.");
			expect(function () {
				new DobyGrid({
					columns: [
						{id: column},
						{id: column}
					]
				});
			}).toThrow(tp);
		});


		// ==========================================================================================


		it("should throw a TypeError if there are undefined or null column definition objects", function () {
			var tp = new TypeError("You have an 'undefined' column object in your Grid Options. This is not allowed.");
			expect(function () {
				new DobyGrid({
					columns: [
						{id: 1},
						undefined,
						{id: 2}
					]
				});
			}).toThrow(tp);

			tp = new TypeError("You have a 'null' column object in your Grid Options. This is not allowed.");
			expect(function () {
				new DobyGrid({
					columns: [
						{id: 1},
						null,
						{id: 2}
					]
				});
			}).toThrow(tp);
		});


		// ==========================================================================================


		it("should set the columns based given values", function () {
			var cols = [{
				id: 'one',
				name: 'One'
			}, {
				id: 'two',
				name: 'Two'
			}];

			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				columns: cols
			}));

			// Ensure correct name is set
			grid.$el.find('.doby-grid-column-name').each(function (i) {
				expect($(this).text()).toEqual(cols[i].name);
			});
		});


		// ==========================================================================================


		it("should render the expected number of column headers", function () {
			var grid = resetGrid();
			expect(grid.$el.find('.doby-grid-header-column').length).toEqual(grid.options.columns.length);
		});


		// ==========================================================================================


		it("should render the expected number of columns for every row", function () {
			var grid = resetGrid();
			expect(grid.$el.find('.doby-grid-row:first .doby-grid-cell').length).toEqual(grid.options.columns.length);
		});
	});


	// ==========================================================================================


	describe("options.columnWidth", function () {
		it("should be 80 by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.columnWidth).toEqual(80);
		});


		// ==========================================================================================


		it("should be correct affect default column width but not affect defined column widths", function () {
			var cols = [{
				id: 'one',
				name: 'One'
			}, {
				id: 'two',
				name: 'Two',
				width: 250
			}];

			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				autoColumnWidth: false,
				columns: cols,
				columnWidth: 100,
				forceFitColumns: false
			}));

			// Ensure correct values are set for headers
			grid.$el.find('.doby-grid-header-column').each(function (i) {
				if (i === 0) {
					expect(grid.options.columns[i].width).toEqual(100);
					expect($(this).outerWidth()).toEqual(100);
				} else if (i === 1) {
					expect(grid.options.columns[i].width).toEqual(250);
					expect($(this).outerWidth()).toEqual(250);
				}
			});

			// Ensure correct values are set for cells
			var w;
			grid.$el.find('.doby-grid-row').each(function () {
				$(this).children('.doby-grid-cell').each(function (i) {
					w = $(this).outerWidth() - parseInt($(this).css('borderLeftWidth'), 10) - parseInt($(this).css('borderRightWidth'), 10);

					if (i === 0) {
						expect(w).toEqual(100);
					} else if (i === 1) {
						expect(w).toEqual(250);
					}
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.contextMenu", function () {
		it("should be 'all' by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.contextMenu).toEqual('all');
		});


		// ==========================================================================================


		it("should display a dropdown menu on header right-click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {contextMenu: 'header'}));

			// Right-click on every columns and make sure the menu comes up
			grid.$el.find('.doby-grid-header-column').each(function (i) {
				$(this).simulate('contextmenu');

				// jquery.simulate doesn't actually propagate click events up the DOM
				// so dropdowns will accumulate. But that's okay for this test.
				expect($(document.body).find('.doby-grid-dropdown').length).toEqual(i + 1);
			});

			// Remove menu
			$(document.body).find('.doby-grid-dropdown').remove();
		});


		// ==========================================================================================


		it("should not display a dropdown menu header if right-click is disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {contextMenu: false}));

			// Right-click on every columns and make sure the menu comes up
			grid.$el.find('.doby-grid-header-column').each(function () {
				$(this).simulate('contextmenu');

				// Should be no dropdowns
				expect($(document.body).find('.doby-grid-dropdown').length).toEqual(0);
			});

			// Remove menu
			$(document.body).find('.doby-grid-dropdown').remove();
		});


		// ==========================================================================================


		it("should display a dropdown menu header anywhere when set to 'all'", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {contextMenu: 'all'}));

			// Right-click on every columns and make sure the menu comes up
			grid.$el.find('.doby-grid-cell:first').each(function () {
				$(this).simulate('contextmenu');

				// Should be no dropdowns
				expect($(document.body).find('.doby-grid-dropdown').length).toEqual(1);
			});

			// Remove menu
			$(document.body).find('.doby-grid-dropdown').remove();
		});
	});


	// ==========================================================================================


	describe("options.ctrlSelect", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.ctrlSelect).toEqual(true);
		});


		// ==========================================================================================


		it("should allow Ctrl+Click selection when enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {ctrlSelect: true}));

			// Get the number of columns and rows we have
			var cols = grid.options.columns.length,
				rows = grid.options.data.length;

			// Activate the first cell
			grid.activate(0, 0);

			var lastcell = grid.$el.find('.doby-grid-cell').last(),
				firstcell = grid.$el.find('.doby-grid-cell').first();

			// Ctrl-click on the last cell
			lastcell.simulate("click", {ctrlKey: true});

			// Expect to have two selection ranges
			expect(grid.selection.length).toEqual(2);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);
			expect(grid.selection[1].fromCell).toEqual(cols - 1);
			expect(grid.selection[1].fromRow).toEqual(rows - 1);
			expect(grid.selection[1].toCell).toEqual(cols - 1);
			expect(grid.selection[1].toRow).toEqual(rows - 1);
			expect(firstcell.attr('class')).toContain(grid.options.selectedClass);
			expect(lastcell.attr('class')).toContain(grid.options.selectedClass);
		});


		// ==========================================================================================


		it("should have only activate cell when Ctrl+Clicking on a cell with no prior active cell chosen", function () {
			var grid = resetGrid($.extend(defaultData(), {ctrlSelect: true}));

			var cell = grid.$el.find('.doby-grid-cell').first();

			// Ctrl+Click the first cell
			cell.simulate("click", {ctrlKey: true});

			// Expect to have no selection ranges and no cells styled
			expect(grid.selection).toEqual(null);
			expect(grid.active.cell).toEqual(0);
			expect(grid.active.row).toEqual(0);
			expect(cell.attr('class')).not.toContain(grid.options.selectedClass);
		});



		// ==========================================================================================


		it("should correctly destroy ranges when they become empty", function () {
			var grid = resetGrid($.extend(defaultData(), {ctrlSelect: true}));

			var cells = grid.$el.find('.doby-grid-cell');

			// Activate the first cell
			grid.activate(0, 0);

			// Ctrl+Click to select every cell
			cells.each(function () {
				$(this).simulate("click", {ctrlKey: true});
			});

			// Expect to have ranges for each cell
			expect(grid.selection.length).toEqual(cells.length);

			// Expect all cells to be styled correctly
			cells.each(function () {
				expect($(this).attr('class')).toContain(grid.options.selectedClass);
			});

			// Now Ctrl+Click to deselect every cell
			cells.each(function () {
				$(this).simulate("click", {ctrlKey: true});
			});

			// Expect there to be no selections
			expect(grid.selection).toEqual(null);
			cells.each(function () {
				expect($(this).attr('class')).not.toContain(grid.options.selectedClass);
			});
		});


		// ==========================================================================================


		it("should keep existing ranges styled correctly when adding new selections", function () {
			var grid = resetGrid($.extend(defaultData(), {
				ctrlSelect: true,
				columns: [
					{id: 'id', field: 'id', name: 'id'},
					{id: 'name', field: 'name', name: 'name'},
					{id: 'asd', field: 'asd', name: 'asd'}
				],
				data: [
					{data: {id: 189, name: 'test', asd: "asd"}, id: 189},
					{data: {id: 289, name: 'test2', asd: "asd"}, id: 289}
				]
			}));

			var rows = grid.$el.find('.doby-grid-row'),
				cells = grid.$el.find('.doby-grid-cell');

			// Activate the first cell
			grid.activate(0, 0);

			// Select everything but the last column
			grid.selectCells(0, 0, grid.options.data.length - 1, grid.options.columns.length - 2);

			var checkRange1 = function (exclude_first) {
				expect(grid.selection[0].fromCell).toEqual(0);
				expect(grid.selection[0].fromRow).toEqual(0);
				expect(grid.selection[0].toCell).toEqual(grid.options.columns.length - 2);
				expect(grid.selection[0].toRow).toEqual(grid.options.data.length - 1);
				rows.each(function (row) {
					$(this).find('.doby-grid-cell').each(function (cell) {
						if (cell === 2) return;
						if (exclude_first && row === 0 && cell === 0) {
							expect($(this).attr('class')).not.toContain(grid.options.selectedClass);
						} else {
							expect($(this).attr('class')).toContain(grid.options.selectedClass);
						}
					});
				});
			};

			// Check that everything got selected
			expect(grid.selection.length).toEqual(1);
			checkRange1();

			// Now Ctrl+Click to deselect a cell in the first range
			cells.first().simulate("click", {ctrlKey: true});

			// Make sure everything is deselected except that one cell
			expect(grid.selection.length).toEqual(1);
			checkRange1(true);

			// Now select the last cell in the grid via Ctrl+Click
			cells.last().simulate("click", {ctrlKey: true});

			// Make sure existing cell range is still selected and styled correctly
			expect(grid.selection.length).toEqual(2);
			checkRange1(true);
			expect(grid.selection[1].fromCell).toEqual(grid.options.columns.length - 1);
			expect(grid.selection[1].toCell).toEqual(grid.options.columns.length - 1);
			expect(grid.selection[1].fromRow).toEqual(grid.options.data.length - 1);
			expect(grid.selection[1].toRow).toEqual(grid.options.data.length - 1);

			// Now re-select the excluded cell
			cells.first().simulate("click", {ctrlKey: true});
			expect(grid.selection.length).toEqual(2);
			checkRange1();
		});
	});


	// ==========================================================================================


	describe("options.data", function () {
		it("should throw a TypeError if the given data object is not an array or a function", function () {
			var tp = new TypeError('The "data" option must be an array, a function or a Backbone.Collection.');
			expect(function () {
				new DobyGrid({
					data: {}
				});
			}).toThrow(tp);
		});


		// ==========================================================================================


		it("should throw a TypeError if the given data object has items with missing 'id's", function () {
			var tp = new TypeError("Each data item must have a unique 'id' key. The following item is missing an 'id': {\"test\":2}");
			expect(function () {
				new DobyGrid({
					data: [
						{test: 1, id: 'asd'},
						{test: 2}
					]
				});
			}).toThrow(tp);
		});


		// ==========================================================================================


		it("should be able to initialize grid with a Backbone.Collection data set", function () {
			resetGrid($.extend(defaultData(), {
				data: new Backbone.Collection()
			}));
		});
	});


	// ==========================================================================================


	describe("options.dataExtractor", function () {
		it("should correct affect all places where data values are pulled", function () {
			var value = "TEST-123";

			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				dataExtractor: function () {
					return value;
				}
			}));

			// Make sure all cells are using the right value
			grid.$el.find('.doby-grid-cell').each(function () {
				expect($(this).text()).toEqual(value);
			});

			// Group rows and make sure headers have the right value
			grid.addGrouping(grid.options.columns[0].id);
			grid.$el.find('.doby-grid-group-title').each(function () {
				expect($(this).text()).toContain(value);
			});
		});
	});


	// ==========================================================================================


	describe("options.deactivateOnRightClick", function () {
		it("should be false by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.deactivateOnRightClick).toEqual(false);
		});


		// ==========================================================================================


		it("should not deactivate cells on right-click when disabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				deactivateOnRightClick: false
			}));

			// Activate a cell
			grid.activate(0, 0);

			// Right-click on the cell
			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.simulate('contextmenu');

			// It should stay activated
			expect($cell).toHaveClass('active');

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});


		// ==========================================================================================


		it("should deactivate cells on right-click when enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				deactivateOnRightClick: true
			}));

			// Activate a cell
			grid.activate(0, 0);

			// Right-click on the cell
			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.simulate('contextmenu');

			// It should stay activated
			expect($cell).not.toHaveClass('active');

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});
	});


	// ==========================================================================================


	describe("options.editable", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.editable).toEqual(false);
		});


		// ==========================================================================================


		it("should not create an editor on double click when disabled", function () {
			// Prepare for test
			var grid = resetGrid(defaultData());

			// Find the first cell
			var firstCell = grid.$el.find('.doby-grid-cell:first').first();

			// Double-click a cell to enable editor
			firstCell.simulate('dblclick');

			// Nothing should happen immediately
			expect(firstCell.find('input').length).toEqual(0);
		});


		// ==========================================================================================


		it("should create an editor on double click when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {editable: true}));

			// Find the first cell
			var firstCell = grid.$el.find('.doby-grid-cell:first').first();

			// Double-click a cell to enable editor
			firstCell.simulate('dblclick');

			// Nothing should happen immediately
			expect(firstCell.find('input').length).toEqual(1);
		});
	});


	// ==========================================================================================


	describe("options.editorType", function () {
		it("should edit all selected cells when set to 'selection' (default setting)", function () {
			var grid = resetGrid($.extend(defaultData(), {editable: true}));

			var value = 'testing';

			// Select some cells
			grid.selectCells(0, 0, 1, 1);

			// Activate a cell
			grid.activate(1, 1);

			// Type something into the editor and hit Enter
			$(grid.active.node).simulate('click', {});
			var $input = $(grid.active.node).children('input');
			$input.attr('value', value);
			$input.simulate('keydown', {keyCode: 13});

			// Deactivate
			grid.activate();

			// All cells should say "testing".
			grid.$el.find('.doby-grid-cell').each(function () {
				expect($(this)).toHaveText(value);
			});
		});


		// ==========================================================================================


		it("should only edit the active cell when set to 'active'", function () {
			var grid = resetGrid($.extend(defaultData(), {editable: true, editorType: 'active'}));

			var value = 'testing';

			// Select some cells
			grid.selectCells(0, 0, 1, 1);

			// Activate a cell
			grid.activate(1, 1);

			// Type something into the editor and hit Enter
			$(grid.active.node).simulate('click', {});
			var $input = $(grid.active.node).children('input');
			$input.attr('value', value);
			$input.simulate('keydown', {keyCode: 13});

			// Deactivate
			grid.activate();

			// All cells should say "testing".
			grid.$el.find('.doby-grid-row').each(function (i) {
				var $cells = $(this).find('.doby-grid-cell');
				if (i === 0) {
					$cells.each(function () {
						expect($(this)).not.toHaveText(value);
					});
				} else {
					$cells.each(function (i) {
						if (i === 0) {
							expect($(this)).not.toHaveText(value);
						} else {
							expect($(this)).toHaveText(value);
						}
					});
				}
			});
		});


		// ==========================================================================================


		it("should not edit un-editable cells even if they're selected", function () {
			var grid = resetGrid($.extend(defaultData(), {
				columns: [
					{id: 'id', field: 'id', name: 'id', editable: false},
					{id: 'name', field: 'name', name: 'name'}
				],
				editable: true
			}));

			var value = 'testing';

			// Select cells across both columns
			grid.selectCells(0, 0, 1, 1);

			// Activate a cell
			grid.activate(1, 1);

			// Type something into the editor and hit Enter
			$(grid.active.node).simulate('click', {});
			var $input = $(grid.active.node).children('input');
			$input.attr('value', value);
			$input.simulate('keydown', {keyCode: 13});

			// Deactivate
			grid.activate();

			// Only second column cells should say "testing", the others should retain their id
			grid.$el.find('.doby-grid-row').each(function () {
				$(this).find('.doby-grid-cell').each(function (cell) {
					if (cell === 0) {
						expect($(this)).not.toHaveText(value);
					} else {
						expect($(this)).toHaveText(value);
					}
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.emptyNotice", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.emptyNotice).toEqual(true);
		});


		// ==========================================================================================


		it("should render an empty notice when there is no data", function () {
			// Ensure empty notice is on
			var grid = resetGrid({emptyNotice: true});

			// Empty the grid
			grid.reset();

			// Check to see if alert was rendered
			expect(grid.$el).toContain('.doby-grid-empty');
		});


		// ==========================================================================================


		it("should not group empty grids", function () {
			// Ensure empty notice is on
			var grid = resetGrid({
				columns: [{id: 'test'}],
				data: [],
				emptyNotice: true
			});

			grid.addGrouping('test');

			// Check to see if alert was rendered and no groups are rendered
			expect(grid.$el).toContain('.doby-grid-empty');
			expect(grid.$el).not.toContain('.doby-grid-group');
		});


		// ==========================================================================================


		it("should not group empty grids when using Backbone.Collection data", function () {
			// Ensure empty notice is on
			var grid = resetGrid({
				columns: [{id: 'test'}],
				data: new Backbone.Collection(),
				emptyNotice: true
			});

			grid.addGrouping('test');

			// Check to see if alert was rendered and no groups are rendered
			expect(grid.$el).toContain('.doby-grid-empty');
			expect(grid.$el).not.toContain('.doby-grid-group');
		});


		// ==========================================================================================


		it("should accept a function for custom empty notice HTML rendering", function () {
			// Ensure empty notice is on
			var html = "<span>Nothing to see here</span>",
				grid = resetGrid({
					columns: [],
					emptyNotice: function () {
						return html;
					}
				});

			// Check to see if alert was rendered and no groups are rendered
			expect(grid.$el).toContain('.doby-grid-empty');
			expect(grid.$el.find('.doby-grid-empty')).toHaveHtml(html);
		});
	});


	// ==========================================================================================


	describe("options.exportFileName", function () {
		it("should be 'doby-grid-export' by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.exportFileName).toEqual('doby-grid-export');
		});
	});


	// ==========================================================================================


	describe("options.formatter", function () {
		it("should correctly formater the cell values", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				formatter: function (row, cell, value) {
					return [row, cell, value].join('-');
				}
			}));

			// Make sure cells have the right values
			var value;
			grid.$el.find('.doby-grid-row').each(function (row) {
				$(this).find('.doby-grid-cell').each(function (cell) {
					value = grid.options.data[row].data[grid.options.columns[cell].id];
					expect($(this).text()).toEqual([row, cell, value].join('-'));
				});
			});
		});


		// ==========================================================================================


		it("should be bound to the grid's instance", function () {
			var scope = [],
				grid = resetGrid($.extend(defaultData(), {
				formatter: function (row, cell, value) {
					scope.push(this);
					return value;
				}
			}));

			_.each(scope, function (s) {
				expect(s).toEqual(grid);
			});
		});
	});


	// ==========================================================================================


	describe("options.fullWidthRows", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.fullWidthRows).toEqual(true);
		});


		// ==========================================================================================


		it("should be correctly extend the rows to the full width", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {fullWidthRows: true}));
			var viewport = grid.$el.find('.doby-grid-viewport:first').first(),
				viewportW = viewport.width();

			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this).width()).toEqual(viewportW);
			});
		});


		// ==========================================================================================


		it("should be correctly set the width to the cell widths when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {fullWidthRows: false})),
				cellWidths = (grid.options.columns.length * grid.options.columnWidth) + 2;

			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this).width()).toEqual(cellWidths);
			});
		});
	});


	// ==========================================================================================


	describe("options.groupable", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.groupable).toEqual(true);
		});


		// ==========================================================================================


		it("should throw an exception if attempting to use grouping functions with options.groupable disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {groupable: false}));

			expect(function () {
				grid.addGrouping(grid.options.columns[0].id);
			}).toThrow('Cannot execute "addGrouping" because "options.groupable" is disabled.');

			expect(function () {
				grid.setGrouping(grid.options.columns[0].id);
			}).toThrow('Cannot execute "setGrouping" because "options.groupable" is disabled.');
		});
	});


	// ==========================================================================================


	describe("options.idProperty", function () {
		it("should be 'id' by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.idProperty).toEqual('id');
		});


		// ==========================================================================================


		it("should use the given idProperty to identify rows", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				data: [{
					cid: 'test',
					data: {
						name: 'hello'
					}
				}],
				idProperty: 'cid'
			}));

			// Attempt to edit cell using setItem
			grid.setItem('test', {
				cid: 'test',
				data: {
					name: 'blah'
				}
			});
		});


		// ==========================================================================================


		it("should not affect the collapsing of groups", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				data: [{
					cid: 'test',
					data: {
						name: 'hello'
					}
				}],
				idProperty: 'cid'
			}));

			// Add grouping
			grid.setGrouping([{
				column_id: 'name'
			}]);

			// Click grouping header to toggle collapsing
			var $grouprow = grid.$el.find('.doby-grid-group .doby-grid-cell').first();
			$grouprow.trigger('click');
		});
	});


	// ==========================================================================================


	describe("options.keepNullsAtBottom", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.keepNullsAtBottom).toEqual(true);
		});


		// ==========================================================================================


		it("should sort nulls correctly when disabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				columns: [{id: 'test', field: 'test'}],
				data: [
					{id: 1, data: {id: 1, test: 'yes'}},
					{id: 2, data: {id: 2, test: null}}
				],
				keepNullsAtBottom: false
			}));

			// Sort by test column
			grid.sortBy('test', true);

			// Rows should sorted in the right direction
			var $rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			$($rows).each(function (i) {
				if (i === 0) {
					expect($(this)).toHaveText('');
				} else {
					expect($(this)).toHaveText('yes');
				}
			});

			// Flip wort
			grid.sortBy('test', false);

			// Rows should sorted in the right direction
			$rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			$($rows).each(function (i) {
				if (i === 0) {
					expect($(this)).toHaveText('yes');
				} else {
					expect($(this)).toHaveText('');
				}
			});
		});


		// ==========================================================================================


		it("should not sort nulls correctly when enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				columns: [{id: 'test', field: 'test'}],
				data: [
					{id: 1, data: {id: 1, test: 'yes'}},
					{id: 2, data: {id: 2, test: null}}
				],
				keepNullsAtBottom: true
			}));

			// Sort by test column
			grid.sortBy('test', true);

			// Rows should sorted in the right direction
			var $rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			$($rows).each(function (i) {
				if (i === 0) {
					expect($(this)).toHaveText('yes');
				} else {
					expect($(this)).not.toHaveText('yes');
				}
			});

			// Flip wort
			grid.sortBy('test', false);

			// Rows should sorted in the right direction
			$rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			$($rows).each(function (i) {
				if (i === 0) {
					expect($(this)).toHaveText('yes');
				} else {
					expect($(this)).not.toHaveText('yes');
				}
			});
		});
	});


	// ==========================================================================================


	describe("options.keyboardNavigation", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.keyboardNavigation).toEqual(true);
		});


		// ==========================================================================================


		it("should activate cell on the right on 'right' click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {keyboardNavigation: true}));

			// Activate the first cell
			grid.activate(0, 0);

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 39});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(1);
		});


		// ==========================================================================================


		it("should activate cell on the right on 'right' click when cell is editable", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				editable: true,
				keyboardNavigation: true
			}));

			// Activate the first cell
			grid.$el.find('.doby-grid-cell:first').first().simulate('click');

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 39});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(1);
		});


		// ==========================================================================================


		it("should activate cell on the left on 'left' click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {keyboardNavigation: true}));

			// Activate the first cell
			grid.activate(0, 1);

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 37});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should activate cell on the left on 'left' click when cell is editable", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				editable: true,
				keyboardNavigation: true
			}));

			// Activate the second cell
			grid.$el.find('.doby-grid-cell:nth-child(2)').first().simulate('click');

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 37});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should activate cell on the bottom on 'down' click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {keyboardNavigation: true}));

			// Activate the first cell
			grid.activate(0, 0);

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 40});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(1);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should activate cell on the bottom on 'down' click when cell is editable", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				editable: true,
				keyboardNavigation: true
			}));

			// Activate the second cell
			grid.$el.find('.doby-grid-cell:first').first().simulate('click');

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 40});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(1);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should activate cell on the top on 'up' click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {keyboardNavigation: true}));

			// Activate the first cell
			grid.activate(1, 0);

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 38});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should activate cell on the top on 'up' click when cell is editable", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				editable: true,
				keyboardNavigation: true
			}));

			// Activate the first cell on second row
			grid.$el.find('.doby-grid-row:nth-child(2) .doby-grid-cell:first').first().simulate('click');

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 38});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(0);

			// Ensure cell editor is focused
			expect($(grid.active.node).find('.doby-grid-editor')[0]).toEqual(document.activeElement);
		});


		// ==========================================================================================


		it("should activate cell on the right on 'tab' click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {keyboardNavigation: true}));

			// Activate the first cell
			grid.activate(0, 0);

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 9});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(1);
		});


		// ==========================================================================================


		it("should activate cell on the right on 'tab' click when cell is editable", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				editable: true,
				keyboardNavigation: true
			}));

			// Activate the first cell on second row
			grid.$el.find('.doby-grid-cell:first').first().simulate('click');

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {keyCode: 9});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(1);

			// Ensure cell editor is focused
			expect($(grid.active.node).find('.doby-grid-editor')[0]).toEqual(document.activeElement);
		});


		// ==========================================================================================


		it("should activate cell on the left on 'shift + tab' click", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {keyboardNavigation: true}));

			// Activate the first cell
			grid.activate(0, 1);

			// Shift+Tab
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {shiftKey: true, keyCode: 9});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(0);
		});


		// ==========================================================================================


		it("should activate cell on the left on 'shift + tab' click when cell is editable", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				editable: true,
				keyboardNavigation: true
			}));

			// Activate the first cell on second row
			grid.$el.find('.doby-grid-cell:nth-child(2)').first().simulate('click');

			// Go right
			grid.$el.find('.doby-grid-canvas').simulate('keydown', {shiftKey: true, keyCode: 9});

			expect(grid.active).toBeDefined();
			expect(grid.active.row).toEqual(0);
			expect(grid.active.cell).toEqual(0);

			// Ensure cell editor is focused
			expect($(grid.active.node).find('.doby-grid-editor')[0]).toEqual(document.activeElement);
		});


		// ==========================================================================================


		it("should always retain focus on the grid when 'shift + tabing' between editable and non-editable cells", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				columns: [
					{id: 'id', field: 'id', name: 'id', editable: false},
					{id: 'name', field: 'name', name: 'name'}
				],
				editable: true,
				keyboardNavigation: true
			}));

			// Clucj ib editable cell to activate it and set focus on editor
			grid.$el.find('.doby-grid-cell').last().simulate('click');

			var $canvas = grid.$el.find('.doby-grid-canvas');

			// Shift+Tab
			$canvas.simulate('keydown', {shiftKey: true, keyCode: 9});

			// 1, 0 should be selected
			expect(grid.active.row).toEqual(1);
			expect(grid.active.cell).toEqual(0);
			expect($(document.activeElement)).toEqual(grid.$el.find('.doby-grid-canvas'));
		});
	});


	// ==========================================================================================


	describe("options.lineHeightOffset", function () {
		it("should be -1 by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.lineHeightOffset).toEqual(-1);
		});
	});


	// ==========================================================================================


	describe("options.locale", function () {
		it("should be defined", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.locale).toBeDefined();
		});


		// ==========================================================================================


		it("should be able to override specific locale items", function () {
			var grid = resetGrid($.extend(defaultData(), {
				locale: {
					global: {
						grid_options: "Mama Mia!"
					}
				}
			}));

			// Simulate context click on the grid
			grid.$el.find('.doby-grid-cell:first').simulate('contextmenu');

			// Make sure the menu loaded
			expect($(document.body)).toContain('.doby-grid-dropdown');
			var $dropdown = $(document.body).find('.doby-grid-dropdown');

			expect($dropdown.find('.doby-grid-dropdown-title').eq(0)).toHaveText('Column Options');
			expect($dropdown.find('.doby-grid-dropdown-title').eq(1)).toHaveText('Mama Mia!');

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});
	});


	// ==========================================================================================


	describe("options.menuExtensions", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.menuExtensions).toEqual(null);
		});


		// ==========================================================================================


		it("should not fail to render defaults when supplied with an empty function", function () {
			var grid = resetGrid($.extend(defaultData(), {
				menuExtensions: function () {}
			}));

			// Simulate context click on the grid
			grid.$el.find('.doby-grid-cell:first').simulate('contextmenu');

			// Make sure the context menu comes up
			expect($(document.body)).toContain('.doby-grid-dropdown');

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});


		// ==========================================================================================


		it("should correctly render the given menuExtensions items in the context menu", function () {
			var grid = resetGrid($.extend(defaultData(), {
				menuExtensions: function () {
					return [{
						name: "Test"
					}];
				}
			}));

			// Simulate context click on the grid
			grid.$el.find('.doby-grid-cell:first').simulate('contextmenu');

			// Make sure the context menu comes up
			expect($(document.body)).toContain('.doby-grid-dropdown');

			var $dropdown = $(document.body).find('.doby-grid-dropdown:first');

			// Make sure the extension item is displayed at the end
			expect($dropdown.find('.doby-grid-dropdown-item').last()).toHaveText('Test');

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});
	});


	// ==========================================================================================


	describe("options.multiColumnSort", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.multiColumnSort).toEqual(true);
		});


		// ==========================================================================================


		it("should allow multi column selection via setSorting() when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {multiColumnSort: true}));

			var sort = [];
			_.each(grid.options.columns, function (col) {
				sort.push({
					columnId: col.id,
					sortAsc: true
				});
			});

			// Make sure we have multiple sort items
			expect(sort.length).toBeGreaterThan(1);

			// Apply sort
			grid.setSorting(sort);

			// Check sorting
			expect(grid.sorting).toEqual(sort);
		});


		// ==========================================================================================


		it("should not allow multi column selection via setSorting() when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {multiColumnSort: false}));

			var sort = [];
			_.each(grid.options.columns, function (col) {
				sort.push({
					columnId: col.id,
					sortAsc: true
				});
			});

			// Make sure we have multiple sort items
			expect(sort.length).toBeGreaterThan(1);

			// Apply sort
			expect(function () {
				grid.setSorting(sort);
			}).toThrow('Doby Grid cannot set the sorting given because "multiColumnSort" is disabled and the given sorting options contain multiple columns.');

			// Make sure sort isn't set
			expect(grid.sorting).not.toEqual(sort);
		});


		// ==========================================================================================


		it("should be able to add multi column sort by Shift+Clicking on column headers", function () {
			var grid = resetGrid({
				columns: [{
					id: 'id',
					name: 'ID',
					field: 'id'
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
					{data: {category: 'A', subcat: 'Q', id: 1}, id: 1},
					{data: {category: 'A', subcat: 'D', id: 2}, id: 2},
					{data: {category: 'B', subcat: 'A', id: 3}, id: 3}
				]
			});

			// Click on the column header to set sort direction
			var $header = grid.$el.find('.doby-grid-header-column[id*="category"]');
			$header.simulate('click');

			// Make sure the sorting object was updated
			expect(grid.sorting).toEqual([{columnId: "category", sortAsc: true}]);

			// Rows should sorted in the right direction
			var $rows = grid.$el.find('.doby-grid-row');
			expect($rows.eq(0).find('.doby-grid-cell.l0').first().text()).toEqual('1');
			expect($rows.eq(1).find('.doby-grid-cell.l0').first().text()).toEqual('2');
			expect($rows.eq(2).find('.doby-grid-cell.l0').first().text()).toEqual('3');

			// Add sort via Shift+Click on another column
			var $header2 = grid.$el.find('.doby-grid-header-column[id*="subcat"]');
			$header2.simulate('click', {shiftKey: true});

			// Make sure the sorting object was updated
			expect(grid.sorting).toEqual([{columnId: "category", sortAsc: true}, {columnId: "subcat", sortAsc: true}]);

			// Rows should sorted in the right direction
			$rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			expect($($rows[0]).find('.doby-grid-cell.l0').first().text()).toEqual('2');
			expect($($rows[1]).find('.doby-grid-cell.l0').first().text()).toEqual('1');
			expect($($rows[2]).find('.doby-grid-cell.l0').first().text()).toEqual('3');

			// Left-clicking again on first column, changes the sort direction
			$header.simulate('click');

			// Make sure the sorting object was updated
			expect(grid.sorting).toEqual([{columnId: "category", sortAsc: false}, {columnId: "subcat", sortAsc: true}]);

			// Rows should sorted in the right direction
			$rows = grid.$el.find('.doby-grid-row');

			// Make sure rows are in correct order
			$rows = _.sortBy($rows, function (i) {
				return parseInt($(i).css('top'), 10);
			});

			expect($($rows[0]).find('.doby-grid-cell.l0').first().text()).toEqual('3');
			expect($($rows[1]).find('.doby-grid-cell.l0').first().text()).toEqual('2');
			expect($($rows[2]).find('.doby-grid-cell.l0').first().text()).toEqual('1');
		});
	});


	// ==========================================================================================


	describe("options.nestedAggregators", function () {
		it("should correctly display aggregate rows when having nested groupings", function () {
			var grid = resetGrid($.extend(defaultData(), {
				columns: [{
					id: 'id',
					field: 'id',
					name: 'id',
					aggregators: [{
						fn: function () {
							this.formatter = function () { return "Aggregator"; };
							this.process = function () {};
							return this;
						}
					}]
				}, {
					id: 'name',
					field: 'name',
					name: 'name',
					aggregators: [{
						name: null,
						fn: function () {
							this.formatter = function () { return "Aggregator"; };
							this.process = function () {};
							return this;
						}
					}]
				}]
			}));

			// Add grouping by Name, then by Id
			grid.addGrouping('name');
			grid.addGrouping('id');

			// Make sure main grid aggregator row is still visible
			grid.$el.find('.doby-grid-row').last().children('.doby-grid-cell').each(function () {
				expect($(this)).toContainText('Aggregator');
			});

			// Expand the first group
			var $grouptoggle = grid.$el.find('.doby-grid-group-toggle').first().children('.doby-grid-cell').first();
			$grouptoggle.simulate('click', {
				clientX: $grouptoggle.offset().left,
				clientY: $grouptoggle.offset().top
			});

			// Confirm that the group got expanded
			expect(grid.$el.find('.doby-grid-row').length).toEqual(5);

			// There should now be two Aggregate rows. One for the grid, and one for the expanded group
			expect(grid.$el.find('.doby-grid-row-total').length).toEqual(2);

			// Expand the nested group
			$grouptoggle = $grouptoggle = grid.$el.find('.doby-grid-group-toggle').eq(1).children('.doby-grid-cell').first();
			$grouptoggle.simulate('click', {
				clientX: $grouptoggle.offset().left,
				clientY: $grouptoggle.offset().top
			});

			// Confirm that the group got expanded
			expect(grid.$el.find('.doby-grid-row').length).toEqual(7);

			// There should now be 3 aggregators (one for the main grid and one for each expanded group)
			expect(grid.$el.find('.doby-grid-row-total').length).toEqual(3);
		});


		// ==========================================================================================


		it("should only display deepest nested group aggregators when nestedAggregators is disabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				columns: [{
					id: 'id',
					field: 'id',
					name: 'id',
					aggregators: [{
						fn: function () {
							this.formatter = function () { return "Aggregator"; };
							this.process = function () {};
							return this;
						}
					}]
				}, {
					id: 'name',
					field: 'name',
					name: 'name',
					aggregators: [{
						name: null,
						fn: function () {
							this.formatter = function () { return "Aggregator"; };
							this.process = function () {};
							return this;
						}
					}]
				}],
				nestedAggregators: false
			}));

			// Add grouping by Name, then by Id
			grid.addGrouping('name');
			grid.addGrouping('id');

			// Make sure main grid aggregator row is still visible
			grid.$el.find('.doby-grid-row').last().children('.doby-grid-cell').each(function () {
				expect($(this)).toContainText('Aggregator');
			});

			// Expand the first group
			var $grouptoggle = grid.$el.find('.doby-grid-group-toggle').first().children('.doby-grid-cell').first();
			$grouptoggle.simulate('click', {
				clientX: $grouptoggle.offset().left,
				clientY: $grouptoggle.offset().top
			});

			// Confirm that the group got expanded
			expect(grid.$el.find('.doby-grid-row').length).toEqual(4);

			// There should still only be 1 aggregator (for the main grid)
			expect(grid.$el.find('.doby-grid-row-total').length).toEqual(1);

			// Expand the nested group
			$grouptoggle = $grouptoggle = grid.$el.find('.doby-grid-group-toggle').eq(1).children('.doby-grid-cell').first();
			$grouptoggle.simulate('click', {
				clientX: $grouptoggle.offset().left,
				clientY: $grouptoggle.offset().top
			});

			// Confirm that the group got expanded
			expect(grid.$el.find('.doby-grid-row').length).toEqual(6);

			// There should now be 2 aggregators (one for the main grid and one for the inner group)
			expect(grid.$el.find('.doby-grid-row-total').length).toEqual(2);
		});
	});


	// ==========================================================================================


	describe("options.quickFilter", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.quickFilter).toEqual(false);
		});


		// ==========================================================================================


		it("should display a new 'Quick Filter' menu option when enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				quickFilter: true
			}));

			// Right-click on every columns and make sure the menu comes up
			grid.$el.find('.doby-grid-header-column:first').first().simulate('contextmenu');

			var found = false;
			$(document.body).find('.doby-grid-dropdown .doby-grid-dropdown-item .doby-grid-dropdown-item').each(function () {
				if ($(this).text().indexOf('Quick Filter by') >= 0) {
					found = true;
				}
			});

			expect(found).toEqual(true);

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});


		// ==========================================================================================


		it("should display a 'Quick Filter' row when selected from the menu", function () {
			var grid = resetGrid($.extend(defaultData(), {
				quickFilter: true
			}));

			// Right-click on every columns and make sure the menu comes up
			grid.$el.find('.doby-grid-header-column:first').first().simulate('contextmenu');

			$(document.body).find('.doby-grid-dropdown .doby-grid-dropdown-item .doby-grid-dropdown-item').each(function () {
				if ($(this).text().indexOf('Quick Filter by') >= 0) {
					// Click on option
					$(this).simulate('click');
				}
			});

			expect(grid.$el).toContain('.doby-grid-header-filter');

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});


		// ==========================================================================================


		it("should display a 'Close Quick Filter' option when right-clicking on the Quick Filter row", function () {
			var grid = resetGrid($.extend(defaultData(), {
				quickFilter: true
			}));

			// Right-click on every columns and make sure the menu comes up
			grid.$el.find('.doby-grid-header-column:first').first().simulate('contextmenu');

			$(document.body).find('.doby-grid-dropdown .doby-grid-dropdown-item .doby-grid-dropdown-item').each(function () {
				if ($(this).text().indexOf('Quick Filter by') >= 0) {
					// Click on option
					$(this).simulate('click');
				}
			});

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();

			// Right-click on Quick Filter header
			$('.doby-grid-header-filter').simulate('contextmenu');

			var found = false;
			$(document.body).find('.doby-grid-dropdown .doby-grid-dropdown-item .doby-grid-dropdown-item').each(function () {
				if ($(this).text().indexOf('Hide Quick Filter') >= 0) {
					found = true;
				}
			});

			expect(found).toEqual(true);

			// Close dropdowns
			$(document.body).find('.doby-grid-dropdown').remove();
		});
	});


	// ==========================================================================================


	describe("options.resizableColumns", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.resizableColumns).toEqual(true);
		});


		// ==========================================================================================


		it("should draw resize handles for every column when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {resizableColumns: true}));

			// Check to make sure all columns have handles
			grid.$el.find('.doby-grid-header-column').each(function () {
				expect($(this).children('.doby-grid-resizable-handle').length).toEqual(1);
			});
		});


		// ==========================================================================================


		it("should draw resize handles for every column (execept the last) when enabled with options.autoColumnWidth enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				autoColumnWidth: true,
				resizableColumns: true
			}));

			// Check to make sure all columns have handles
			grid.$el.find('.doby-grid-header-column').each(function (i) {
				if (i < grid.options.columns.length - 1) {
					expect($(this).children('.doby-grid-resizable-handle').length).toEqual(1);
				} else {
					expect($(this).children('.doby-grid-resizable-handle').length).toEqual(0);
				}
			});
		});


		// ==========================================================================================


		it("should not draw resize handles when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				resizableColumns: false
			}));

			// Check to make sure all columns have handles
			grid.$el.find('.doby-grid-header-column').each(function () {
				expect($(this).children('.doby-grid-resizable-handle').length).toEqual(0);
			});
		});


		// ==========================================================================================


		it("should correctly resize all columns to their minimal width when double-clicking header handles", function () {

			var colwidths = [80, 300];

			// Create grid with some specific width items
			var grid = resetGrid({
				columns: [{
					"class": 'nopad',
					id: 'id',
					field: 'id',
					formatter: function () {
						return '<div style="width:' + colwidths[0] + 'px"></div>';
					},
					width: 50
				}, {
					"class": 'nopad',
					id: 'width',
					field: 'width',
					formatter: function (row, cell, value) {
						return '<div style="width:' + value + 'px"></div>';
					},
					width: 50
				}],
				data: [{
					id: 1,
					data: {
						id: 1,
						width: colwidths[1] - 20
					}
				}, {
					id: 2,
					data: {
						id: 2,
						width: colwidths[1] - 10
					}
				}, {
					id: 3,
					data: {
						id: 3,
						width: colwidths[1]
					}
				}]
			});

			// Click on each handle
			grid.$el.find('.doby-grid-header-column .doby-grid-resizable-handle').each(function () {
				$(this).simulate('dblclick');
			});

			// Get header padding - as that goes into the calculation
			var header = grid.$el.find('.doby-grid-header-column:first').first(),
				headerpadding = parseInt(header.css('paddingLeft'), 10) + parseInt(header.css('paddingRight'), 10);

			// Get cell padding - for the same reason
			var cell = grid.$el.find('.doby-grid-cell:first').first(),
				cellpadding = parseInt(cell.css('paddingLeft'), 10) + parseInt(cell.css('paddingRight'), 10);

			// Use the largest padding
			var padding = Math.max(headerpadding, cellpadding),
				weirdoffset = 12,		// FIXME: Tests seem to have this extra offset for some reason.
				marginoferror = 5;		// FIXME: Can't find a way to reliable test pixel-perfect resizing
										// here, so check to see that things at least get resized in the
										// a relative margin of error.

			// Verify the widths
			_.each(grid.options.columns, function (col, i) {
				expect(col.width).toBeGreaterThan(colwidths[i] + padding - weirdoffset - marginoferror);
				expect(col.width).toBeLessThan(colwidths[i] + padding - weirdoffset + marginoferror);
			});
		});


		// ==========================================================================================


		it("should correctly resize a newly added column when double-clicking on its header handle", function () {

			var colwidths = [80, 300];

			var columns = [{
				"class": 'nopad',
				id: 'id',
				field: 'id',
				name: "ID",
				formatter: function () {
					return '<div style="width:' + colwidths[0] + 'px"></div>';
				},
				width: 50
			}, {
				"class": 'nopad',
				id: 'width',
				field: 'width',
				name: "Width",
				formatter: function (row, cell, value) {
					return '<div style="width:' + value + 'px"></div>';
				},
				visible: false,
				width: 50
			}];

			// Create grid
			var grid = resetGrid({
				columns: columns,
				data: [{
					id: 1,
					data: {
						id: 1,
						width: colwidths[1]
					}
				}, {
					id: 2,
					data: {
						id: 2,
						width: colwidths[1]
					}
				}, {
					id: 3,
					data: {
						id: 3,
						width: colwidths[1]
					}
				}]
			});

			// Enable the hidden column
			columns[1].visible = true;
			grid.setColumns(columns);

			// Find the handle for the last column
			var $colheader = grid.$el.find('.doby-grid-header-column[id*="width"]:first'),
				$handle = $colheader.find('.doby-grid-resizable-handle:first');

			// Double click the handle
			$handle.simulate('dblclick');

			// Verify header width
			expect($colheader.outerWidth()).toEqual(colwidths[1] + 2);

			// Verify column widths
			grid.$el.find('.doby-grid-cell.l1').each(function () {
				expect($(this).width()).toEqual(colwidths[1] + 2);
			});
		});


		// ==========================================================================================


		it("should now allow grid to go beyond 100% width when double-clicking a column resize handle when autoColumnWidth is set", function () {

			// Create grid with some specific width items
			var grid = resetGrid({
				autoColumnWidth: true,
				columns: [{
					id: 'wide-column-a',
					field: 'wide-column-a',
					formatter: function () {
						return '<div style="width:500px"></div>';
					},
					width: 50
				}, {
					"class": 'nopad',
					id: 'wide-column-b',
					field: 'wide-column-b',
					formatter: function () {
						return '<div style="width:500px"></div>';
					},
					width: 50
				}],
				data: [{
					id: 1,
					data: {
						id: 1
					}
				}]
			});

			// Auto resize first column
			grid.$el.find('.doby-grid-header-column:first .doby-grid-resizable-handle').each(function () {
				$(this).simulate('dblclick');
			});

			var viewport_width = grid.$el.find('.doby-grid-viewport').width(),
				canvas_width = grid.$el.find('.doby-grid-canvas').width();

			// Make sure the canvas width didn't grow to be bigger than the viewport width
			expect(viewport_width).toEqual(canvas_width);
		});
	});


	// ==========================================================================================


	describe("options.resizableRows", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.resizableRows).toEqual(false);
		});


		// ==========================================================================================


		it("should draw resize handles for every row when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {resizableRows: true}));

			// Check to make sure all columns have handles
			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this).children('.doby-grid-row-handle').length).toEqual(1);
			});
		});


		// ==========================================================================================


		it("should not draw resize handles when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {resizableRows: false}));

			// Check to make sure all columns have handles
			grid.$el.find('.doby-grid-row').each(function () {
				expect($(this).children('.doby-grid-row-handle').length).toEqual(0);
			});
		});


		// ==========================================================================================


		it("should not draw resize handles when specific rows override the default setting", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				data: [
					{data: {id: 189, name: 'test'}, id: 189},
					{data: {id: 289, name: 'test2'}, id: 289, resizable: false},
					{data: {id: 389, name: 'test3'}, id: 389},
					{data: {id: 489, name: 'test4'}, id: 489, resizable: false}
				],
				resizableRows: true
			}));


			// Check to make sure all columns have handles
			grid.$el.find('.doby-grid-row').each(function (i) {
				if (i % 2) {
					expect($(this).children('.doby-grid-row-handle').length).toEqual(0);
				} else {
					expect($(this).children('.doby-grid-row-handle').length).toEqual(1);
				}
			});
		});


		// ==========================================================================================


		it("should be able to resize group rows", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				resizableRows: true
			}));

			// Apply grouping
			grid.addGrouping('id');

			// Try to resize the first group row
			var $grouprowhandle = grid.$el.find('.doby-grid-row-handle:first').first();

			// Get previous height
			var oldHeight = grid.$el.find('.doby-grid-group:first').first().height();

			// Simulate drag
			$grouprowhandle.simulate('drag', {dy: 20});

			// Get new height
			var newHeight = grid.$el.find('.doby-grid-group:first').first().height();

			var wait = false;
			setTimeout(function () {
				wait = true;
			}, 25);

			// Add micro delay to wait for grid to re-draw?
			waitsFor(function () {
				return wait;
			});

			runs(function () {
				// Compare heights
				expect(newHeight).toEqual(oldHeight + 20);

				// Now expand the group
				grid.$el.find('.doby-grid-group:first .doby-grid-cell:first').simulate('click');
			});

			// Wait for group to expand
			waitsFor(function () {
				var $firstgroup = grid.$el.find('.doby-grid-group:first');
				return $firstgroup.hasClass('expanded');
			}, 500, 'group should expand');

			runs(function () {
				// Make sure the height is still the same
				var $firstgroup = grid.$el.find('.doby-grid-group:first');
				expect($firstgroup.height()).toEqual(newHeight);
			});
		});
	});


	// ==========================================================================================


	describe("options.resizeCells", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.resizeCells).toEqual(false);
		});


		// ==========================================================================================


		it("should only resize headers during drag when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				autoColumnWidth: false,
				resizableColumns: true,
				resizeCells: false
			}));

			// Find columns and their cells
			var columnData = [];
			grid.$el.find('.doby-grid-header-column').each(function () {
				columnData.push({
					header: $(this),
					cells: []
				});
			});
			grid.$el.find('.doby-grid-row').each(function () {
				$(this).find('.doby-grid-cell').each(function (i) {
					columnData[i].cells.push($(this));
				});
			});

			// How much should we drag
			var drag_distance = 100;

			// Simulate a drag
			var handle, widths_before, widths_during, widths_after;
			_.each(columnData, function (cd) {
				// Grab the handle
				handle = cd.header.find('.doby-grid-resizable-handle');

				// Calculate widths before drag
				widths_before = [cd.header.width()];
				_.each(cd.cells, function (cell) {
					widths_before.push(cell.width());
				});

				// Start dragging
				handle.trigger({type: 'dragstart', pageX: 0});
				handle.trigger({type: 'drag', pageX: drag_distance});

				// Calculate widths during drag
				widths_during = [cd.header.width()];
				_.each(cd.cells, function (cell) {
					widths_during.push(cell.width());
				});

				// Stop dragging
				handle.trigger('dragend');

				// Calculate widths after drag
				widths_after = [cd.header.width()];
				_.each(cd.cells, function (cell) {
					widths_after.push(cell.width());
				});

				// Expect headers to drag
				expect(widths_during[0]).toEqual(widths_before[0] + drag_distance);
				expect(widths_after[0]).toEqual(widths_before[0] + drag_distance);

				// Expect cells to stand still
				for (var i = 1, l = widths_during; i < l; i++) {
					expect(widths_during[i]).toEqual(widths_before[i]);
					expect(widths_after[i]).toEqual(widths_before[i] + drag_distance);
				}
			});
		});


		// ==========================================================================================


		it("should resize headers and cells during drag when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				autoColumnWidth: false,
				resizableColumns: true,
				resizeCells: true
			}));

			// Find columns and their cells
			var columnData = [];
			grid.$el.find('.doby-grid-header-column').each(function () {
				columnData.push({
					header: $(this),
					cells: []
				});
			});
			grid.$el.find('.doby-grid-row').each(function () {
				$(this).find('.doby-grid-cell').each(function (i) {
					columnData[i].cells.push($(this));
				});
			});

			// How much should we drag
			var drag_distance = 100;

			// Simulate a drag
			var handle, widths_before, widths_during, widths_after;
			_.each(columnData, function (cd) {
				// Grab the handle
				handle = cd.header.find('.doby-grid-resizable-handle');

				// Calculate widths before drag
				widths_before = [cd.header.width()];
				_.each(cd.cells, function (cell) {
					widths_before.push(cell.width());
				});

				// Start dragging
				handle.trigger({type: 'dragstart', pageX: 0});
				handle.trigger({type: 'drag', pageX: drag_distance});

				// Calculate widths during drag
				widths_during = [cd.header.width()];
				_.each(cd.cells, function (cell) {
					widths_during.push(cell.width());
				});

				// Stop dragging
				handle.trigger('dragend');

				// Calculate widths after drag
				widths_after = [cd.header.width()];
				_.each(cd.cells, function (cell) {
					widths_after.push(cell.width());
				});

				// Expect headers to drag
				expect(widths_during[0]).toEqual(widths_before[0] + drag_distance);
				expect(widths_after[0]).toEqual(widths_before[0] + drag_distance);

				// Expect cells to stand still
				for (var i = 1, l = widths_during; i < l; i++) {
					expect(widths_during[i]).toEqual(widths_before[i] + drag_distance);
					expect(widths_after[i]).toEqual(widths_before[i] + drag_distance);
				}
			});
		});
	});


	// ==========================================================================================


	describe("options.reorderable", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.reorderable).toEqual(true);
		});


		// ==========================================================================================


		it("should correctly re-arrange columns via drag and drop when enabled", function () {
			// Prepare for test
			var columns = [
				{id: 'id', field: 'id', name: 'id', class: 'one'},
				{id: 'name', field: 'name', name: 'name', class: 'two'},
				{id: 'hidden', field: 'hidden', name: 'hidden', class: 'three', visible: false}
			];

			var grid = resetGrid($.extend(defaultData(), {
				columns: columns
			}));

			// Grab the columns
			var cols = grid.$el.find('.doby-grid-header-column');

			// Programmatically move the column 0 after column 1
			cols.eq(0).simulate('drag', {dx: cols.eq(0).width() * 2});

			// Grab the columns again
			var colsAfter = grid.$el.find('.doby-grid-header-column');

			// Confirm that the elements moved correctly
			expect(cols[0].id).toEqual(colsAfter[1].id);
			expect(cols[1].id).toEqual(colsAfter[0].id);

			// Confirm that classes are changed (ie. rows re-rendered)
			grid.$el.find('.doby-grid-row').each(function () {
				$(this).find('.doby-grid-cell').each(function (i) {
					if (i === 0) {
						expect($(this).hasClass('two')).toEqual(true);
					} else {
						expect($(this).hasClass('one')).toEqual(true);
					}
				});
			});

			// Confirm that column options got reversed
			expect(_.pluck(grid.options.columns, 'id')).toEqual(['name', 'id', 'hidden']);
		});
	});


	// ==========================================================================================


	describe("options.rowHeight", function () {
		it("should be 28 by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.rowHeight).toEqual(28);
		});


		// ==========================================================================================


		it("should correctly affect the height of rows in the grid", function () {
			var testheight = 100;

			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {rowHeight: testheight}));

			// Make sure we've got actual rows to test on
			expect(grid.$el.find('.doby-grid-row').length).toBeGreaterThan(0);

			grid.$el.find('.doby-grid-row').each(function () {
				// Make sure row is the correct height
				expect($(this).height()).toEqual(testheight);

				// Make sure every cell is the correct height
				$(this).find('.doby-grid-cell').each(function () {
					expect($(this).height()).toEqual(testheight);
				});
			});
		});
	});


	// ==========================================================================================


	describe("options.rowBasedSelection", function () {
		it("should be false by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.rowBasedSelection).toEqual(false);
		});


		// ==========================================================================================


		it("should select rows when clicking on row with rowBasedSelection enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				rowBasedSelection: true
			}));

			// Click on a cell
			var $cell = grid.$el.find('.doby-grid-cell:first');
			$cell.simulate('click');

			// Entire row should be selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(1);
			expect(grid.selection[0].exclusions.length).toEqual(0);

			// Row should have 'selected' calss
			expect($cell.closest('.doby-grid-row')).toHaveClass('selected');
		});
	});


	// ==========================================================================================


	describe("options.rowSpacing", function () {
		it("should be 0 by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.rowSpacing).toEqual(0);
		});


		// ==========================================================================================


		it("should correctly affect the rows spacing in the grid", function () {
			var testSpacing = 5;

			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {rowSpacing: testSpacing})),
				$rows = grid.$el.find('.doby-grid-row'),
				$prevRow;

			// Make sure we've got actual rows to test on
			expect($rows.length).toBeGreaterThan(0);

			$rows.each(function (i) {
				if (i > 0) {
					$prevRow = $($rows[i - 1]);

					// Make sure every row (except for first) is spaced correctly
					expect(parseInt($(this).css('top'), 10)).toEqual(parseInt($prevRow.css('top'), 10) + $prevRow.outerHeight() + testSpacing);
				}
			});
		});
	});


	// ==========================================================================================


	describe("options.scrollbarPosition", function () {
		it("should be 'right' by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.scrollbarPosition).toEqual('right');
		});


		// ==========================================================================================


		it("should draw the scrollbar on the left with a column spacer", function () {
			var data = [];

			for (var i = 0, l = 100; i < l; i++) {
				data.push({
					id: i,
					data: {
						id: i
					}
				});
			}

			var grid = resetGrid($.extend(defaultData(), {
				data: data,
				scrollbarPosition: "left"
			}));

			// Spacer should be created
			expect(grid.$el).toContain('.doby-grid-column-spacer');
		});
	});


	// ==========================================================================================


	describe("options.scrollLoader", function () {
		it("should be null by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.scrollLoader).toEqual(null);
		});


		// ==========================================================================================


		it("should display the value when scrolling quickly", function () {
			var data = [];
			for (var i = 0, l = 1000; i < l; i++) {
				data.push({
					id: i,
					data: {
						id: i,
						name: 'test' + i
					}
				});
			}

			var grid = resetGrid($.extend(defaultData(), {
				data: data,
				scrollLoader: function () {
					return "Unit Testing";
				}
			}));

			var viewport = grid.$el.find('.doby-grid-viewport')[0];
			viewport.scrollTop = viewport.scrollTop + 1000;

			waitsFor(function () {
				var $scrollLoader = grid.$el.find('.doby-grid-scroll-loader');
				return $scrollLoader.length;
			}, 100, 'scroll loader element to appear');

		});
	});


	// ==========================================================================================


	describe("options.selectable", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.selectable).toEqual(true);
		});


		// ==========================================================================================


		it("should allow cell range selection when enabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				selectable: true
			}));

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:first');

			// Get the drag delta from the first cell
			var dy = firstcell.position().top - lastcell.position().top + lastcell.height();

			// Simulate a click and drag on the cell ranges
			firstcell.simulate('drag', {dx: 0, dy: dy});

			// Expect the first and last cells to be selected
			expect(grid.selection.length).toBeGreaterThan(0);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(1);
		});


		// ==========================================================================================


		it("should not allow cell range selection when disabled", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {
				selectable: false
			}));

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:first');

			// Get the drag delta from the first cell
			var dy = firstcell.position().top - lastcell.position().top + lastcell.height();

			// Simulate a click and drag on the cell ranges
			firstcell.simulate('drag', {dx: 0, dy: dy});

			// Expect the first and last cells to be selected
			expect(grid.selection).toEqual(null);
		});


		// ==========================================================================================


		// Disabled until "https://github.com/jquery/jquery-simulate/issues/26" can be fixed
		xit("should append to the selection when dragging selection and holding down the Shift key", function () {
			// Prepare for test
			var grid = resetGrid($.extend(defaultData(), {}));

			// Find the first and last cells
			var firstcell = grid.$el.find('.doby-grid-row:first .doby-grid-cell:first'),
				lastcell = grid.$el.find('.doby-grid-row:last .doby-grid-cell:last');

			// Simulate a selection of the first cell
			firstcell.simulate('drag', {
				dx: firstcell.position().left,
				dy: firstcell.position().top
			});

			// Expect the first cell to be selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(0);

			// Simulate a selection of the last cell (with Shift key)
			lastcell.simulate('drag', {
				dx: lastcell.offset().left + 1,
				dy: lastcell.offset().top + 1,
				shiftKey: true
			});

			// Expect the first cell to be selected
			expect(grid.selection.length).toEqual(2);
			expect(grid.selection[1].fromCell).toEqual(0);
			expect(grid.selection[1].fromRow).toEqual(1);
			expect(grid.selection[1].toCell).toEqual(0);
			expect(grid.selection[1].toRow).toEqual(1);


		});
	});


	// ==========================================================================================


	describe("options.selectedClass", function () {
		it("should be 'selected' by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.selectedClass).toEqual('selected');
		});


		// ==========================================================================================


		it("should apply the given class to all selected cells", function () {
			var cls = 'testing123';
			var grid = resetGrid($.extend(defaultData(), {selectedClass: cls}));

			// Get the number of columns and rows we have
			var cols = grid.options.columns.length,
				rows = grid.options.data.length;

			// Select everything
			grid.selectCells(0, 0, rows - 1, cols - 1);

			// Make sure the right class was applied to all cells
			grid.$el.find('.doby-grid-cell').each(function () {
				expect($(this).hasClass(cls)).toEqual(true);
			});
		});
	});


	// ==========================================================================================


	describe("options.shiftSelect", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.shiftSelect).toEqual(true);
		});


		// ==========================================================================================


		it("should allow shift selection when enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {shiftSelect: true}));

			// Get the number of columns and rows we have
			var cols = grid.options.columns.length,
				rows = grid.options.data.length;

			// Activate the first cell
			grid.activate(0, 0);

			// Shift-click on the last cell
			grid.$el.find('.doby-grid-cell').last().simulate("click", {shiftKey: true});

			// Expect all cells to be selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(cols - 1);
			expect(grid.selection[0].toRow).toEqual(rows - 1);
		});


		// ==========================================================================================


		it("should not allow shift selection when disabled", function () {
			var grid = resetGrid($.extend(defaultData(), {shiftSelect: false}));

			// Activate the first cell
			grid.activate(0, 0);

			// Shift-click on the last cell
			grid.$el.find('.doby-grid-cell').last().simulate("click", {shiftKey: true});

			// Expect all cells to be selected
			expect(grid.selection).toEqual(null);
		});


		// ==========================================================================================


		it("should only allow for one cell range when using shiftSelect", function () {
			var grid = resetGrid($.extend(defaultData(), {shiftSelect: true}));

			// Activate the first cell
			grid.activate(0, 0);

			// Shift-click on the last cell in the first column
			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').first().simulate("click", {
				shiftKey: true
			});

			var cols = grid.options.columns.length,
				rows = grid.options.data.length;

			// Expect the first column to be selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(0);
			expect(grid.selection[0].toRow).toEqual(rows - 1);

			// Now shift select the top right cell
			grid.$el.find('.doby-grid-row:first-child .doby-grid-cell').last().simulate("click", {
				shiftKey: true
			});

			// Expect to have only 1 selection with the full grid selected
			expect(grid.selection.length).toEqual(1);
			expect(grid.selection[0].fromCell).toEqual(0);
			expect(grid.selection[0].fromRow).toEqual(0);
			expect(grid.selection[0].toCell).toEqual(cols - 1);
			expect(grid.selection[0].toRow).toEqual(rows - 1);
		});
	});


	// ==========================================================================================


	describe("options.showHeader", function () {
		it("should be enabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.showHeader).toEqual(true);
		});


		// ==========================================================================================


		it("should be able to render a grid without a header", function () {
			var grid = resetGrid($.extend(defaultData(), {
				showHeader: false
			}));

			expect(grid.$el).not.toContain('.doby-grid-header');
		});

	});


	// ==========================================================================================


	describe("options.stickyFocus", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.stickyFocus).toEqual(false);
		});


		// ==========================================================================================


		it("should keep focus of grid cells when the option is enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				stickyFocus: true
			}));

			// Make sure grid has focus
			grid.$el.find('.doby-grid-canvas').focus();

			// Activate and select some cells
			grid.selectCells(0, 0, 1, 1);
			grid.activate(0, 0);

			// Click outside the grid
			grid.$el.find('.doby-grid-canvas').simulate('blur');

			// Wait a little bit to ensure grid isn't destroyed when the blur event fires
			var waited = false;

			setTimeout(function () {
				waited = true;
			}, 20);

			waitsFor(function () {
				return waited;
			}, 50);

			runs(function () {
				expect(grid.active.cell).toEqual(0);
				expect(grid.active.row).toEqual(0);
				expect(grid.selection.length).toEqual(1);
				return true;
			});
		});


		// ==========================================================================================


		it("should remove focus of grid cells when the option is enabled", function () {
			var grid = resetGrid($.extend(defaultData(), {
				stickyFocus: false
			}));

			// Make sure grid has focus
			grid.$el.find('.doby-grid-canvas').focus();

			// Activate and select some cells
			grid.selectCells(0, 0, 1, 1);
			grid.activate(0, 0);

			// Click outside the grid
			$(document.body).simulate('click');

			// Wait a little bit to ensure grid isn't destroyed when the blur event fires
			var waited = false;

			setTimeout(function () {
				waited = true;
			}, 20);

			waitsFor(function () {
				return waited;
			}, 50);

			runs(function () {
				expect(grid.active.cell).toEqual(null);
				expect(grid.active.row).toEqual(null);
				expect(grid.selection).toEqual(null);
				return true;
			});
		});
	});


	// ==========================================================================================


	describe("options.stickyGroupRows", function () {
		it("should be disabled by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.stickyGroupRows).toEqual(false);
		});


		// ==========================================================================================


		it("should keep group headers stuck to the top of the viewport when scrolling", function () {
			var data = [];
			for (var i = 0; i < 50; i++) {
				data.push({id: i, data: {id: i, name: 'test' + i}});
			}

			var grid = resetGrid($.extend(defaultData(), {
				data: data,
				groupable: true,
				stickyGroupRows: true
			}));

			// Group grid
			grid.addGrouping('id', {
				collapsed: false
			});

			// Scroll to middle
			grid.scrollToRow(25);

			expect(grid.$el.find('.doby-grid-sticky').length).toEqual(1);
			expect(grid.$el.find('.doby-grid-sticky .doby-grid-cell').length).toEqual(1);
		});


		// ==========================================================================================


		it("should unstick when scrolling back to the top", function () {
			var data = [];
			for (var i = 0; i < 50; i++) {
				data.push({id: i, data: {id: i, name: 'test' + i}});
			}

			var grid = resetGrid($.extend(defaultData(), {
				data: data,
				groupable: true,
				stickyGroupRows: true
			}));

			// Group grid
			grid.addGrouping('id', {
				collapsed: false
			});

			// Scroll to middle
			grid.scrollToRow(25);

			expect(grid.$el.find('.doby-grid-sticky').length).toEqual(1);
			expect(grid.$el.find('.doby-grid-sticky .doby-grid-cell').length).toEqual(1);

			// Scroll back to top
			grid.scrollToRow(0);

			expect(grid.$el.find('.doby-grid-sticky').length).toEqual(0);
		});


		// ==========================================================================================


		it("should correctly create sticky groups even when using a custom `idProperty`", function () {
			var data = [];
			for (var i = 0; i < 50; i++) {
				data.push({cid: i, data: {id: i, name: 'test' + i}});
			}

			var grid = resetGrid($.extend(defaultData(), {
				columns: [
					{id: 'test', field: 'test'},
					{id: 'id', field: 'id'}
				],
				data: data,
				idProperty: 'cid',
				groupable: true,
				stickyGroupRows: true
			}));

			// Group grid
			grid.addGrouping('test', {
				collapsed: false
			});

			// Scroll to middle
			grid.scrollToRow(25);

			expect(grid.$el.find('.doby-grid-sticky').length).toEqual(1);
			expect(grid.$el.find('.doby-grid-sticky .doby-grid-cell').length).toEqual(1);
		});

		// ==========================================================================================


		it("should skip null groups when `groupNulls` is enabled", function () {
			var data = [];
			for (var i = 0; i < 50; i++) {
				data.push({id: i, data: {id: i, test: null}});
			}

			var grid = resetGrid($.extend(defaultData(), {
				columns: [
					{id: 'test', field: 'test'},
					{id: 'id', field: 'id'}
				],
				data: data,
				groupable: true,
				stickyGroupRows: true
			}));

			// Group grid
			grid.setGrouping([{
				column_id: 'test',
				collapsed: false,
				groupNulls: false
			}, {
				column_id: 'id',
				collapsed: false
			}]);

			// Scroll to middle
			grid.scrollToRow(25);
		});
	});


	// ==========================================================================================


	describe("options.tooltipType", function () {
		it("should be 'popup' by default", function () {
			var grid = resetGrid(defaultData());
			expect(grid.options.tooltipType).toEqual('popup');
		});


		// ==========================================================================================


		it("should correctly add 'title' tags if using 'title' tooltips", function () {
			var columns = [
				{id: 'zero', tooltip: 0, name: "Zero"},
				{id: 'one', tooltip: 1, name: "One"}
			];
			var grid = resetGrid($.extend(defaultData(), {
				columns: columns,
				tooltipType: 'title'
			}));

			var $columns = grid.$el.find('.doby-grid-header-column');
			_.each(columns, function (col, i) {
				expect($($columns[i]).attr('title')).toEqual(i.toString());
			});

		});


		// ==========================================================================================


		it("should throw an error if specifying an invalid type", function () {
			_.each(['a', 1, [], {}, true, false, -1], function (test) {
				expect(function () {
					resetGrid($.extend(defaultData(), {tooltipType: test}));
				}).toThrow('The "tooltipType" option be either "title" or "popup", not "' + test + '".');
			});
		});
	});

});