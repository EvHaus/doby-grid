/* global $, Backbone */

"use strict";

var CLS = require('./../utils/classes');


/**
 * Given an input field object, will tell you where the cursor is positioned
 * @method getCaretPosition
 *
 * @param	{DOMObject}		input		- Input dom element
 *
 * @returns {integer}
 */
var getCaretPosition = function (input) {
	var pos = 0;

	if (document.selection) {
		// IE Specific
		input.focus();
		var oSel = document.selection.createRange();
		oSel.moveStart('character', -input.value.length);
		pos = oSel.text.length;
	} else if (input.selectionStart !== input.selectionEnd) {
		// If text is selected -- return null
		return null;
	} else if (input.selectionStart || input.selectionStart == '0') {
		// Find cursor position
		pos = input.selectionStart;
	}

	return pos;
};


/**
 * Default editor object that handles cell reformatting and processing of edits
 * @class defaultEditor
 *
 * @param	{object}	self		- Current DobyGrid instance
 * @param	{object}	options		- Editor arguments
 *
 */
var DefaultEditor = function (self, options) {

	/**
	 * The editor is actived when an active cell in the grid is focused.
	 * This should generate any DOM elements you want to use for your editor.
	 * @method initialize
	 * @memberof defaultEditor
	 */
	this.initialize = function () {
		// Will hold the current value of the item being edited
		this.loadValue(options.item);

		var value = this.currentValue;
		if (value === null || value === undefined) value = "";

		this.$input = $('<input type="text" class="' + CLS.editor + '" value="' + value + '"/>')
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

				// Check if position of cursor is on the ends, if it's not then
				// left or right arrow keys will prevent editor from saving
				// results and will instead, move the text cursor
				var pos = getCaretPosition(this);

				if ((pos === null && event.which != 38 && event.which != 40) ||
					(pos > 0 && event.which === 37) ||
					(pos < $(this).val().length && event.which === 39)
				) {
					event.stopImmediatePropagation();
				}
			});
	};


	/**
	 * This is the function that will update the data model in the grid.
	 * @method applyValue
	 * @memberof defaultEditor
	 *
	 * @param	{array}		items		- Array of row data to update
	 * @param	{string}	value		- The user-input value being entered
	 *
	 */
	this.applyValue = function (items, value) {
		var item;

		for (var i = 0, l = items.length; i < l; i++) {
			item = items[i];

			// Make sure we always have an id for our item
			if (!(self.options.idProperty in item.item) && item.column.field == self.options.idProperty) {
				item.item[self.options.idProperty] = value;
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


	/**
	 * Cancel the edit and return the cell to its default state
	 * @method cancel
	 * @memberof defaultEditor
	 */
	this.cancel = function () {};


	/**
	 * Destroys any elements your editor has created.
	 * @method destroy
	 * @memberof defaultEditor
	 */
	this.destroy = function () {
		// Clear any invalid cells
		options.grid.$el.find('.' + CLS.invalid).removeClass(CLS.invalid);
		this.$input.remove();
	};


	/**
	 * When the cell with an initialized editor is focused
	 * @method focus
	 * @memberof defaultEditor
	 */
	this.focus = function () {
		this.$input.focus().select();
	};


	/**
	 * Gets the current value of whatever the user has inputted
	 * @method getValue
	 * @memberof defaultEditor
	 *
	 * @returns {string}
	 */
	this.getValue = function () {
		return this.$input.val();
	};


	/**
	 * Determines whether or not the value has changed
	 * @method isValueChanged
	 * @memberof defaultEditor
	 *
	 * @returns {boolean}
	 */
	this.isValueChanged = function () {
		return (!(this.$input.val() === "" && this.currentValue === null)) && (this.$input.val() != this.currentValue);
	};


	/**
	 * Loads the current value for the item
	 * @method loadValue
	 * @memberof defaultEditor
	 *
	 * @param	{object}	item		- Data model object that is being edited
	 */
	this.loadValue = function (item) {
		if (!item) return null;
		var value = item instanceof Backbone.Model ? item.get(options.column.field) : item.data ? item.data[options.column.field] : null;
		this.currentValue = value || "";
		return this.currentValue;
	};


	/**
	 * Process the input value before submitting it
	 * @method serializeValue
	 * @memberof defaultEditor
	 */
	this.serializeValue = function () {
		return this.$input.val();
	};


	/**
	 * Sets the value inside your editor, in case some internal grid calls needs to do
	 * it dynamically.
	 * @method setValue
	 * @memberof defaultEditor
	 *
	 * @param	{string}	val			- Value to set
	 */
	this.setValue = function (val) {
		this.$input.val(val);
	};


	/**
	 * What to do when the validation for an edit fails. Here you can highlight the cell
	 * and show the user the error message.
	 * @method showInvalid
	 * @memberof defaultEditor
	 *
	 * @param	{array}		results		- Results array from your validate() function
	 */
	this.showInvalid = function (results) {
		var result;
		for (var i = 0, l = results.length; i < l; i++) {
			result = results[i];

			// Add Invalid Icon
			result.$cell.append([
				'<span class="', CLS.invalidicon, '" title="', result.msg, '"></span>'
			].join(''));

			// Highlight Cell
			result.$cell
				.removeClass(CLS.invalid)
				.width(); // Force layout
			result.$cell.addClass(CLS.invalid);
		}
	};


	/**
	 * Validation step for the value before allowing a save. Should return back either
	 * true or an array of objects like this:
	 * @method validate
	 * @memberof defaultEditor
	 *
	 * @example
	 * [{
	 *	row: 1,
	 *	cell: 1,
	 *	$cell: $(..),
	 *	msg: 'Your failure message here.'
	 * }, {
	 *	row: 1,
	 *	cell: 2,
	 *	$cell: $(..),
	 *	msg: 'Your failure message here.'
	 * }]
	 *
	 * @param	{array}		items		- Array of edits to validate
	 * @param	{function}	callback	- Callback function
	 *
	 */
	this.validate = function (items, callback) {
		var results = [];

		// Sample code for validation failure
		/*
		for (var i = 0, l = items.length; i < l; i++) {
			results.push({
				row: items[i].row,
				cell: items[i].cell,
				$cell: items[i].$cell,
				msg: "You cannot use " + this.getValue() + " as your value."
			});
		}
		*/

		// No errors
		if (results.length === 0) results = true;

		callback(results);
	};

	return this.initialize();
};

module.exports = DefaultEditor;