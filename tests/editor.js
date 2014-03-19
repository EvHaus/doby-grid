// (c) 2014 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global $, Backbone, DobyGrid*/

describe("Editors", function () {
	"use strict";

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
		// @param   item        object      The data model for the item being edited
		// @param   column		objet		The column object being edited
		// @param   value       string      The user-input value being entered
		//
		this.applyValue = function (item, column, value) {
			item.data[column.field] = value;
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
			if (item instanceof Backbone.Model) {
				this.currentValue = item.get(options.column.field) || "";
			} else {
				this.currentValue = item.data[options.column.field] || "";
			}
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


		// validate()
		// Validation step for the value before allowing a save. Should return back
		// and object with two keys: `valid` (boolean) and `msg` (string) for the error
		// message (if any).
		//
		// @return object
		this.validate = function () {
			if (options.column.validator) {
				var validationResults = options.column.validator(this.$input.val());
				if (!validationResults.valid) {
					return validationResults;
				}
			}

			return {
				valid: true,
				msg: null
			};
		};

		return this.initialize();
	};

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
			],
			editable: true
		}));

		copy.editor = editor;

		return copy;
	};

	var resetGrid = function (options, use_backbone) {
		options = options || {};

		if (use_backbone) {
			var collection = new Backbone.Collection();
			for (var i = 0, l = options.data.length; i < l; i++) {
				collection.add(options.data[i].data);
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

});