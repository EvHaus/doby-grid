// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global $, _, Backbone, DobyGrid*/

describe("Editors", function () {
	"use strict";

	// Disable underscore's debounce until https://github.com/pivotal/jasmine/pull/455 is fixed
	_.debounce = function (func) { return function () { func.apply(this, arguments);}; };


	// ==========================================================================================


	var editor = function (options) {

		// initialize()
		// The editor is actived when an active cell in the grid is focused.
		// This should generate any DOM elements you want to use for your editor.
		//
		this.initialize = function () {
			// Will hold the current value of the item being edited
			this.loadValue(options.item);

			var value = this.currentValue;
			if (value === null || value === undefined) value = "";

			this.$input = $('<input type="text" class="doby-grid-editor" value="' + value + '"/>')
				.appendTo(options.cell)
				.on("keydown", function (event) {
					// Escape out of here on 'Tab', 'Enter', 'Home, 'End', 'Page Up' and 'Page Down'
					// so that the grid can capture that event
					if ([9, 13, 33, 34, 35, 36].indexOf(event.which) >= 0) {
						event.preventDefault();
						return;
					}

					// Esc
					if (event.which == 27) return;
				});
		};


		// applyValue()
		// This is the function that will update the data model in the grid.
		//
		// @param	items		array		Array of row data to update
		// @param	value		string		The user-input value being entered
		//
		this.applyValue = function (items, value) {
			var item;

			for (var i = 0, l = items.length; i < l; i++) {
				item = items[i];

				// Make sure we always have an id for our item
				if (!('id' in item.item) && item.column.field == 'id') {
					item.item.id = value;
				}

				if (item.item instanceof Backbone.Model) {
					item.item.set(item.column.field, value);
				} else {
					// This might be a nested row with no data
					if (item.item.data) {
						item.item.data[item.column.field] = value;
					}
				}
			}
		};


		// cancel()
		// Cancel the edit and return the cell to its default state
		//
		this.cancel = function () {
			this.destroy();
			$(options.cell).html(this.currentValue);
		};


		// destroy()
		// Destroys any elements your editor has created.
		//
		this.destroy = function () {
			this.$input.remove();
		};


		// focus()
		// When the cell with an initialized editor is focused
		//
		this.focus = function () {
			this.$input
				.addClass("focused")
				.focus()
				.select();
		};


		// getValue()
		// Gets the current value of whatever the user has inputted
		//
		// @return string
		this.getValue = function () {
			return this.$input.val();
		};


		// isValueChanged()
		// Determines whether or not the value has changed
		//
		// @return boolean
		this.isValueChanged = function () {
			return (!(this.$input.val() === "" && this.currentValue === null)) && (this.$input.val() != this.currentValue);
		};


		// loadValue()
		// Loads the current value for the item
		//
		// @param   item    object      Data model object that is being edited
		//
		this.loadValue = function (item) {
			if (!item) return null;
			var value = item instanceof Backbone.Model ? item.get(options.column.field) : item.data ? item.data[options.column.field] : null;
			this.currentValue = value || "";
			return this.currentValue;
		};


		// serializeValue()
		// Process the input value before submitting it
		//
		this.serializeValue = function () {
			return this.$input.val();
		};


		// setValue()
		// Sets the value inside your editor, in case some internal grid calls needs to do
		// it dynamically.
		//
		// @param   val     string      Value to set
		//
		this.setValue = function (val) {
			this.$input.val(val);
		};


		// showInvalid()
		// What to do when the validation for an edit fails. Here you can highlight the cell
		// and show the user the error message.
		//
		// @param   results     array       Results array from your validate() function
		//
		this.showInvalid = function (results) {
			var result;
			for (var i = 0, l = results.length; i < l; i++) {
				result = results[i];

				// Add Invalid Icon
				result.$cell.append([
					'<span class="invalid-icon" title="', result.msg, '"></span>'
				].join(''));

				// Highlight Cell
				result.$cell
					.removeClass('invalid')
					.width(); // Force layout
				result.$cell.addClass('invalid');
			}
		};


		// validate()
		// Validation step for the value before allowing a save. Should return back either
		// true or an array of objects like this:
		//
		// [{
		//	row: 1,
		//	cell: 1,
		//	$cell: $(..),
		//	msg: 'Your failure message here.'
		// }, {
		//	row: 1,
		//	cell: 2,
		//	$cell: $(..),
		//	msg: 'Your failure message here.'
		// }]
		//
		// @param	items		array		Array of edits to validate
		// @param	callback	function	Callback function
		//
		this.validate = function (items, callback) {
			var results = [],
				value = this.getValue();

			// Sample code for validation failure
			for (var i = 0, l = items.length; i < l; i++) {
				if (value == 'invalid-answer') {
					results.push({
						row: items[i].row,
						cell: items[i].cell,
						$cell: items[i].$cell,
						msg: "You cannot use " + this.getValue() + " as your value."
					});
				}
			}

			// No errors
			if (results.length === 0) results = true;

			callback(results);
		};

		return this.initialize();
	};

	// Utilities for resetting the grid
	var defaultData = function (default_editor) {
		var copy = JSON.parse(JSON.stringify({
			columns: [
				{id: 'id', field: 'id', name: 'id'},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: [
				{data: {id: 189, name: 'test'}, id: 189},
				{data: {id: 289, name: 'test2'}, id: 289}
			],
			editable: true
		}));

		if (!default_editor) copy.editor = editor;

		return copy;
	};

	var resetGrid = function (options, use_backbone, nested_rows) {
		options = options || {};

		if (use_backbone) {
			var collection = new Backbone.Collection(), m;
			for (var i = 0, l = options.data.length; i < l; i++) {
				m = collection.add(options.data[i].data);
				if (nested_rows) {
					m.rows = {
						0: {
							id: 'nested' + i,
							collapsed: true
						}
					};
				}
			}
			options.data = collection;
		}

		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;width:500px');

		grid.appendTo(fixture);
		return grid;
	};


	// ==========================================================================================


	it("should be able to perform an edit using the default editor", function () {
		// Prepare grid
		var grid = resetGrid(defaultData(true)),
			edit = 'some-edit-answer';

		// Enable cell for editing
		var $cell = grid.$el.find('.doby-grid-cell').last();
		$cell.simulate('click');

		// Simulate edit
		var $input = $cell.find('.doby-grid-editor');
		$input.val(edit);
		$input.simulate('keydown', {which: 13, keyCode: 13});
		$input.simulate('keyup', {which: 13, keyCode: 13});

		expect($cell).toHaveText(edit);
	});


	// ==========================================================================================


	it("should be able to initialize a custom editor", function () {
		// Prepare grid
		expect(function () {
			resetGrid(defaultData());
		}).not.toThrow();
	});


	// ==========================================================================================


	it("should re-apply the formatter when an edit is cancelled", function () {
		// Prepare grid
		var grid = resetGrid($.extend(defaultData(), {
			columns: [
				{id: 'id', field: 'id', name: 'id', formatter: function () { return "TEST"; }},
				{id: 'name', field: 'name', name: 'name', formatter: function () { return "TEST"; }}
			]
		}));

		var $cell = grid.$el.find('.doby-grid-cell:first');

		// Make sure formatter is set correctly
		expect($cell).toHaveText("TEST");

		$cell.simulate('click');

		// Make sure editor was enabled
		expect($cell).toHaveClass('active');
		expect($cell).toHaveClass('editable');

		// The editor's input should have the real value
		expect($cell.children().attr('value')).not.toEqual('TEST');

		// Make some edits
		$cell.children().attr('value', 'something new');

		// Press ESC to cancel the editing
		$cell.simulate('keydown', {keyCode: 27});

		// Make sure formatter was
		expect($cell).toHaveText("TEST");
	});


	// ==========================================================================================


	it("should call the focus function of the editor when an editable cell is focused", function () {
		// Prepare grid
		var grid = resetGrid(defaultData());

		// Enable cell for editing
		var $cell = grid.$el.find('.doby-grid-cell:first').first();
		$cell.simulate('click');

		// Make sure focus was called
		expect($cell.children()).toHaveClass('focused');
	});


	// ==========================================================================================


	it("should not interpret arrow key navigation as editor submission events (when using Backbone Collections)", function () {
		// Prepare grid
		var grid = resetGrid(defaultData(), true);

		// Select some cells
		grid.selectCells(0, 0, 1, 1);

		// Enable first cell for editing
		var $cell = grid.$el.find('.doby-grid-cell:first').first();
		$cell.simulate('click');

		// Simulate down arrow
		var $input = $cell.find('.doby-grid-editor');
		$input.simulate('keydown', {which: 40, keyCode: 40});
		$input.simulate('keyup', {which: 40, keyCode: 40});

		// The editor's applyValue function should not be called
		grid.$el.find('.doby-grid-cell').each(function () {
			expect($(this)).not.toBeEmpty();
		});
	});


	// ==========================================================================================


	it("should be able to perform a batch edit on cells with nested rows (when using Backbone Collections)", function () {
		// Start clock
		jasmine.clock().install();

		// Prepare grid
		var grid = resetGrid(defaultData(), true, true),
			edit = 'edited';

		// Select some cells
		grid.selectCells(0, 1, 1, 1);

		// Enable first cell for editing
		var $cell = grid.$el.find('.doby-grid-cell.selected').last();
		$cell.simulate('click');

		// Simulate edit
		var $input = $cell.find('.doby-grid-editor');
		$input.val(edit);
		$input.simulate('keydown', {which: 13, keyCode: 13});
		$input.simulate('keyup', {which: 13, keyCode: 13});

		expect(grid.$el.find('.doby-grid-cell').length).toBeGreaterThan(0);

		// Wait for redraw
		jasmine.clock().tick(1000);

		grid.$el.find('.doby-grid-cell').each(function () {
			if ($(this).hasClass('l1')) {
				expect($(this)).toHaveText(edit);
			}
		});

		// Remove clock
		jasmine.clock().uninstall();
	});


	// ==========================================================================================


	it("should edit all selected cells as well as the active cell", function () {
		// Prepare grid
		var grid = resetGrid(defaultData()),
			edit = 'strangelove potion';

		// Select a cell
		grid.selectCells(0, 1, 0, 1);

		// Active a different cell
		grid.activate(1, 1, 1, 1);

		// Enable cell for editing
		var $cell = grid.$el.find('.doby-grid-cell').last();
		$cell.simulate('click');

		// Simulate edit
		var $input = $cell.find('.doby-grid-editor');
		$input.val(edit);
		$input.simulate('keydown', {which: 13, keyCode: 13});
		$input.simulate('keyup', {which: 13, keyCode: 13});

		grid.$el.find('.doby-grid-cell').each(function (i) {
			if (i % 2) {
				expect($(this)).toHaveText(edit);
			}
		});
	});


	// ==========================================================================================


	it("should highlight cells as invalid and prevent editing if validation fails", function () {
		// Prepare grid
		var grid = resetGrid(defaultData()),
			edit = 'invalid-answer';

		// Select a cell
		grid.selectCells(0, 1, 0, 1);

		// Active a different cell
		grid.activate(1, 1, 1, 1);

		// Enable cell for editing
		var $cell = grid.$el.find('.doby-grid-cell').last();
		$cell.simulate('click');

		// Simulate edit
		var $input = $cell.find('.doby-grid-editor');
		$input.val(edit);
		$input.simulate('keydown', {which: 13, keyCode: 13});
		$input.simulate('keyup', {which: 13, keyCode: 13});

		grid.$el.find('.doby-grid-cell').each(function (i) {
			if (i % 2) {
				expect($(this)).toContainElement('input');
				expect($(this)).toHaveClass('invalid');
			}
		});
	});


});