// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jshint loopfunc: true*/
/*global $, _, DobyGrid*/

describe("Events", function () {
	"use strict";

	// Disable underscore's debounce until https://github.com/pivotal/jasmine/pull/455 is fixed
	_.debounce = function (func) { return function () { func.apply(this, arguments);}; };

	// ==========================================================================================


	// Utilities for resetting the grid
	var defaultData = function () {
		var copy = JSON.parse(JSON.stringify({
			columns: [
				{id: 'id', field: 'id', name: 'id'},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: [
				{data: {id: 189, name: 'test'}, id: 189},
				{data: {id: 289, name: 'test2'}, id: 289}
			]
		}));

		return copy;
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

	var events = {
		'activecellchange': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('activecellchange', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					}
				});
			});

			// Change the active cell
			grid.activate(0, 0);
		},
		'change': function (callback) {
			var grid = resetGrid($.extend(defaultData(), {
				editable: true
			}));

			// Subscribe to event
			grid.on('change', function (event, args) {
				callback(event, args, {
					cell: 1,
					row: 1,
					item: {
						data: {
							id: 289,
							name: 'something new'
						},
						id: 289
					}
				});
			});

			// Click on a cell and change its value
			var $cell = grid.$el.find('.doby-grid-cell').last();
			$cell.simulate('click');
			$cell.find('input').val('something new');
			$cell.find('input').simulate('keydown', {keyCode: 13, which: 13});
		},
		'click': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('click', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.simulate('click');
		},
		'columnchange': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('columnchange', function (event, args) {
				callback(event, args, {
					columns: grid.options.columns,
					oldColumns: grid.options.columns
				});
			});

			grid.setColumns(grid.options.columns);
		},
		'columnreorder': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('columnreorder', function (event, args) {
				callback(event, args, {
					columns: grid.options.columns
				});
			});

			// Grab the columns
			var cols = grid.$el.find('.doby-grid-header-column');

			// Programmatically move the column 0 after column 1
			cols.eq(0).simulate('drag', {dx: cols.eq(0).width() * 2});
		},
		'columnresize': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('columnresize', function (event, args) {
				callback(event, args, {
					columns: grid.options.columns
				});
			});

			// Auto resize first column
			grid.$el.find('.doby-grid-header-column:first .doby-grid-resizable-handle').each(function () {
				$(this).simulate('dblclick');
			});
		},
		'contextmenu': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('contextmenu', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.simulate('contextmenu');
		},
		'dblclick': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('dblclick', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.simulate('dblclick');
		},
		'destroy': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('destroy', function (event, args) {
				callback(event, args, undefined);
			});

			grid.destroy();
		},
		'headerclick': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('headerclick', function (event, args) {
				callback(event, args, {
					column: grid.options.columns[0]
				});
			});

			var $header = grid.$el.find('.doby-grid-header-column').first();
			$header.simulate('click');
		},
		'headercontextmenu': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('headercontextmenu', function (event, args) {
				callback(event, args, {
					column: grid.options.columns[0]
				});
			});

			var $header = grid.$el.find('.doby-grid-header-column').first();
			$header.simulate('contextmenu');
		},
		'keydown': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('keydown', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0
				});
			});

			// Set an active cell
			grid.activate(0, 0);

			// Simulate a keydown
			grid.$el.find('.doby-grid-canvas').simulate('keydown');
		},
		'mousedown': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mousedown', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mousedown');
		},
		'mouseenter': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mouseenter', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mouseenter');
		},
		'mouseleave': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mouseleave', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mouseleave');
		},
		'mousemove': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mousemove', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mousemove');
		},
		'mouseout': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mouseout', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mouseout');
		},
		'mouseover': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mouseover', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mouseover');
		},
		'mouseup': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('mouseup', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 0,
					item: {
						data: {
							id: 189,
							name: 'test'
						},
						id: 189
					},
					column: grid.options.columns[0]
				});
			});

			var $cell = grid.$el.find('.doby-grid-cell').first();
			$cell.trigger('mouseup');
		},
		'newrow': function (callback) {
			// Prepare grid
			var grid = resetGrid($.extend(defaultData(), {
				addRow: true,
				editable: true
			}));

			// Subscribe to event
			grid.on('newrow', function (event, args) {
				callback(event, args, {
					cell: 0,
					row: 2,
					item: {
						data: {
							id: 'new'
						},
						id: 'new'
					},
					column: grid.options.columns[0]
				});
			});

			var $addRowCell = grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').first();

			// Click into cell to activate editor
			$addRowCell.simulate('click');

			// Simulate entering new value
			var $input = $addRowCell.children('input');
			$input.val('new');
			$input.simulate('keydown', {keyCode: 13, which: 13});
		},
		// TODO: Find a way to test these
//		'remotegroupsloaded': function () {
//		},
//		'remoteloaded': function () {
//		},
		'scroll': function (callback) {
			var grid = resetGrid(defaultData()),
				$canvas = grid.$el.find('.doby-grid-canvas');

			// Subscribe to event
			grid.on('scroll', function (event, args) {
				callback(event, args, {
					scrollLeft: 0,
					scrollTop: 0,
					scrollLeftDelta: 0,
					scrollTopDelta: 0
				});
			});

			$canvas.trigger('scroll', {dy: 100});
		},
		'selection': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('selection', function (event, args) {
				callback(event, args, {
					selection: grid.selection
				});
			});

			grid.selectCells(0, 0, 0, 1);
		},
		'sort': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('sort', function (event, args) {
				callback(event, args, {
					sort: {
						multiColumnSort: false,
						sortCols: [{
							sortCol: grid.options.columns[0],
							sortAsc: true
						}]
					}
				});
			});

			// Click on the first column header
			grid.$el.find('.doby-grid-header-column').first().simulate('click');
		},
		'statechange': function (callback) {
			var grid = resetGrid(defaultData());

			// Subscribe to event
			grid.on('statechange', function (event, args) {
				callback(event, args);
			});

			grid.setColumns(grid.options.columns);
		},
		'validationerror': function (callback) {
			// Prepare grid
			var grid = resetGrid($.extend(defaultData(), {
				addRow: true,
				editable: true
			}));

			var $addRowCell = grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').first();

			// Subscribe to event
			grid.on('validationerror', function (event, args) {
				callback(event, args, {
					editor: grid.currentEditor,
					cellNode: $addRowCell[0],
					validationResults: [{
						row: 2,
						cell: 0,
						$cell: $addRowCell,
						msg: 'Unable to create a new item without a unique \'id\' value.'
					}],
					row: 2,
					cell: 0,
					column: grid.options.columns[0]
				});
			});

			// Click into cell to activate editor
			$addRowCell.simulate('click');

			// Try to create an item with the same ID as another
			var $input = $addRowCell.children('input');
			$input.val(grid.options.data[0].id);
			$input.simulate('keydown', {keyCode: 13, which: 13});

		},
		'viewportchanged': function (callback) {
			var data = [];
			for (var i = 0, l = 100; i < l; i++) {
				data.push({
					id: i,
					data: {
						id: i,
						name: 'test' + i
					}
				});
			}

			// Prepare grid
			var grid = resetGrid($.extend(defaultData(), {
				data: data
			}));

			// Subscribe to event
			grid.on('viewportchanged', function (event, args) {
				callback(event, args, {
					scrollLeft: 0,
					scrollTop: 2871,
					scrollLeftDelta: 0,
					scrollTopDelta: 2871
				});
			});

			grid.scrollToRow(99);
		}
	};


	// ==========================================================================================


	// For each event
	for (var event in events) {
		describe(event, (function (event) {
			return function () {
				it("should be able to subscribe to this event", function () {
					// Prepare grid
					var grid = resetGrid(defaultData());
					expect(function () {
						grid.on(event, function () {});
					}).not.toThrow();
				});


				// =======================================================================================


				it("should return 'event' and 'args' objects back from the event trigger", function () {
					// Prepare grid and trigger event
					var eventSpy = jasmine.createSpy('eventSpy').and.callFake(function (event, actual, expected) {
						if (event && typeof(event) === 'object') {
							expect(event.target.toString()).toEqual('[object HTMLDivElement]');
						} else {
							expect(event).toEqual(null);
						}

						expect(actual).toEqual(expected);
					});

					events[event](eventSpy);
					expect(eventSpy).toHaveBeenCalled();
				});
			};
		}(event)));
	}

});
