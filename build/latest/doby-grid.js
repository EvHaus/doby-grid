// doby-grid.js 1.0.0-beta1
// (c) 2016 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DobyGrid = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var CLS 		= require('./../utils/classes.js'),
	NonDataItem = require('./NonDataItem.js');

/**
 * @class Aggregate
 * @classdesc Information about data totals.
 * @augments NonDataItem
 *
 * An instance of Aggregate will be created for each totals row and passed to the aggregators
 * so that they can store arbitrary data in it. That data can later be accessed by group totals
 * formatters during the display.
 *
 * @param	{array}		aggregators		- List of aggregators for this object
 *
 * @returns {object}
 */
var Aggregate = function (aggregators) {
	this.aggregators = aggregators;
	this.class = CLS.rowtotal;
	this.columns = {};
	this.editable = false;
	this.focusable = true;
	this.selectable = false;
};

Aggregate.prototype = new NonDataItem();
Aggregate.prototype._aggregateRow = true;

Aggregate.prototype.toString = function () {
	return "Aggregate";
};

Aggregate.prototype.exporter = function (columnDef) {
	if (this.aggregators[columnDef.id]) {
		var aggr;
		for (var aggr_idx in this.aggregators[columnDef.id]) {
			aggr = this.aggregators[columnDef.id][aggr_idx];
			if (aggr.active && aggr.exporter) {
				return aggr.exporter();
			}
		}
	}
	return "";
};

Aggregate.prototype.formatter = function (row, cell, value, columnDef) {
	if (this.aggregators[columnDef.id]) {
		var aggr;
		for (var aggr_idx in this.aggregators[columnDef.id]) {
			aggr = this.aggregators[columnDef.id][aggr_idx];
			if (aggr.active && aggr.formatter) {
				return aggr.formatter();
			}
		}
	}
	return "";
};

module.exports = Aggregate;
},{"./../utils/classes.js":12,"./NonDataItem.js":8}],2:[function(require,module,exports){
"use strict";

var NonDataItem	= require('./NonDataItem');

/**
 * @class CellRange
 * @classdesc A structure containing a range of cells.
 *
 * @param {object}		data			- Data for the cell range
 * @param {integer}		data.fromCell	- Cell at which the range starts
 * @param {integer}		data.fromRow	- Row at which the range starts
 * @param {integer}		data.toCell		- Cell at which the range ends
 * @param {integer}		data.toRow		- Row at which the range ends
 * @param {object}		grid			- Current DobyGrid instance
 *
 */
var CellRange = function (data, grid) {
	var fromRow = data.fromRow,
		fromCell = data.fromCell,
		toRow = data.toRow === undefined ? data.fromRow : data.toRow,
		toCell = data.toCell === undefined ? data.fromCell : data.toCell;

	this._grid = grid;

	// The index of the rows and cells that define the range
	this.fromRow = Math.min(fromRow, toRow);
	this.fromCell = Math.min(fromCell, toCell);
	this.toRow = Math.max(fromRow, toRow);
	this.toCell = Math.max(fromCell, toCell);

	// Cell exclusions
	this.exclusions = [];
};


/**
 * Returns whether a range contains a given cell
 * @method contains
 * @memberof CellRange
 *
 * @param	{integer}	row			- Row index
 * @param	{integer}	cell		- Cell index
 *
 * @returns {boolean}
 */
CellRange.prototype.contains = function (row, cell) {
	return row >= this.fromRow &&
		row <= this.toRow && (
			cell === undefined || cell === null || (
				cell >= this.fromCell &&
				cell <= this.toCell &&
				!this.isExcludedCell(row, cell)
			)
		) && !this.isExcludedRow(row);
};


/**
 * Deselects the range, or a specific cell in the range. Returns the Range object.
 * @method deselect
 * @memberof CellRange
 *
 * @param	{integer}	[row]		- Row index for cell to deselect
 * @param	{integer}	[cell]	- Cell index to deselect in the given row
 *
 * @returns {object}
 */
CellRange.prototype.deselect = function (row, cell) {
	var specific = row !== undefined && row !== null && cell !== undefined && cell !== null,
		cache = this._grid.getCache();

	// Make sure cell is part of range
	if (specific && !this.contains(row, cell)) {
		throw new Error('Unable to deselect cell (' + row + ', ' + cell + ') because it is not part of this CellRange.');
	}

	// If deselecting a specific cell -- add it to the exclusion list
	if (specific) {
		this.exclusions.push([row, cell]);
	} else if (row !== undefined && row !== null) {
		for (var c = 0, l = cache.activeColumns.length; c < l; c++) {
			this.exclusions.push([row, c]);
		}
	}

	// Get rows we want to deselect items
	var selectedRows = [];
	if (row === undefined || row === null) {
		for (var j = this.fromRow; j <= this.toRow; j++) {
			if (selectedRows.indexOf(j) < 0) selectedRows.push(j);
		}
	} else {
		selectedRows.push(row);
	}

	// Build key/value object for classes we want to clear
	var clear = {}, styles = {};

	// If we have a specific cell to deselect, just do that one
	if (cell !== undefined && cell !== null) {
		clear[cache.activeColumns[cell].id] = this._grid.options.selectedClass;
	} else {
		for (var ic = 0, lc = cache.activeColumns.length; ic < lc; ic++) {
			clear[cache.activeColumns[ic].id] = this._grid.options.selectedClass;
		}
	}

	// Do the same for every row that we're clearing
	for (var iw = 0, lw = selectedRows.length; iw < lw; iw++) {
		styles[selectedRows[iw]] = clear;
	}

	// Update cell node styling
	this._grid.updateCellCssStylesOnRenderedRows(null, styles);

	return this;
};


/**
 * Validates that all cells in the range are selectable, if not - adds them to the exclusions
 * @method excludeUnselectable
 * @memberof CellRange
 */
CellRange.prototype.excludeUnselectable = function () {
	for (var row = this.fromRow; row <= this.toRow; row++) {
		for (var cell = this.fromCell; cell <= this.toCell; cell++) {
			if (!this._grid.canCellBeSelected(row, cell)) {
				this.exclusions.push([row, cell]);
			}
		}
	}
};


/**
 * Returns whether the range is fully excluded
 * @method fullyExcluded
 * @memberof CellRange
 *
 * @returns {boolean}
 */
CellRange.prototype.fullyExcluded = function () {
	for (var row = this.fromRow; row <= this.toRow; row++) {
		for (var cell = this.fromCell; cell <= this.toCell; cell++) {
			if (!this.isExcludedCell(row, cell)) return false;
		}
	}
	return true;
};


/**
 * Returns the number of cells in this selection range
 * @method getCellCount
 * @memberof CellRange
 *
 * @returns {integer}
 */
CellRange.prototype.getCellCount = function () {
	var count = 0,
		rownodes,
		cache = this._grid.getCache();

	for (var r = this.fromRow; r <= this.toRow; r++) {
		rownodes = cache.nodes[r];
		for (var c = this.fromCell; c <= this.toCell; c++) {
			if (rownodes.cellColSpans.length && rownodes.cellColSpans[c]) {
				count++;
			}
		}
	}
	return count;
};


/**
 * Returns whether a cell is excluded in this range
 * @method isExcludedCell
 * @memberof CellRange
 *
 * @param	{integer}	row			- Row index for cell to check
 * @param	{integer}	cell		- Cell index to check in the given row
 */
CellRange.prototype.isExcludedCell = function (row, cell) {
	if (this.exclusions.length === 0) return false;
	for (var i = 0, l = this.exclusions.length; i < l; i++) {
		if (this.exclusions[i][0] === row && this.exclusions[i][1] === cell) return true;
	}
};


/**
 * Returns whether a row is excluded from this range
 * @method isExcludedRow
 * @memberof CellRange
 *
 * @param	{integer}	row			- Row index for row to check
 */
CellRange.prototype.isExcludedRow = function (row) {
	if (this.exclusions.length === 0) return false;

	var excludedColumns = [],
		cache = this._grid.getCache();

	for (var i = 0, l = this.exclusions.length; i < l; i++) {
		if (this.exclusions[i][0] !== row) continue;
		excludedColumns.push(this.exclusions[i]);
	}
	return (excludedColumns.length == cache.activeColumns.length);
};


/*
 * Returns whether a range represents a single cell
 * @method isSingleCell
 * @memberof CellRange
 *
 * @returns {boolean}
 */
CellRange.prototype.isSingleCell = function () {
	// TODO: This needs to take colspans into account
	return this.fromRow == this.toRow && this.fromCell == this.toCell;
};


/**
 * Returns whether a range represents a single row.
 * @method isSingleRow
 * @memberof CellRange
 *
 * @returns {boolean}
 */
CellRange.prototype.isSingleRow = function () {
	return this.fromRow == this.toRow;
};


/**
 * Splits the range into 4 quadrants based on a vertical and horizontal position.
 * This is useful for splitting the range up into panes when frozen columns or rows
 * are used. Return an array of ranges [topLeft, topRight, bottomLeft, bottomRight].
 * @method split
 * @memberof CellRange
 *
 * @param	{integer}	[column]		- Column at which to split
 * @param	{integer}	[row]			- Row at which to split
 *
 * @returns {array}
 */
CellRange.prototype.split = function (column, row) {
	var topLeft = null,
		topRight = null,
		bottomLeft = null,
		bottomRight = null;

	// Split columns
	if (column !== undefined && column !== null && column >= 0 && this.toCell > column) {
		topLeft = new CellRange({fromCell: this.fromCell, toCell: column, fromRow: this.fromRow, toRow: this.toRow}, this._grid);
		topRight = new CellRange({fromCell: column + 1, toCell: this.toCell, fromRow: this.fromRow, toRow: this.toRow}, this._grid);
	} else {
		topLeft = new CellRange({fromCell: this.fromCell, toCell: this.toCell, fromRow: this.fromRow, toRow: this.toRow}, this._grid);
	}

	// If split is to the left of the range, keep topLeft null
	if (column < this.fromCell && topRight) {
		topLeft = null;
		topRight.fromCell = this.fromCell;
	}

	// Split rows
	if (row !== undefined && row !== null && row >= 0 && this.toRow > row) {
		topLeft = new CellRange({fromCell: topLeft.fromCell, toCell: topLeft.toCell, fromRow: this.fromRow, toRow: row}, this._grid);
		bottomLeft = new CellRange({fromCell: topLeft.fromCell, toCell: topLeft.toCell, fromRow: row + 1, toRow: this.toRow}, this._grid);

		if (topRight) {
			topRight = new CellRange({fromCell: topRight.fromCell, toCell: topRight.toCell, fromRow: this.fromRow, toRow: row}, this._grid);
			bottomRight = new CellRange({fromCell: topRight.fromCell, toCell: topRight.toCell, fromRow: row + 1, toRow: this.toRow}, this._grid);
		}
	}

	return [topLeft, topRight, bottomLeft, bottomRight];
};


/**
 * Converts the cell range values to CSV
 * @method toCSV
 * @memberof CellRange
 *
 * @returns {string}
 */
CellRange.prototype.toCSV = function () {
	var json = this.toJSON(),
		csv = [];
	for (var i = 0, l = json.length; i < l; i++) {
		csv.push('"' + json[i].join('","') + '"');
	}
	return csv.join('\n');
};


/**
 * Converts the cell range values to JSON
 * @method toJSON
 * @memberof CellRange
 *
 * @returns {string}
 */
CellRange.prototype.toJSON = function () {
	// TODO: Hacky solution to fix PhantomJS Jasmine tests. For some reason
	// they will run this command on some tests after the grid has been destroyed.
	if (this._grid.destroyed) return;

	var json = [],
		cache = this._grid.getCache(),
		column, row, data;

	for (var i = this.fromRow; i <= this.toRow; i++) {
		row = cache.rows[i];

		// Skip NonData rows
		if (row instanceof NonDataItem) continue;

		data = [];
		for (var c = this.fromCell; c <= this.toCell; c++) {
			// Replace excluded items with blanks
			if (this.isExcludedCell(i, c)) {
				data.push(null);
			} else {
				column = cache.activeColumns[c];
				data.push(this._grid.getValueFromItem(row, column));
			}
		}
		json.push(data);
	}
	return json;
};


/**
 * Converts the cell range values to an HTML table
 * @method toHTML
 * @memberof CellRange
 *
 * @returns {string}
 */
CellRange.prototype.toHTML = function () {
	var json = this.toJSON();

	var rows = json.map(function (row) {
		var columns = row.map(function (cell) {
			return '\t\t<td>' + cell + '</td>';
		});

		return Array.prototype.concat('\t<tr>', columns, '\t</tr>').join('\n');
	});

	var html = Array.prototype.concat('<table>', rows, '</table>').join('\n');
	return html;
};


/**
 * Converts the cell range values to a list of selected row objects
 * @method toRows
 * @memberof CellRange
 *
 * @returns {string}
 */
CellRange.prototype.toRows = function () {
	var result = [],
		cache = this._grid.getCache();

	for (var i = this.fromRow; i <= this.toRow; i++) {
		if (!this.isExcludedRow(i)) result.push(cache.rows[i]);
	}
	return result;
};


/**
 * Returns a readable representation of a range
 * @method toString
 * @memberof CellRange
 *
 * @returns {string}
 */
CellRange.prototype.toString = function () {
	if (this.isSingleCell()) {
		return "CellRange (" + this.fromRow + ":" + this.fromCell + ")";
	} else {
		return "CellRange (" + this.fromRow + ":" + this.fromCell + " - " + this.toRow + ":" + this.toCell + ")";
	}
};

module.exports = CellRange;

},{"./NonDataItem":8}],3:[function(require,module,exports){
/* global $ */

"use strict";

var CLS = require('./../utils/classes'),
	removeElement = require('./../utils/removeElement');

/**
 * @class CellRangeDecorator
 * @classdesc Displays an overlay on top of a given cell range
 *
 * @param	{object}	grid				- Current instance of the grid
 * @param	{function}	getCellNodeBox		- Shared method required by this class
 */
// TODO: Remove getCellNodeBox from the params here
var CellRangeDecorator = function (grid, getCellNodeBox) {
	this.$el = null;
	this.$stats = null;
	this.grid = grid;
	this.getCellNodeBox = getCellNodeBox;
};


/**
 * Renders the cell range decorator elements
 * @method show
 * @memberof CellRangeDecorator
 *
 * @param	{object}	range		- The selection range which to outline
 *
 * @return {array}
 */
CellRangeDecorator.prototype.show = function (range) {
	// Render a new decorator for this canvas
	if (!this.$el) {
		this.$el = $('<div class="' + CLS.rangedecorator + '"></div>')
			.appendTo(this.grid.$el);

		this.$stats = $('<span class="' + CLS.rangedecoratorstat + '"></span>')
			.appendTo(this.$el);
	}

	var from = this.getCellNodeBox(range.fromRow, range.fromCell),
		to = this.getCellNodeBox(range.toRow, range.toCell),
		borderBottom = parseInt(this.$el.css('borderBottomWidth'), 10),
		borderLeft = parseInt(this.$el.css('borderLeftWidth'), 10),
		borderRight = parseInt(this.$el.css('borderRightWidth'), 10),
		borderTop = parseInt(this.$el.css('borderTopWidth'), 10),
		$rightpane = this.grid.$el.find('.' + CLS.pane).eq(1),
		topOffset = this.grid.$el.find('.' + CLS.pane + ":first ." + CLS.viewport).first().position().top,
		frozenCol = this.grid.options.frozenColumns,
		leftOffset = frozenCol >= 0 && range.fromCell > frozenCol ? $rightpane.position().left : 0,
		widthOffset = frozenCol >= 0 && range.toCell > frozenCol && range.fromCell <= frozenCol ? $rightpane.position().left : 0;

	// If the selection goes into the right viewports, and the right viewports are scrolled --
	// we need to account for that when drawing the range
	if (frozenCol >= 0) {
		var $rightViewport = this.grid.$el.find('.' + CLS.viewport).eq(1);
		if (range.fromCell > frozenCol) {
			leftOffset -= $rightViewport[0].scrollLeft;
		} else if (range.toCell > frozenCol) {
			widthOffset -= $rightViewport[0].scrollLeft;
		}
	}

	if (from && to) {
		var width = to.right - from.left - borderLeft - borderRight;

		this.$el.css({
			top: from.top + topOffset,
			left: from.left + leftOffset,
			height: to.bottom - from.top - borderBottom - borderTop,
			width: width + widthOffset
		});

		// Only display stats box if there is enough room
		if (width > 200) {
			// Calculate number of selected cells
			this.$stats.show().html([
				'<strong>Selection:</strong> ', range.getCellCount(), ' cells',
				' <strong>From:</strong> ', (range.fromRow + 1), ':', (range.fromCell + 1),
				' <strong>To:</strong> ', (range.toRow + 1), ':', (range.toCell + 1)
			].join(''));
		} else {
			this.$stats.hide();
		}
	}

	return this.$el;
};


/**
 * Destroys the rendered elements
 * @method hide
 * @memberof CellRangeDecorator
 */
CellRangeDecorator.prototype.hide = function () {
	if (this.$el && this.$el.length) removeElement(this.$el[0]);
	this.$el = null;
};


module.exports = CellRangeDecorator;
},{"./../utils/classes":12,"./../utils/removeElement":15}],4:[function(require,module,exports){
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

			// If you're using Backbone -- this will come in handy
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
},{"./../utils/classes":12}],5:[function(require,module,exports){
"use strict";

/**
 * Default formatting functions for all cell rendering. Returns an HTML string.
 * @method defaultFormatter
 *
 * @param	{integer}	row			- Index of the row is located
 * @param	{integer}	cell		- Index of the
 * @param	{string}	value		- The value of this cell from the data object for this row
 * @param	{object}	[columnDef]	- The column definition object for the given column
 * @param	{object}	[data]		- The full data object for the given cell
 *
 * @returns {string}
 */
var DefaultFormatter = function (row, cell, value, columnDef, data) {
	// These variables aren't used in the default editor, but are available to you
	// for customization. This line is left here for JSDoc reasons.
	if (columnDef || data) {}

	// Never write "undefined" or "null" in the grid -- that's just bad programming
	if (value === undefined || value === null) {
		return "";
	}

	// Some simple HTML escaping
	return (value + "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
};

module.exports = DefaultFormatter;
},{}],6:[function(require,module,exports){
/* global $ */

"use strict";

var CLS  			= require('./../utils/classes'),
	removeElement	= require('./../utils/removeElement');

var uid = "doby-grid-dd-" + Math.round(1000000 * Math.random());

/**
 * Creates a new dropdown menu.
 * @class Dropdown
 *
 * @param	{object}	[event]			- Javascript event object
 * @param	{object}	[options]		- Additional dropdown options
 *
 * @returns {object}
 */
var Dropdown = function (event, options) {

	// Is the dropdown currently shown?
	this.open = false;

	/**
	 * Initializes the class
	 * @method initialize
	 * @memberof Dropdown
	 */
	this.initialize = function () {
		this.$parent = options.parent || $(event.currentTarget);
		this.$el = options.menu;
		this.id = [uid, CLS.dropdown, options.id].join('_');

		// Create data store in the parent object if it doesn't already exist
		var existing = null;
		if (!this.$parent.data(CLS.dropdown)) {
			this.$parent.data(CLS.dropdown, []);
		} else {
			// Also find the existing dropdown for this id (if it exists)
			existing = this.$parent.data(CLS.dropdown).filter(function (i) {
				return i.id == this.id;
			}.bind(this));
			if (existing) existing = existing[0];
		}

		// If this parent already has a dropdown enabled -- initializing will close it
		if (existing && existing.open) {
			existing.hide();
		} else {
			// Ensure dropdown has the right styling
			this.$el.attr('id', this.id);
			this.$el.addClass(['off', CLS.dropdown].join(' '));
			this.show();
		}

		// Clicking outside - closes the dropdown
		var bodyClose;
		bodyClose = function (e) {
			if (e.target == event.target) return;
			this.hide();
			$(document).off('click', bodyClose);
			$(document).off('context', bodyClose);
		}.bind(this);

		$(document).on('click', bodyClose);
		$(document).on('contextmenu', bodyClose);

		// Esc - closes the dropdown
		var bodyEscape;
		bodyEscape = function (e) {
			if (e.keyCode == 27) {
				this.hide();
				$(document).off('keydown', bodyEscape);
			}
		}.bind(this);
		$(document).one('keydown', bodyEscape);

		return this;
	};


	/**
	 * Positions the dropdown in the right spot
	 * @method position
	 * @memberof Dropdown
	 */
	this.position = function () {
		var top = event.pageY,
			left = event.pageX,
			menu_width = this.$el.outerWidth(),
			menu_height = this.$el.outerHeight(),
			required_width = event.clientX + menu_width,
			required_height = event.clientY + menu_height,
			b = $(document.body),
			available_width = b.width(),
			available_height = b.height();

		// Determine position of main dropdown

		// If no room on the right side, throw dropdown to the left
		if (available_width < required_width) {
			left -= menu_width;
		}

		// If no room on the right side for submenu, throw submenus to the left
		if (available_width < required_width + menu_width) {
			this.$el.addClass(CLS.dropdownleft);
		}

		// If no room on the bottom, throw dropdown upwards
		if (available_height < required_height) {
			top -= menu_height;
		}

		this.$el.css({
			left: Math.max(left, 0),
			top: Math.max(top, 0)
		});

		// Now, loop through all of the submenus and determine which way they should drop
		// depending on how much screen space there is
		var pos, off, height, width, leftright, parentWidth;
		this.$el.children('.' + CLS.dropdownmenu + ':first').find('.' + CLS.dropdownmenu).each(function () {
			pos = $(this).position();
			off = $(this).offset();
			height = $(this).outerHeight();
			width = $(this).outerWidth();
			parentWidth = $(this).parent().outerWidth();

			// Determine whether to drop to left or right
			leftright = (off.left + parentWidth) - Math.min(pos.left, 0) + width > available_width ? 'drop-left' : 'drop-right';
			$(this).addClass(leftright);

			// When dropping left - need to set correct position
			if (leftright == 'drop-left') {
				$(this).css('left', -width + 'px');
			}

			// Determine whether to drop to up or down
			$(this).addClass(event.clientY + height > available_height ? 'drop-up' : 'drop-down');
		});
	};

	return this.initialize();
};


/**
 * Displays the dropdown
 * @method show
 * @memberof Dropdown
 */
Dropdown.prototype.show = function () {
	if (this.open) return;

	this.$el.appendTo(document.body);

	this.position();

	var store = this.$parent.data(CLS.dropdown);
	store.push(this);
	this.$parent.data(CLS.dropdown, store);

	// Animate fade in
	setTimeout(function () {
		this.$el.removeClass('off');
	}.bind(this), 150);

	this.open = true;
};


/**
 * Hides the dropdown
 * @method hide
 * @memberof Dropdown
 */
Dropdown.prototype.hide = function () {
	if (!this.open || !this.$parent) return;

	if (this.$parent.data(CLS.dropdown)) {
		var store = this.$parent.data(CLS.dropdown).filter(function (i) {
			return i != this;
		}.bind(this));

		this.$parent.data(CLS.dropdown, store);

		this.$el.addClass('off');

		// Animate fade out
		setTimeout(function () {
			removeElement(this.$el[0]);
		}.bind(this), 150);

		this.open = false;
	}
};

module.exports = Dropdown;

},{"./../utils/classes":12,"./../utils/removeElement":15}],7:[function(require,module,exports){
/* global $ */

"use strict";

var CLS 		= require('./../utils/classes.js'),
	NonDataItem = require('./NonDataItem.js');

/**
 * Class that stores information about a group of rows.
 * @class Group
 *
 * @param	{object}	options		- Custom options for this group item
 */
var Group = function (options) {
	options = options || {};

	$.extend(this, {
		count: 0,				// Number of rows in the group
		groups: null,			// Sub-groups that are part of this group
		id: null,				// A unique key used to identify the group
		level: 0,				// Grouping level, starting with 0 (for nesting groups)
		grouprows: [],			// Rows that are part of this group
		selectable: false,		// Don't allow selecting groups
		title: null,			// Formatted display value of the group
		value: null				// Grouping value
	}, options);

	this.columns = {
		0: {
			colspan: "*",
			focusable: false,
			selectable: false
		}
	};

	if (this.predef) {
		// If group row height or spacing was manipulated - use that value
		if (this.predef.height !== undefined && this.predef.height !== null) {
			this.height = this.predef.height;
		}

		if (this.predef.rowSpacing !== undefined && this.predef.rowSpacing !== null) {
			this.rowSpacing = this.predef.rowSpacing;
		}

		if (this.predef.colspan !== undefined) {
			this.columns[0].colspan = this.predef.colspan;
		}
	}
};

Group.prototype = new NonDataItem();
Group.prototype._groupRow = true;

Group.prototype.class = function (row, item) {
	var collapseclass = (item.collapsed ? CLS.collapsed : CLS.expanded),
		classes = [CLS.group, this.options.collapsible ? CLS.grouptoggle : null, collapseclass];

	if (item.predef.class) {
		if (typeof(item.predef.class) === 'function') {
			// Group class functions will use the first column as the argument
			classes.push(item.predef.class.bind(this)(row, 0, item.value, this.getActiveColumns()[0], item));
		} else {
			classes.push(item.predef.class);
		}
	}

	return classes.join(' ');
};

Group.prototype.toString = function () {
	return "Group";
};

module.exports = Group;
},{"./../utils/classes.js":12,"./NonDataItem.js":8}],8:[function(require,module,exports){
/* global $ */

"use strict";

/**
 * @class NonDataItem
 * @classdesc A base class that all special / non-data rows (like Group) derive from.
 *
 * @param	{object}	data		- Data object for this item
 */
var NonDataItem = function (data) {
	this.__nonDataRow = true;
	if (data) $.extend(this, data);
};

NonDataItem.prototype.toString = function () {
	return "NonDataItem";
};

module.exports = NonDataItem;
},{}],9:[function(require,module,exports){
"use strict";

var NonDataItem	= require('./NonDataItem');

/**
 * @class Placeholder
 * @classdesc An item object used as a placeholder for a remote item.
 * @augments NonDataItem
 */
var Placeholder = function () {};
Placeholder.prototype = new NonDataItem();
Placeholder.prototype.__placeholder = true;
Placeholder.prototype.toString = function () {
	return "Placeholder";
};

module.exports = Placeholder;
},{"./NonDataItem":8}],10:[function(require,module,exports){
/* global $ */

"use strict";

var CLS = require('./../utils/classes'),
	removeElement = require('./../utils/removeElement');

/**
 * Show a tooltip on the column header
 * @method showTooltip
 * @memberof DobyGrid
 * @private
 *
 * @param	{object}	event		- Javascript event object
 * @param	{object}	options		- Tooltip options
 *
 */
var Tooltip = function (event, options) {
	options = options || {};

	// Proceed for popup tooltips only
	if (options.type != 'popup') return;

	// Proceed if not on a drag handle
	if ($(event.target).closest('.' + CLS.handle).length) {
		// Trigger mouseleave event so existing tooltips are hidden during resizing
		$(event.target).trigger('mouseleave');
		return;
	}

	var column = options.column;

	// Proceed for valid columns only
	if (!column || !column.tooltip) return;

	var el = $(event.target).closest('.' + CLS.headercolumn);

	// Don't create tooltip if this element already has one open
	if (el.attr('aria-describedby')) return;

	// ID of the tooltip element
	var uid = "doby-grid-" + Math.round(1000000 * Math.random());
	var tooltip_id = uid + '-tooltip-column-' + column.id;
	var renderTimer;

	// Add describe by
	el.attr('aria-describedby', tooltip_id);

	// Assign removal event
	el.one("mouseleave remove", function () {
		clearTimeout(renderTimer);

		// Remove tooltip
		if ($(this).attr('aria-describedby') !== undefined) {
			var tltp = $('#' + tooltip_id);

			tltp.removeClass('on');

			// Animate out
			setTimeout(function () {
				if (tltp && tltp.length) removeElement(tltp[0]);
			}, 200);

			$(this).removeAttr('aria-describedby');
		}
	});

	// Delay rendering by a few milliseconds to prevent rolling over tooltip
	// and for better UX
	renderTimer = setTimeout(function () {
		// Make sure tooltip is still needed
		if (el.attr('aria-describedby') === undefined || !el.is(':visible')) return;

		// Height of the tooltip arrow
		var arrowheight = 10;

		// Build tooltip HTML
		var html = ['<span class="' + CLS.tooltip + '" id="' + tooltip_id + '">'];
		html.push(column.tooltip);
		html.push('<span class="' + CLS.tooltiparrow + '"></span>');
		html.push('</span>');

		// Double check that element doesn't already exist
		if ($('#' + tooltip_id).length) return;

		// Insert into DOM temporarily so we can calculate size
		var tooltip = $(html.join(''));
		tooltip.appendTo(document.body);

		// Calculate position
		var x = el.offset().left + (el.outerWidth() / 2) - (tooltip.outerWidth() / 2),
			y = el.offset().top + el.outerHeight() + arrowheight;

		// Compensate when we get close to the edge
		var arrowoffset = 0,
			win = $(window),
			windowwidth = win.outerWidth();

		if (x < 0) {
			arrowoffset = x;
			x = 0;
		} else if ((x + tooltip.outerWidth()) > windowwidth) {
			arrowoffset = (x + tooltip.outerWidth()) - windowwidth;
			x -= arrowoffset + 1;
		}

		// Position arrow
		var arrow = tooltip.children('.' + CLS.tooltiparrow).first();
		arrow.css('left', (tooltip.outerWidth() / 2) - (arrow.outerWidth() / 2) + arrowoffset);

		// Draw tooltip
		tooltip
			.remove()	// Need to remove it from body and re-insert to ensure Chrome animates
			.addClass('on')
			.attr('style', 'left:' + x + 'px;top:' + (y + 5) + 'px')
			.appendTo(document.body)
			.width(); // Force layout to display transitions

		// Transition in
		tooltip.css('top', y);
	}, 250);
};

module.exports = Tooltip;
},{"./../utils/classes":12,"./../utils/removeElement":15}],11:[function(require,module,exports){
// doby-grid.js
// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*global $:true, jQuery, _, Backbone, console, saveAs*/

"use strict";


// Support for jQuery.noConflict
if (!$ && jQuery) $ = jQuery;

// Check for required dependencies
if (!$) throw new Error('Unable to load DobyGrid because jQuery, which is a required dependency, could not be found.');
if (!_) throw new Error('Unable to load DobyGrid because Underscore, which is a required dependency, could not be found.');
if (!Backbone) throw new Error('Unable to load DobyGrid because Backbone, which is a required dependency, could not be found.');


var Aggregate			= require('./classes/Aggregate'),
	CellRange			= require('./classes/CellRange'),
	CellRangeDecorator	= require('./classes/CellRangeDecorator'),
	DefaultEditor		= require('./classes/DefaultEditor'),
	DefaultFormatter	= require('./classes/DefaultFormatter'),
	Dropdown			= require('./classes/Dropdown'),
	Group				= require('./classes/Group'),
	NonDataItem 		= require('./classes/NonDataItem'),
	Placeholder			= require('./classes/Placeholder'),
	Tooltip				= require('./classes/Tooltip'),

	CLS					= require('./utils/classes'),
	Locales				= require('./utils/locales'),
	naturalSort			= require('./utils/naturalSort'),
	removeElement 		= require('./utils/removeElement');

/**
 * The Doby Grid class instance.
 * @class DobyGrid
 *
 * @param	{object}	options			- Grid Options object
 *
 * @returns {object} Instance of DobyGrid
 */
var DobyGrid = function (options) {
	options = options || {};

	// Name of this Doby component
	this.NAME = 'doby-grid';

	// Current version of the library
	this.VERSION = '0.1.2';

	// Ensure options are an object
	if (typeof options !== "object" || $.isArray(options)) {
		throw new TypeError('The "options" param must be an object.');
	}

	// Handle console logs if they aren't enabled
	if (typeof window.console !== "object") window.console = {};

	// Private
	var self = this,
		$canvas,
		$gutters,
		$headers,
		$headerL,
		$headerR,
		$headerFilter,
		$headerFilterL,
		$headerFilterR,
		$headerScroller,
		$headerScrollerL,
		$headerScrollerR,
		$overlay,
		$panes,
		$style,
		$viewport,
		$viewportScrollContainerX,
		$viewportScrollContainerY,
		absoluteColumnMinWidth,
		activePosX,
		actualFrozenRow = -1,
		applyColumnHeaderWidths,
		applyColumnWidths,
		applyHeaderAndColumnWidths,
		asyncPostProcessRows,
		autosizeColumns,
		bindCellRangeSelect,
		bindRowResize,
		cache = {
			activeColumns: [],	// Stores the list of columns that are active
			aggregatorsByColumnId: {},
			columnPosLeft: [],
			columnPosRight: [],
			columnsById: {},
			indexById: {},
			nodes: {},
			modelsById: {},
			postprocess: {},
			rowPositions: {},
			rows: [],
			stickyRows: []
		},
		cacheRows,
		calculateVisibleRows,
		canCellBeActive,
		canvasWidth,
		canvasWidthL,
		canvasWidthR,
		cellExists,
		cellHeightDiff = 0,
		cellWidthDiff = 0,
		cj,				// "jumpiness" coefficient
		cleanUpAndRenderCells,
		cleanUpCells,
		cleanupRows,
		clearTextSelection,
		Collection,
		columnCssRulesL,
		columnCssRulesR,
		commitCurrentEdit,
		copySelected,
		counter_rows_rendered = 0,
		createCssRules,
		createGrid,
		createGroupingObject,
		deselectCells,
		deselectRow,
		disableSelection,
		enableAsyncPostRender = false,	// Does grid have any columns that require post-processing
		enforceWidthLimits,
		ensureCellNodesInRowsCache,
		executeSorter,
		findFirstFocusableCell,
		findLastFocusableCell,
		fitColumnToHeader,
		fitColumnsToHeader,
		frozenRowsHeight = 0,
		generatePlaceholders,
		getActiveCell,
		getBrowserData,
		getCanvasWidth,
		getCellFromEvent,
		getCellFromNode,
		getCellFromPoint,
		getCellNode,
		getCellNodeBox,
		getColumnById,
		getColumnCssRules,
		getColumnContentWidth,
		getColumnHeaderWidth,
		getColumnFromEvent,
		getColspan,
		getDataItemValueForColumn,
		getDataLength,
		getEditor,
		getFormatter,
		getGroupFormatter,
		getGroupFromRow,
		getHeadersWidth,
		getLocale,
		getMaxCSSHeight,
		getRenderedRange,
		getRowFromNode,
		getRowFromPosition,
		getScrollbarSize,
		getTotalHeight,
		getVBoxDelta,
		getViewportHeight,
		getViewportWidth,
		getVisibleRange,
		gotoCell,
		gotoDown,
		gotoLeft,
		gotoNext,
		gotoPrev,
		gotoRight,
		gotoUp,
		h,				// real scrollable height
		h_editorLoader = null,
		h_render = null,
		h_postrender = null,
		handleBodyClick,
		handleClick,
		handleContextMenu,
		handleDblClick,
		handleHeaderContextMenu,
		handleHeaderClick,
		handleKeyDown,
		handleScroll,
		handleWindowResize,
		hasFrozenRows = false,
		hasGrouping,
		hasSorting,
		headerColumnWidthDiff = 0,
		headerColumnHeightDiff = 0, // border+padding
		isFileSaverSupported = typeof window.Blob === "function",
		initialize,
		initialized = false,
		insertAddRow,
		insertEmptyOverlay,
		invalidate,
		invalidateAllRows,
		invalidatePostProcessingResults,
		invalidateRows,
		isCellPotentiallyEditable,
		isCellSelected,
		isColumnSelected,
		lastRenderedScrollLeft = 0,
		lastRenderedScrollTop = 0,
		lockColumnWidths,
		bindToCollection,
		makeActiveCellEditable,
		makeActiveCellNormal,
		maxPageX,
		minPageX,
		measureCellPadding,
		mergeGroupSorting,
		n,				// number of pages
		navigate,
		numVisibleRows,
		offset = 0,		// current page offset
		page = 0,		// current page
		ph,				// page height
		postProcessFromRow = null,
		postProcessToRow = null,
		prepareLeeway,
		prevScrollLeft = 0,
		prevScrollTop = 0,
		remoteAllLoaded,
		remoteLoaded,
		remoteCount,
		remoteFetch,
		remoteFetcher,
		remoteFetchGroups,
		remoteGroupRefetch,
		remoteTimer = null,
		removeCssRules,
		removeInvalidRanges,
		removeRowFromCache,
		render,
		renderCell,
		renderColumnHeaders,
		renderMenu,
		renderRow,
		renderRows,
		resetActiveCell,
		resetAggregators,
		resizeCanvas,
		resizeColumn,
		resizeColumnToContent,
		resizeContainer,
		scrollCellIntoView,
		scrollLeft = 0,
		scrollLoader,
		scrollPage,
		scrollRowIntoView,
		scrollTo,
		scrollTop = 0,
		serializedEditorValue,
		setActiveCellInternal,
		setFrozenOptions,
		setRowHeight,
		setScroller,
		setupColumnReorder,
		setupColumnResize,
		setupColumnSort,
		startPostProcessing,
		stickGroupHeaders,
		stickyIds = [],
		stylesheet,
		styleSortColumns,
		submitColResize,
		suspend = false,	// suspends the refresh recalculation
		tabbingDirection = 1,
		th,				// virtual height
		toggleContextMenu,
		uid = this.NAME + "-" + Math.round(1000000 * Math.random()),
		updateCanvasWidth,
		updateColumnCaches,
		updateRow,
		updateRowCount,
		validateColumns,
		validateOptions,
		validateRemoteGroups,
		variableRowHeight,
		viewportH,
		viewportHasHScroll,
		viewportHasVScroll,
		viewportW,
		vScrollDir = 1;

	// Default Grid Options

	// A recursive extend for locale options.
	options.locale = options.locale || {};
	options.locale = $.extend(true, Locales, options.locale);

	// But simple extend for these options
	// We can't make all options recursively extended because options.data could
	// have references to itself.
	this.options = $.extend({
		activeFollowsPage:		false,
		activateSelection:		true,
		addRow:					false,
		asyncEditorLoadDelay:	100,
		asyncEditorLoading:		false,
		asyncPostRenderDelay:	25,
		autoColumnWidth:		false,
		autoDestroy:			true,
		autoEdit:				true,
		autoHeight:				false,
		canvasFocus:			true,
		"class":				null,
		clipboard:				"csv",
		collapsible:			true,
		columns:				[],
		columnSpacing:			1,
		columnWidth:			80,
		contextMenu:			'all',
		ctrlSelect:				true,
		data:					[],
		dataExtractor:			null,
		deactivateOnRightClick:	false,
		editable:				false,
		editor:					null,
		editorType:				"selection",
		emptyNotice:			true,
		exportFileName:			"doby-grid-export",
		fetchCollapsed:			false,
		forceRemoteSort:		false,
		formatter:				null,
		frozenBottom:			false,
		frozenColumns:			-1,
		frozenRows:				-1,
		fullWidthRows:			true,
		groupable:				true,
		idProperty:				"id",
		keepNullsAtBottom:		true,
		keyboardNavigation:		true,
		lineHeightOffset:		-1,
		nestedAggregators:		true,
		menuExtensions:			null,
		menuExtensionsPosition:	"bottom",
		minColumnWidth:			"",
		multiColumnSort:		true,
		quickFilter:			false,
		remoteScrollTime:		200,
		resizableColumns:		true,
		resizableRows:			false,
		resizeCells:			false,
		reorderable:			true,
		rowHeight:				28,
		rowSpacing:				0,
		rowBasedSelection:		false,
		rowsToPrefetch:			0,
		scrollbarPosition:		"right",
		scrollLoader:			null,
		selectable:				true,
		selectedClass:			"selected",
		shiftSelect:			true,
		showGutters:			false,
		showHeader:				true,
		stickyFocus:			false,
		stickyGroupRows:		false,
		tooltipType:			"popup",
		virtualScroll:			true
	}, options);

	// Default Column Options
	var columnDefaults = {
		cache:				false,
		"class":			null,
		comparator:			null,
		editable:			null,
		filterable:			true,
		focusable:			true,
		groupable:			true,
		headerClass:		null,
		id:					null,
		maxWidth:			null,
		minWidth:			42,
		name:				"",
		postprocess:		null,
		removable:			false,
		rerenderOnResize:	false,
		resizable:			true,
		selectable:			true,
		sortable:			true,
		sortAsc:			true,
		tooltip:			null,
		visible:			true,
		width:				null
	};

	// Enable events
	$.extend(this, Backbone.Events);

	// Stores the current event object
	this._event = null;

	// Stores the currently active cell
	this.active = null;

	// Stores the current editor instance
	this.currentEditor = null;

	// Is this instance destroyed?
	this.destroyed = false;

	// The remote fetching object used for remote data
	this.fetcher = false;

	// Stores the currently selected cell range
	this.selection = null;

	// Stores the current sorting objects
	this.sorting = [];


	/**
	 * Creates a new DobyGrid instance
	 * @method initialize
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {object}
	 */
	initialize = function () {

		// Ensure the options we were given are all valid and complete
		validateOptions();

		// Calculate some information about the browser window
		getBrowserData();

		// Cache some column stuff (needed to intialize a collection with aggregators)
		updateColumnCaches();

		// Create a new data collection
		self.collection = new Collection(self);

		// Insert an 'addRow' row
		if (self.options.addRow) insertAddRow();

		// Create the grid
		createGrid();

		// Cell range selection is disabled when using row-based selection
		if (self.options.selectable && !self.options.rowBasedSelection) bindCellRangeSelect();

		return self;
	};


	/**
	 * Given a row and cell index, will set that cell as the active in the grid
	 * @method activate
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	row			- Row index
	 * @param	{integer}	cell		- Cell index
	 *
	 * @returns {object}
	 */
	this.activate = function (row, cell) {
		if (!initialized) return;
		if (row === undefined || cell === undefined) {
			resetActiveCell();
			return;
		}
		if (row > getDataLength() || row < 0 || cell >= cache.activeColumns.length || cell < 0 || !canCellBeActive(row, cell)) return;
		scrollCellIntoView(row, cell, false);
		setActiveCellInternal(getCellNode(row, cell), false);
		return this;
	};


	/**
	 * Entry point for collection.add(). See collection.add for more info.
	 * @method add
	 * @memberof DobyGrid
	 *
	 * @param	{array}		models		- List of models to add
	 * @param	{object}	[options]	- Additional options
	 *
	 * @returns {object}
	 */
	this.add = function (models, options) {
		this.collection.add(models, options);
		return this;
	};


	/**
	 * Inserts a new column into the grid
	 * @method addColumn
	 * @memberof DobyGrid
	 *
	 * @param	{object}	data		- Column data object
	 * @param	{object}	[options]	- Additional options for handling the insert.
	 *
	 * @returns {object}
	 */
	this.addColumn = function (data, options) {
		if (!data || typeof data !== 'object' || $.isArray(data) || data instanceof HTMLElement) {
			throw new Error("Unable to addColumn() because the given 'data' param is invalid.");
		}

		options = options || {};

		// Check for a column with the same id
		var existing = cache.columnsById[data.id];
		if (existing !== undefined) {
			if (options.merge !== true) {
				var err = ["Unable to addColumn() because a column with id '" + data.id];
				err.push("' already exists. Did you want to {merge: true} maybe?");
				throw new Error(err.join(''));
			} else {
				// Merge column with existing
				for (var i = 0, l = this.options.columns.length; i < l; i++) {
					if (this.options.columns[i].id != data.id) continue;
					$.extend(this.options.columns[i], data);
				}
				return this;
			}
		}

		var columns = this.options.columns;
		if (options.at === null || options.at === undefined) {
			columns.push(data);
		} else {
			columns.splice(columns, options.at, data);
		}

		// Set the grid columns
		self.setColumns(columns);
		return this;
	};


	/**
	 * Add to the grouping object given the 'id' of a column. Allows you to create nested groupings.
	 * @method addGrouping
	 * @memberof DobyGrid
	 *
	 * @param	{string}		column_id		- Id of the column to group by
	 * @param	{object}		[options]		- Additional grouping options.
	 *
	 * @returns {object}
	 */
	this.addGrouping = function (column_id, options) {
		// Is grouping enabled
		if (!self.options.groupable) throw new Error('Cannot execute "addGrouping" because "options.groupable" is disabled.');

		options = options || {};

		if (column_id === null || column_id === undefined) throw new Error("Unable to add grouping to grid because the 'column_id' value is missing.");

		if (!hasGrouping(column_id)) {
			// Use the column_id shortcut to extend the options
			options.column_id = column_id;

			// Add to grouping
			this.collection.groups.push(options);

			// Set new grouping
			this.setGrouping(this.collection.groups);
		}
		return this;
	};

	/**
	 * Duplicates the jQuery appendTo() function
	 * @method appendTo
	 * @memberof DobyGrid
	 *
	 * @param	{jQuery}		target		- jQuery object to insert table into
	 *
	 * @returns {object}
	 */
	this.appendTo = function (target) {
		if (!target || !target.length) {
			throw new Error('Doby Grid requires a valid container. "' + $(target).selector + '" does not exist in the DOM.');
		}

		// Insert into target
		this.$el.appendTo(target);

		// Initialize the Grid
		try {
			initialized = true;

			// Calculate viewport width
			viewportW = parseFloat($.css(this.$el[0], "width", true));

			// Calculate caches, dimensions and prepare layout
			measureCellPadding();
			if (this.options.showHeader) disableSelection($headers);
			renderColumnHeaders();
			setupColumnSort();
			setFrozenOptions();
			setScroller();
			createCssRules();
			cacheRows();
			resizeCanvas(true);

			// Fit column widths to header contents
			if (self.options.minColumnWidth === "headerContent") fitColumnsToHeader(true);

			// If we're using remote data, start by fetching the data set length
			if (this.fetcher) {
				remoteCount(function () {
					// If we haven't scrolled anywhere yet - fetch the first page,
					if ($viewport[0].scrollTop === 0) {
						remoteFetch();
					}
				}.bind(this));

				// Subscribe to scroll events
				this.on('viewportchanged', function (event, args) {
					// Fetch remote results on vertical scroll
					if (args.scrollTopDelta > 0) {
						remoteFetch();
					}
				});
			}

			// Assign events

			this.$el
				.on("resize." + this.NAME, function () {
					resizeCanvas(true);
				});

			if (this.options.autoDestroy) {
				this.$el.one("remove", function () {
					// Self-destroy when the element is deleted
					this.destroy();
				}.bind(this));
			}

			$viewport
				.on("scroll", handleScroll);

			if (this.options.showHeader) {
				$headerScroller
					.on("contextmenu", handleHeaderContextMenu)
					.on("click", handleHeaderClick);

				// Events for column header tooltips
				if (this.options.tooltipType != 'title') {
					$headerScroller
						.on("mouseover", function (event) {
							// Show tooltip
							new Tooltip(event, {
								column: getColumnFromEvent(event),
								type: self.options.tooltipType
							});
						});
				}
			}

			$(document.body).on("click contextmenu", handleBodyClick);

			$canvas
				.on("keydown", handleKeyDown)
				.on("click", handleClick)
				.on("dblclick", handleDblClick)
				.on("contextmenu", handleContextMenu);

			// Pass through common mouseevents
			var evs = [
				'mousedown',
				'mouseenter',
				'mouseleave',
				'mousemove',
				'mouseout',
				'mouseover',
				'mouseup'
			], evHandler = function (event) {
				var cell = getCellFromEvent(event),
					item = cell && cell.row !== undefined && cell.row !== null ? self.getRowFromIndex(cell.row) : null,
					column = cell ? cache.activeColumns[cell.cell] : null;

				self.trigger(event.type, event, {
					row: cell ? cell.row : null,
					cell: cell ? cell.cell : null,
					column: column,
					item: item
				});

				// Focus on the canvas when the mouse is in it.
				// Only as long as the Quick Filter isn't focused.
				if (event.type == 'mouseenter' && self.options.canvasFocus) {
					var ae = document.activeElement;
					if (ae != this && !$(this).has($(ae)).length && (
						(self.options.quickFilter && !$(ae).closest('.' + CLS.headerfiltercell).length) ||
						!self.options.quickFilter
					)) {

						// Prevent page from scrolling when the grid is focused.
						// Remember previous scroll position.
						var prevScroll = [window.scrollX, window.scrollY];

						// This will un-necessarily scroll the page
						$(this).focus();

						// Restore scroll
						window.scrollTo(prevScroll[0], prevScroll[1]);
					}
				}

			};

			for (var i = 0, l = evs.length; i < l; i++) {
				$canvas.on(evs[i], evHandler);
			}

			// Enable resizable rows
			if (this.options.resizableRows) {
				bindRowResize();
			}

		} catch (e) {
			if (console.error) console.error(e);
		}

		// Enable context menu
		if (this.options.contextMenu == 'header') {
			this.on('headercontextmenu', toggleContextMenu);
		} else if (this.options.contextMenu == 'all') {
			this.on('headercontextmenu', toggleContextMenu);
			this.on('contextmenu', toggleContextMenu);
		}

		// Resize grid when window is changed
		$(window).on('resize', handleWindowResize);

		return this;
	};


	/**
	 * Ensures that the header column widths are all set correctly
	 * @method applyColumnHeaderWidths
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{array}		[headers]		- Header column DOM elements to resize
	 *
	 */
	applyColumnHeaderWidths = function (headers) {
		if (!initialized || !self.options.showHeader) return;
		if (!headers) headers = $headers.children('.' + CLS.headercolumn);

		// Auto-sizes the quick filter headers too
		var qHeaders = null;
		if ($headerFilter !== undefined) {
			qHeaders = $headerFilter.children();
		}

		var i, l, w, styl;
		for (i = 0, l = headers.length; i < l; i++) {
			w = cache.activeColumns[i].width - headerColumnWidthDiff;

			styl = ['width:', w, 'px'].join('');

			// Style the header
			$(headers[i]).attr('style', styl);

			// Style the quick filter
			if (qHeaders && qHeaders[i]) $(qHeaders[i]).attr('style', styl);
		}

		updateColumnCaches(false);
	};


	/**
	 * Sets the widths of the columns to what they should be
	 * @method applyColumnWidths
	 * @memberof DobyGrid
	 * @private
	 */
	applyColumnWidths = function () {
		// The -1 here is to compensate for the border spacing between cells
		var x = -1, c, w, rule, i, l, r, isRightmostColumn;

		// If scrollbar is on the left - we need to add a spacer
		if ($headers) {
			$headers.children('.' + CLS.columnspacer).remove();
			if (self.options.scrollbarPosition === 'left' && viewportHasVScroll) {
				$headers.prepend('<span class="' + CLS.columnspacer + '" style="width:' + window.scrollbarDimensions.height + 'px"></span>');
			}
		}

		for (i = 0, l = cache.activeColumns.length; i < l; i++) {
			c = cache.activeColumns[i];
			w = c.width;

			// Left
			rule = getColumnCssRules(i);
			rule.left.style.left = x + "px";

			// Right
			// The -2 here is to compensate for the border spacing between cells
			r = (self.options.frozenColumns != -1 && i > self.options.frozenColumns ? canvasWidthR : canvasWidthL) - x - w - 2;

			// Determine if this column is the right-most in its pane
			isRightmostColumn = (i + 1 === l) || (self.options.frozenColumns != -1 && i === self.options.frozenColumns);

			// If this is the rightmost column, and there is no vertical scrollbar, then
			// do not allow negative spacing on the right otherwise we get a gap
			if (!viewportHasVScroll && self.options.scrollbarPosition === 'right' && isRightmostColumn && r < 0) {
				r = 0;
			}

			rule.right.style.right = r + "px";

			// Reset the css left value since the
			// column starts in a new viewport
			if (self.options.frozenColumns == i) {
				x = -1;
			} else {
				// The +1 here is to compensate for the border spacing between cells
				x += c.width + 1;
			}
		}
	};

	/**
	* Sets the widths of column headers and columns to what they should be
	* @method applyHeaderAndColumnWidths
	* @memberof DobyGrid
	* @private
	*/
	applyHeaderAndColumnWidths = function () {
		applyColumnHeaderWidths();
		if (self.options.resizeCells) applyColumnWidths();
	};


	/**
	 * Processing the post-render action on all cells that need it
	 * @method asyncPostProcessRows
	 * @memberof DobyGrid
	 * @private
	 */
	asyncPostProcessRows = function () {
		var dataLength = getDataLength(),
			cb = function () {
				if (this.col.cache && cache && cache.rows[this.row]) {
					var row_id = cache.rows[this.row][self.options.idProperty];
					if (!cache.postprocess[row_id]) cache.postprocess[row_id] = {};
					cache.postprocess[row_id][this.col.id] = $(this.node).html();
				}
			};

		while (postProcessFromRow <= postProcessToRow) {
			var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--,
				cacheEntry = cache.nodes[row],
				rowdata = cache.rows[row],
				columnIdx;

			if (!cacheEntry || row >= dataLength) {
				continue;
			}

			if (!cache.postprocess[rowdata[self.options.idProperty]]) cache.postprocess[rowdata[self.options.idProperty]] = {};

			ensureCellNodesInRowsCache(row);
			for (columnIdx in cacheEntry.cellNodesByColumnIdx) {
				if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) continue;

				columnIdx = columnIdx || 0;

				var col = cache.activeColumns[columnIdx],
					postprocess = col.postprocess,
					rd_cols = rowdata.columns;

				// Check to see if a row-specific column override exists
				if (rd_cols && rd_cols[columnIdx] && rd_cols[columnIdx].postprocess) {
					postprocess = rd_cols[columnIdx].postprocess;
				}

				// If row has no caching set -- run the postprocessing
				if (postprocess && !cache.postprocess[rowdata[self.options.idProperty]][col.id]) {
					var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
					if (node && node.length) {
						node = node[0];
						postprocess({
							$cell: $(node),
							column: col,
							data: self.getRowFromIndex(row),
							grid: self,
							rowIndex: row
						}, cb.bind({node: node, col: col, row: row}));
					}
				}
			}

			clearTimeout(h_postrender);
			h_postrender = setTimeout(asyncPostProcessRows, self.options.asyncPostRenderDelay);
			return;
		}
	};


	/**
	 * Resizes all column to try and fit them into the available screen width
	 * @method autosizeColumns
	 * @memberof DobyGrid
	 * @private
	 */
	autosizeColumns = function () {
		var i, c,
			widths = [],
			shrinkLeeway = 0,
			total = 0,
			prevTotal,
			growProportion, max, growSize,
			availWidth = viewportHasVScroll ? viewportW - window.scrollbarDimensions.width : viewportW;

		// Compensate for the separators between columns
		availWidth -= cache.activeColumns.length;

		// Calculate the current total width of columns
		for (i = 0; i < cache.activeColumns.length; i++) {
			c = cache.activeColumns[i];

			// Skip invisible columns
			if (c.visible === false) continue;

			widths.push(c.width);
			total += c.width;

			if (c.resizable) {
				shrinkLeeway += c.width - Math.max((c.minWidth || 0), absoluteColumnMinWidth);
			}
		}

		// Shrink
		prevTotal = total;
		while (total > availWidth && shrinkLeeway) {
			var shrinkProportion = (total - availWidth) / shrinkLeeway;
			for (i = 0; i < cache.activeColumns.length && total > availWidth; i++) {
				c = cache.activeColumns[i];
				var width = widths[i];
				if (c.visible === false || !c.resizable || width <= (c.minWidth || 0) || width <= absoluteColumnMinWidth) {
					continue;
				}
				var absMinWidth = Math.max(c.minWidth, absoluteColumnMinWidth);
				var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
				shrinkSize = Math.min(shrinkSize, width - absMinWidth);
				total -= shrinkSize;
				shrinkLeeway -= shrinkSize;
				widths[i] -= shrinkSize;
			}
			if (prevTotal <= total) { // avoid infinite loop
				break;
			}
			prevTotal = total;
		}

		// Grow
		prevTotal = total;
		while (total < availWidth) {
			growProportion = availWidth / total;
			for (i = 0; i < cache.activeColumns.length && total < availWidth; i++) {
				c = cache.activeColumns[i];
				if (c.visible === false || !c.resizable || (c.maxWidth && c.maxWidth <= c.width)) continue;

				// Make sure we don't get bigger than the max width
				max = 1000000;
				if (c.maxWidth && (c.maxWidth - c.width)) max = (c.maxWidth - c.width);

				growSize = Math.min(Math.floor(growProportion * c.width) - c.width, max) || 1;

				total += growSize;
				widths[i] += growSize;
			}

			if (prevTotal >= total) { // avoid infinite loop
				break;
			}
			prevTotal = total;
		}

		// Set new values
		var reRender = false, col;
		for (i = 0; i < cache.activeColumns.length; i++) {
			col = cache.activeColumns[i];

			// Skip invisible columns
			if (col.visible === false) continue;

			if (!reRender && col.rerenderOnResize && col.width != widths[i]) reRender = true;
			cache.activeColumns[i].width = widths[i];
		}

		applyColumnHeaderWidths();
		updateCanvasWidth(true);

		if (reRender) {
			invalidateAllRows();
			render();
		}
	};


	/**
	 * Enable events used to select cell ranges via click + drag
	 * @method bindCellRangeSelect
	 * @memberof DobyGrid
	 * @private
	 */
	bindCellRangeSelect = function () {
		var decorator = new CellRangeDecorator(self, getCellNodeBox),
			_dragging = null,
			handleSelector = function () {
				return $(this).closest('.' + CLS.cellunselectable).length > 0;
			};

		$canvas
			.on('draginit', {not: handleSelector}, function (event) {
				// Prevent the grid from cancelling drag'n'drop by default
				event.stopImmediatePropagation();

				// Deselect any text the user may have selected
				clearTextSelection();
			})
			.on('dragstart', {not: handleSelector}, function (event, dd) {
				var cell = getCellFromEvent(event);
				if (!cell) return;

				// This prevents you from starting to drag on a cell that can't be selected
				if (self.canCellBeSelected(cell.row, cell.cell)) {
					_dragging = true;
					event.stopImmediatePropagation();
				}

				if (!_dragging) return;

				var $closestPane = $(this).closest($panes);

				var start = getCellFromPoint(
					dd.startX - $(this).offset().left + $closestPane.position().left,
					dd.startY - $(this).offset().top
				);

				// Store a custom "_range" in the event attributes
				dd._range = {
					end: start,
					start: start
				};

				return decorator.show(new CellRange({fromRow: start.row, fromCell: start.cell}, self));
			})
			.on('drag', {not: handleSelector}, function (event, dd) {
				if (!_dragging) return;

				event.stopImmediatePropagation();

				var $closestPane = $(this).closest($panes),
					xPos = event.pageX - $(this).offset().left,
					xOffset = $closestPane.position().left;

				// If started dragging in left pane but ending in right, need to account
				// for right pane scrolling
				if (dd._range.start.cell <= self.options.frozenColumns && xPos > $viewport.eq(0).width()) {
					xOffset += $viewport.eq(1)[0].scrollLeft;
				}

				var end = getCellFromPoint(
					xPos + xOffset,
					event.pageY - $(this).offset().top
				);

				if (!self.canCellBeSelected(end.row, end.cell)) return;

				dd._range.end = end;
				decorator.show(new CellRange({fromRow: dd._range.start.row, fromCell: dd._range.start.cell, toRow: end.row, toCell: end.cell}, self));

				// Set the active cell as you drag. This is default spreadsheet behavior.
				if (self.options.activateSelection && canCellBeActive(end.row, end.cell)) {
					setActiveCellInternal(getCellNode(end.row, end.cell), false);
				}
			})
			.on('dragend', {not: handleSelector}, function (event, dd) {
				if (!_dragging) return;
				_dragging = false;

				event.stopImmediatePropagation();

				decorator.hide();

				self._event = event;

				// Dragging always selects a new range unless Shift key is held down
				if (!event.shiftKey) deselectCells();

				self.selectCells(
					dd._range.start.row,
					dd._range.start.cell,
					dd._range.end.row,
					dd._range.end.cell,
					event.shiftKey
				);
				self._event = null;

				// Automatically go into edit mode
				if (self.options.activateSelection) {
					makeActiveCellEditable();
				}
			});
	};


	/**
	 * Binds the necessary events to handle row resizing
	 * @method bindRowResize
	 * @memberof DobyGrid
	 * @private
	 */
	bindRowResize = function () {
		// This cannot be assigned to the $viewport element because the two drag
		// event binding conflict with each other.
		$canvas
			.on('dragstart', function (event, dd) {
				if (!$(event.target).hasClass(CLS.rowhandle)) return;
				event.stopImmediatePropagation();

				dd._row = getRowFromNode($(event.target).parent()[0]);
				dd._rowNode = cache.nodes[dd._row].rowNode;

				// Grab all the row nodes below the current row
				dd._rowsBelow = [];
				$(dd._rowNode).siblings().each(function () {
					// If the row is below the dragged one - collected it
					var r = getRowFromNode(this);
					if (r > dd._row) dd._rowsBelow.push(this);
				});

				// Put the rows below into a temporary container
				$(dd._rowsBelow).wrapAll('<div class="' + CLS.rowdragcontainer + '"></div>');
				dd._container = $(dd._rowsBelow).parent();
			})
			.on('drag', function (event, dd) {
				if (dd._row === undefined) return;

				// Resize current row
				var node = dd._rowNode,
					pos = cache.rowPositions[dd._row],
					height = (pos.height || self.options.rowHeight);
				dd._height = height + dd.deltaY;

				// Do not allow invisible heights
				if (dd._height < 5) dd._height = 5;

				// Apply height and line-height
				$(node).height(dd._height);
				$(node).css('line-height', (dd._height + self.options.lineHeightOffset) + 'px');

				// Drag and container of rows below
				dd._container.css({marginTop: (dd._height - height) + 'px'});
			})
			.on('dragend', function (event, dd) {
				if (dd._row === undefined) return;

				// Unwrap rows below
				$(dd._rowsBelow).unwrap();

				setRowHeight(dd._row, dd._height);
			});
	};


	/**
	 * Walks through the data and caches positions for all the rows into
	 * the 'cache.rowPositions' object
	 * @method cacheRows
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	[from]			- Start to cache from which row?
	 * @param	{boolean}	[indexOnly]		- If true, will only perform a re-index
	 *
	 */
	cacheRows = function (from, indexOnly) {
		from = from || 0;

		// Start cache object
		if (from === 0) {
			cache.indexById = {};
			if (!indexOnly && variableRowHeight) {
				cache.rowPositions = {
					0: {
						top: self.options.rowSpacing,
						height: self.options.rowHeight,
						bottom: self.options.rowHeight + self.options.rowSpacing,
						spacing: self.options.rowSpacing
					}
				};
			}
		}

		var item, data, rowSpacing;
		for (var i = from, l = cache.rows.length; i < l; i++) {
			item = cache.rows[i];

			// Cache by item id
			// NOTE: This is currently the slowest part of grid initialization. Can it be done
			// lazily since this is only used for get/add/remove.
			cache.indexById[item[self.options.idProperty]] = i;

			// Cache row position
			if (!indexOnly && variableRowHeight) {
				data = {
					top: ((cache.rowPositions[i - 1]) ? (cache.rowPositions[i - 1].bottom - offset) : 0)
				};

				// The extra 1 is here to compesate for the 1px space between rows
				data.top += (i === 0 ? 0 : 1);

				rowSpacing = (item.rowSpacing !== null && item.rowSpacing !== undefined ? item.rowSpacing : self.options.rowSpacing);

				// Process rowSpacing function
				if (typeof rowSpacing === 'function') rowSpacing = rowSpacing(item);

				// Row spacing goes on top
				data.spacing = rowSpacing;
				data.top += rowSpacing;

				if (item.height !== null && item.height !== undefined && item.height != self.options.rowHeight) {
					if (typeof(item.height) === 'function') {
						data.height = item.height(item);
					} else {
						data.height = item.height;
					}
				}

				data.bottom = data.top + (data.height !== null && data.height !== undefined ? data.height : self.options.rowHeight);

				cache.rowPositions[i] = data;
			}
		}
	};


	/**
	 * Calculates the number of currently visible rows in the viewport. Partially visible rows are
	 * included in the calculation.
	 * @method calculateVisibleRows
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {integer}
	 */
	calculateVisibleRows = function () {

		// All rows are visible when using autoHeight
		if (self.options.autoHeight) {
			numVisibleRows = self.collection.length;
			return;
		}

		// When in variable row height mode we need to find which actual rows are at the
		// top and bottom of the viewport
		if (variableRowHeight) {
			var scrollTop = $viewport[0].scrollTop,
				bottomRow = getRowFromPosition(viewportH + scrollTop);
			numVisibleRows = bottomRow - getRowFromPosition(scrollTop);

		// When in fixed right height mode - we can make a much faster calculation
		} else {
			numVisibleRows = Math.floor(viewportH / (self.options.rowHeight + 1 + self.options.rowSpacing));
		}
	};


	/**
	 * Can a given cell be activated?
	 * @method canCellBeActive
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row		- Row index
	 * @param	{integer}	cell	- Cell index
	 *
	 * @returns {boolean}
	 */
	canCellBeActive = function (row, cell) {
		if (!self.options.keyboardNavigation || row >= getDataLength() ||
			row < 0 || cell >= cache.activeColumns.length || cell < 0) {
			return false;
		}

		var item = self.getRowFromIndex(row);
		if (typeof item.focusable === "boolean") return item.focusable;

		var columnMetadata = item.columns;
		if (
			columnMetadata &&
			columnMetadata[cache.activeColumns[cell].id] &&
			typeof columnMetadata[cache.activeColumns[cell].id].focusable === "boolean"
		) {
			return columnMetadata[cache.activeColumns[cell].id].focusable;
		}
		if (columnMetadata && columnMetadata[cell] && typeof columnMetadata[cell].focusable === "boolean") {
			return columnMetadata[cell].focusable;
		}

		return cache.activeColumns[cell].focusable;
	};


	/**
	 * Can a given cell be selected?
	 * @method canCellBeSelected
	 * @memberof DobyGrid
	 *
	 * @param	{integer}		row		- Row index
	 * @param	{integer}		cell	- Cell index
	 *
	 * @returns {boolean}
	 */
	this.canCellBeSelected = function (row, cell) {
		if (row >= getDataLength() || row < 0 || cell >= cache.activeColumns.length || cell < 0) {
			return false;
		}

		var item = self.getRowFromIndex(row);
		if (typeof item.selectable === "boolean") {
			return item.selectable;
		}

		var columnMetadata = item.columns && (item.columns[cache.activeColumns[cell].id] || item.columns[cell]);
		if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
			return columnMetadata.selectable;
		}

		return cache.activeColumns[cell].selectable;
	};


	/**
	 * Returns true if the requested cell exists in the data set
	 * @method cellExists
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}		row		- Index of the row
	 * @param	{integer}		cell	- Index of the cell
	 *
	 * @returns {boolean}
	 */
	cellExists = function (row, cell) {
		return !(row < 0 || row >= getDataLength() || cell < 0 || cell >= cache.activeColumns.length);
	};


	/**
	 * Re-renders existing cells. Makes sure that all columns in the viewport are rendered.
	 * @method cleanUpAndRenderCells
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param		{object}		range		- Cell range to render
	 *
	 */
	cleanUpAndRenderCells = function (range) {
		var cacheEntry,
			stringArray = [],
			processedRows = [],
			cellsAdded,
			totalCellsAdded = 0,
			colspan;

		for (var row = range.top, btm = range.bottom; row <= btm; row++) {
			cacheEntry = cache.nodes[row];
			if (!cacheEntry) continue;

			// cellRenderQueue populated in renderRows() needs to be cleared first
			ensureCellNodesInRowsCache(row);

			cleanUpCells(range, row);

			// Render missing cells
			cellsAdded = 0;

			var item = self.getRowFromIndex(row),
				metadata = item.columns;

			for (var i = 0, ii = cache.activeColumns.length; i < ii; i++) {
				// Cells to the right are outside the range.
				if (cache.columnPosLeft[i] > range.rightPx) break;

				// Already rendered
				colspan = cacheEntry.cellColSpans[i];
				if (colspan !== null && colspan !== undefined) {
					i += (colspan > 1 ? colspan - 1 : 0);
					continue;
				}

				colspan = 1;
				if (metadata) {
					var columnData = metadata[cache.activeColumns[i].id] || metadata[i];
					colspan = (columnData && columnData.colspan) || 1;
					if (colspan === "*") {
						colspan = ii - i;
					}
				}

				if (cache.columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
					renderCell(stringArray, row, i, colspan, item);
					cellsAdded++;
				}

				i += (colspan > 1 ? colspan - 1 : 0);
			}

			if (cellsAdded) {
				totalCellsAdded += cellsAdded;
				processedRows.push(row);
			}
		}

		if (!stringArray.length) return;

		var x = document.createElement("div");
		x.innerHTML = stringArray.join("");

		var processedRow, node, columnIdx;
		while ((processedRow = processedRows.pop()) !== null && processedRow !== undefined) {
			cacheEntry = cache.nodes[processedRow];
			while ((columnIdx = cacheEntry.cellRenderQueue.pop()) !== null && columnIdx !== undefined) {
				node = $(x.lastChild);
				cacheEntry.rowNode.append(node);
				cacheEntry.cellNodesByColumnIdx[columnIdx] = node;
			}
		}
	};


	/**
	 * Cleanup the cell cache
	 * @method cleanUpCells
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	range	- Data about the range to clean up
	 * @param	{integer}	row		- Which row to clean up
	 *
	 */
	cleanUpCells = function (range, row) {
		var totalCellsRemoved = 0;
		var cacheEntry = cache.nodes[row];

		// Remove cells outside the range.
		var cellsToRemove = [];
		for (var i in cacheEntry.cellNodesByColumnIdx) {
			// I really hate it when people mess with Array.prototype.
			if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)) {
				continue;
			}

			// This is a string, so it needs to be cast back to a number.
			i = i | 0;

			var colspan = cacheEntry.cellColSpans[i];
			if (cache.columnPosLeft[i] > range.rightPx ||
				cache.columnPosRight[Math.min(cache.activeColumns.length - 1, i + colspan - 1)] < range.leftPx) {
				if (self.active && !(row == self.active.row && i == self.active.cell)) {
					cellsToRemove.push(i);
				}
			}
		}

		var cellToRemove;
		while (((cellToRemove = cellsToRemove.pop()) !== null && cellToRemove !== undefined) && cellToRemove) {
			cacheEntry.cellNodesByColumnIdx[cellToRemove].remove();
			delete cacheEntry.cellColSpans[cellToRemove];
			delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
			if (cache.postprocess[cache.rows[row].id]) {
				delete cache.postprocess[cache.rows[row].id][cache.activeColumns[cellToRemove].id];
			}
			totalCellsRemoved++;
		}
	};


	/**
	 * Cleans the row cache
	 * @method cleanupRows
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	rangeToKeep		- A range of top/bottom values to keep
	 *
	 */
	cleanupRows = function (rangeToKeep) {
		var acr = self.active && 'row' in self.active ? self.active.row : null;
		for (var i in cache.nodes) {
			if (((i = parseInt(i, 10)) !== acr) && (i < rangeToKeep.top || i > rangeToKeep.bottom)) {
				removeRowFromCache(i);
			}
		}
	};


	/**
	 * If user has somethinge selected - clears that selection
	 * @method clearTextSelection
	 * @memberof DobyGrid
	 * @private
	 */
	clearTextSelection = function () {
		if (document.selection && document.selection.empty) {
			try {
				// IE fails here if selected element is not in DOM
				document.selection.empty();
			} catch (e) {}
		} else if (window.getSelection) {
			var sel = window.getSelection();
			if (sel && sel.removeAllRanges) {
				sel.removeAllRanges();
			}
		}
	};


	/**
	 * Processes edit operations using the current editor
	 * @method commitCurrentEdit
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{function}	callback	- Callback function
	 */
	commitCurrentEdit = function (callback) {
		if (!self.active || !self.currentEditor) return callback(true);

		var item = self.getRowFromIndex(self.active.row),
			column = cache.activeColumns[self.active.cell];

		// Creates a list of all the cells that will be affected by the edit
		var getCellsToEdit = function () {
			var cellsToEdit = [],
				includes_active = false;

			if (self.options.editorType == 'selection' && self.selection) {
				for (var i = 0, l = self.selection.length; i < l; i++) {
					for (var j = self.selection[i].fromRow, k = self.selection[i].toRow; j <= k; j++) {
						for (var q = self.selection[i].fromCell, m = self.selection[i].toCell; q <= m; q++) {
							// Is this cell editable
							if (!isCellPotentiallyEditable(j, q)) continue;

							if (j == self.active.row && q == self.active.cell) includes_active = true;
							cellsToEdit.push({
								item: cache.rows[j],
								column: cache.activeColumns[q],
								row: j,
								cell: q,
								$cell: $(getCellNode(j, q))
							});
						}
					}
				}
			}

			// If active cell is not in selection - apply edit to it too
			if (!includes_active && isCellPotentiallyEditable(self.active.row, self.active.cell)) {
				cellsToEdit.push({
					item: item,
					column: column,
					row: self.active.row,
					cell: self.active.cell,
					$cell: $(getCellNode(self.active.row, self.active.cell))
				});
			}

			return cellsToEdit;
		};

		var showInvalidHandler = function (validationResults) {
			// Execute the showInvalid function for the editor, if it exists
			if (self.currentEditor.showInvalid) self.currentEditor.showInvalid(validationResults);

			self.trigger('validationerror', self._event, {
				editor: self.currentEditor,
				cellNode: self.active.node,
				validationResults: validationResults,
				row: self.active.row,
				cell: self.active.cell,
				column: column
			});

			self.currentEditor.focus();
		};

		if (!self.currentEditor.isValueChanged()) {
			// No changes made
			callback(true);
		} else {
			var cellsToEdit = getCellsToEdit();

			// Run validation on all the affected cells
			self.currentEditor.validate(cellsToEdit, function (validationResults) {
				if (validationResults === true) {
					// If we're inside an "addRow", create a duplicate and write to that
					if (item.__addRow) {
						var newItem = {
							data: {}
						};

						// Add row
						self.currentEditor.applyValue([{
							item: newItem,
							column: column,
							row: self.active.row,
							cell: self.active.cell,
							$cell: $(getCellNode(self.active.row, self.active.cell))
						}], self.currentEditor.serializeValue());

						// Make sure item has an id
						if ((!newItem.data.id && !newItem.id) ||
							newItem.id in cache.indexById ||
							newItem.data.id in cache.indexById
						) {
							return showInvalidHandler([{
								row: self.active.row,
								cell: self.active.cell,
								$cell: $(getCellNode(self.active.row, self.active.cell)),
								msg: "Unable to create a new item without a unique 'id' value."
							}]);
						}

						// Add item to data
						self.add(newItem);

						self.trigger('newrow', self._event, {
							cell: self.active.cell,
							column: column,
							item: newItem,
							row: self.active.row
						});
					} else {

						// Execute the operation
						self.currentEditor.applyValue(cellsToEdit, self.currentEditor.serializeValue());

						// Update rows
						for (var i = 0, l = cellsToEdit.length; i < l; i++) {
							updateRow(cellsToEdit[i].row);

							self.trigger('change', self._event, {
								row: cellsToEdit[i].row,
								cell: cellsToEdit[i].cell,
								item: cellsToEdit[i].item
							});
						}
					}

					// If we're using aggregators - update them now.
					// Except for Backbone Collection data sets -- those will auto-refresh
					if (Object.keys(cache.aggregatorsByColumnId).length > 0) {
						resetAggregators();
						if (!(self.options.data instanceof Backbone.Collection)) {
							self.collection.refresh();
						}
					}

					// Deselect any selections
					deselectCells();

					makeActiveCellNormal();
					callback(true);
				} else {
					showInvalidHandler(validationResults);
					callback(false);
				}
			});
		}

		return true;
	};


	/**
	 * Copies the selected cell(s) to the clipboard
	 * @method copySelected
	 * @memberof DobyGrid
	 * @private
	 */
	copySelected = function () {
		var result;

		// Do we have a cell range selection?
		if (self.selection) {
			// Are the multiple selections?
			if (self.selection.length > 1) return alert('Sorry, you cannot copy multiple selections.');

			switch (self.options.clipboard) {
				case 'csv':
					result = self.selection[0].toCSV();
					break;

				case 'json':
					result = JSON.stringify(self.selection[0].toJSON());
					break;

				case 'html':
					result = self.selection[0].toHTML();
					break;
			}
		}

		// Do we have an active cell?
		if (!result && self.active && self.active.node) {
			var row = getRowFromNode(self.active.node.parentNode),
				cell = getCellFromNode(self.active.node),
				item = cache.rows[row],
				column = cache.activeColumns[cell];
			result = self.getValueFromItem(item, column);
		}

		// Send to clipboard by creating a dummy container with the text selected
		// and letting the browser execute the default clipboard behavior. Similar to:
		// http://stackoverflow.com/questions/17527870/how-does-trello-access-the-users-clipboard
		if (result) {
			$('<textarea class="' + CLS.clipboard + '"></textarea>')
				.val(result)
				.appendTo(self.$el)
				.focus()
				.select()
				.on('keyup', function () {
					removeElement(this);
				});
		}
	};


	/**
	 * Generates the CSS styling that will drive the dimensions of the grid cells
	 * @method createCssRules
	 * @memberof DobyGrid
	 * @private
	 */
	createCssRules = function () {
		$style = $('<style type="text/css" rel="stylesheet"></style>').appendTo($("head"));
		var rowHeight = self.options.rowHeight - cellHeightDiff;
		var rules = [
			"#" + uid + " ." + CLS.row + "{height:" + rowHeight + "px;line-height:" + (rowHeight + self.options.lineHeightOffset) + "px}"
		];

		for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
			rules.push("#" + uid + " .l" + i + "{}");
			rules.push("#" + uid + " .r" + i + "{}");
		}

		$style[0].appendChild(document.createTextNode(rules.join("\n")));
	};


	/**
	 * Generates the grid elements
	 * @method createGrid
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {object}
	 */
	createGrid = function () {
		// Create the container
		var cclasses = [self.NAME];
		if (self.options.class) cclasses.push(self.options.class);
		if (self.options.scrollbarPosition === 'left') cclasses.push(CLS.left);
		if (self.options.showGutters) cclasses.push(CLS.guttersVisible);

		self.$el = $('<div class="' + cclasses.join(' ') + '" id="' + uid + '"></div>');

		// Create pane elements
		var panes = ['top-left', 'top-right', 'bottom-left', 'bottom-right'], $p, $v, $c;

		$panes = $();
		$viewport = $();
		$canvas = $();
		$gutters = $();

		for (var i = 0, l = panes.length; i < l; i++) {
			// Generate panes
			$p = $([
				'<div class="', CLS.pane,
				' ', CLS.pane, '-', panes[i],
				'"></div>'
			].join('')).appendTo(self.$el);

			// Generate viewport containers
			$v = $([
				'<div class="', CLS.viewport,
				(self.options.autoHeight ? ' ' + CLS.autoheight : ''),
				(self.options.frozenColumns > -1 && i % 2 === 0 ? ' ' + CLS.autoheight : ''),
				'"></div>'
			].join('')).appendTo($p);

			// Create gutters.
			if (self.options.showGutters) {
				var gutter = '<div class="' + CLS.gutter + '"></div>';
				var $gutterLeft = $(gutter).addClass('left').appendTo($v);
				var $gutterRight = $(gutter).addClass('right').appendTo($v);
				$gutters = $gutters
					.add($gutterLeft)
					.add($gutterRight);
			}

			// Generate canvas
			// The tabindex here ensures we can focus on this element
			// otherwise we can't assign keyboard events
			$c = $('<div class="' + CLS.canvas + '" tabindex="0"></div>').appendTo($v);

			$panes = $panes.add($p);
			$viewport = $viewport.add($v);
			$canvas = $canvas.add($c);
		}

		// Create header elements
		if (self.options.showHeader) {
			$headerScrollerL = $('<div class="' + CLS.header + '"></div>');
			$panes.eq(0).prepend($headerScrollerL);
			$headerScrollerR = $('<div class="' + CLS.header + '"></div>');
			$panes.eq(1).prepend($headerScrollerR);

			$headerScroller = $().add($headerScrollerL).add($headerScrollerR);

			$headerL = $('<div class="' + CLS.headercolumns + '"></div>')
				.appendTo($headerScrollerL)
				.width(getHeadersWidth());

			$headerR = $('<div class="' + CLS.headercolumns + '"></div>')
				.appendTo($headerScrollerR)
				.width(getHeadersWidth());

			$headers = $().add($headerL).add($headerR);
		}
	};


	/**
	 * Given a grouping object, extends it with the defaults.
	 * @method createGroupingObject
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	grouping		- A column grouping object
	 *
	 * @returns {object}
	 */
	createGroupingObject = function (grouping) {
		if (!grouping) throw new Error("Unable to create group because grouping object is missing.");

		if (grouping.column_id === undefined) throw new Error("Unable to create grouping object because 'column_id' is missing.");

		var column = getColumnById(grouping.column_id);

		var result = $.extend({
			collapsed: true,	// All groups start off being collapsed
			column_id: column.id,
			comparator: function (a, b) {
				// Null groups always on the bottom
				if (self.options.keepNullsAtBottom) {
					if (a.value === null) return 1;
					if (b.value === null) return -1;
				}

				// Find the current sort direction for this group
				var asc = true;
				for (var i = 0, l = self.sorting.length; i < l; i++) {
					if (self.sorting[i].columnId == a.predef.column_id) {
						asc = self.sorting[i].sortAsc;
						break;
					}
				}

				var sorted = naturalSort(a.value, b.value);
				return asc ? sorted : -sorted;
			},
			getter: function (item) {
				return getDataItemValueForColumn(item, column);
			},
			rows: []
		}, grouping);

		return result;
	};


	/**
	 * @class Collection
	 * @classdesc This is a special class that looks an awful lot like Backbone.Collection and it
	 * stores and manipulates the data set for this grid.
	 * So why not just use a Backbone.Collection?
	 *	1) It's super slow for large data sets: https://github.com/jashkenas/backbone/issues/2760
	 *	2) In order for 'remote' fetching to work nicely with scrolling, the collection has to
	 *		simulate objects that haven't been fetched from the server yet. Backbone doesn't allow
	 *		you to have "fake" data in their collections without some serious hacking.
	 *
	 * @param	{object}		grid		- Reference pointer to the grid instance
	 *
	 * @returns {object}
	 */
	Collection = function (grid) {

		// Private Variables

		var self = this,
			expandCollapseAllGroups,
			filterCache = [],
			filteredItems = [],
			groupingDelimiter = ':|:',
			prevRefreshHints = {},
			refreshHints = {},
			rowsById = null,	// rows by id; lazy-calculated
			sortAsc = true,
			sortComparer,
			toggledGroupsByLevel = [],
			totalRows = 0,
			updated = null,		// updated item ids

		// Private Methods

			expandCollapseGroup,
			extractGroups,
			finalizeGroups,
			flattenGroupedRows,
			getFilteredItems,
			getRowDiffs,
			parse,
			processAggregators,
			processGroupAggregators,
			recalc,
			uncompiledFilter,
			uncompiledFilterWithCaching;


		// Events
		$.extend(this, Backbone.Events);

		// Items by index
		this.items = [];

		// Filter function
		this.filter = null;

		// Group definitions
		this.groups = [];

		// Size of the collection
		this.length = 0;


		/**
		 * Initializes the Data View
		 * @method initialize
		 * @memberof Collection
		 *
		 * @returns {object}
		 */
		this.initialize = function () {

			// If we have normal data - set it now
			if (!grid.fetcher && grid.options.data) {
				this.reset(grid.options.data);
			}

			return this;
		};


		/**
		 * Add models to the collection.
		 * @method add
		 * @memberof Collection
		 *
		 * @param	{array|object}		models		- Object(s) to add to the collection
		 * @param	{object}			options		- Additional options
		 *
		 * @returns {object}
		 */
		this.add = function (models, options) {
			if (!$.isArray(models)) models = models ? [models] : [];
			options = options || {};
			var at = options.at, model, existing, toAdd = [];

			// Parse models
			parse(models);

			// Ensures setItem() does not call refresh() for each item
			suspend = true;

			// Merge existing models and collect the new ones
			for (var i = 0, l = models.length; i < l; i++) {
				model = models[i];
				existing = this.get(model);
				if (existing) existing = existing[1];

				// For remote models, check if we're inserting 'at' an index with place holders
				if (grid.fetcher && at !== undefined) {
					if (this.items[at + i] && this.items[at + i].__placeholder) {
						existing = this.items[at + i];
					}
				}

				if (existing) {
					if (options.merge) {
						this.setItem(existing[grid.options.idProperty], model);
					} else {
						throw new Error([
							"You are not allowed to add() items without a unique '",
							grid.options.idProperty, "' value. ",
							"A row with id '", existing[grid.options.idProperty],
							"' already exists."
						].join(''));
					}
				} else {
					toAdd.push(model);
				}
			}

			suspend = false;

			// Previous size of the collection
			var prevLength = this.items.length;

			// Add the new models
			if (toAdd.length) {
				// If data used to be empty, with an alert - remove alert
				if (this.items.length && $overlay && $overlay.length) {
					grid.hideOverlay();
				}

				// If "addRow" is enabled, make sure we don't insert below it
				if (grid.options.addRow && (
						(at && at > this.items.length) ||
						at === null || at === undefined
					) && !('__addRow' in toAdd[0])
				) {
					at = this.items.length - 1;
				}

				// Add to internal collection and update cache
				if (at !== null && at !== undefined) {
					Array.prototype.splice.apply(this.items, [at, 0].concat(toAdd));
					cacheRows((at > 0 ? at - 1 : 0));
				} else {
					Array.prototype.push.apply(this.items, toAdd);
					cacheRows(prevLength > 0 ? prevLength - 1 : 0);
				}

				// Cache by id
				for (i = 0, l = toAdd.length; i < l; i++) {
					cache.modelsById[toAdd[i][grid.options.idProperty]] = toAdd[i];
				}
			}

			// If not updating silently, reload grid
			if (!options.silent) {

				// Reduce the refresh loop. This greatly improves the performance of large datasets,
				// especially when using Backbone.Collection which calls add() very often.
				if (at) refreshHints.ignoreDiffsAfter = at + toAdd.length;

				// Call bounced refresh to ensure successive add() commands don't cause
				// too many refreshes
				if (options.forced) {
					this.refresh();
				} else {
					this.refreshDebounced();
				}
			}

			return this;
		};


		/**
		 * Collapse all groups
		 * @method collapseAllGroups
		 * @memberof Collection
		 *
		 * @param	{integer}	level		- Optional level to collapse. If not
		 *									specified, applies to all levels.
		 */
		this.collapseAllGroups = function (level) {
			expandCollapseAllGroups(level, true);
		};


		/**
		 * Collapse a group
		 * @method collapseGroup
		 * @memberof Collection
		 */
		this.collapseGroup = function () {
			var args = Array.prototype.slice.call(arguments),
				arg0 = args[0];
			if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
				expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, true);
			} else {
				expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), true);
			}
		};


		/**
		 * Expand all groups
		 * @method expandAllGroups
		 * @memberof Collection
		 *
		 * @param	{integer}	level		- Optional level to expand.
		 *									If not specified, applies to all levels.
		 */
		this.expandAllGroups = function (level) {
			expandCollapseAllGroups(level, false);
		};


		/**
		 * Handles expading/collapsing for all groups in batch
		 * @method expandCollapseAllGroups
		 * @memberof Collection
		 * @private
		 *
		 * @param	{integer}		level		- Optional level to expand
		 * @param	{boolean}		collapse	- Collapse or expand?
		 *
		 */
		expandCollapseAllGroups = function (level, collapse) {
			if (level === null || level === undefined) {
				for (var i = 0, l = self.groups.length; i < l; i++) {
					toggledGroupsByLevel[i] = {};
					self.groups[i].collapsed = collapse;
				}
			} else {
				toggledGroupsByLevel[level] = {};
				self.groups[level].collapsed = collapse;
			}

			self.refresh();
			if (grid.fetcher && !collapse) remoteFetch();
		};


		/**
		 * Handles collapsing and expanding of groups
		 * @method expandCollapseGroup
		 * @memberof Collection
		 * @prviate
		 *
		 * @param	{integer}		level			- Which level are we toggling
		 * @param	{integer}		group_id		- Which group key are we toggling
		 * @param	{boolean}		collapse		- Collapse? Otherwise expand.
		 */
		expandCollapseGroup = function (level, group_id, collapse) {
			toggledGroupsByLevel[level][group_id] = self.groups[level].collapsed ^ collapse;
			resetAggregators();
			self.refresh();
			if (grid.fetcher && !collapse) remoteFetch();
		};


		/**
		 * Expands a collapsed group
		 * @method expandGroup
		 * @memberof Collection
		 */
		this.expandGroup = function () {
			var args = Array.prototype.slice.call(arguments),
				arg0 = args[0];

			if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
				expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, false);
			} else {
				expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), false);
			}
		};


		/**
		 * Make sure cell nodes are cached for a given row
		 * @method ensureCellNodesInRowsCache
		 * @memberof Collection
		 * @private
		 *
		 * @param	{integer}	row		- Row index
		 */
		ensureCellNodesInRowsCache = function (row) {
			var cacheEntry = cache.nodes[row];
			if (cacheEntry) {
				if (cacheEntry.cellRenderQueue.length) {
					var $lastNode = $(cacheEntry.rowNode).children('.' + CLS.cell + '').last();
					while (cacheEntry.cellRenderQueue.length) {
						var columnIdx = cacheEntry.cellRenderQueue.pop();
						cacheEntry.cellNodesByColumnIdx[columnIdx] = $lastNode;
						$lastNode = $lastNode.prev();

						// Hack to retrieve the frozen columns
						// TODO: Find out why this is needed. It was copied from jlynch.
						if ($lastNode.length === 0) {
							$lastNode = $(cacheEntry.rowNode[0]).children().last();
						}
					}
				}
			}
		};


		/**
		 * Generates new group objects from the given rows
		 * @method extractGroups
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}			rows			- The list of data objects to group
		 * @param	{object}		parentGroup		- The parent group object
		 * @param	{function}		callback		- Callback function
		 *
		 * @returns {array}
		 */
		extractGroups = function (rows, parentGroup, callback) {
			var group,
				val,
				groups = [],
				groupsByVal = {},
				r, gr, grl,
				level = parentGroup ? parentGroup.level + 1 : 0,
				gi = self.groups[level],
				i, l, aggregateRow, addRow, nullRows = [];

			// Get the value of a group at a specific level
			var getParentGroupValue = function (lvl, g) {
				if (g.level === lvl) return g.value;
				return getParentGroupValue(lvl - 1, g.parentGroup);
			};

			var checkRemoteGroup = function (level, group, pGroup) {
				// No parent groups yet
				if (!pGroup) return true;

				var pass = group.parent[level - 1] === getParentGroupValue(level - 1, pGroup);

				if (!pass) {
					return false;
				} else if (level === 1) {
					return true;
				} else {
					// Continue checking next level
					return checkRemoteGroup(level - 1, group, pGroup.parentGroup);
				}
			};

			// Reset grouping row references
			gi.rows = [];

			var processGroups = function (remote_groups) {

				var createGroupObject = function (g) {
					var value = g ? g.value : val;

					var grp = new Group({
						column_id: gi.column_id,
						collapsed: gi.collapsed,
						formatter: gi.formatter || getGroupFormatter(),
						level: level,
						parentGroup: (parentGroup ? parentGroup : null),
						predef: gi,
						sticky: gi.sticky !== null && gi.sticky !== undefined ? gi.sticky : true,
						value: value,
						visible: gi.groupNulls === false && value === null ? false : true
					});

					// Assign id property
					grp[grid.options.idProperty] = '__group' + (parentGroup ? parentGroup[grid.options.idProperty] + groupingDelimiter : '') + value;

					if (g) grp.count = g.count;

					// Remember the group rows in the grouping objects
					self.groups[level].rows.push(grp);

					return grp;
				};

				// If we are given a set of remote_groups, use them to generate new group objects
				if (remote_groups) {
					// Simple validation for remote grouping object
					if (remote_groups[level] === undefined) {
						throw new Error("Unable to group rows because the data returned from your remote fetchGroups method is missing a definition for `" + gi.column_id + "` column at array position `" + level + "`.");
					}

					var rm_g;
					for (var m = 0, n = remote_groups[level].groups.length; m < n; m++) {
						rm_g = remote_groups[level].groups[m];

						// For each parent, walk up the hierarchy of group parents and
						// confirm that this sub-group belongs there
						if (!checkRemoteGroup(level, rm_g, parentGroup)) continue;

						group = createGroupObject(rm_g);
						groups.push(group);
						groupsByVal[group.value] = group;
					}
				}

				// Loop through the rows in the group and create group header rows as needed
				for (i = 0, l = rows.length; i < l; i++) {
					r = rows[i];

					// The global grid aggregate should at the very end of the grid. Remember it here
					// And then we'll add it at the very end.
					if (r._aggregateRow && r.id == '__gridAggregate') {
						aggregateRow = r;
						continue;
					}

					// Do a similar thing for the AddRow row. Keep it at the bottom of the grid.
					if (r.__addRow) {
						addRow = r;
						continue;
					}

					if (r.__placeholder) {
						// For placeholder rows - find an empty group's value.
						// This must use the 'groups' object and not the 'groupByVal' because
						// the order of the groups is important for sorting.
						for (var g = 0, q = groups.length; g < q; g++) {
							if (groups[g].count > groups[g].grouprows.length) {
								val = groups[g].value;
								break;
							}
						}
					} else {
						// For normal rows - get their value
						val = typeof gi.getter === "function" ? gi.getter(r) : r[gi.getter];
					}

					// Store groups by value if the getter
					group = groupsByVal[val];

					// Create a new group header row, if it doesn't already exist for this group
					if (!group) {
						group = createGroupObject();
						groups.push(group);
						groupsByVal[val] = group;
					}

					// Insert row into its group
					group.grouprows.push(r);

					// Do not increment count for remote groups because we already have the right count
					if (!grid.fetcher) group.count++;
				}

				// If we have a custom dataExtractor -- general data values for this row
				// so that it can be sorted by any columns.
				for (gr = 0, grl = groups.length; gr < grl; gr++) {
					if (!groups[gr].predef.dataExtractor) continue;
					if (groups[gr].predef.dataExtractor) {
						groups[gr].data = {};
						for (var gri = 0, gril = grid.options.columns.length; gri < gril; gri++) {
							groups[gr].data[grid.options.columns[gri].field] = groups[gr].predef.dataExtractor(groups[gr], grid.options.columns[gri]);
						}
					}
				}

				// Nest groups
				if (level < self.groups.length - 1) {
					var setGroups = function (result) {
						group.groups = result;
					};

					for (i = 0, l = groups.length; i < l; i++) {
						gr = groups[i];

						// TODO: This looks hacky. Why is it here?
						group = gr;

						// Do not treat aggreates as groups
						if (gr._aggregateRow) continue;

						extractGroups(gr.grouprows, gr, setGroups);
					}
				}

				// Sort the groups if they're not remotely fetched. Remote groups
				// are expected to already be in the right order.
				if (!remote_groups) groups.sort(self.groups[level].comparator.bind(grid));

				// If null rows are collected - put it at the bottom of the grid
				if (nullRows.length) {
					groups = groups.concat(nullRows);
				}

				// If there's an add row - put it at the bottom of the grid
				if (addRow) groups.push(addRow);

				// If there's a global grid aggregate - put it at the bottom of the grid
				if (aggregateRow) groups.push(aggregateRow);

				callback(groups);
			};

			// Remote groups needs to be extracted from the remote source.
			// Do not re-fetch if all data is already loaded.
			if (grid.fetcher) {
				// remoteFetchGroups will cache the results after the first request,
				// so there is no fear of this being re-querying the server on every grouping loop
				remoteFetchGroups(function (results) {
					processGroups(results);
				});
			} else {
				processGroups();
			}
		};


		/**
		 * Ensure the group objects have valid data and the states are set correctly
		 * @method finalizeGroups
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		groups		- Groups to validate
		 * @param	{integer}	level		- Which level to validate
		 *
		 */
		finalizeGroups = function (groups, level) {
			level = level || 0;
			var gi = self.groups[level],
				toggledGroups = toggledGroupsByLevel[level],
				idx = groups.length,
				g,
				aggregateFilter = function (row) {
					return row._aggregateRow;
				};

			while (idx--) {
				g = groups[idx];

				g.collapsed = gi.collapsed ^ toggledGroups[g.id];
				g.title = g.value;

				// Force invisible rows to be expanded
				if (!g.visible) g.collapsed = 0;

				if (g.groups) {
					finalizeGroups(g.groups, level + 1);

					// Let the non-leaf setGrouping rows get garbage-collected.
					// Only keep Aggregate rows (when nestedAggregators option is on)
					if (grid.options.nestedAggregators) {
						g.grouprows = g.grouprows.filter(aggregateFilter);
					} else {
						g.grouprows = [];
					}
				}
			}
		};


		/**
		 * Given a list of groups and the nesting levels returns the list of grouped rows
		 * that are expanded.
		 * @method flattenGroupedRows
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		groups		- List of group objects
		 * @param	{integer}	level		- Level of group nesting to scan
		 *
		 * @returns {array}
		 */
		flattenGroupedRows = function (groups, level) {
			level = level || 0;
			var groupedRows = [],
				rows, gl = 0,
				g;

			for (var i = 0, l = groups.length; i < l; i++) {
				g = groups[i];
				groupedRows[gl++] = g;

				if (!g.collapsed) {
					rows = g.groups ? flattenGroupedRows(g.groups, level + 1) : g.grouprows;
					if (!rows) continue;
					for (var j = 0, m = rows.length; j < m; j++) {
						groupedRows[gl++] = rows[j];
					}

					// If this is a nested group - still draw its Aggregate row
					// when nestedAggregators is enabled
					if (grid.options.nestedAggregators && g.groups && g.grouprows.length === 1 && g.grouprows[0]._aggregateRow) {
						groupedRows[gl++] = g.grouprows[0];
					}
				}
			}

			return groupedRows;
		};


		/**
		 * Runs the data through the filters (if any).
		 * @method getFilteredItems
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		items		- List of items to filter through
		 *
		 * @returns {object}
		 */
		getFilteredItems = function (items) {
			// Remote data will already be filtered
			if (self.filter && !grid.fetcher) {
				var batchFilter = uncompiledFilter;
				var batchFilterWithCaching = uncompiledFilterWithCaching;

				if (refreshHints.isFilterNarrowing) {
					filteredItems = batchFilter(filteredItems);
				} else if (refreshHints.isFilterExpanding) {
					filteredItems = batchFilterWithCaching(items, filterCache);
				} else if (!refreshHints.isFilterUnchanged) {
					filteredItems = batchFilter(items);
				}
			} else {
				// special case: if not filtering and not paging, the resulting
				// rows collection needs to be a copy so that changes due to sort
				// can be caught
				filteredItems = items.concat();
			}

			return {
				totalRows: filteredItems.length,
				rows: filteredItems
			};
		};


		/**
		 * Get a model from collection, specified by an id, or by passing in a model.
		 * The model gets generated on demand as generating all models at the start would
		 * make the grid take a very long time to initialize. This way, users will always
		 * see model objects, but internally the grid can make use of direct item references
		 * when performance is important.
		 *
		 * Return back an array where the first key is the index of the item in the data list,
		 * and the second key is the data object itself.
		 * @method get
		 * @memberof Collection
		 *
		 * @param		{object|integer}	obj		- Model reference or model id
		 *
		 * @returns {array|null}
		 */
		this.get = function (obj) {
			if (obj === null) return void 0;
			var id = obj;
			if (typeof obj == 'object') {
				id = obj[grid.options.idProperty] || (obj.data && obj.data[grid.options.idProperty]);
				if (id === null || id === undefined) return null;
			}

			var result = cache.modelsById[id];
			return result ? [this.items.indexOf(result), result] : null;
		};


		/**
		 * Given two lists of row data objects, returns a list of indexes of the rows which
		 * are changed. This will tell the grid what needs to be re-cached and re-rendered.
		 * @method getRowDiffs
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		rows		- List of current rows
		 * @param	{array}		newRows		- List of new rows
		 *
		 * @returns {array}
		 */
		getRowDiffs = function (rows, newRows) {
			var item, r, eitherIsNonData, diff = [];
			var from = 0,
				to = newRows.length;

			if (refreshHints && refreshHints.ignoreDiffsBefore) {
				from = Math.max(0, Math.min(newRows.length, refreshHints.ignoreDiffsBefore));
			}

			if (refreshHints && refreshHints.ignoreDiffsAfter) {
				to = Math.min(newRows.length, Math.max(0, refreshHints.ignoreDiffsAfter));
			}

			for (var i = from, rl = rows.length; i < to; i++) {
				if (i >= rl) {
					diff[diff.length] = i;
				} else {
					item = newRows[i];
					r = rows[i];
					eitherIsNonData = (item && item.__nonDataRow) || (r && r.__nonDataRow);

					// Determine if 'r' is different from 'item'
					if (item && r &&
						(
							// Compare group with non group
							(item._groupRow && !(r._groupRow)) ||
							(!(item._groupRow) && r._groupRow) ||
							// Compare two groups
							(
								self.groups.length && eitherIsNonData &&
								(item && item._groupRow) && (item[grid.options.idProperty] != r[grid.options.idProperty]) ||
								(item && item._groupRow) && (item.collapsed != r.collapsed) ||
								(item && item._groupRow) && (item.count != r.count) ||

								// If item has no rows, but has nested groups - we have to redraw
								// because we can't assume that the nested groups haven't changed
								(item && item._groupRow && item.grouprows.length === 0 && item.groups && item.groups.length > 0) ||
								(r && r._groupRow && r.grouprows.length === 0 && r.groups && r.groups.length > 0) ||

								// If the items in the group have changed (like if placeholders
								// got replaced with real items).
								(item && item._groupRow && item.grouprows.length && r.grouprows.length) && (item.grouprows[0] != r.grouprows[0])
							) ||
							// Compare between different non-data types
							(
								eitherIsNonData &&
								// no good way to compare totals since they are arbitrary DTOs
								// deep object comparison is pretty expensive
								// always considering them 'dirty' seems easier for the time being
								(item._aggregateRow || r._aggregateRow)
							) ||
							// Compare between different data object ids
							(
								item && item[grid.options.idProperty] != r[grid.options.idProperty] ||
								(updated && updated[item[grid.options.idProperty]])
							)
						)
					) {
						diff[diff.length] = i;
					}
				}
			}

			return diff;
		};


		/**
		 * Given a list of items objects to convert to models, returns a list of parsed items.
		 * This also checks to see if we need to enable variable height support.
		 * @method parse
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}			items		- List of objects
		 * @param	{boolean}		recache		- Update cache of given items
		 *
		 * @returns {array}
		 */
		parse = function (items, recache) {
			var i, l, childrow, item;
			for (i = 0, l = items.length; i < l; i++) {
				item = items[i];

				// Validate that idProperty exists
				if (item[grid.options.idProperty] === undefined || item[grid.options.idProperty] === null) {
					throw new Error("Each data item must have a unique '" + grid.options.idProperty + "' key. The following item is missing an '" + grid.options.idProperty + "': " + JSON.stringify(item));
				}

				// Cache by id
				if (recache) cache.modelsById[item[grid.options.idProperty]] = item;

				// Check for children columns
				if (item.rows) {
					for (var rowIdx in item.rows) {
						childrow = item.rows[rowIdx];
						if (!variableRowHeight && (
							(childrow.height !== undefined && childrow.height !== null && childrow.height != grid.options.rowHeight) ||
							(childrow.rowSpacing !== undefined && childrow.rowSpacing !== null && childrow.rowSpacing != grid.options.rowSpacing)
						)) {
							variableRowHeight = true;
							break;
						}

						// Cache child row by id too
						if (recache) cache.modelsById[childrow[grid.options.idProperty]] = childrow;

						// Detect if nested postprocessing is needed via columns
						if (childrow.columns && !enableAsyncPostRender) {
							for (var childclmn in childrow.columns) {
								if (enableAsyncPostRender) break;
								if (childrow.columns[childclmn].postprocess) enableAsyncPostRender = true;
							}
						}

					}
				}

				// Detect if variable row heights are used
				if (!variableRowHeight && (
					(item.height !== undefined && item.height !== null && item.height !== grid.options.rowHeight) ||
					(item.rowSpacing !== undefined && item.rowSpacing !== null && item.rowSpacing !== grid.options.rowHeight)
				)) {
					variableRowHeight = true;
				}

				// Detect if nested postprocessing is needed via columns
				if (item.columns && !enableAsyncPostRender) {
					for (var clmn in item.columns) {
						if (enableAsyncPostRender) break;
						if (item.columns[clmn].postprocess) enableAsyncPostRender = true;
					}
				}
			}

			return items;
		};


		/**
		 * Processes any aggregrators that are enabled and caches their results.
		 * Then inserts new Aggregate rows that are needed.
		 * @method processAggregators
		 * @memberof Collection
		 * @private
		 */
		processAggregators = function () {
			var item, i, l, active_aggregator, agg_keys,
				column_id, aggreg_idx,
				items = filteredItems;

			// Loop through the data and process the aggregators
			for (i = 0, l = items.length; i < l; i++) {
				item = items[i];

				// Skip nonData rows
				if (item instanceof NonDataItem) continue;

				for (column_id in cache.aggregatorsByColumnId) {

					// Make sure only one aggregator is active
					active_aggregator = null;
					for (aggreg_idx in cache.aggregatorsByColumnId[column_id]) {
						if (cache.aggregatorsByColumnId[column_id][aggreg_idx].active) {
							if (active_aggregator === null) {
								active_aggregator = cache.aggregatorsByColumnId[column_id][aggreg_idx];
							} else {
								// Disable duplicate active aggregators
								cache.aggregatorsByColumnId[column_id][aggreg_idx].active = false;
							}
						}
					}

					// If no active aggregator found - use first one
					agg_keys = Object.keys(cache.aggregatorsByColumnId[column_id]);
					if (active_aggregator === null && agg_keys.length) {

						active_aggregator = cache.aggregatorsByColumnId[column_id][agg_keys[0]];
						active_aggregator.active = true;
					}

					if (active_aggregator === null) continue;

					// Do not re-process aggregators
					if (active_aggregator._processed) continue;

					// Now process the active aggregator
					if (typeof(active_aggregator.process) == 'function') {
						active_aggregator.process(item);
					} else {
						throw new Error('The column aggregator for "' + column_id + '" is missing a valid \'process\' function.');
					}
				}
			}

			// Mark aggregators as 'processed'
			for (column_id in cache.aggregatorsByColumnId) {
				for (aggreg_idx in cache.aggregatorsByColumnId[column_id]) {
					if (cache.aggregatorsByColumnId[column_id].active) {
						cache.aggregatorsByColumnId[column_id]._processed = true;
					}
				}
			}

			// Insert grid totals row
			var gridAggregate = new Aggregate(cache.aggregatorsByColumnId);

			// Mark this is the grid-level aggregate
			gridAggregate[grid.options.idProperty] = '__gridAggregate';

			// Insert new Aggregate row
			items.push(gridAggregate);
		};


		/**
		 * Processes the aggregation methods for each group.
		 * Then inserts new Aggregate rows at the bottom of each.
		 * @method processGroupAggregators
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		groups		- Groups to process
		 */
		processGroupAggregators = function (groups) {
			// For each group we're going to generate a new aggregate row
			var i, l, group, item, column, column_id, ii, ll, aggreg_idx;
			for (i = 0, l = groups.length; i < l; i++) {
				group = groups[i];

				// Make sure this is a group row
				if (!group._groupRow) continue;

				// Create a new aggregators instance for each column
				group.aggregators = {};
				for (column_id in cache.aggregatorsByColumnId) {
					// NOTE: This can be optimized
					column = getColumnById(column_id);

					group.aggregators[column_id] = {};
					for (aggreg_idx in cache.aggregatorsByColumnId[column_id]) {
						group.aggregators[column_id][aggreg_idx] = new column.aggregators[aggreg_idx].fn(column);
						if (typeof(group.aggregators[column_id][aggreg_idx].reset) == 'function') {
							group.aggregators[column_id][aggreg_idx].reset();
						}

						if (cache.aggregatorsByColumnId[column_id][aggreg_idx].active) {
							group.aggregators[column_id][aggreg_idx].active = true;
						}
					}
				}

				// Loop through the group row data and process the aggregators
				for (ii = 0, ll = groups[i].grouprows.length; ii < ll; ii++) {
					item = groups[i].grouprows[ii];

					// Skip NonData rows
					if (item instanceof NonDataItem) continue;

					for (column_id in group.aggregators) {
						for (aggreg_idx in group.aggregators[column_id]) {
							group.aggregators[column_id][aggreg_idx].process(item);
						}
					}
				}

				// Insert grid totals row
				var groupAggregate = new Aggregate(group.aggregators);
				groupAggregate[grid.options.idProperty] = '__gridAggregate-group-' + group.id;
				group.grouprows.push(groupAggregate);

				// Process nested groups
				if (group.groups && group.groups.length) processGroupAggregators(group.groups);
			}
		};


		/**
		 * Given a list of rows we're viewing determines which of them need to be re-rendered
		 * @method recalc
		 * @memberof Collection
		 * @private
		 *
		 * @param		{array}		_items		- List of rows to render
		 * @param		{function}	callback	- Callback function
		 *
		 * @returns {array}
		 */
		recalc = function (_items, callback) {
			rowsById = null;

			if (refreshHints.isFilterNarrowing != prevRefreshHints.isFilterNarrowing ||
				refreshHints.isFilterExpanding != prevRefreshHints.isFilterExpanding) {
				filterCache = [];
			}

			var filteredItems = getFilteredItems(_items);
			totalRows = filteredItems.totalRows;
			var newRows = filteredItems.rows;

			// Process aggregators
			if (Object.keys(cache.aggregatorsByColumnId).length) {
				processAggregators();
			}

			var extractChildRows = function (parentRow, newRowsWithChildren) {
				for (var r in parentRow.rows) {
					if (parentRow.rows[r].collapsed) continue;

					// Remember the child row's parent in the 'parent' attribute
					parentRow.rows[r].parent = parentRow;
					newRowsWithChildren.push(parentRow.rows[r]);

					// Recursively scan for more children
					if (parentRow.rows[r].rows) {
						extractChildRows(parentRow.rows[r], newRowsWithChildren);
					}
				}
			};

			var processChildRows = function () {
				// Insert child rows
				var newRowsWithChildren = [];
				for (var i = 0, l = newRows.length; i < l; i++) {
					// If this is an invisible row - skip it entirely
					if (newRows[i].visible === false) continue;

					newRowsWithChildren.push(newRows[i]);

					if (newRows[i].rows) {
						extractChildRows(newRows[i], newRowsWithChildren);
					}
				}

				var diff = getRowDiffs(cache.rows, newRowsWithChildren);
				cache.rows = newRowsWithChildren;

				if (diff.length) {
					// Recache positions using the flattened group data
					cacheRows(0);
				}

				callback(diff);
			};

			// Insert group rows
			// NOTE: This is called when groups are collapsed and expanded which causes extractGroups
			// to be executed again -- there is no reason this needs to happen.
			//
			// Do not create groups when the grid is empty.
			//
			var groups = [];
			if (self.groups.length && self.items.length) {

				extractGroups(newRows, null, function (result) {
					groups = result;
					if (groups.length) {
						if (Object.keys(cache.aggregatorsByColumnId).length) {
							processGroupAggregators(groups);
						}
						finalizeGroups(groups);
						newRows = flattenGroupedRows(groups);
					}

					processChildRows();
				});
			} else {
				processChildRows();
			}
		};


		/**
		 * Automatically re-render the grid when rows have changed
		 * @method refresh
		 * @memberof Collection
		 */
		this.refresh = function () {
			if (suspend) return;

			// TODO: If grid was destroyed -- leave immediatele. This is needed for remote unit tests
			// for some reason. Investigate one day.
			if (grid.destroyed) return;

			var countBefore = cache.rows.length,
				diff;

			// Recalculate changed rows
			recalc(this.items, function (result) {
				diff = result;

				updated = null;
				prevRefreshHints = refreshHints;
				refreshHints = {};

				// Change the length of the collection to the new number of rows
				this.length = cache.rows.length;

				if (countBefore != cache.rows.length) {
					updateRowCount();
				}

				if (diff.length > 0) {
					invalidateRows(diff);
					render();
				}

				if (this.length === 0) {
					if (!grid.fetcher && grid.options.emptyNotice) insertEmptyOverlay();
				} else {
					grid.hideOverlay();
				}
			}.bind(this));

			// If autoheight is enabled the grid needs to be resized on every refresh
			if (initialized && grid.options.autoHeight) {
				grid.resize();
			}
		};


		/**
		 * Calls the refresh function, with debounce enabled to prevent repeat calls
		 * @method refreshDebounced
		 * @memberof Collection
		 */
		this.refreshDebounced = _.debounce(this.refresh, 10),


		/**
		 * Removes an item from the collection
		 * @method remove
		 * @memberof Collection
		 *
		 * @param	{string}	id		- ID of the row item
		 */
		this.remove = function (id) {
			if (id === undefined || id === null) {
				throw new Error("Unable to delete collection item. Invalid '" + grid.options.idProperty + "' supplied (" + id + ").");
			}

			var idx = cache.indexById[id];
			if (idx === null || idx === undefined) {
				throw new Error(["Unable to remove row '", id, "' because no such row could be found in the grid."].join(''));
			}

			// Remove from items
			if (this.items instanceof Backbone.Collection) {
				this.items.remove(id);
			} else {
				this.items.splice(this.get(id)[0], 1);
			}

			// Clear cache
			delete cache.indexById[id];
			delete cache.rowPositions[idx];
			delete cache.modelsById[id];

			// Recache positions from affected row
			cacheRows(idx);

			// Re-render grid
			this.refresh();
		};


		/**
		 * Given an array of items, binds those items to the data view collection, generates
		 * index caches and checks for id uniqueness.
		 * @method reset
		 * @memberof Collection
		 *
		 * @param	{array}		models		- Array of objects
		 * @param	{boolean}	[recache]	- Force a recache of positions and rows
		 */
		this.reset = function (models, recache) {
			if (!models) models = [];
			suspend = true;

			// Make sure that rows are re-cached too. This is needed to make sure you can reset
			// rows with 'id' values that previously existed
			if (recache) cache.rows = [];

			// Reset postprocess cache
			cache.postprocess = {};

			// If we're given a Backbone.Collection - grab just the models (as a copy)
			if (models instanceof Backbone.Collection) models = models.models.concat();

			// Parse data
			parse(models, true);

			// Load items and validate
			this.items = filteredItems = models;

			if (recache) {
				cacheRows();
			}

			suspend = false;

			this.refresh();
		};


		/**
		 * Sets the current grouping settings
		 * @method setGrouping
		 * @memberof Collection
		 *
		 * @param	{array}		options		- List of grouping objects
		 *
		 */
		this.setGrouping = function (options) {
			// Is grouping enabled
			if (!grid.options.groupable) throw new Error('Cannot execute "setGrouping" because "options.groupable" is disabled.');

			options = options || [];

			if (!$.isArray(options)) throw new Error('Unable to set grouping because given options are not an array. Given: ' + JSON.stringify(options));

			// If resetting grouping - reset toggle cache
			if (!options.length) toggledGroupsByLevel = [];

			var fullyLoaded = grid.fetcher ? remoteAllLoaded() : true;

			// Reset remote grouping cache
			cache.remoteGroups = null;

			// Reset group cache
			var i, l, groups = [], col;
			for (i = 0, l = options.length; i < l; i++) {
				if (options[i] === undefined || options[i] === null) {
					throw new Error('Invalid grouping value defined. Make sure your setGrouping options do not contain null or undefined values.');
				}

				col = getColumnById(options[i].column_id);

				if (col === undefined) {
					throw new Error('Cannot add grouping for column "' + options[i].column_id + '" because no such column could be found.');
				} else if (col.groupable === false) {
					throw new Error('Cannot add grouping for column "' + col.id + '" because "options.groupable" is disabled for that column.');
				}

				// If there are custom heights set for groupings - enable variable row height
				if (!variableRowHeight && (
					(options[i].height !== undefined && options[i].height !== null) ||
					(options[i].rowSpacing !== undefined && options[i].rowSpacing !== null)
				)) {
					variableRowHeight = true;
				}

				if (!toggledGroupsByLevel[i]) toggledGroupsByLevel[i] = {};

				// Extend using a default grouping object and add to groups
				groups.push(createGroupingObject(options[i]));
			}

			// Consider groupings changed if the number of groupings changed
			var grouping_changed = groups.length !== this.groups.length;

			// If the grouping column ids have changed
			if (!grouping_changed) {
				for (i = 0, l = groups.length; i < l; i++) {
					if (groups[i].column_id !== this.groups[i].column_id) {
						grouping_changed = true;
						break;
					}
				}
			}

			// Reset aggregators
			resetAggregators();

			// Set groups
			this.groups = groups;

			// Now that groups are set, we need to set sorting
			grid.sorting = mergeGroupSorting(grid.sorting);

			// When we're dealing with remote groups - we might as well re-generate placeholders
			// for everything since any data that was previously fetched is no longer in the right
			// order anyway.
			if (!fullyLoaded && grid.fetcher && initialized) {
				// Reset collection length to full. This ensures that when groupings are removed,
				// the grid correctly refetches the full page of results.
				this.length = this.remote_length;
				generatePlaceholders();
			}

			// Unfortunately, because group row heights may be different than regular row heights
			// we need to completely invalidate all rows here to prevent misplaced row rendering.
			if (variableRowHeight) invalidateAllRows();

			// If groupings have changed - refetch groupings
			if (grid.fetcher && !fullyLoaded && grouping_changed) {
				if (initialized) {
					remoteGroupRefetch();
				}
			} else {
				// Reload the grid with the new grouping.
				this.refresh();
			}

			// If we're in variable row height mode - resize the canvas now since grouping changes
			// will cause the row sizes to be changed.
			if (variableRowHeight) resizeCanvas(true);

			if (grid.fetcher && !fullyLoaded && (groups.length === 0 || grid.options.fetchCollapsed && initialized)) {
				// If all groupings are removed - refetch the data
				remoteFetch();
			}

			grid.trigger('statechange', this._event, {});
		};


		/**
		 * Update and redraw an existing items. If item being replaced is a Placeholder,
		 * it is replaced entirely, otherwise object is extended.
		 * @method setItem
		 * @memberof Collection
		 *
		 * @param	{string}	id			- The id of the item to update
		 * @param	{object}	data		- The data to use for the item
		 *
		 * @returns {object}
		 */
		this.setItem = function (id, data) {
			// Get the index of this item
			var idx = cache.indexById[id],
				original_object = this.get(id);

			if (idx === undefined && original_object === null) {
				throw new Error("Unable to update item (" + grid.options.idProperty + ": " + id + "). Invalid or non-matching id");
			}

			if (grid.options.data instanceof Backbone.Collection) {
				if (!(data instanceof Backbone.Model)) {
					throw new Error("Sorry, Backbone.Collection data sets must be given a valid Backbone.Model in the setItem() method.");
				}

				// Backbone does not support changing a model's id
				// Except if the item in there is a place holder
				if (data[grid.options.idProperty] !== id && !original_object[1].__placeholder) {
					throw new Error("Sorry, but Backbone does not support changing a model's id value, and as a result, this is not supported in Doby Grid either.");
				}
			}

			// Clear postprocessing cache
			if (cache.postprocess[id]) {
				delete cache.postprocess[id];

				// Delete postprocess cache for nested rows
				if (original_object[1].rows) {
					for (var key in original_object[1].rows) {
						if (cache.postprocess[original_object[1].rows[key][grid.options.idProperty]]) {
							delete cache.postprocess[original_object[1].rows[key][grid.options.idProperty]];
						}
					}
				}
			}

			// Set new cache
			cache.rows[idx] = data;

			// ID may have changed for the item so update the index by id too.
			// This is most relevant in remote grids where real IDs replace placeholder IDs
			if (id !== data[grid.options.idProperty]) {
				delete cache.indexById[id];
				delete cache.modelsById[id];
			}

			cache.indexById[data[grid.options.idProperty]] = idx;
			cache.modelsById[data[grid.options.idProperty]] = data;

			// Parse the updated data before re-rendering. This will ensure that variableRowHeight
			// is correctly set when items are updated.
			if (data[grid.options.idProperty] === undefined || data[grid.options.idProperty] === null) data[grid.options.idProperty] = id;
			parse([data]);

			// Find the data item and update it
			this.items[original_object[0]] = data;

			// If the rows were changed we need to invalidate the child rows
			if (data.rows) {
				var child_row_idxs = _.chain(data.rows)
					.map(function (row) {
						cache.modelsById[row[grid.options.idProperty]] = row;
						return cache.indexById[row[grid.options.idProperty]];
					})
					.compact()
					.value();

				if (child_row_idxs.length) {
					invalidateRows(child_row_idxs);
				}
			}

			// Store the ids that were updated so the refresh knows which row to update
			if (!updated) updated = {};
			updated[id] = true;
			if (id !== data[grid.options.idProperty]) updated[data[grid.options.idProperty]] = true;


			// This needs to be debounced for when it's called via Backbone Events (when many
			// collection items are changed all at once)
			this.refreshDebounced();
		};


		/**
		 * Performs the sort operation and refreshes the grid render
		 * @method sort
		 * @memberof Collection
		 *
		 * @param	{function}	comparator		- The function to use to render
		 * @param	{boolean}	ascending		- Is the direction ascending?
		 */
		this.sort = function (comparator, ascending) {
			sortAsc = ascending;
			sortComparer = comparator;

			if (ascending === false) {
				this.items.reverse();
			}

			// Backbone Collection sorting is done through a defined comparator
			this.items.sort(comparator);

			if (ascending === false) this.items.reverse();

			// TODO: This only needs to re-index ID, not recalculate positions.
			// Maybe update cacheRows to support different modes?
			cacheRows(null, true);

			// Debouncing here ensures aggregators are not duplicated. See Issue #113.
			this.refreshDebounced();
		};


		/**
		 * Runs the given items through the active filters in the collection
		 * @method uncompiledFilter
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		items	- List of items to filter
		 *
		 * @returns {array}
		 */
		uncompiledFilter = function (items) {
			var retval = [],
				idx = 0;

			for (var i = 0, ii = items.length; i < ii; i++) {
				// Only filter out data rows
				if (items[i].__nonDataRow || self.filter(items[i])) {
					retval[idx++] = items[i];
				}
			}

			return retval;
		};


		/**
		 * Runs the given items through the active filters in the collection,
		 * and caches the results.
		 * @method uncompiledFilterWithCaching
		 * @memberof Collection
		 * @private
		 *
		 * @param	{array}		items	- List of items to filter
		 *
		 * @returns {array}
		 */
		uncompiledFilterWithCaching = function (items, cache) {
			var retval = [],
				idx = 0,
				item;

			for (var i = 0, ii = items.length; i < ii; i++) {
				item = items[i];
				if (cache[i]) {
					retval[idx++] = item;
				} else if (items[i].__nonDataRow || self.filter(item)) {
					retval[idx++] = item;
					cache[i] = true;
				}
			}

			return retval;
		};

		return this.initialize();
	};


	/**
	 * Deselects all selected cell ranges, or a specific cell specified.
	 * @method deselectCells
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	[row]		- Row index for cell to deselect
	 * @param	{integer}	[cell]		- Cell index to deselect in the given row
	 *
	 */
	deselectCells = function (row, cell) {
		// Nothing to deselect
		if (!self.selection) return;

		var rowProvided = row !== undefined && row !== null,
			specific = rowProvided && cell !== undefined && cell !== null;

		// Go through the selection ranges and deselect as needed
		for (var i = 0, l = self.selection.length; i < l; i++) {
			// To deselect a specific cell we first need to make sure its in the selection Range
			if (specific) {
				if (self.selection[i].contains(row, cell)) {
					self.selection[i].deselect(row, cell);
				}
			} else if (rowProvided) {
				if (self.selection[i].contains(row)) {
					self.selection[i].deselect(row);
				}
			} else {
				self.selection[i].deselect();
			}
		}

		// If deselecting everything - remove selection store
		if (!specific && !rowProvided) self.selection = null;

		// Did the user exclude all values of any ranges? If so - destroy that range.
		if (self.selection) {
			var cleanranges = [];
			for (i = 0, l = self.selection.length; i < l; i++) {
				if (!self.selection[i].fullyExcluded()) {
					cleanranges.push(self.selection[i]);
				}
			}

			if (cleanranges.length === 0) {
				self.selection = null;
			} else {
				self.selection = cleanranges;
			}
		}
	};


	/**
	 * Deselect all cells in the specified row
	 * @method deselectRow
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	rowIndex	- Row index for row to deselect
	 *
	 */
	deselectRow = function (rowIndex) {
		deselectCells(rowIndex);
		var rowNode = cache.nodes[rowIndex] ? cache.nodes[rowIndex].rowNode : null;
		if (rowNode) {
			$(rowNode).addClass(self.options.selectedClass);
		}
	};


	/**
	 * Destroy the grid and clean up any events that have been assigned
	 * @method destroy
	 * @memberof DobyGrid
	 */
	this.destroy = function () {
		if (this.destroyed) {
			console.warn('Doby Grid instance has already been destroyed. You do not need to manually call destroy().');
			return;
		}

		this.destroyed = true;

		// Remove events
		this.stopListening();

		// If reorderable, destroy sortable jQuery plugin
		if (this.options.reorderable && this.options.showHeader) {
			$headers.filter(":ui-sortable").sortable("destroy");
		}

		// If Dropdown is open -- hide and destroy it
		if (this.dropdown) {
			this.dropdown.hide();
			this.dropdown = null;
		}

		// Remove all events
		if (this.$el && this.$el.length) {
			this.$el.off();
			this.$el.remove();
			removeElement(this.$el[0]);
		}
		this.$el = null;

		// Remove body click event
		$(document.body).off("click contextmenu", handleBodyClick);

		// Remove CSS Rules
		removeCssRules();

		// Forcefully clean up the header DOM -- without this, we'll leak DOM nodes
		if (this.options.showHeader && $headers && $headers.length) {
			$headers.off();
			removeElement($headers[0]);
		}
		$headers = null;

		// Remove window resize binding
		$(window).off('resize', handleWindowResize);

		// If we're in the middle of a timer - clear it
		var timers = [h_postrender, h_render, remoteTimer];
		for (var i = 0, l = timers.length; i < l; i++) {
			if (timers[i]) {
				clearTimeout(timers[i]);
				timers[i] = null;
			}
		}

		// Forcefully destroy all cached elements -- another DOM leak prevention
		var rowClear = function () { removeElement(this); };
		for (var row in cache.nodes) {
			cache.nodes[row].rowNode.each(rowClear);
		}

		// Clear collection items (they may be a Remote Objects)
		this.collection.items = null;
		this.options.data = null;

		// Forcefully clear the cache variable -- to force immediate garbage collection
		cache = null;

		// Remove the garbage bin
		$('#' + CLS.garbage).remove();

		// Call destroy event
		this.trigger('destroy', this._event);
	};


	/**
	 * Disable all text selection in header (including input and textarea).
	 *
	 * For usability reasons, all text selection is disabled
	 * with the exception of input and textarea elements (selection must
	 * be enabled there so that editors work as expected); note that
	 * selection in grid cells (grid body) is already unavailable in
	 * all browsers except IE.
	 *
	 * @method disableSelection
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{jQuery}	$target			- Target to use as selection curtain
	 */
	disableSelection = function ($target) {
		if ($target && $target.jquery) {
			$target
				.attr("unselectable", "on")
				.css("MozUserSelect", "none")
				.on("selectstart.ui", function () {
				return false;
			}); // from jquery:ui.core.js 1.7.2
		}
	};


	/**
	 * Given a set of columns, make sure 'minWidth <= width <= maxWidth
	 * @method enforceWidthLimits
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{array}		columns		- Array of columns to validate
	 *
	 * @returns {array}
	 */
	enforceWidthLimits = function (columns) {
		var c;
		for (var i = 0, l = columns.length; i < l; i++) {
			c = columns[i] = $.extend(JSON.parse(JSON.stringify(columnDefaults)), columns[i]);
			if (c.minWidth && c.width < c.minWidth) c.width = c.minWidth;
			if (c.maxWidth && c.width > c.maxWidth) c.width = c.maxWidth;
		}
		return columns;
	};


	/**
	 * Re-sorts the data set and re-renders the grid
	 * @method executeSorter
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	args		- Event Sort Data
	 */
	executeSorter = function (args) {
		var cols = args.sortCols;

		// If remote, and not all data is fetched - sort on server
		if (self.fetcher && (!remoteAllLoaded() || self.options.forceRemoteSort) && initialized) {
			// Reset collection length to full. This ensures that when groupings are removed,
			// the grid correctly refetches the full page of results.
			self.collection.length = self.collection.remote_length;

			// Refill the collection with placeholders
			generatePlaceholders();

			// Refresh the grid to recalculate the cache for placeholder rows
			self.collection.refresh();

			if (self.collection.groups.length) {
				remoteGroupRefetch();
			} else {
				// Ask the Remote fetcher to refetch the data -- this time using the new sort settings
				remoteFetch();
			}

			return;
		}

		self.collection.sort(function (dataRow1, dataRow2) {
			var column, field, sign, value1, value2, val;

			// Do not attempt to sort Aggregators. They will always go to the bottom.
			if (dataRow1._aggregateRow) return 1;
			if (dataRow2._aggregateRow) return -1;

			// Loops through the columns by which we are sorting
			for (var i = 0, l = cols.length; i < l; i++) {
				column = cols[i].sortCol;
				field = column.field;
				sign = cols[i].sortAsc ? 1 : -1;

				value1 = getDataItemValueForColumn(dataRow1, column);
				value2 = getDataItemValueForColumn(dataRow2, column);

				// Use custom column comparator if it exists
				if (typeof(column.comparator) === 'function') {
					val = column.comparator(value1, value2) * sign;
					if (val !== 0) return val;
				} else {
					if (self.options.keepNullsAtBottom) {
						// Always keep null values on the bottom
						if (value1 === null && value2 === null) continue;
						if (value1 === null) return 1;
						if (value2 === null) return -1;
					} else {

					}

					// Use natural sort by default
					val = naturalSort(value1, value2) * sign;
					if (val !== 0) return val;
				}
			}

			return 0;
		});
	};


	/**
	 * Export all grid data to a format of your choice. Available formats are 'csv' and 'html'.
	 * @method export
	 * @memberof DobyGrid
	 *
	 * @param	{string}	format		- Which format to export to
	 * @param	{function}	callback	- Callback function
	 * @param	{object}	[groupRow]	- Row index of the group to export
	 *
	 * @returns {object}
	 */
	this.export = function (format, callback, groupRow) {
		var allowed = ['csv', 'html'];
		if (allowed.indexOf(format) < 0) throw new Error('Sorry, "' + format + '" is not a supported format for export.');
		callback = callback || function () {};

		var htmlTagToEscape = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': '&quot;',
			"'": '&#39;',
			"/": '&#x2F;'
		};

		function escapeTag (tag) {
			return htmlTagToEscape[tag] || tag;
		}

		function escapeVal (val) {
			// Only escape val if it is really a string!
			if (typeof val === 'string') {
				return val.replace(/[&<>"'/]/g, escapeTag);
			}
			return val;
		}

		var processExport = function () {
			// First collect all the data as an array of arrays
			var result = [], i, l, row, ii, ll, val;

			if (format === 'html') {
				result.push('<table><thead><tr>');
			}

			// Get header
			var header = [];
			for (i = 0, l = cache.activeColumns.length; i < l; i++) {
				val = cache.activeColumns[i].name || "";
				if (format === 'csv') {
					// Escape quotes
					val = val.replace(/\"/g, '\"');

					header.push(['"', val, '"'].join(''));
				} else if (format === 'html') {
					header.push('<th>');
					header.push(val);
					header.push('</th>');
				}
			}

			if (format === 'csv') {
				result.push(header.join(','));
			} else if (format === 'html') {
				result.push(header.join(''));
				result.push('</tr></thead><tbody>');
			}

			// Export group items if a group row was supplied, all items otherwise.
			var group = typeof groupRow !== 'undefined' ? getGroupFromRow(groupRow) : null;
			var items = group ? group.grouprows : this.collection.items;

			// Get data
			for (i = 0, l = items.length; i < l; i++) {
				// Don't export non-data
				if (items[i] instanceof NonDataItem) continue;

				row = [];
				if (format === 'html') row.push('<tr>');
				for (ii = 0, ll = cache.activeColumns.length; ii < ll; ii++) {

					val = this.getValueFromItem(items[i], cache.activeColumns[ii]);

					if (format === 'csv') {
						// Escape quotes
						val = val !== null && val !== undefined ? val.toString().replace(/\"/g, '\"') : '';

						row.push(['"', val, '"'].join(''));
					} else if (format === 'html') {
						val = escapeVal(val);
						row.push('<td>');
						row.push(val);
						row.push('</td>');
					}
				}
				if (format === 'csv') {
					result.push(row.join(','));
				} else if (format === 'html') {
					val = escapeVal(val);
					row.push('</tr>');
					result.push(row.join(''));
				}

			}

			if (format === 'html') {
				result.push('</tbody></table>');
			}

			if (format === 'csv') {
				result = result.join("\n");
			} else if (format === 'html') {
				result = result.join("");
			}

			callback(result);
		}.bind(this);

		// If this is a remote data set and we don't have all data, ask the user what to export?
		var remoteConfirm = this.fetcher && !remoteAllLoaded() ? confirm('Are you sure you want to export all data? This will require a full data fetch on the server.') : true;

		if (remoteConfirm) {
			if (this.fetcher) {
				this.remoteFetchAll(function () {
					processExport();
				});
			} else {
				processExport();
			}
		}

		return this;
	};


	/**
	 * Filters the grid using a given function
	 * @method filter
	 * @memberof DobyGrid
	 *
	 * @param	{function|array}	filter		- Function or array to use for filtering data
	 *
	 * @returns {object}
	 */
	this.filter = function (filter) {
		// Remove existing filters
		if (filter === null || filter === undefined) {
			this.collection.filterset = null;
			this.collection.filter = null;
		} else {

			// If this is a filter set - remember it
			if ($.isArray(filter)) {
				this.collection.filterset = filter;
			}

			// Remote data is filtered on the server - so just store it for reference
			if (typeof(filter) == 'function' || this.fetcher) {
				// Set collection filter function
				this.collection.filter = filter;
			} else if ($.isArray(filter)) {

				// A filter set is given.
				// Build a filter function from the given set
				this.collection.filter = function (item) {

					var result = true, f, columnDef, value, test;
					for (var i = 0, l = filter.length; i < l; i++) {
						f = filter[i];

						// Validate the filter item
						if (f.length !== 3) throw new Error('Cannot apply filter because the give filter set contains an invalid filter item: ' + JSON.stringify(f) + '.');

						// Get column
						columnDef = getColumnById(f[0]);

						// Validate column
						if (!columnDef) throw new Error('Unable to filter by "' + f[0] + '" because no such columns exists in the grid.');

						value = getDataItemValueForColumn(item, columnDef);

						// Process operators
						switch (f[1].toString().toLowerCase()) {
						case '=':
							result = value == f[2];
							break;
						case '!=':
							result = value !== f[2];
							break;
						case 'in':
							if (!$.isArray(f[2])) {
								throw new Error('The "IN" filter operator must be used with an array. ' + f[2] + ' was given instead.');
							}

							result = f[2].indexOf(value) >= 0;
							break;
						case '>':
							test = value === null ? undefined : value;
							result = test > f[2];
							break;
						case '<':
							test = value === null ? undefined : value;
							result = test < f[2];
							break;
						case '>=':
							test = value === null ? undefined : value;
							result = test >= f[2];
							break;
						case '<=':
							test = value === null ? undefined : value;
							result = test <= f[2];
							break;
						case '~':
							test = value === null ? '' : value;
							result = test.toString().search(f[2].toString()) !== -1;
							break;
						case '!~':
							test = value === null ? '' : value;
							result = test.toString().search(f[2].toString()) === -1;
							break;
						case '~*':
							test = value === null ? '' : value;
							result = test.toString().toLowerCase().search(f[2].toString().toLowerCase()) !== -1;
							break;
						case '!~*':
							test = value === null ? '' : value;
							result = test.toString().toLowerCase().search(f[2].toString().toLowerCase()) === -1;
							break;
						default:
							throw new Error('Unable to filter by "' + f[0] + '" because "' + f[1] + '" is not a valid operator.');
						}

						// If we already failed the filter - stop filtering
						if (!result) break;
					}

					return result;
				};

				self.trigger('statechange', this._event);
			} else {
				throw new Error('Cannot apply filter to grid because given filter must be an array or a function, but given ' + typeof(filter) + '.');
			}
		}

		// Remote data needs to be completely reloaded
		if (this.fetcher) {
			// Only re-fetch if the grid is initialized, otherwise we're wasting an AJAX call
			if (initialized) this.refetch();
		} else {
			// Ensure aggregators are reset before changing filter values
			resetAggregators();

			// Refresh the grid with the filtered data
			this.collection.refresh();
		}

		return this;
	};


	/**
	 * Given a row, returns the index of first focusable cell in that row
	 * @method findFirstFocusableCell
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row		- Row index
	 *
	 * @returns {integer}
	 */
	findFirstFocusableCell = function (row) {
		var cell = 0;
		while (cell < cache.activeColumns.length) {
			if (canCellBeActive(row, cell)) {
				return cell;
			}
			cell += getColspan(row, cell);
		}
		return null;
	};


	/**
	 * Given a row, returns the index of last focusable cell in that row
	 * @method findLastFocusableCell
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row		- Row index
	 *
	 * @returns {integer}
	 */
	findLastFocusableCell = function (row) {
		var cell = 0;
		var lastFocusableCell = null;
		while (cell < cache.activeColumns.length) {
			if (canCellBeActive(row, cell)) {
				lastFocusableCell = cell;
			}
			cell += getColspan(row, cell);
		}
		return lastFocusableCell;
	};


	/**
	* Adjusts the columns width and minWidth to according to the content found in it's header.
	* @method fitColumnToHeader
	* @memberof DobyGrid
	* @private
	*
	* @param	{object}	column		- Column object
	*/
	fitColumnToHeader = function (column) {

		if (!initialized) return;

		var currentWidth = column.width,
			column_index = cache.columnsById[column.id];

		column._headerWidth = getColumnHeaderWidth(column_index);

		var newWidth = Math.max(column.width, column._headerWidth),
			columnRightPosition;

		if (currentWidth == newWidth) return;

		lockColumnWidths(column_index);

		var diff = newWidth - currentWidth;

		columnRightPosition = cache.columnPosRight[column_index];

		prepareLeeway(column_index, columnRightPosition);

		// This will ensure you can't resize beyond the maximum allowed width
		var delta = Math.min(maxPageX, Math.max(minPageX, columnRightPosition + diff)) - columnRightPosition;

		resizeColumn(column_index, delta);
	};


	/**
	* Adjusts the width and minWidth of all columns according to the content of its header.
	* @method fitColumnsToHeader
	* @memberof DobyGrid
	* @private
	*
	* @param	{boolean}	silent		- Do not trigger columnresize event
	*/
	fitColumnsToHeader = function (silent) {

		if (!initialized) return;

		for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
			fitColumnToHeader(cache.activeColumns[i]);
		}

		applyHeaderAndColumnWidths();
		submitColResize(silent);
	};


	/**
	 * Replaces the entire collection with Placeholder objects
	 * @method generatePlaceholders
	 * @memberof DobyGrid
	 * @private
	 */
	generatePlaceholders = function () {
		// Reset the collection
		self.collection.items = [];

		// For Backbone Collections we need to do a data reset here too
		if (self.options.data instanceof Backbone.Collection) {
			self.options.data.reset(null, {silent: true});
		}

		// Populate the collection with placeholders
		var phId, ph, i, l;
		for (i = 0, l = self.collection.length; i < l; i++) {
			phId = 'placeholder-' + i;
			ph = new Placeholder();
			ph[self.options.idProperty] = phId;
			self.collection.items.push(ph);
			cache.modelsById[phId] = ph;
		}

		// Reset any row references in groups as they are no longer valid
		if (self.collection.groups.length) {
			for (i = 0, l = self.collection.groups.length; i < l; i++) {
				for (var j = 0, m = self.collection.groups[i].rows.length; j < m; j++) {
					self.collection.groups[i].rows[j].grouprows = [];
				}
			}
		}
	};


	/**
	 * Entry point for collection.get(). See collection.get for more info.
	 * @method get
	 * @memberof DobyGrid
	 *
	 * @param	{integer}		id		- Id of the model to fetch
	 *
	 * @return {object}
	 */
	this.get = function (id) {
		var result = this.collection.get(id);
		if (result) result = result[1];
		return result;
	};


	/**
	 * Get the index of a row model
	 * @method getIndex
	 * @memberof DobyGRid
	 *
	 * @param	{integer}		id		- Id of the model to fetch
	 *
	 * @returns {integer}
	 */
	this.getIndex = function (id) {
		return cache.indexById[id];
	};


	/**
	 * Get the total height of currently rendered rows in the table
	 * @method getTotalHeight
	 * @memberof DobyGrid
	 * @private
	 *
	 * @return {integer}
	 */
	getTotalHeight = function () {
		var totalHeight = 0;

		for (var i in cache.nodes) {
			totalHeight += $(cache.nodes[i].rowNode).outerHeight();
		}

		return totalHeight;
	};


	/**
	 * Gets the active cell row/cell indexes
	 * @method getActive
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {object}
	 */
	getActiveCell = function () {
		if (!self.active || !self.active.node) {
			return null;
		} else {
			return {
				row: self.active.row,
				cell: self.active.cell
			};
		}
	};


	/**
	 * Returns the list of active column objects
	 * @method getActiveColumns
	 * @memberof DobyGrid
	 *
	 * @returns {array}
	 */
	this.getActiveColumns = function () {
		return cache.activeColumns;
	};


	/**
	 * Calculates some information about the browser window that will be shared
	 * with all grid instances.
	 * @method getBrowserData
	 * @memberof DobyGrid
	 * @private
	 */
	getBrowserData = function () {
		window.maxSupportedCssHeight = window.maxSupportedCssHeight || getMaxCSSHeight();
		window.scrollbarDimensions = window.scrollbarDimensions || getScrollbarSize();
	};


	/**
	 * Returns the current cache object
	 * @method getCache
	 * @memberof DobyGrid
	 *
	 * @returns {object}
	 */
	this.getCache = function () {
		return cache;
	};


	/**
	 * Gets the width of the current canvas area (usually the viewport)
	 * @method getCanvasWidth
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {integer}
	 */
	getCanvasWidth = function () {
		var availableWidth = viewportW - (viewportHasVScroll ? window.scrollbarDimensions.width : 0),
			colWidth, i, l;

		canvasWidthL = canvasWidthR = 0;

		for (i = 0, l = cache.activeColumns.length; i < l; i++) {
			// The 2 here is to compensate for the spacing between columns
			colWidth = cache.activeColumns[i].width - self.options.columnSpacing + 2;

			if ((self.options.frozenColumns > -1) && (i > self.options.frozenColumns)) {
				canvasWidthR += colWidth;
			} else {
				canvasWidthL += colWidth;
			}
		}

		// When fullWidthRows is disabled - keep canvas as big as the data only
		var totalRowWidth = canvasWidthL + canvasWidthR;
		var result = self.options.fullWidthRows ? Math.max(totalRowWidth, availableWidth) : (totalRowWidth + l * 2);

		// Handle fullWidthRows correctly when frozenColumns are enabled
		if (self.options.fullWidthRows) {
			if (self.options.frozenColumns > -1) {
				canvasWidthR = result - canvasWidthL;
			} else {
				canvasWidthL = result;
			}
		}

		// Support for left-side scrollbar
		if (self.options.scrollbarPosition == 'left') result--;

		return result;
	};


	/**
	 * Given a cell node, returns the cell index in that row
	 * @method getCellFromNode
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{DOMObject}		cellNode	- DOM object for the cell
	 *
	 * @returns {integer}
	 */
	getCellFromNode = function (cellNode) {
		// read column number from .l<columnNumber> CSS class
		var cls = /l\d+/.exec(cellNode.className);
		if (!cls) {
			throw new Error("getCellFromNode: cannot get cell - " + cellNode.className);
		}
		return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
	};


	/**
	 * Find the cell that corresponds to the given x, y coordinates in the canvas
	 * @method getCellFromPoint
	 * @memberof DobyGrid
	 * @prviate
	 *
	 * @param	{integer}	x		- x pixel position
	 * @param	{integer}	y		- y pixel position
	 *
	 * @returns {object}
	 */
	getCellFromPoint = function (x, y) {
		var row = getRowFromPosition(y),
			cell = 0,
			w = 0;

		for (var i = 0, l = cache.activeColumns.length; i < l && w < x; i++) {
			w += cache.activeColumns[i].width;
			cell++;
		}

		if (cell < 0) cell = 0;

		return {
			cell: cell - 1,
			row: row
		};
	};


	/**
	 * Given a row and cell index, returns the DOM node for that cell
	 * @method getCellNode
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Row index
	 * @param	{integer}	cell		- Cell index
	 *
	 * @returns {DOMObject}
	 */
	getCellNode = function (row, cell) {
		if (cache.nodes[row]) {
			ensureCellNodesInRowsCache(row);

			// Calculate colspan offset
			var nodecell = cell;
			if (!cache.nodes[row].cellColSpans[cell]) {
				for (var i = 0, l = cell; i <= l; i++) {
					if (cache.nodes[row].cellColSpans[i] && cache.nodes[row].cellColSpans[i] > 1) {
						nodecell -= cache.nodes[row].cellColSpans[i] - 1;
					}
				}
			}

			// Do not allow negative values
			nodecell = nodecell < 0 ? 0 : nodecell;

			// Some cells might not yet be rendered and so have no jQuery node.
			var jqNode = cache.nodes[row].cellNodesByColumnIdx[nodecell];
			return jqNode ? jqNode[0] : undefined;
		}
		return null;
	};


	/**
	 * Given a row and cell index, returns the node size for that cell DOM
	 * @method getCellNodeBox
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Row index
	 * @param	{integer}	cell		- Cell index
	 *
	 * @returns {DOMObject}
	 */
	getCellNodeBox = function (row, cell) {
		if (!cellExists(row, cell)) return null;

		var y1, y2;
		if (variableRowHeight) {
			var pos = cache.rowPositions[row];
			y1 = pos.top - 1;
			y2 = y1 + (pos.height !== null && pos.height !== undefined ? pos.height : self.options.rowHeight) + 2;
		} else {
			y1 = (self.options.rowHeight + self.options.rowSpacing) * row - offset + row - 1;
			y2 = y1 + self.options.rowHeight + 2 + self.options.rowSpacing;
		}
		var x1 = -1;

		for (var i = 0; i < cell; i++) {
			if (self.options.frozenColumns === -1 || i > self.options.frozenColumns) {
				x1 += cache.activeColumns[i].width + 1;
			}
		}

		var x2 = x1 + cache.activeColumns[cell].width + 2;

		return {
			bottom: y2,
			left: x1,
			right: x2,
			top: y1
		};
	};


	/**
	 * Given an event object, gets the cell that generated the event
	 * @method getCellFromEvent
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	e		- Javascript event object
	 *
	 * @returns {object}
	 */
	getCellFromEvent = function (e) {
		var $cell = $(e.target).closest("." + CLS.cell, $canvas);

		if (!$cell.length) return null;

		var row = getRowFromNode($cell[0].parentNode),
			cell = getCellFromNode($cell[0]);

		if (row === null || cell === null) {
			return null;
		} else {
			return {
				"row": row,
				"cell": cell
			};
		}
	};


	/**
	 * Given a row and cell index, returns the colspan for that cell
	 * @method getColspan
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Row index
	 * @param	{integer}	cell		- Cell index
	 *
	 * @returns {integer}
	 */
	getColspan = function (row, cell) {
		var item = self.getRowFromIndex(row);
		if (!item.columns) return 1;

		var columnData = item.columns[cache.activeColumns[cell].id] || item.columns[cell];
		var colspan = (columnData && columnData.colspan);
		if (colspan === "*") {
			colspan = cache.activeColumns.length - cell;
		} else {
			colspan = colspan || 1;
		}

		return colspan;
	};


	/**
	 * Returns the column object given the column id
	 * @method getColumnById
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{string}	column_id		- Id the column to lookup
	 *
	 * @returns {object}
	 */
	getColumnById = function (column_id) {
		return _.findWhere(self.options.columns, {id: column_id});
	};


	/**
	 * Gets the CSS rules for the given columns
	 * @method getColumnCssRules
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	idx		- Index of the column to get rules for
	 *
	 * @returns {object}
	 */
	getColumnCssRules = function (idx) {
		if (!stylesheet) {
			var sheets = document.styleSheets, i, l;
			for (i = 0, l = sheets.length; i < l; i++) {
				if ((sheets[i].ownerNode || sheets[i].owningElement) == $style[0]) {
					stylesheet = sheets[i];
					break;
				}
			}

			if (!stylesheet) throw new Error("Cannot find stylesheet.");

			// find and cache column CSS rules
			columnCssRulesL = [];
			columnCssRulesR = [];
			var cssRules = (stylesheet.cssRules || stylesheet.rules);
			var matches, columnIdx;
			for (i = 0; i < cssRules.length; i++) {
				var selector = cssRules[i].selectorText;
				matches = new RegExp(/\.l\d+/).exec(selector);
				if (matches) {
					columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
					columnCssRulesL[columnIdx] = cssRules[i];
				} else {
					matches = new RegExp(/\.r\d+/).exec(selector);
					if (matches) {
						columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
						columnCssRulesR[columnIdx] = cssRules[i];
					}
				}
			}
		}

		return {
			"left": columnCssRulesL[idx],
			"right": columnCssRulesR[idx]
		};
	};


	/**
	 * Returns the width of the content in the given column. Used for auto resizing
	 * columns to their content via double-click on the resize handle. Ignores Group rows.
	 * @method getColumnContentWidth
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	column_index	- Index of the column to calculate data for
	 *
	 * @returns {integer}
	 */
	getColumnContentWidth = function (column_index) {
		if (!self.options.showHeader) return;

		var cellWidths = [];

		// Determine the width of the column name text
		cellWidths.push(getColumnHeaderWidth(column_index));

		// Loop through the visible row nodes
		var rowcls = 'r' + column_index, $node;
		for (var i in cache.nodes) {
			// Check to see if this row's column has a colspan defined -- if it does, ignore it
			if (
				cache.rows[i].columns &&
				cache.rows[i].columns[column_index] &&
				cache.rows[i].columns[column_index].colspan &&
				cache.rows[i].columns[column_index].colspan !== 1
			) continue;

			// Check to see if node is already in cache
			$node = $(cache.nodes[i].cellNodesByColumnIdx[column_index]);

			// If not in cache -- look up via slow jQuery
			if ($node.length === 0) $node = $(cache.nodes[i].rowNode).children('.l' + column_index);

			// Missing node, possibly a colspan column
			if ($node.length === 0) continue;

			// Remove width limit
			$node.removeClass(rowcls);

			// Get width
			var w = $node.outerWidth();
			if (cellWidths.indexOf(w) < 0) cellWidths.push(w);

			$node.addClass(rowcls);
		}

		// If new width is smaller than min width - use min width
		return Math.max.apply(null, cellWidths);
	};

	/**
	 * Returns the width of the content in the given column header. Ignores Group rows.
	 * @method getColumnHeaderWidth
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	column_index		- Index of the column to calculate data for
	 *
	 * @returns {integer}	headerWidth			- The With of the columns header
	 */
	getColumnHeaderWidth = function (column_index) {
		if (!self.options.showHeader) return;

		var columnElements = $headers.children(),
			column = cache.activeColumns[column_index],
			$column = $(columnElements[column_index]),
			currentWidth = $column.width(),
			headerPadding = parseInt($column.css('paddingLeft'), 10) + parseInt($column.css('paddingRight'), 10);

		// Determine the width of the column name text
		var name = $column.children('.' + CLS.columnname + ':first');
		name.css('overflow', 'visible');
		$column.width('auto');
		// The extra 1 is needed here because text-overflow: ellipsis
		// seems to kick in 1 pixel too early.
		var headerWidth = $column.width() + headerPadding + 1;

		if (hasSorting(column.id)) {
			var $indicator = $column.find("." + CLS.sortindicator);
			headerWidth += $indicator.width();
		}

		name.css('overflow', '');
		$column.width(currentWidth);

		return headerWidth;
	};


	/**
	 * Given an event object, attempts to figure out which column was acted upon
	 * @method getColumnFromEvent
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	event		- Javascript event object
	 *
	 * @returns {object}
	 */
	getColumnFromEvent = function (event) {
		// Attempt to find column in header
		var $column = $(event.target).closest("." + CLS.headercolumn + ':not(.' + CLS.placeholder + ')');

		// Attempt to find column in body
		if (!$column.length) {
			var cell = getCellFromEvent(event);
			return cell ? cache.activeColumns[cell.cell] : null;
		}

		var column_id = $column && $column.length ? $column.attr('id').replace(uid, '') : null;

		return column_id ? getColumnById(column_id) : null;
	};


	/**
	 * Given an item object and a column definition, returns the value of the column
	 * to display in the cell.
	 * @method getDataItemValueForColumn
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	item			- Data row object from the dataset
	 * @param	{object}	columnDef		- Column definition object for the given column
	 *
	 * @returns {string}
	 */
	getDataItemValueForColumn = function (item, columnDef) {
		// If a custom column extractor is specified -- use that
		if (columnDef.dataExtractor) return columnDef.dataExtractor(item, columnDef);

		// If a custom grid extractor is specified -- use that
		if (self.options.dataExtractor) return self.options.dataExtractor(item, columnDef);

		// Backbone Model
		if (item instanceof Backbone.Model) return item.get(columnDef.field);

		// Group headers
		if (item._groupRow) {
			return item.predef.dataExtractor ? item.predef.dataExtractor(item, columnDef) : item.value;
		}

		return item.data ? item.data[columnDef.field] : null;
	};


	/**
	 * Gets the number of items in the data set
	 * @method getDataLength
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {integer}
	 */
	getDataLength = function () {
		if (!self.collection) return 0;
		return self.collection.length;
	};


	/**
	 * Given a row and cell index, returns the editor factory for that cell
	 * @method getEditor
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Row index
	 * @param	{integer}	cell		- Cell index
	 *
	 * @returns {function}
	 */
	getEditor = function (row, cell) {
		var column = cache.activeColumns[cell],
			item = self.getRowFromIndex(row),
			columnMetadata = item.columns;

		// Get the editor from the column definition
		if (columnMetadata && columnMetadata[column.id] && columnMetadata[column.id].editor !== undefined) {
			return columnMetadata[column.id].editor;
		}
		if (columnMetadata && columnMetadata[cell] && columnMetadata[cell].editor !== undefined) {
			return columnMetadata[cell].editor;
		}

		// If no column editor, use editor in the options, otherwise use default editor
		return column.editor || self.options.editor || DefaultEditor.bind(null, self);
	};


	/**
	 * Given a row and column, returns the formatter function for that cell
	 * @method getFormatter
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	item		- The data item to get the formatter for
	 * @param	{object}	column		- Column data object
	 *
	 * @returns {function}
	 */
	getFormatter = function (item, column) {
		// Check if item has column overrides
		var columnOverrides = item.columns && (item.columns[column.id] || item.columns[cache.columnsById[column.id]]);

		// Pick formatter starting at the item formatter
		var f = item.formatter ? item.formatter.bind(item) : null ||
			// Then the column override formatter
			(columnOverrides && columnOverrides.formatter) ||
			// Then the column formatter
			column.formatter ||
			// Then the grid formatter as defined by the user
			self.options.formatter ||
			// Then the default formatter
			DefaultFormatter;

		return f.bind(self);
	};


	/**
	 * Returns the formatter function for the group header rows
	 * @method getGroupFormatter
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {function}
	 */
	getGroupFormatter = function () {
		return function (row, cell, value, columnDef, item) {
			// If colspan isn't full - use custom value.
			// This is more useful when using a custom dataExtractor.
			if (item.columns[0].colspan !== '*') {
				return value;
			}

			var column = getColumnById(item.column_id),
				indent = item.level * 15,
				h = [
					"<strong>" + column.name + ":</strong> ",
					(item.value === null ? '-empty-' : item.value),
					' <span class="count">(<strong>' + item.count + '</strong> item'
				];
			if (item.count !== 1) h.push("s");
			h.push(")</span>");

			return [(indent ? '<span style="margin-left:' + indent + 'px">' : ''),
				'<span class="icon"></span>',
				'<span class="' + CLS.grouptitle + '">',
				h.join(''),
				'</span>',
				(indent ? '</span>' : '')
			].join('');
		};
	};


	/**
	 * Given a row index, returns the grouping object which contain that row.
	 * @method getGroupFromRow
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row		- Index of the row
	 *
	 * @returns {array}
	 */
	getGroupFromRow = function (row) {
		var result = null,
			item = cache.rows[row];

		// No groups even
		if (self.collection.groups.length === 0) return result;

		var checkGroupRows = function (rows) {
			var grouprow, groupitem;
			for (var g = 0, gl = rows.length; g < gl; g++) {
				if (result) break;

				grouprow = rows[g];

				// Check if the item is the group row itself
				if (grouprow == item) {
					result = grouprow;
					break;
				}

				// Check group rows
				if (grouprow.grouprows) {
					for (var h = 0, hl = grouprow.grouprows.length; h < hl; h++) {
						groupitem = grouprow.grouprows[h];
						if (groupitem == item) {
							result = grouprow;
							break;
						}
					}
				}

				// Check nested groups
				if (grouprow.groups) checkGroupRows(grouprow.groups);
			}
		};

		// Process first group object only (nested groups will be done recursively)
		checkGroupRows(self.collection.groups[0].rows);

		return result;
	};


	/**
	 * Gets the total width of the column headers, or the viewport (whichever is bigger)
	 * @method getHeadersWidth
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {integer}
	 */
	getHeadersWidth = function () {
		var headersWidth = 0;

		// For each column - get its width
		for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
			// The extra one here is to compensate for the column spacing created with a border
			headersWidth += cache.activeColumns[i].width + 1;
		}

		// Include the width of the scrollbar
		headersWidth += window.scrollbarDimensions.width;

		return Math.max(headersWidth, viewportW) + 1000;
	};


	/**
	 * Formats a string of text for display to the end user
	 * @method getLocale
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{string}	key			- Key string to fetch in locale object
	 * @param	{object}	data		- Object to pass in
	 *
	 * @returns {string}
	 */
	getLocale = function (key, data) {
		data = data || {};

		// Convert "a.b.c" notation to reference in options.locale
		var string = self.options.locale,
			keypieces = key.split('.');

		for (var i = 0, l = keypieces.length; i < l; i++) {
			string = string[keypieces[i]];
		}

		if (!string) {
			throw new Error('Doby Grid does not have a locale string defined for "' + key + '"');
		}

		// Parse data object and return locale string
		return _.template(string, {
			interpolate: /\{\{(.+?)\}\}/gim
		})(data);
	};


	/**
	 * Some browsers have a limit on the CSS height an element can make use of.
	 * Calculate the maximum height we have to play with.
	 * @method getMaxCSS
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {integer}
	 */
	getMaxCSSHeight = function () {
		var supportedHeight = 1000000;

		// Firefox reports the height back but still renders blank after ~6M px
		var testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000,
			div = $('<div style="display:none"></div>').appendTo(document.body),
			test;

		while (true) {
			test = supportedHeight * 2;
			div.css("height", test);
			if (test > testUpTo || div.height() !== test) {
				break;
			} else {
				supportedHeight = test;
			}
		}

		removeElement(div[0]);
		return supportedHeight;
	};


	/**
	 * Given viewport coordinates, returns the range of rendered rows
	 * @method getRenderedRange
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	viewportTop		- Top viewport coordinate
	 * @param	{integer}	viewportLeft	- Left viewport coordinate
	 *
	 * @return {object}
	 */
	getRenderedRange = function (viewportTop, viewportLeft) {
		var range = getVisibleRange(viewportTop, viewportLeft),
			buffer,
			minBuffer = 3;

		if (!variableRowHeight) {
			buffer = Math.round(viewportH / (self.options.rowHeight + self.options.rowSpacing));
		} else {
			buffer = Math.round(getRowFromPosition(viewportH));
		}

		if (vScrollDir == -1) {
			range.top -= buffer;
			range.bottom += minBuffer;
		} else if (vScrollDir == 1) {
			range.top -= minBuffer;
			range.bottom += buffer;
		} else {
			range.top -= minBuffer;
			range.bottom += minBuffer;
		}

		range.top = Math.max(0, range.top);
		range.bottom = Math.min(getDataLength() - 1, range.bottom);

		range.leftPx -= viewportW;
		range.rightPx += viewportW;

		range.leftPx = Math.max(0, range.leftPx);
		range.rightPx = Math.min(canvasWidth, range.rightPx);

		return range;
	};


	/**
	 * Given an event object, gets the row that generated the event
	 * @method getRowFromEvent
	 * @memberof DobyGrid
	 *
	 * @param	{object}	event		- Javascript event object
	 *
	 * @returns {object}
	 */
	this.getRowFromEvent = function (event) {
		var $row = $(event.target).closest("." + CLS.row, $canvas);
		if (!$row.length) return null;
		return cache.rows[getRowFromNode($row[0])];
	};


	/**
	 * Given a row index number, returns the row object for that index.
	 * @method getRowFromIndex
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	index		- Row index number
	 *
	 * @returns {object}
	 */
	this.getRowFromIndex = function (index) {
		return cache.rows[index];
	};


	/**
	 * Given a DOM node, returns the row index for that row
	 * @method getRowFromNode
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	rowNode			- DOM object
	 *
	 * @returns {integer}
	 */
	getRowFromNode = function (rowNode) {
		for (var row in cache.nodes) {
			if (cache.nodes[row].rowNode.is(rowNode)) {
				return row | 0;
			}
		}

		return null;
	};


	/**
	 * Given a pixel position, returns the row index for that position.
	 * @method getRowFromPosition
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	maxPosition		- Top scroll position
	 *
	 * @returns {integer}
	 */
	getRowFromPosition = function (maxPosition) {
		if (!variableRowHeight) {
			return Math.floor((maxPosition + offset) / (self.options.rowHeight + 1 + self.options.rowSpacing));
		}

		var row = 0, rowLength = cache.rows.length,	pos, lastpos, i;

		if (rowLength) {
			// Loop through the row position cache and break when the row is found
			for (i = 0; i < rowLength; i++) {
				pos = cache.rowPositions[i];
				if (pos.top - pos.spacing <= maxPosition && pos.bottom >= maxPosition) {
					row = i;
					break;
				}
			}

			// If we've gone past the bottom
			// Return the last row in the grid
			lastpos = cache.rowPositions[rowLength - 1];
			if (maxPosition > lastpos.bottom) row = rowLength - 1;

			return row;
		}
	};


	/**
	 * Calculates the size of the browser's scrollbar by inserting a temporary element
	 * into the DOM and measuring the offset it creates.
	 *
	 * @method getScrollbarSize
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {object}	- Returns an object like this: {height: 1000, width: 20}.
	 */
	getScrollbarSize = function () {
		var s = 'position:absolute;top:-10000px;left:-10000px;width:100px;height:100px;overflow:scroll',
			c = $("<div style='" + s + "'></div>").appendTo($(document.body)),
			result = {
				width: c.width() - c[0].clientWidth,
				height: c.height() - c[0].clientHeight
			};
		removeElement(c[0]);
		return result;
	};


	/**
	 * Returns the currently selected rows including the item data
	 * @method getSelectedRows
	 * @memberof DobyGrid
	 *
	 * @returns {array}
	 */
	this.getSelectedRows = function () {
		var rows = [];
		if (this.selection) {
			for (var i = 0, l = this.selection.length; i < l; i++) {
				var selectedRows = this.selection[i].toRows();
				for (var ir in selectedRows) {
					rows.push(selectedRows[ir]);
				}
			}
		}
		return rows;
	};


	/**
	 * Retrieves a configuration object for the state of all user customizations for the grid.
	 * This allows you to easily restore states between page reloads.
	 * @method getState
	 * @memberof DobyGrid
	 *
	 * @param	{object}	[options]						- Additional options
	 * @param	{array}		[options.column_properties]		- A list of additional column
	 *														properties to save
	 *
	 * @returns {object}
	 */
	this.getState = function (options) {
		options = options || {};

		var results = {
			autoColumnWidth: this.options.autoColumnWidth,
			columns: [],
			filters: [],
			grouping: [],
			sort: [],
			resizedRows: []
		}, i, l, column, group, sort;

		// Get columns
		for (i = 0, l = cache.activeColumns.length; i < l; i++) {
			column = cache.activeColumns[i];
			if (!column.visible) continue;

			// By default, only store the customizable bits of the column definition
			var col_store = {
				id: column.id,
				width: column.width
			};

			// However, if the user specified additional params to store - get them now
			if (options.column_properties) {
				for (var c = 0, cl = options.column_properties.length; c < cl; c++) {
					if (column[options.column_properties[c]] !== undefined) {
						col_store[options.column_properties[c]] = column[options.column_properties[c]];
					}
				}
			}

			results.columns.push(col_store);
		}

		// Get filters
		if (this.collection && this.collection.filterset) {
			results.filters = this.collection.filterset;
		}

		// Get grouping
		if (this.options.groupable && this.collection && this.collection.groups) {
			for (i = 0, l = this.collection.groups.length; i < l; i++) {
				group = this.collection.groups[i];

				// TODO: Store the collapse/expand state of each group row

				results.grouping.push({
					collapsed: group.collapsed,
					column_id: group.column_id
				});
			}
		}

		// Get sorting
		if (this.sorting) {
			for (i = 0, l = this.sorting.length; i < l; i++) {
				sort = this.sorting[i];
				if (sort.group) continue;
				results.sort.push({
					columnId: sort.columnId,
					sortAsc: sort.sortAsc
				});
			}
		}

		// Get user-set row heights
		if (this.options.resizableRows) {
			results.resizedRows = cache.rows
				.filter(function (item) {
					return item.resized;
				})
				.map(function (item) {
					return {id: item[this.options.idProperty], height: item.height};
				}, this);
		}

		return results;
	};


	/**
	 * Given a data item, returns the value of that cell for all export functions
	 * @method getValueFromItem
	 * @memberof DobyGrid
	 *
	 * @param	{object}	item		- Data item from the collection
	 * @param	{object}	column		- Column object for the field to pull
	 *
	 * @returns {string}
	 */
	this.getValueFromItem = function (item, column) {
		// First check for an exporter function for this specific item
		if (typeof item.exporter === 'function') {
			return item.exporter(column, item).toString();
		}

		// Second check for an exporter function for this column
		if (column.exporter && typeof column.exporter === 'function') {
			return column.exporter(column, item).toString();
		}

		// Then check for regular data
		return getDataItemValueForColumn(item, column);
	};


	/**
	 * Given an elements, gets its padding and border offset size
	 * @method getVBoxDelta
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{jQuery}	$el			- Element to scan
	 *
	 * @returns {integer}
	 */
	getVBoxDelta = function ($el) {
		var p = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
		var delta = 0;
		$.each(p, function (n, val) {
			delta += parseFloat($el.css(val)) || 0;
		});
		return delta;
	};


	/**
	 * Calculates the height of the current viewport
	 * @method getViewportHeight
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {integer}
	 */
	getViewportHeight = function () {
		// TODO: Find out why the extra 1 is needed.
		return Math.max(self.$el.height() - (self.options.showHeader ? $headerScroller.outerHeight() - getVBoxDelta($headerScroller) : 0) - 1, 0);
	};


	/**
	 * Calculates the width of the current viewport
	 * @method getViewportWidth
	 * @memberof DobyGrid
	 * @private
	 *
	 * @returns {float}
	 */
	getViewportWidth = function () {
		return parseFloat($.css(self.$el[0], "width", true));
	};


	/**
	 * Gets the currently visible range of the grid. This is the range we'll be rendering
	 * @method getVisibleRange
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	viewportTop			- The current top offset
	 * @param	{integer}	viewportLeft		- The current left offset
	 *
	 * @returns {object}
	 */
	getVisibleRange = function (viewportTop, viewportLeft) {
		if (viewportTop === undefined || viewportTop === null) viewportTop = scrollTop;
		if (viewportLeft === undefined || viewportLeft === null) viewportLeft = scrollLeft;

		var rowTop, rowBottom;

		if (self.options.autoHeight) {
			// All rows are visible when using autoHeight
			rowTop = 0;
			rowBottom = self.collection.length - 1;
		} else if (variableRowHeight) {
			rowTop = Math.floor(getRowFromPosition(viewportTop + offset));
			rowBottom = Math.ceil(getRowFromPosition(viewportTop + offset + viewportH));
		} else {
			rowTop = getRowFromPosition(viewportTop);
			rowBottom = getRowFromPosition(viewportTop + viewportH) + 1;
		}

		if (isNaN(rowTop)) rowTop = null;
		if (isNaN(rowBottom)) rowBottom = null;

		return {
			top: rowTop,
			bottom: rowBottom,
			leftPx: viewportLeft,
			rightPx: viewportLeft + viewportW
		};
	};


	/**
	 * Activates a given cell
	 * @method gotoCell
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row				- Index of the row
	 * @param	{integer}	cell			- Index of the cell
	 * @param	{boolean}	forceEdit		- TODO: ???
	 */
	gotoCell = function (row, cell, forceEdit) {
		if (!initialized) return;
		if (!canCellBeActive(row, cell)) return;

		scrollCellIntoView(row, cell, false);

		var newCell = getCellNode(row, cell);

		// if selecting the 'add new' row, start editing right away
		setActiveCellInternal(newCell, forceEdit || (row === getDataLength()) || self.options.autoEdit);
	};


	/**
	 * Activates the cell below the currently active one
	 * @method gotoDown
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row				- Index of the row
	 * @param	{integer}	cell			- Index of the cell
	 * @param	{integer}	posX			- TODO: ???
	 */
	gotoDown = function (row, cell, posX) {
		var prevCell,
			dataLength = getDataLength();
		while (true) {
			if (++row >= dataLength) {
				return null;
			}

			prevCell = cell = 0;
			while (cell <= posX) {
				prevCell = cell;
				cell += getColspan(row, cell);
			}

			if (canCellBeActive(row, prevCell)) {
				return {
					"row": row,
					"cell": prevCell,
					"posX": posX
				};
			}
		}
	};


	/**
	 * Activates the cell to the left the currently active one
	 * @method gotoLeft
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row				- Index of the row
	 * @param	{integer}	cell			- Index of the cell
	 */
	gotoLeft = function (row, cell) {
		if (cell <= 0) {
			return null;
		}

		var firstFocusableCell = findFirstFocusableCell(row);
		if (firstFocusableCell === null || firstFocusableCell >= cell) {
			return null;
		}

		var prev = {
			"row": row,
			"cell": firstFocusableCell,
			"posX": firstFocusableCell
		};
		var pos;
		while (true) {
			pos = gotoRight(prev.row, prev.cell, prev.posX);
			if (!pos) {
				return null;
			}
			if (pos.cell >= cell) {
				return prev;
			}
			prev = pos;
		}
	};


	/**
	 * Activates the next available cell in the grid (either left, or first in next row)
	 * @method gotoNext
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Index of the row
	 * @param	{integer}	cell		- Index of the cell
	 * @param	{integer}	posX		- TODO: ???
	 */
	gotoNext = function (row, cell, posX) {
		if (row === null && cell === null) {
			row = cell = posX = 0;
			if (canCellBeActive(row, cell)) {
				return {
					"row": row,
					"cell": cell,
					"posX": cell
				};
			}
		}

		var pos = gotoRight(row, cell, posX);
		if (pos) {
			return pos;
		}

		var firstFocusableCell = null,
			dataLength = getDataLength();

		while (++row < dataLength) {
			firstFocusableCell = findFirstFocusableCell(row);
			if (firstFocusableCell !== null) {
				return {
					"row": row,
					"cell": firstFocusableCell,
					"posX": firstFocusableCell
				};
			}
		}
		return null;
	};


	/**
	 * Activates the previous cell to the current one
	 * @method gotoPrev
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Index of the row
	 * @param	{integer}	cell		- Index of the cell
	 * @param	{integer}	posX		- TODO: ???
	 */
	gotoPrev = function (row, cell, posX) {
		if (row === null && cell === null) {
			row = getDataLength() - 1;
			cell = posX = cache.activeColumns.length - 1;
			if (canCellBeActive(row, cell)) {
				return {
					"row": row,
					"cell": cell,
					"posX": cell
				};
			}
		}

		var pos;
		var lastSelectableCell;
		while (!pos) {
			pos = gotoLeft(row, cell, posX);
			if (pos) {
				break;
			}
			if (--row < 0) {
				return null;
			}

			cell = 0;
			lastSelectableCell = findLastFocusableCell(row);
			if (lastSelectableCell !== null) {
				pos = {
					"row": row,
					"cell": lastSelectableCell,
					"posX": lastSelectableCell
				};
			}
		}
		return pos;
	};


	/**
	 * Activates the cell to the right the currently active one
	 * @method gotoRight
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Index of the row
	 * @param	{integer}	cell		- Index of the cell
	 */
	gotoRight = function (row, cell) {
		if (cell >= cache.activeColumns.length) return null;

		do {
			cell += getColspan(row, cell);
		}
		while (cell < cache.activeColumns.length && !canCellBeActive(row, cell));

		if (cell < cache.activeColumns.length) {
			return {
				"row": row,
				"cell": cell,
				"posX": cell
			};
		}
		return null;
	};


	/**
	 * Activates the cell above the currently active one
	 * @method gotoUp
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Index of the row
	 * @param	{integer}	cell		- Index of the cell
	 * @param	{integer}	posX		- TODO: ???
	 */
	gotoUp = function (row, cell, posX) {
		var prevCell;
		while (true) {
			if (--row < 0) {
				return null;
			}

			prevCell = cell = 0;
			while (cell <= posX) {
				prevCell = cell;
				cell += getColspan(row, cell);
			}

			if (canCellBeActive(row, prevCell)) {
				return {
					"row": row,
					"cell": prevCell,
					"posX": posX
				};
			}
		}
	};


	/**
	 * Handles the click and context menu events when clicking on the entire page body.
	 * This is what will unfocus the grid, when clicking outside.
	 * @method handleBodyClick
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	e		- Javascript event object
	 */
	handleBodyClick = function (e) {

		// If we clicked inside the grid, or in the grid's context menu - do nothing
		if (
			self.options.stickyFocus ||
			$(e.target).closest(self.$el).length > 0 ||
			(self.dropdown && $(e.target).closest(self.dropdown.$el).length > 0) ||
			// Sometimes clicking on inner cell elements results in clicking on orphans
			$(e.target).parent().length === 0
		) {
			return;
		}

		// Was the grid destroyed by the time we go in here?
		if (self.destroyed) return;

		// If the stickyFocus is disabled - remove any active cells
		self.activate(null);
		deselectCells();
	},


	/**
	 * Handles the click events on cells
	 * @method handleClick
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	e		- Javascript event object
	 */
	handleClick = function (e) {
		var cell = getCellFromEvent(e);

		if ((!cell || cell.row === null || cell.row === undefined) || (
			self.currentEditor !== null &&
			(self.active && self.active.row == cell.row && self.active.cell == cell.cell)
		)) {
			return;
		}

		// Get item from cell
		var item = self.getRowFromIndex(cell.row);

		// Handle group expand/collapse
		if (self.options.collapsible && item && item._groupRow) {
			var isToggler = $(e.target).hasClass(CLS.grouptoggle) || $(e.target).closest('.' + CLS.grouptoggle).length;

			if (isToggler) {
				if (item.collapsed) {
					self.collection.expandGroup(item[self.options.idProperty]);
				} else {
					self.collection.collapseGroup(item[self.options.idProperty]);
				}

				e.stopImmediatePropagation();
				e.preventDefault();

				return;
			}
		}

		// The rest of the events require a valid cell
		if (!cell) return;

		self.trigger('click', e, {
			cell: cell.cell,
			column: cache.activeColumns[cell.cell],
			item: item,
			row: cell.row
		});

		if (e.isImmediatePropagationStopped()) return;

		// Set clicked cells to active
		if (canCellBeActive(cell.row, cell.cell)) {

			var shiftUsed = self.options.shiftSelect && e.shiftKey,
				ctrlUsed = self.options.ctrlSelect && (e.ctrlKey || e.metaKey);

			// When row-based selection is used - we need to handle clicks differently
			if (self.options.rowBasedSelection) {

				var newestRange = self.selection && self.selection[self.selection.length - 1];

				// Support for "Ctrl" / "Command" clicks
				if (ctrlUsed && self.active) {
					if (isCellSelected(cell.row)) {
						deselectRow(cell.row);
					} else {
						// Don't select the new row if the shift key is pressed since
						// it will be selected with the range
						if (!(shiftUsed)) {
							self.selectRows(cell.row, cell.row, true);
						}
					}
				}

				// If holding down "Shift" key and another cell is already active - use this to
				// select a cell range.
				if (shiftUsed && self.active) {
					deselectRow(self.active.row);

					// Keep selection if ctrlKey is also pressed
					if (ctrlUsed) {
						// If ctrlKey is pressed, deselect the activeRow
						self.selectRows(self.active.row, cell.row, true);
					} else {
						if (newestRange) {
							// Deselect everything so we can work with one single range
							deselectCells();

							var up = (self.active.row == newestRange.fromRow),
								targetRow = up ? newestRange.toRow : newestRange.fromRow;

							if (cell.row < newestRange.fromRow) {
								// new cell is above the range
								self.selectRows(cell.row, targetRow, true);
							} else if (cell.row > newestRange.toRow) {
								// new cell is below the range
								self.selectRows(targetRow, cell.row, true);
							} else {
								// new cell is within the range
								if (up) {
									self.selectRows(cell.row, targetRow, true);
								} else {
									self.selectRows(targetRow, cell.row, true);
								}
							}
						} else {
							self.selectRows(self.active.row, cell.row, true);
						}
					}
				}

				if (!(ctrlUsed || shiftUsed)) {
					deselectCells();
					self.selectRows(cell.row, cell.row, true);
				}

				clearTextSelection();

			} else {
				// If holding down "Shift" key and another cell is already active - use this to
				// select a cell range.
				if (shiftUsed && self.active) {
					// Deselect anything we had selected before
					deselectCells();

					self.selectCells(self.active.row, self.active.cell, cell.row, cell.cell);
				}

				// Support for "Ctrl" / "Command" clicks
				if (ctrlUsed && self.active) {

					// Is the cell already selected? If so - deselect it
					if (isCellSelected(cell.row, cell.cell)) {
						deselectCells(cell.row, cell.cell);
						return;
					}

					// Select the currently active cell
					if (!self.selection) {
						self.selectCells(self.active.row, self.active.cell, self.active.row, self.active.cell, true);
					}

					// Select the cell the user chose
					self.selectCells(cell.row, cell.cell, cell.row, cell.cell, true);
					return;
				}
			}

			scrollRowIntoView(cell.row, false);
			setActiveCellInternal(getCellNode(cell.row, cell.cell));
		}
	};



	/**
	 * Handles the context menu events on cells
	 * @method handleContextMenu
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	e		- Javascript event object
	 *
	 */
	handleContextMenu = function (e) {
		var $cell = $(e.target).closest("." + CLS.cell, $canvas);
		if ($cell.length === 0) return;

		// Deactivate active cell
		if (self.options.deactivateOnRightClick && self.active) self.activate();

		// Are we editing this cell?
		if (self.active && self.active.node === $cell[0] && self.currentEditor !== null) return;

		var column = getColumnFromEvent(e),
			cell = getCellFromEvent(e) || {};

		self.trigger('contextmenu', e, {
			cell: cell.cell !== null && cell.cell !== undefined ? cell.cell : null,
			column: column,
			item: self.getRowFromIndex(cell.row),
			row: cell.row !== null && cell.row !== undefined ? cell.row : null
		});
	};


	/**
	 * Handles the double click events on cells
	 * @method handleDblClick
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	e		- Javascript event object
	 */
	handleDblClick = function (e) {
		var cell = getCellFromEvent(e);
		if (!cell || (self.currentEditor !== null && (self.active && self.active.row == cell.row && self.active.cell == cell.cell))) {
			return;
		}

		var column = getColumnFromEvent(e);

		self.trigger('dblclick', e, {
			cell: cell.cell !== null && cell.cell !== undefined ? cell.cell : null,
			column: column,
			item: self.getRowFromIndex(cell.row),
			row: cell.row !== null && cell.row !== undefined ? cell.row : null
		});

		if (e.isImmediatePropagationStopped()) return;

		if (self.options.editable) {
			gotoCell(cell.row, cell.cell, true);
		}
	};


	/**
	 * Handles the header click events
	 * @method handleHeaderClick
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	event		- Javascript event object
	 *
	 */
	handleHeaderClick = function (event) {
		var column = getColumnFromEvent(event);
		if (column) {
			self.trigger('headerclick', event, {
				column: column
			});
		}
	};


	/**
	 * Triggers the header context menu events
	 * @method handleHeaderContextMenu
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	event			- Javascript event object
	 *
	 */
	handleHeaderContextMenu = function (event) {
		var column = getColumnFromEvent(event);
		self.trigger('headercontextmenu', event, {
			column: column
		});
	};


	/**
	 * Handles the key down events on cells. These are our keyboard shortcuts.
	 * @method handleKeyDown
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	e		- Javascript event object
	 */
	handleKeyDown = function (e) {
		if (self.active) {
			self.trigger('keydown', e, {
				row: self.active.row,
				cell: self.active.cell
			});
		}

		var handled = e.isImmediatePropagationStopped();

		this._event = e;

		if (!handled) {
			// Ctrl/Command + C
			if (e.which == 67 && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
				copySelected();
			} else if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
				// Esc
				if (e.which == 27) {
					if (self.options.editable && self.currentEditor) {
						self.currentEditor.cancel();
						makeActiveCellNormal();

						// Return focus back to the canvas
						$canvas.eq(0).focus();
						handled = true;
					} else if (self.selection) {
						// If something is selected remove the selection range
						deselectCells();
					} else if (self.active) {
						// If something is active - remove the active state
						self.activate();
					}
				// Page Down
				} else if (e.which == 34) {
					scrollPage(1);
					handled = true;
				// Page Up
				} else if (e.which == 33) {
					scrollPage(-1);
					handled = true;
				// Home
				} else if (e.which == 36) {
					self.scrollToRow(0);
					handled = true;
				// End
				} else if (e.which == 35) {
					self.scrollToRow(self.collection.items.length - 1);
					handled = true;
				// Left Arrow
				} else if (e.which == 37) {
					if (self.options.editable && self.currentEditor) {
						handled = commitCurrentEdit(function (result) {
							if (result) navigate("left");
						});
					} else {
						handled = navigate("left");
					}
				// Right Arrow
				} else if (e.which == 39) {
					if (self.options.editable && self.currentEditor) {
						handled = commitCurrentEdit(function (result) {
							if (result) navigate("right");
						});
					} else {
						handled = navigate("right");
					}
				// Up Arrow
				} else if (e.which == 38) {
					if (self.options.editable && self.currentEditor) {
						handled = commitCurrentEdit(function (result) {
							if (result) navigate("up");
						});
					} else {
						handled = navigate("up");
					}
				// Down Arrow
				} else if (e.which == 40) {
					if (self.options.editable && self.currentEditor) {
						handled = commitCurrentEdit(function (result) {
							if (result) navigate("down");
						});
					} else {
						handled = navigate("down");
					}
				// Tab
				} else if (e.which == 9) {
					if (self.options.editable && self.currentEditor) {
						handled = commitCurrentEdit(function (result) {
							if (result) {
								navigate("next");
							}
						});
					} else {
						handled = navigate("next");
					}
				// Enter
				} else if (e.which == 13) {
					if (self.options.editable && self.currentEditor) {
						handled = commitCurrentEdit(function (result) {
							if (result) navigate("down");
						});
					} else {
						handled = navigate("down");
					}
				}
			// Shift Tab
			} else if (e.which == 9 && e.shiftKey && !e.ctrlKey && !e.altKey) {
				if (self.options.editable && self.currentEditor) {
					handled = commitCurrentEdit(function (result) {
						if (result) navigate("prev");
					});
				} else {
					handled = navigate("prev");
				}
			}
		}

		this._event = null;

		if (handled) {
			// the event has been handled so don't let parent element
			// (bubbling/propagation) or browser (default) handle it
			e.stopPropagation();
			e.preventDefault();

			try {
				// prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
				e.originalEvent.which = 0;
			}
			// ignore exceptions - setting the original event's keycode
			// throws access denied exception for "Ctrl" (hitting control key only,
			// nothing else), "Shift" (maybe others)
			catch (error) {}
		}
	};


	/**
	 * Handles the offsets and event that need to fire when a user is scrolling
	 * @method handleScroll
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	event		- Javascript event object
	 */
	handleScroll = function (event) {
		if (event === undefined) event = null;

		scrollTop = $viewportScrollContainerY[0].scrollTop;
		scrollLeft = $viewportScrollContainerX[0].scrollLeft;

		var scrollTopDelta = Math.abs(scrollTop - prevScrollTop),
			scrollLeftDelta = Math.abs(scrollLeft - prevScrollLeft);

		// Horizontal Scroll
		if (scrollLeftDelta) {
			prevScrollLeft = scrollLeft;

			// Scroll the header
			if (self.options.showHeader) {
				if (self.options.frozenColumns > -1) {
					$headerScroller[1].scrollLeft = scrollLeft;
				} else {
					$headerScroller[0].scrollLeft = scrollLeft;
				}
			}
		}

		// Vertical Scroll
		if (scrollTopDelta) {
			vScrollDir = prevScrollTop < scrollTop ? 1 : -1;
			prevScrollTop = scrollTop;

			// Ensure scrolling affects the appropriate frozen panel
			if (self.options.frozenColumns > -1) {
				if (hasFrozenRows && !self.options.frozenBottom) {
					$viewport.eq(2)[0].scrollTop = scrollTop;
				} else {
					$viewport.eq(0)[0].scrollTop = scrollTop;
				}
			}

			// Switch virtual pages if needed
			if (scrollTopDelta < viewportH) {
				scrollTo(scrollTop + offset);
			} else {
				var oldOffset = offset;
				if (h == viewportH) {
					page = 0;
				} else {
					page = Math.min(n - 1, Math.floor(scrollTop * ((th - viewportH) / (h - viewportH)) * (1 / ph)));
				}
				offset = Math.round(page * cj);
				if (oldOffset != offset) {
					invalidateAllRows();
				}
			}

			// Handle sticky group headers
			stickGroupHeaders(scrollTop);
		}

		// Any Scroll
		if (scrollLeftDelta || scrollTopDelta) {
			if (h_render) clearTimeout(h_render);

			if (
				Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
				Math.abs(lastRenderedScrollLeft - scrollLeft) > 20 ||
				// TODO: For some unknown reason - in some rare cases the
				// scroll reports as 0 pixels but yet the h_render timeout never
				// completes. To deal with this - check to see if a scrollLoader
				// is still present - and if it is - do a final re-render. Once fixed
				// also remove the '!scrollLoader' condition below.
				scrollLoader
			) {

				// If virtual scroll is disabled, or viewing something that is already rendered
				// -- re-render immediately
				if (!scrollLoader && (
					!self.options.virtualScroll || (
						Math.abs(lastRenderedScrollTop - scrollTop) < viewportH &&
						Math.abs(lastRenderedScrollLeft - scrollLeft) < viewportW)
					)
				) {
					render();
				} else {
					if (self.options.scrollLoader && !scrollLoader) {
						scrollLoader = $('<div class="' + CLS.scrollloader + '">' + self.options.scrollLoader() + '</div>').appendTo(self.$el);
					}

					h_render = setTimeout(function () {
						if (scrollLoader) {
							scrollLoader.remove();
							scrollLoader = null;
						}

						render();
						h_render = null;
					}, 50);
				}

				self.trigger('viewportchanged', event, {
					scrollLeft: scrollLeft,
					scrollTop: scrollTop,
					scrollLeftDelta: scrollLeftDelta,
					scrollTopDelta: scrollTopDelta
				});
			}

			// Reposition gutters.
			if (self.options.showGutters) {
				$gutters.css('top', scrollTop);
				$gutters.filter('.left').css('left', scrollLeft);
				$gutters.filter('.right').css('right', -scrollLeft);
			}
		}

		self.trigger('scroll', event, {
			scrollLeft: scrollLeft,
			scrollTop: scrollTop,
			scrollLeftDelta: scrollLeftDelta,
			scrollTopDelta: scrollTopDelta
		});
	};


	/**
	 * Event that fires when the window is resize
	 * @method handleWindowResize
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param {object} evt - Javascript event object
	 */
	handleWindowResize = function (evt) {
		// Only if the object is visible
		if (evt.target !== window || !self.$el.is(':visible')) return;
		self.resize();
	};


	/**
	 * Given a column's id, check to see if it is currently grouped. If it is, returns the grouping
	 * object. Otherwise returns false.
	 * @method hasGrouping
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{string}	column_id	- ID of the column to check grouping for
	 *
	 * @returns {boolean|object}
	 */
	hasGrouping = function (column_id) {
		if (!column_id) return false;

		// Does this column even exist?
		var column = getColumnById(column_id);
		if (!column) return false;

		// Try to grab the grouping object
		var grouping = _.groupBy(self.collection.groups, function (g) { return g.column_id; });

		// Return the grouping object
		return grouping[column_id] && grouping[column_id].length ? grouping[column_id][0] : false;
	};


	/**
	 * Returns true if there is a sorting enabled for a given column id.
	 * @method hasSorting
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{string}	column_id		- ID of the column to check sorting for
	 *
	 * @returns {boolean}
	 */
	hasSorting = function (column_id) {
		if (!column_id) return false;
		var column_ids = _.pluck(self.sorting, 'columnId');
		return column_ids.indexOf(column_id) >= 0;
	};


	/**
	 * Removes a column from view, but keeps it in the grid's memory bank so
	 * that user can re-add it later.
	 * @method hideColumn
	 * @memberof DobyGrid
	 *
	 * @param {string}	column_id		- ID of the column to hide
	 *
	 */
	this.hideColumn = function (column_id) {
		var column = null;

		// Does this column even exist?
		if (column_id !== undefined && column_id !== null) {
			column = getColumnById(column_id);
		}

		if (!column) {
			throw new Error('Unable to hide column "' + column_id + '" because no such column could be found.');
		}

		// Clone the columns so that the 'columnchange' event correctly reports back the old columns
		var columns_clone = this.options.columns.map(function (c) {
			var col = _.clone(c);
			if (col.id === column_id) col.visible = false;
			return col;
		});

		this.setColumns(columns_clone);
	};


	/**
	 * Hides the active overlay
	 * @method hideOverlay
	 * @memberof DobyGrid
	 */
	this.hideOverlay = function () {
		if ($overlay && $overlay.length) {
			removeElement($overlay[0]);
			$overlay = null;

			// Reset canvas width
			updateCanvasWidth();

			// Redraw grid
			invalidate();
		}

		return this;
	};


	/**
	 * Inserts a new row to the end of the collection used for adding new rows to the grid
	 * @method insertAddRow
	 * @memberof DobyGrid
	 * @private
	 */
	insertAddRow = function () {
		var obj = new NonDataItem({
			__addRow: true,
			data: {},
			formatter: function () {
				return "";
			},
			id: '-add-row-',
		});

		self.collection.add(obj, {forced: true});
	};


	/**
	 * Determines if a given cell is editable
	 * @method isCellPotentiallyEditable
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- ID of the row
	 * @param	{integer}	cell		- ID of the cell
	 *
	 * @returns {boolean}
	 */
	isCellPotentiallyEditable = function (row, cell) {
		var dataLength = getDataLength(),
			item = self.getRowFromIndex(row);

		if (!item) return false;

		// Is this cell editable?
		if (item.editable === false) return false;

		// Is this column editable?
		if (cache.activeColumns[cell].editable === false) return false;

		// Is the data for this row loaded?
		if (row < dataLength && !item) return false;

		// Does this cell have an editor?
		if (!getEditor(row, cell)) return false;

		return true;
	};


	/**
	 * Returns true if the given row/cell index combination yields a selected cell
	 * @method isCellSelected
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Index of row of the cell
	 * @param	{integer}	cell		- Index of the cell in the row
	 *
	 * @returns {boolean}
	 */
	isCellSelected = function (row, cell) {
		if (!self.selection) return false;
		var s;
		for (var i = 0, l = self.selection.length; i < l; i++) {
			s = self.selection[i];
			if (s.contains(row, cell)) return true;
		}
		return false;
	};


	/**
	 * Returns true if all the cells for a given column are selected
	 * @method isColumnSelected
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	column_idx		- Index of the column to check
	 *
	 * @returns {boolean}
	 */
	isColumnSelected = function (column_idx) {
		if (!self.selection) return false;

		var selectable_rows = self.collection.length - 1;

		if (self.collection.items[self.collection.items.length - 1][self.options.idProperty] == '__gridAggregate') {
			selectable_rows--;
		}

		var s;
		for (var i = 0, l = self.selection.length; i < l; i++) {
			s = self.selection[i];
			if (s.fromRow === 0 && s.toRow === selectable_rows && s.fromCell >= column_idx && s.toCell <= column_idx) {
				return true;
			}
		}

		return false;
	};


	/**
	 * When the grid is empty and the empty alert is enabled -- add a NonDataItem to the grid
	 * @method insertEmptyOverlay
	 * @memberof DobyGrid
	 * @private
	 */
	insertEmptyOverlay = function () {
		var html = "";

		if (typeof(self.options.emptyNotice) === 'function') {
			html = self.options.emptyNotice.bind(self)();
		} else {
			html = self.fetcher ? getLocale("empty.remote") : self.collection && self.collection.filterset ? getLocale("empty.filter") : getLocale("empty.default");
		}

		self.showOverlay({
			class: CLS.empty,
			html: html
		});
	};


	/**
	 * Clears the caching for all rows counts and positions
	 * @method invalidate
	 * @memberof DobyGrid
	 * @private
	 */
	invalidate = function () {
		updateRowCount();
		invalidateAllRows();
		render();
	};


	/**
	 * Clears the caching for all rows caches
	 * @method invalidateAllRows
	 * @memberof DobyGrid
	 * @private
	 */
	invalidateAllRows = function () {
		if (self.currentEditor) {
			makeActiveCellNormal();
		}
		for (var row in cache.nodes) {
			removeRowFromCache(row);
		}
	};


	// invalidatePostProcessingResults()
	// Clears the caching for all post processing for a row
	//
	// @param	row		{integer}		Row index
	//
	invalidatePostProcessingResults = function (row) {
		delete cache.postprocess[cache.rows[row][self.options.idProperty]];
		postProcessFromRow = Math.min(postProcessFromRow, row);
		postProcessToRow = Math.max(postProcessToRow, row);
		startPostProcessing();
	};


	// invalidateRows()
	// Clear the cache for a given set of rows
	//
	// @param	rows	{array}		List of row indices to invalidate
	//
	invalidateRows = function (rows) {
		if (!rows || !rows.length) return;

		vScrollDir = 0;

		for (var i = 0, l = rows.length; i < l; i++) {
			if (self.currentEditor && self.active && self.active.row === rows[i]) {
				makeActiveCellNormal();
			}

			if (cache.nodes[rows[i]]) {
				removeRowFromCache(rows[i]);
			}
		}
	};


	// isGrouped()
	// Returns true if the grid is currently grouped by a value
	//
	// @returns {boolean}
	this.isGrouped = function () {
		return this.collection.groups.length ? true : false;
	};


	// isSorted()
	// Returns true if the grid is currently sorted by a value
	//
	// @returns {boolean}
	this.isSorted = function () {
		return this.sorting.length ? true : false;
	};


	// bindToCollection()
	// When the given data set is a Backbone Collection - this function will link
	// up common Collection events to the grid.
	//
	bindToCollection = function () {
		self.listenTo(self.options.data, 'add', function (model, collection, options) {
			// If grid is destroyed by the time we get here - leave
			if (self.destroyed) return;

			// If "silentDobyRefresh" option is used -- add silently
			if (options.silentDobyRefresh !== undefined) {
				options.silent = options.silentDobyRefresh;
			}

			// When new items are added to the collection - add them to the grid
			self.collection.add(model, options);
		});

		self.listenTo(self.options.data, 'change', function (model) {
			// If grid is destroyed by the time we get here - leave
			if (self.destroyed) return;

			// When items are changed - re-render the right row
			if (model.changed && model.changed[self.options.idProperty]) {
				// If trying to edit the idProperty field -- capture that and send it to
				// the setItem function for proper error handling
				self.setItem(model._previousAttributes[self.options.idProperty], model);
			} else {
				self.setItem(model[self.options.idProperty], model);
			}
		});

		self.listenTo(self.options.data, 'remove', function (model) {
			// If grid is destroyed by the time we get here - leave
			if (self.destroyed) return;

			// When items are removed - remove the right row
			self.collection.remove(model[self.options.idProperty]);
		});

		self.listenTo(self.options.data, 'reset', function (collection) {
			// If grid is destroyed by the time we get here - leave
			if (self.destroyed) return;

			self.collection.reset(collection);
		});

		self.listenTo(self.options.data, 'sort', _.debounce(function () {
			// If grid is destroyed by the time we get here - leave
			if (self.destroyed) return;

			// If sorting before we've had a chance to process the collection - skip
			if (!self.collection) return;

			// Reset collection with the new ordering in the data set
			self.collection.reset(self.options.data);
		}), 10);
	};


	/**
	 * Remembers the current width of each column header in the .previousWidth property
	 * @method lockColumnWidths
	 * @memberof DobyGrid
	 * @private
	 */
	lockColumnWidths = function () {
		// Columns may have been changed since the last time this ran - refetch children
		var columnElements = $headers.children('.' + CLS.headercolumn);

		columnElements.each(function (i) {
			// The extra 1 here is to compensate for the border separator
			cache.activeColumns[i].previousWidth = cache.activeColumns[i].width;
		});
	};


	/**
	 * Makes the currently active cell editable
	 * @method makeActiveCellEditable
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{function}	editor		- Editor factory to use
	 */
	makeActiveCellEditable = function (editor) {
		if (!self.active || !self.active.node || self.options.editable !== true) return;

		// Is this cell editable?
		if (!isCellPotentiallyEditable(self.active.row, self.active.cell)) return;

		// Cancel pending async call if there is one
		clearTimeout(h_editorLoader);

		var columnDef = cache.activeColumns[self.active.cell];
		var item = self.getRowFromIndex(self.active.row);

		$(self.active.node).addClass("editable");

		// If no editor is given, clear the cell
		if (!editor) self.active.node.innerHTML = "";

		var CellEditor = editor || getEditor(self.active.row, self.active.cell);

		self.currentEditor = new CellEditor({
			grid: self,
			cell: self.active.node,
			column: columnDef,
			item: item || {},
			commitChanges: function () {
				// if the commit fails, it would do so due to a validation error
				// if so, do not steal the focus from the editor
				if (self.options.autoEdit) {
					navigate('down');
				}
			}
		});

		// Validate editor for required methods
		var editormethods = ['applyValue', 'cancel', 'destroy', 'focus', 'getValue', 'isValueChanged', 'loadValue', 'serializeValue', 'setValue', 'validate'];
		for (var i = 0, l = editormethods.length; i < l; i++) {
			if (!self.currentEditor[editormethods[i]]) {
				throw new Error("Your editor is missing a '" + [editormethods[i]] + "' function.");
			}
		}

		serializedEditorValue = self.currentEditor.serializeValue();

		// Focus the editor
		self.currentEditor.focus();
	};


	/**
	 * Handler for cell styling when using an editor
	 * @method makeActiveCellNormal
	 * @memberof DobyGrid
	 * @private
	 */
	makeActiveCellNormal = function () {

		if (!self.currentEditor) return;

		// When an editor is destroyed, the input element loses focus and focus is given back
		// to the 'body' element. To retain focus on the grid - we need to manually set it here first.
		if (self.currentEditor.$input.is(document.activeElement)) {
			$canvas.eq(0).focus();
		}

		self.currentEditor.destroy();
		self.currentEditor = null;

		if (self.active && self.active.node) {
			var d = self.getRowFromIndex(self.active.row);
			$(self.active.node).removeClass("editable invalid");
			if (d) {
				var column = cache.activeColumns[self.active.cell];
				var formatter = getFormatter(d, column);
				self.active.node.innerHTML = formatter(self.active.row, self.active.cell, getDataItemValueForColumn(d, column), column, d);
				invalidatePostProcessingResults(self.active.row);
			}
		}
	};


	/**
	 * Header columns and cells may have different padding skewing width
	 * calculations (box-sizing, hello?) calculate the diff so we can set consistent sizes
	 * @method measureCellPadding
	 * @memberof DobyGrid
	 * @private
	 */
	measureCellPadding = function () {
		var h = ["paddingLeft", "paddingRight"],
			v = ["paddingTop", "paddingBottom"],
			el;

		if (self.options.showHeader) {
			el = $('<div class="' + CLS.headercolumn + '" style="visibility:hidden">-</div>')
				.appendTo($headerL);

			headerColumnWidthDiff = headerColumnHeightDiff = 0;

			if (
				el.css("box-sizing") != "border-box" &&
				el.css("-moz-box-sizing") != "border-box" &&
				el.css("-webkit-box-sizing") != "border-box"
			) {
				$.each(h, function (n, val) {
					headerColumnWidthDiff += parseFloat(el.css(val)) || 0;
				});
				$.each(v, function (n, val) {
					headerColumnHeightDiff += parseFloat(el.css(val)) || 0;
				});
			}
			removeElement(el[0]);
		}

		var r = $('<div class="' + CLS.row + '"></div>').appendTo($canvas[0]);
		el = $('<div class="' + CLS.cell + '" style="visibility:hidden">-</div>').appendTo(r);
		cellWidthDiff = cellHeightDiff = 0;

		if (
			el.css("box-sizing") != "border-box" &&
			el.css("-moz-box-sizing") != "border-box" &&
			el.css("-webkit-box-sizing") != "border-box"
		) {
			$.each(h, function (n, val) {
				cellWidthDiff += parseFloat(el.css(val)) || 0;
			});
			$.each(v, function (n, val) {
				cellHeightDiff += parseFloat(el.css(val)) || 0;
			});
		}

		removeElement(r[0]);

		absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
	};


	/**
	 * Given a sorting object generated by addGrouping(), will merge those sorting options
	 * with the existing sorting options in the grid to ensure groups are always sorted first.
	 * @method mergeGroupSorting
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{array}		user_sorting	- List of sorting options as requested by the user
	 *
	 * @return {array}
	 */
	mergeGroupSorting = function (user_sorting) {
		var sorting = [],
			groupSortById = {},
			i, l;

		// Process group sorts first
		for (i = 0, l = self.collection.groups.length; i < l; i++) {
			sorting.push({
				columnId: self.collection.groups[i].column_id,
				sortAsc: true,
				group: true
			});
			groupSortById[self.collection.groups[i].column_id] = sorting[i];
		}

		// Now add any remaining user sorting configs at the end
		var gsort;
		for (i = 0, l = user_sorting.length; i < l; i++) {
			if (user_sorting[i].group) continue;

			gsort = groupSortById[user_sorting[i].columnId];
			if (!gsort) {
				sorting.push(user_sorting[i]);
			} else {
				delete gsort.group;
				gsort.sortAsc = user_sorting[i].sortAsc;
			}
		}

		// Set new sorting options
		return sorting;
	};


	/**
	 * Enables cell navigation via keyboard shortcuts. Returns true if
	 * navigation resulted in a change of active cell.
	 * @method navigate
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{string}		dir			- Navigation direction
	 *
	 * @returns {boolean}
	 */
	navigate = function (dir) {
		if (!self.options.keyboardNavigation) return false;

		if ((!self.active || !self.active.node) && dir != "prev" && dir != "next") {
			return false;
		}

		var tabbingDirections = {
			"up": -1,
			"down": 1,
			"left": -1,
			"right": 1,
			"prev": -1,
			"next": 1
		};
		tabbingDirection = tabbingDirections[dir];

		var stepFunctions = {
			"up": gotoUp,
			"down": gotoDown,
			"left": gotoLeft,
			"right": gotoRight,
			"prev": gotoPrev,
			"next": gotoNext
		};
		var stepFn = stepFunctions[dir];
		var pos = stepFn(self.active ? self.active.row : null, self.active ? self.active.cell : null, activePosX);

		if (pos) {
			var isAddNewRow = (pos.row == getDataLength());
			scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);
			setActiveCellInternal(getCellNode(pos.row, pos.cell));
			activePosX = pos.posX;
			return true;
		}

		return false;
	};


	/**
	 * Handles the width leeway for the column headers
	 * @method prepareLeeway
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	i		- The columns index
	 * @param	{integer}	pageX	- The x coordinate of the right edge of the column
	 */
	prepareLeeway = function (i, pageX) {

		var columnElements = $headers.children('.' + CLS.headercolumn);
		var shrinkLeewayOnRight = null,
			stretchLeewayOnRight = null,
			j, c;

		if (self.options.autoColumnWidth) {
			shrinkLeewayOnRight = 0;
			stretchLeewayOnRight = 0;
			// colums on right affect maxPageX/minPageX
			for (j = i + 1; j < columnElements.length; j++) {
				c = cache.activeColumns[j];
				if (!c.resizable) continue;
				if (stretchLeewayOnRight !== null) {
					if (c.maxWidth) {
						stretchLeewayOnRight += c.maxWidth - c.previousWidth;
					} else {
						stretchLeewayOnRight = null;
					}
				}
				shrinkLeewayOnRight += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
			}
		}
		var shrinkLeewayOnLeft = 0,
			stretchLeewayOnLeft = 0;
		for (j = 0; j <= i; j++) {
			// columns on left only affect minPageX
			c = cache.activeColumns[j];
			if (!c.resizable) continue;
			if (stretchLeewayOnLeft !== null) {
				if (c.maxWidth) {
					stretchLeewayOnLeft += c.maxWidth - c.previousWidth;
				} else {
					stretchLeewayOnLeft = null;
				}
			}
			shrinkLeewayOnLeft += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
		}

		if (shrinkLeewayOnRight === null) shrinkLeewayOnRight = 100000;
		if (shrinkLeewayOnLeft === null) shrinkLeewayOnLeft = 100000;
		if (stretchLeewayOnRight === null) stretchLeewayOnRight = 100000;
		if (stretchLeewayOnLeft === null) stretchLeewayOnLeft = 100000;

		maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
		minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
	};


	/**
	 * A public method that allows developers to ask the grid to fetch data using its current
	 * filters and configuration
	 * @method refetch
	 * @memberof DobyGrid
	 *
	 * @returns {object}
	 */
	this.refetch = function () {
		if (this.fetcher) {
			remoteCount(function () {
				if (self.collection.groups && self.collection.groups.length) {
					remoteGroupRefetch();
				} else {
					remoteFetch();
				}
			});
		} else {
			throw new Error('The "refetch" method can only be used with Doby Grid instances which use a remote data set.');
		}

		return this;
	};


	/**
	 * Returns true if all remote data is loaded
	 * @method remoteAllLoaded
	 * @memberof DobyGrid
	 * @private
	 */
	remoteAllLoaded = function () {
		// Do we have any placeholders?
		for (var i = 0, l = self.collection.items.length; i < l; i++) {
			if (self.collection.items[i].__placeholder) {
				return false;
			}
		}
		return true;
	};


	/**
	 * Executes a remote data count fetch, saves it as the collection length
	 * then calls the callback.
	 * @method remoteCount
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{function}	callback	- Callback function
	 *
	 */
	remoteCount = function (callback) {
		var options = {
			filters: typeof(self.collection.filter) != 'function' ? self.collection.filter : null
		};

		if (typeof self.fetcher.onLoading === 'function'){
			self.fetcher.onLoading(false);
		}

		var req = function () {
			var	dfd = new $.Deferred();

			self.fetcher.count(options, function (result) {
				// Grid was destroyed before the callback finished
				if (self.destroyed) return dfd.resolve();

				// Validate
				if (typeof(result) !== 'number') {
					throw new Error('Your count() method must return a number. It returned a ' + typeof(result) + ' of value "' + result + '" instead.');
				}

				// Sets the current collection length
				self.collection.length = result;

				// Sets the total remote collection length
				self.collection.remote_length = result;

				if (result === 0) {
					// When there are no results - reset
					self.collection.reset();
					insertEmptyOverlay();
				} else {
					// Fill the collection with placeholders
					generatePlaceholders();
				}

				// Updating the row count here will ensure the scrollbar is
				// rendered the right size
				updateRowCount();

				// Now that we have placeholders and the right row count - update
				// the viewport with blanks
				self.collection.refresh();

				if (typeof self.fetcher.onLoaded === 'function'){
					self.fetcher.onLoaded();
				}
				// Now go and fetch the real items
				callback();

				// Resolve promise
				dfd.resolve();
			});

			return dfd.promise();
		};

		self.fetcher.queue = self.fetcher.queue
			.then(function () {
				return req();
			});
	};


	/**
	 * Executes a remote data fetch and re-renders the grid with the new data.
	 * @method remoteFetch
	 * @memberof DobyGrid
	 * @private
	 */
	remoteFetch = function () {
		// If scrolling fast, abort pending requests
		var silentRemoteLoaded = true;
		if (self.fetcher.request && typeof self.fetcher.request.abort === 'function') {
			self.fetcher.request.abort();

			// If the request is aborted, we need to ensure that the "remoteloaded"
			// event isn't triggered when the fetch request is processed.
			silentRemoteLoaded = false;
		}

		// Also cancel previous execution entirely (if scrolling really really fast)
		if (remoteTimer !== null) clearTimeout(remoteTimer);

		// Helper method for determining if group or any of its subgroups have a placeholder row
		var hasPlaceholderRow = function (group) {
			if (!group.groups) {
				if (group.grouprows && group.grouprows.length) {
					return _.findWhere(group.grouprows, {'__placeholder': true}) ? true : false;
				}
				return null;
			} else {
				if (group.groups.length) {
					for (var gg = 0, ggl = group.groups.length; gg < ggl; gg++) {
						if (hasPlaceholderRow(group.groups[gg])) return true;
					}
				}
				return null;
			}
		};

		var req = function () {
			var dfd = new $.Deferred(),
				vp = getVisibleRange(),
				from = vp.top,
				to = vp.bottom;

			// Decrease likelihood that user sees empty rows before the results
			// load by prefetching extra ones.
			if (vScrollDir == -1) {
				from -= self.options.rowsToPrefetch;
			} else {
				to += self.options.rowsToPrefetch;
			}

			// Don't attempt to fetch more results than there are
			if (from < 0) from = 0;
			if (self.collection.length > 0) to = Math.min(to, self.collection.length - 1);

			// If there are groups - we need to scan from the very top to ensure we calculate
			// the correct data offsets.
			var start = self.collection.groups.length ? 0 : from,
				newFrom,
				newTo,
				r,
				realRowOffset = 0,
				nonDataOffset = 0,
				collapsedOffset = 0;

			// fetchCollapsed mode has a completely different rule set for determining
			// offset and limits because it accounts for collapsed groups.
			if (self.options.fetchCollapsed && self.collection.groups.length) {
				for (var ifc = start; ifc <= to; ifc++) {
					r = cache.rows[ifc];

					// If no start is set yet, and group doesn't have placeholders
					if (newFrom === undefined && r && (r.__placeholder || (r._groupRow && hasPlaceholderRow(r)))) {
						newFrom = Math.max(ifc - nonDataOffset + collapsedOffset - realRowOffset, 0);
					}

					// If encoutering a Group row
					if (r && r._groupRow) {
						// Account for the row itself
						nonDataOffset++;
					}

					// If encountering a top-level Group row
					if (r && r._groupRow && !r.parentGroup) {
						collapsedOffset += r.count;
					}

					// If encoutering real rows
					if (r && !(r instanceof NonDataItem)) realRowOffset++;

					if (newFrom !== undefined) newTo = collapsedOffset - 1;
				}
			} else {

				// Strip out the range that is already loaded
				for (var i = start; i <= to; i++) {
					r = cache.rows[i];

					// When encountering Group rows - keep in mind how many collapsed rows
					// we need to skip over
					if (r && r._groupRow && r.collapsed && newFrom === undefined) {
						nonDataOffset++;
						collapsedOffset += r.count;
						continue;
					}

					// collection.items doesn't store such values and we need to reliably determine
					// what collection.items index we're currently on
					if (r && r instanceof NonDataItem && !r.__placeholder) {
						nonDataOffset++;
					}

					// When groups are enabled we need to scan all data to parse the offsets,
					// but we don't need to fetch all data above -- make sure we set from limit
					// back to the current page only.
					if (i < from) continue;

					if (!r || r.__placeholder) {
						if (newFrom === undefined) {
							newFrom = i - nonDataOffset + collapsedOffset;
						}

						newTo = i - nonDataOffset + collapsedOffset;
					}
				}
			}

			// If everything is already loaded - simply process the rows via remoteLoaded()
			if (newFrom === undefined) {
				remoteLoaded(null, null, {silent: silentRemoteLoaded});
				return dfd.resolve().promise();
			}

			var oldvariableRowHeight;

			// Determine if rows to load are already visible by checking for
			// overlap between we're fetching and current visible ones.
			var loadingVisibleRows = newFrom <= vp.bottom && vp.top <= newTo;

			// Run the fetcher
			remoteFetcher({
				columns: cache.activeColumns,
				filters: typeof(self.collection.filter) != 'function' ? self.collection.filter : null,
				limit: newTo - newFrom + 1,
				offset: newFrom,
				order: self.sorting
			}, function (results) {
				// Grid was destroyed before the callback finished
				if (self.destroyed) return dfd.resolve();

				// Add items to Backbone.Collection dataset
				// TODO: We may want to make this optional as users way want to control
				// what's added to their collections manually.
				if (self.options.data instanceof Backbone.Collection) {
					for (var i = 0, l = results.length; i < l; i++) {
						self.options.data.add(results[i], {at: newFrom + i, merge: true, silentDobyRefresh: true});
					}
				} else {
					// Item items to internal collection
					self.collection.add(results, {at: newFrom, merge: true, silent: true});
				}

				var topRow = (newFrom - collapsedOffset),
					bottomRow = (newTo + nonDataOffset - collapsedOffset);

				// After the items are fetched, we need to reset some caching if variableRowHeight
				// mode was changed.
				if (oldvariableRowHeight !== variableRowHeight) {
					// First, ensure rows are re-cached to ensure the grid can be rendered properly
					cacheRows();

					// We'll need to invalidate everything, since we don't know where the new row
					// heights will end up.
					invalidate();
				}

				// Fire loaded function to process the changes
				remoteLoaded(topRow, bottomRow);

				// If variableRowHeight mode got enabled,
				// we need to check to see if the viewport got filled. It's possible that the rows
				// fetched are smaller than originally predicted, and we will need to fetch more.
				if (oldvariableRowHeight !== variableRowHeight) {
					// TODO: This behavior might not be desireable as it may take many fetches
					// to fill up the viewport... We may want to think about another way to handle this.
					// Perhaps calculate the average height of the previous rows and use that to
					// better estimate how many rows we should fetch next time?

					// The new viewport is smaller than it was before
					if (getVisibleRange().bottom > to) {
						// Fetch more rows
						remoteFetch();
					}
				}

				dfd.resolve();
			}, function () {
				dfd.resolve();
			}, loadingVisibleRows);

			return dfd.promise();
		};

		self.fetcher.queue = self.fetcher.queue
			.then(function () {
				return req();
			});
	};


	/**
	 * Fetches all the remote data the server has available for this grid. This is needed sometimes,
	 * like in the case where the user may want to export the full result data set.
	 * @method remoteFetchAll
	 * @memberof DobyGrid
	 *
	 * @param	{function}	callback	- Callback function
	 */
	this.remoteFetchAll = function (callback) {
		callback = callback || function () {};

		// If scrolling fast, abort pending requests
		if (this.fetcher.request && typeof this.fetcher.request.abort === 'function') {
			this.fetcher.request.abort();
		}

		// Also, cancel previous execution entirely (if refetching very quickly)
		if (remoteTimer !== null) clearTimeout(remoteTimer);

		remoteFetcher({
			columns: cache.activeColumns,
			order: this.sorting
		}, function (results) {
			if (this.options.data instanceof Backbone.Collection) {
				this.options.data.reset(results);
			} else {
				this.collection.reset(results);
			}
			callback();
		}.bind(this));

		return this;
	};


	/**
	 * Handles the processing of the remote fetch function for remoteFetch and remoteFetchAll
	 * since both of those functions share the majority of their fetching code.
	 * @method remoteFetcher
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	options				- Fetching options
	 * @param	{function}	callback			- Callback function
	 * @param	{function}	clear_callback		- Callback fired if the timeout was cleared
	 * @param	{boolean}	loadingVisibleRows	- If true, rows being loaded are inside the visible range
	 *
	 */
	remoteFetcher = function (options, callback, clear_callback, loadingVisibleRows) {
		callback = callback || function () {};
		clear_callback = clear_callback || function () {};

		// Assume by default that the rows to load are inside the visible range.
		loadingVisibleRows = typeof loadingVisibleRows !== 'undefined' ? loadingVisibleRows : true;

		// Ensure basic options are defined
		if (!options.offset) options.offset = 0;
		if (!options.limit) options.limit = null;

		// Put the request on a timer so that when users scroll quickly they don't fire off
		// hundreds of requests for no good reason.
		if (remoteTimer) {
			clearTimeout(remoteTimer);
			clear_callback();
		}

		remoteTimer = setTimeout(function () {
			try {
				// Fire onLoading callback
				if (typeof self.fetcher.onLoading === 'function') self.fetcher.onLoading(loadingVisibleRows);

				self.fetcher.request = self.fetcher.fetch(options, function (results) {
					// Empty the request variable so it doesn't get aborted on scroll
					self.fetcher.request = null;

					callback(results);

					// Fire onLoaded callback
					if (typeof self.fetcher.onLoaded === 'function') self.fetcher.onLoaded(loadingVisibleRows);
				});
			} catch (err) {
				throw new Error('Doby Grid remote fetching failed due to: ' + err);
			}
		}, self.options.remoteScrollTime);
	};


	/**
	 * Executes a remote data fetch for group objects
	 * @method remoteFetchGroups
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{function}	callback	- Callback function
	 *
	 */
	remoteFetchGroups = function (callback) {
		callback = callback || function () {};

		// If grouping fast, abort pending requests
		if (self.fetcher.request && typeof self.fetcher.request.abort === 'function') {
			self.fetcher.request.abort();
		}

		// If we have a cache -- load that
		if (cache.remoteGroups) {
			callback(cache.remoteGroups);
		} else {
			var options = {
				filters: typeof(self.collection.filter) != 'function' ? self.collection.filter : null,
				groups: self.collection.groups,
				order: self.sorting
			};

			// Fire onLoading callback
			if (typeof self.fetcher.onLoading === 'function') self.fetcher.onLoading();

			var req = function () {
				var dfd = new $.Deferred();

				// Begin remote fetch request
				self.fetcher.request = self.fetcher.fetchGroups(options, function (results) {
					// Empty the request variable so it doesn't get aborted on scroll
					self.fetcher.request = null;

					// Validate results
					validateRemoteGroups(results);

					// Cache the results for this column
					cache.remoteGroups = results;

					// Return results via callback
					callback(results);

					self.trigger('remotegroupsloaded', self._event, {});

					// Fire onLoaded callback
					if (typeof self.fetcher.onLoaded === 'function') self.fetcher.onLoaded();

					dfd.resolve();
				});

				return dfd.promise();
			};

			self.fetcher.queue = self.fetcher.queue
				.then(function () {
					return req();
				});
		}
	};


	/**
	 * Sometimes we need to refetch remote groups (like after a sort or a filter).
	 * This function will correctly refetch the groups and then reload the grid if necessary.
	 * @method remoteGroupRefetch
	 * @memberof DobyGrid
	 * @private
	 */
	remoteGroupRefetch = function () {
		// Clear the grouping cache
		cache.remoteGroups = null;

		// Subscribe to an event that will tell us once the refresh
		// (and group fetching is done)
		var waitForGroups = function () {
			// Only call remoteFetch if at least 1 group is open
			var allClosed = true;
			for (var i = 0, l = self.collection.groups.length; i < l; i++) {
				if (!allClosed) break;
				for (var j = 0, m = self.collection.groups[i].rows.length; j < m; j++) {
					if (!self.collection.groups[i].rows[j].collapsed) {
						allClosed = false;
						break;
					}
				}
			}

			if (!allClosed || self.options.fetchCollapsed) remoteFetch();
		};

		self.once('remotegroupsloaded', waitForGroups);

		// If we're grouped, we need to refetch groups in the right order again.
		// For this we call 'refresh' which will refetch the groups and auto-render the grid
		// for us.
		self.collection.refresh();
	};


	/**
	 * After remote data is fetched, this function is called to refresh the grid accordingly.
	 * @method remoteLoaded
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	from					- Row index from which to start fetching
	 * @param	{integer}	to						- Row index until when to fetch
	 * @param	{object}	[options]				- Additional options
	 * @param	{boolean}	[options.silent]		- If true, will not fire the "remoteloaded" event
	 *
	 */
	remoteLoaded = function (from, to, options) {
		options = options || {};

		// Invalidate updated rows
		for (var i = from; i <= to; i++) {
			invalidateRows([i]);
		}

		updateRowCount();
		render();

		if (!options.silent) self.trigger('remoteloaded', self._event, {});
	};



	/**
	 * Removes a row of data from the grid
	 * @method remove
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	id		- Lookup data object via id instead
	 *
	 * @returns {object}
	 */
	this.remove = function (id) {
		// TODO: Convert this to use a similar to input to Backbone.Collection.remove()
		this.collection.remove(id);
		return this;
	};


	/**
	 * Removes a column from the grid
	 * @method removeColumn
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	column		- 'id' key of the column definition
	 *
	 * @returns {object}
	 */
	this.removeColumn = function (column) {
		if (!column) return this;
		if (typeof column == 'object') column = column.id;

		var colDef;
		var newcolumns = this.options.columns.filter(function (c) {
			if (c.id == column) {
				colDef = c;
				if (c.removable !== true) {
					throw new Error('Cannot remove column "' + c.id + '" because it is not removable.');
				}
			}
			return c.id != column;
		});

		if (!colDef) throw new Error('Cannot remove column "' + column + '" because no such column exists.');

		// If column had a grouping - remove that grouping
		if (hasGrouping(column)) {
			this.removeGrouping(column);
		}

		// If column has a Quick Filter element - remove it
		var qf;
		if (colDef && colDef.quickFilterInput) {
			removeElement(colDef.quickFilterInput.parent()[0]);
			qf = true;
		}

		self.setColumns(newcolumns);

		// If Quick Filter was on, we need to resize column headers here to get rid of some artifacts
		if (qf) applyColumnHeaderWidths();

		return this;
	};


	/**
	 * Removes the CSS rules specific to this grid instance
	 * @method removeCssRules
	 * @memberof DobyGrid
	 * @private
	 */
	removeCssRules = function () {
		if ($style && $style.length) {
			removeElement($style[0]);
			$style = null;
		}

		stylesheet = null;
	};


	/**
	 * Remove column grouping for a given 'id' of a column.
	 * @method removeGrouping
	 * @memberof DobyGrid
	 *
	 * @param	{string}	column		- Id of the column to remove group for
	 *
	 * @returns {object}
	 */
	this.removeGrouping = function (column) {
		if (!column) return;
		if (typeof column == 'object') column = column.id;

		var columnGrouping = hasGrouping(column);
		if (columnGrouping) {
			// Remove that grouping from the groups
			this.collection.groups.splice(this.collection.groups.indexOf(columnGrouping), 1);

			// Update grouping
			this.setGrouping(this.collection.groups);
		}
		return this;
	};


	/**
	 * Given a list of cell ranges, removes the ranges that are not allowed due to cells
	 * not being selectable
	 * @method removeInvalidRanges
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{array}		ranges		- List of Range objects
	 *
	 * @returns {array}
	 */
	removeInvalidRanges = function (ranges) {
		var result = [];
		for (var i = 0, l = ranges.length; i < l; i++) {
			var r = ranges[i];
			if (self.canCellBeSelected(r.fromRow, r.fromCell) && self.canCellBeSelected(r.toRow, r.toCell)) {
				result.push(r);
			}
		}

		return result;
	};


	/**
	 * Given a row index, removes that row from the cache
	 * @method removeRowFromCache
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	row		- Row index to remvoe
	 *
	 */
	removeRowFromCache = function (row) {
		var cacheEntry = cache.nodes[row], col;
		if (!cacheEntry) return;

		// Remove row from parent element
		cacheEntry.rowNode[0].parentElement.removeChild(cacheEntry.rowNode[0]);

		// Remove the row from the right viewport
		if (cacheEntry.rowNode[1]) {
			cacheEntry.rowNode[1].parentElement.removeChild(cacheEntry.rowNode[1]);
		}

		delete cache.nodes[row];

		var item = cache.rows[row];

		// Clear postprocessing cache
		if (item && cache.postprocess[item[self.options.idProperty]]) {
			for (var id in cache.postprocess[item[self.options.idProperty]]) {
				col = cache.activeColumns[cache.columnsById[id]];
				// Remove cache if it's non-cached column, or if the column has been hidden or removed
				if (!col || !col.cache) {
					delete cache.postprocess[item[self.options.idProperty]][id];
				}
			}
		}
	};


	/**
	 * Renders the viewport of the grid
	 * @method render
	 * @memberof DobyGrid
	 * @private
	 */
	render = function () {
		if (!initialized) return;

		var visible = getVisibleRange(),
			rendered = getRenderedRange();

		// Remove rows no longer in the viewport
		cleanupRows(rendered);

		// Add new rows & missing cells in existing rows
		// Handles horizontal scrolling and cell reveal
		if (lastRenderedScrollLeft != scrollLeft) {
			cleanUpAndRenderCells(rendered);
		}

		// If there is no vertical scroll and we're auto-sized. Remove the right column.
		if (self.$el) {
			if (!viewportHasVScroll && self.options.autoColumnWidth) {
				self.$el.addClass(CLS.noright);
			} else {
				self.$el.removeClass(CLS.noright);
			}
		}

		// Render missing rows
		renderRows(rendered);

		// Post process rows
		postProcessFromRow = visible.top;
		postProcessToRow = Math.min(getDataLength() - 1, visible.bottom);
		startPostProcessing();

		// Save scroll positions
		lastRenderedScrollTop = scrollTop;
		lastRenderedScrollLeft = scrollLeft;

		// Handle sticky group headers
		stickGroupHeaders(scrollTop);

		// If grid is empty - show empty overlay
		if (!self.fetcher && self.collection.length === 0) insertEmptyOverlay();
	};


	/**
	 * Generates the HTML content for a given cell and adds it to the output cache
	 * @method renderCell
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{array}		result			- Output array to which to append
	 * @param	{integer}	row				- Current row index
	 * @param	{integer}	cell			- Current cell index
	 * @param	{integer}	colspan			- Colspan of this cell
	 * @param	{object}	item			- Data object for this cell
	 *
	 */
	renderCell = function (result, row, cell, colspan, item) {
		var m = cache.activeColumns[cell],
			mColumns = item && item.columns || {},
			rowI = Math.min(cache.activeColumns.length - 1, cell + colspan - 1),

			// Group rows do not inherit column class
			value = item ? getDataItemValueForColumn(item, m) : null,
			mClass = item._groupRow ? "" : (m.class ? typeof m.class === "function" ? m.class.bind(self)(row, cell, value, m, item) : m.class : null),

			column = cache.activeColumns[cell],
			cellCss = [CLS.cell, "l" + cell, "r" + rowI];

		if (mClass) cellCss.push(mClass);
		if (self.active && row === self.active.row && cell === self.active.cell) cellCss.push("active");
		if (mColumns[column.id] && mColumns[column.id].class) {
			cellCss.push(mColumns[column.id].class);
		} else if (mColumns[cell] && mColumns[cell].class) {
			cellCss.push(mColumns[cell].class);
		}
		if (isCellSelected(row, cell)) cellCss.push(self.options.selectedClass);
		if (column.selectable === false) cellCss.push(CLS.cellunselectable);

		result.push('<div class="' + cellCss.join(" ") + '">');

		// If this is a cached, postprocessed row -- use the cache
		if (m.cache && m.postprocess && cache.postprocess[item[self.options.idProperty]] && cache.postprocess[item[self.options.idProperty]][column.id]) {
			result.push(cache.postprocess[item[self.options.idProperty]][column.id]);
		} else if (item) {
			// if there is a corresponding row (if not, this is the Add New row or
			// this data hasn't been loaded yet)
			try {
				result.push(getFormatter(item, m)(row, cell, value, m, item));
			} catch (e) {
				result.push('');
				if (console.error) console.error("Cell failed to render due to failed '" + column.id + "' column formatter. Error: " + e.message, e);
			}
		}

		result.push("</div>");

		if (cache.nodes[row]) {
			cache.nodes[row].cellRenderQueue.push(cell);
			cache.nodes[row].cellColSpans[cell] = colspan;
		}
	};


	/**
	 * Creates the column header elements.
	 * @method renderColumnHeaders
	 * @memberof DobyGrid
	 * @private
	 */
	renderColumnHeaders = function () {
		if (!self.options.showHeader) return;

		// Reset the headers
		$headers.each(function () {
			if (!$(this).is(':empty')) {
				$(this).empty();
				$(this).width(getHeadersWidth());
			}
		});

		// Render columns
		var column, html, classes, w, $headerTarget;
		for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
			html = [];
			column = cache.activeColumns[i];

			$headerTarget = (self.options.frozenColumns > -1) ? ((i <= self.options.frozenColumns) ? $headerL : $headerR) : $headerL;

			// Determine classes
			classes = [CLS.headercolumn, (column.headerClass || "")];
			if (column.sortable) classes.push(CLS.headersortable);

			// Determine width
			w = column.width - headerColumnWidthDiff;

			html.push('<div class="' + classes.join(' ') + '" style="width:' + w + 'px" ');
			html.push('id="' + (uid + column.id) + '"');

			// Tooltips
			if (column.tooltip !== undefined && column.tooltip !== null && self.options.tooltipType == 'title') {
				html.push(' title="' + column.tooltip + '"');
			}

			html.push('>');
			html.push('<span class="' + CLS.columnname + '">' + column.name + '</span>');

			if (column.sortable) {
				html.push('<span class="' + CLS.sortindicator + '"></span>');
			}

			html.push('</div>');

			$headerTarget.append(html.join(''));
		}

		// Style the column headers accordingly
		styleSortColumns();

		if (self.options.resizableColumns) setupColumnResize();
		if (self.options.reorderable) setupColumnReorder();
	};


	/**
	 * Function for recursively rendering menu components for a Dropdown menu
	 * @method renderMenu
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	menu			- A menu data object to render
	 * @param	{object}	$parent			- DOM object into which to insert the rendered HTML
	 *
	 */
	renderMenu = function (menu, $parent) {
		var $menu = $(['<div class="', CLS.dropdownmenu, '"></div>'].join('')),
			item,
			clickFn = function (event) {
				if (typeof this.fn === 'function') {
					this.fn.bind(self)(event);
				} else if (this.menu) {
					// If item has a menu - clicking should not close the dropdown
					event.stopPropagation();
				}
			};

		for (var i = 0, l = menu.length; i < l; i++) {
			item = menu[i];
			if (item.enabled !== undefined && !item.enabled) continue;
			if (item.title) {
				$menu.append([
					'<div class="', CLS.dropdowntitle, '">',
					(item.icon ? item.icon : ""),
					(item.name || ""),
					'</div>'
				].join(''));
			} else if (item.divider) {
				$menu.append(['<div class="', CLS.dropdowndivider, '"></div>'].join(''));
			} else {
				var label = (item.name || ""),
					cls = "";
				if (item.value !== undefined) {
					if (item.value) cls = " on";
					label += ['<span class="', CLS.dropdownicon, '"></span>'].join('');
				}

				var html = [
					'<div class="', CLS.dropdownitem, ' ', cls, '">',
					(item.icon ? item.icon : ""),
					label,
					'</div>'
				].join(''), $el = $(html).appendTo($menu);

				// Submenus
				if (item.menu) {
					$el.append(['<span class="', CLS.dropdownarrow, '"></span>'].join(''));
					renderMenu(item.menu, $el);
				}

				// Click function
				$el.click(clickFn.bind(item));
			}
		}
		$menu.appendTo($parent);
	};


	/**
	 * Generates the HTML content for a given cell and adds it to the output cache
	 * @method renderRow
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{array}		stringArrayL		- Output array to which to append (for left pane)
	 * @param	{array}		stringArrayR		- Output array to which to append (for right pane)
	 * @param	{integer}	row					- Current row index
	 * @param	{object}	range				- Viewport range to display
	 *
	 */
	renderRow = function (stringArrayL, stringArrayR, row, range) {
		var d = self.getRowFromIndex(row),
			rowCss = CLS.row +
				(self.active && row === self.active.row ? " active" : "") +
				(row % 2 === 1 ? " odd" : ""),
			top, pos = {};

		if (d === undefined) {
			throw new Error("Unable to render row at index " + row + " because no such row could be found.");
		}

		if (variableRowHeight) {
			pos = cache.rowPositions[row];
			top = (pos.top - offset);
		} else {
			top = (self.options.rowHeight * row) - offset + (row * 1) + ((row + 1) * self.options.rowSpacing);
		}

		if (d && d.class) rowCss += " " + (typeof d.class === 'function' ? d.class.bind(self)(row, d) : d.class);

		var rowHtml = ["<div class='", rowCss, "' style='top:", top, "px"];

		// In variable row height mode we need some fancy ways to determine height
		if (variableRowHeight && pos.height !== null && pos.height !== undefined) {
			var rowheight = pos.height - cellHeightDiff;
			rowHtml = rowHtml.concat(';height:', rowheight, 'px;line-height:', (rowheight + self.options.lineHeightOffset), 'px');
		}

		rowHtml.push("'>");

		stringArrayL.push.apply(stringArrayL, rowHtml);

		if (self.options.frozenColumns > -1) {
			stringArrayR.push.apply(stringArrayR, rowHtml);
		}

		var colspan, m, i, l;
		for (i = 0, l = cache.activeColumns.length; i < l; i++) {
			m = cache.activeColumns[i];

			colspan = 1;

			// Render custom columns
			if (d && d.columns) {
				var columnData = d.columns[m.id] || d.columns[i];
				colspan = (columnData && columnData.colspan) || 1;
				if (colspan === "*") {
					colspan = l - i;
				}
			}

			// Do not render cells outside of the viewport.
			if (cache.columnPosRight[Math.min(l - 1, i + colspan - 1)] > range.leftPx) {
				if (cache.columnPosLeft[i] > range.rightPx) {
					// All columns to the right are outside the range.
					break;
				}

				if ((self.options.frozenColumns > -1) && (i > self.options.frozenColumns)) {
					renderCell(stringArrayR, row, i, colspan, d);
				} else {
					renderCell(stringArrayL, row, i, colspan, d);
				}
			} else if ((self.options.frozenColumns > -1) && (i <= self.options.frozenColumns)) {
				renderCell(stringArrayL, row, i, colspan, d);
			}

			if (colspan > 1) {
				i += (colspan - 1);
			}
		}

		var endRowHtml = [];

		// Add row resizing handle
		if (self.options.resizableRows && d.resizable !== false) {
			endRowHtml.push('<div class="');
			endRowHtml.push(CLS.rowhandle);
			endRowHtml.push('"></div>');
		}

		endRowHtml.push("</div>");

		stringArrayL.push.apply(stringArrayL, endRowHtml);

		if (options.frozenColumns > -1) {
			stringArrayR.push.apply(stringArrayR, endRowHtml);
		}
	};


	/**
	 * Renders the rows of the grid
	 * @method renderRows
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	range		- Range of rows to render
	 *
	 */
	renderRows = function (range) {
		var stringArrayL = [],
			stringArrayR = [],
			rows = [],
			needToReselectCell = false,
			i, ii;

		for (i = range.top, ii = range.bottom; i <= ii; i++) {
			// Don't re-render cached nodes, unless they have cells which haven't been rendered yet
			if (cache.nodes[i]) continue;

			rows.push(i);

			// Create an entry right away so that renderRow() can
			// start populatating it.
			cache.nodes[i] = {
				rowNode: null,

				// ColSpans of rendered cells (by column idx).
				// Can also be used for checking whether a cell has been rendered.
				cellColSpans: [],

				// Cell nodes (by column idx). Lazy-populated by ensureCellNodesInRowsCache().
				cellNodesByColumnIdx: [],

				// Column indices of cell nodes that have been rendered, but not yet indexed in
				// cellNodesByColumnIdx. These are in the same order as cell nodes added at the
				// end of the row.
				cellRenderQueue: []
			};

			renderRow(stringArrayL, stringArrayR, i, range);

			if (self.active && self.active.node && self.active.row === i) {
				needToReselectCell = true;
			}
			counter_rows_rendered++;
		}

		if (!rows.length) return;

		var xLeft = document.createElement("div"),
			xRight = document.createElement("div");

		xLeft.innerHTML = stringArrayL.join("");
		xRight.innerHTML = stringArrayR.join("");

		// Cache the row nodes
		for (i = 0, ii = rows.length; i < ii; i++) {
			// If frozen rows are enabled
			if (hasFrozenRows && (rows[i] >= actualFrozenRow)) {
				if (self.options.frozenColumns > -1) {
					cache.nodes[rows[i]].rowNode = $()
						.add($(xLeft.firstChild).appendTo($canvas[2]))
						.add($(xRight.firstChild).appendTo($canvas[3]));
				} else {
					cache.nodes[rows[i]].rowNode = $()
						.add($(xLeft.firstChild).appendTo($canvas[2]));
				}
			// If frozen columns are enabled
			} else if (self.options.frozenColumns > -1) {
				cache.nodes[rows[i]].rowNode = $()
					.add($(xLeft.firstChild).appendTo($canvas[0]))
					.add($(xRight.firstChild).appendTo($canvas[1]));
			// No frozen rows or columns
			} else {
				cache.nodes[rows[i]].rowNode = $()
					.add($(xLeft.firstChild).appendTo($canvas[0]));
			}
		}

		if (needToReselectCell) {
			self.active.node = getCellNode(self.active.row, self.active.cell);
		}
	};


	/**
	 * Entry point for collection.reset(). See collection.reset for more info.
	 * @method reset
	 * @memberof DobyGrid
	 *
	 * @param	{array}		[models]		- List of models to reset to
	 *
	 * @returns {object}
	 */
	this.reset = function (models) {
		this.collection.reset(models, true);
		return this;
	};


	/**
	 * Reset the current active cell
	 * @method resetActiveCell
	 * @memberof DobyGrid
	 * @private
	 */
	resetActiveCell = function () {
		setActiveCellInternal(null, false);
	};


	/**
	 * Resets all aggregators
	 * @method resetAggregators
	 * @memberof DobyGrid
	 * @private
	 */
	resetAggregators = function () {
		// Reset aggregator values
		for (var column_id in cache.aggregatorsByColumnId) {
			for (var i in cache.aggregatorsByColumnId[column_id]) {
				cache.aggregatorsByColumnId[column_id][i]._processed = false;
				if (typeof(cache.aggregatorsByColumnId[column_id][i].reset) == 'function') {
					cache.aggregatorsByColumnId[column_id][i].reset();
				}
			}
		}
	};


	/**
	 * Force the resize and re-draw of the grid (for when coming out of an invisible element)
	 * @method resize
	 * @memberof DobyGrid
	 *
	 * @returns {object}
	 */
	this.resize = function () {
		// If grid is already destroyed - do nothing
		if (this.destroyed) return this;

		var oldHeight = viewportH;

		if (self.options.autoHeight) resizeContainer();

		// Resize the grid
		resizeCanvas();

		// If the grid has an overlay enabled - do not display data
		if ($overlay && $overlay.length) return this;

		invalidate();

		// If viewport got bigger and we're using remote data - fetch more items to populate the grid
		if (oldHeight < viewportH && this.fetcher) remoteFetch();

		return this;
	};


	/**
	 * Resizes the canvas based on the current viewport dimensions
	 * @method resizeCanvas
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{boolean}	rerender		- Re-render the grid when done?
	 *
	 */
	resizeCanvas = function (rerender) {
		if (!initialized) return;

		viewportH = getViewportHeight();
		viewportW = getViewportWidth();

		// Save the currently visible number of rows
		calculateVisibleRows();

		// Determine height of each pane
		// TODO: Temporary hack until work on frozen rows starts
		$panes.each(function (i) {
			if (!hasFrozenRows) {
				if (i > 1) {
					$(this).height(0);
				} else {
					$(this).css({bottom: 0});
					$viewport.eq(0).css({height: viewportH});
					$viewport.eq(1).css({height: viewportH});
				}
			}
		});

		updateRowCount();

		if (self.options.autoColumnWidth) autosizeColumns();

		// TODO: This was in SlickGrid, but it's probably there to catch active cells being
		// out of bounds after a resize. There's got to be a better way to catch that
		// instead of calling handleScroll() which is pretty slow
		//handleScroll();

		// Since the width has changed, force the render() to reevaluate virtually rendered cells.
		lastRenderedScrollLeft = -1;

		if (rerender) render();
	};


	/**
	 * Given a column's index and width delta, changes the width of the column
	 * @method resizeColumn
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	i		- The columns index
	 * @param	{integer}	d		- The delta by which to change the column width
	 */
	resizeColumn = function (i, d) {
		var actualMinWidth, headerContentWidth, x, j, c, l;
		var columnElements = $headers.children('.' + CLS.headercolumn);
		x = d;
		if (d < 0) { // shrink column
			for (j = i; j >= 0; j--) {
				c = cache.activeColumns[j];
				headerContentWidth = self.options.minColumnWidth === 'headerContent' ? c._headerWidth : 0;
				if (!c.resizable) continue;
				actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth, headerContentWidth);

				if (x && c.previousWidth + x < actualMinWidth) {
					x += c.previousWidth - actualMinWidth;
					c.width = actualMinWidth;
				} else {
					c.width = c.previousWidth + x;
					x = 0;
				}
			}

			if (self.options.autoColumnWidth) {
				x = -d;
				for (j = i + 1; j < columnElements.length; j++) {
					c = cache.activeColumns[j];
					if (!c.resizable) continue;
					if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
						x -= c.maxWidth - c.previousWidth;
						c.width = c.maxWidth;
					} else {
						c.width = c.previousWidth + x;
						x = 0;
					}
				}
			}
		} else { // stretch column
			for (j = i; j >= 0; j--) {
				c = cache.activeColumns[j];
				if (!c.resizable) continue;
				if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
					x -= c.maxWidth - c.previousWidth;
					c.width = c.maxWidth;
				} else {
					c.width = c.previousWidth + x;
					x = 0;
				}
			}

			if (self.options.autoColumnWidth) {
				x = -d;
				for (j = i + 1, l = columnElements.length; j < l; j++) {
					c = cache.activeColumns[j];
					if (!c.resizable) continue;
					actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
					if (x && c.previousWidth + x < actualMinWidth) {
						x += c.previousWidth - actualMinWidth;

						c.width = actualMinWidth;
					} else {
						c.width = c.previousWidth + x;
						x = 0;
					}
				}
			}
		}
	};


	/**
	 * Given a column, resizes the column according to its contents
	 * @method resizeColumnToContent
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	column		- The column to resize
	 * @param	{object}	event		- The event that caused the execution (if any)
	 * @param 	{boolean} 	useMaxWidth - Take the maximum width of the column into account
	 * @param 	{boolean} 	submit		- Submit column resize
	 * @param 	{boolean} 	silent 		- Don't trigger resize events
	 */
	resizeColumnToContent = function (column, event, useMaxWidth, submit, silent) {
		if (!column) return;
		var column_index = cache.columnsById[column.id],
			// Either use the width of the column's content or the min column width
			currentWidth = column.width,
			newWidth = Math.max(getColumnContentWidth(column_index), column.minWidth);

		if (useMaxWidth) newWidth = Math.min(newWidth, column.maxWidth);

		// Do nothing if width isn't changed
		if (currentWidth == newWidth) return;

		var pageX = event && event.pageX || cache.columnPosRight[column_index];

		lockColumnWidths(column_index);

		// Calculate resize diff
		var diff = newWidth - currentWidth;

		// Duplicate the drag functionality
		prepareLeeway(column_index, pageX);

		// This will ensure you can't resize beyond the maximum allowed width
		var delta = Math.min(maxPageX, Math.max(minPageX, pageX + diff)) - pageX;

		resizeColumn(column_index, delta);
		applyHeaderAndColumnWidths();
		(submit || typeof(submit) === "undefined" || submit === null) && submitColResize(silent);
	};


	/**
	 * Resizes all columns according to their contents
	 * @method resizeColumnsToContent
	 * @memberof DobyGrid
	 *
	 * @param 	{boolean} 	useMaxWidth 	- Take the maximum width of the columns into account
	 * @param 	{boolean} 	once 			- Submit the column resize only once for all columns
	 * @param 	{boolean} 	silent 			- Don't trigger resize events
	 */
	this.resizeColumnsToContent = function (useMaxWidth, once, silent) {
		for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
			var c = cache.activeColumns[i];
			resizeColumnToContent(c, null, useMaxWidth, !once, silent);
		}

		if (once) {
			submitColResize(silent);
		}

		return this;
	};


	/**
	 * Resizes the tables outer container to fit the total height of all visible rows
	 * (currently only used for options.autoHeight).
	 * @method resizeContainer
	 * @memberof DobyGrid
	 * @private
	 */
	resizeContainer = function () {
		var newHeight = getTotalHeight() + (self.options.showHeader ? $headerScroller.outerHeight() - getVBoxDelta($headerScroller) : 0) + 1;
		self.$el.height(newHeight);
	};


	/**
	 * Restores the state of grid's user customizations. Expect an object which was returned from
	 * `grid.getState()`.
	 * @method restoreState
	 * @memberof DobyGrid
	 *
	 * @param	{object}	state		- The state of the grid
	 *
	 * @returns {object}
	 */
	this.restoreState = function (state) {
		var resizeColumns = false, i, l;

		// Restore autoColumnWidth
		if (state.autoColumnWidth !== undefined && state.autoColumnWidth !== null) {
			this.options.autoColumnWidth = state.autoColumnWidth;
			resizeColumns = state.autoColumnWidth;
		}

		// Restore columns
		if (state.columns) {
			var stateColsById = {}, column;

			// Cache state columns by id
			for (i = 0, l = state.columns.length; i < l; i++) {
				column = state.columns[i];
				column.order_index = i;
				if (column.id) stateColsById[column.id] = column;
			}

			for (i = 0, l = this.options.columns.length; i < l; i++) {
				column = this.options.columns[i];
				column.visible = stateColsById[column.id] ? true : false;
				column.width = stateColsById[column.id] ? stateColsById[column.id].width : column.width;
			}

			// Re-order using order_index from state
			this.options.columns = _.sortBy(this.options.columns, function (col) {
				if (stateColsById[col.id]) return stateColsById[col.id].order_index;
				return state.columns.length + 1;
			});

			this.setColumns(this.options.columns);
		}

		// In order to jump from autoColumnWidth to non-autoColumnWidth - we need to resize
		if (resizeColumns && initialized) {
			setupColumnResize();
			autosizeColumns();
		}

		// Restore filters
		if (state.filters) this.filter(state.filters);

		// Restore grouping
		if (this.options.groupable && state.grouping) this.setGrouping(state.grouping);

		// Restore sorting
		if (state.sort) this.setSorting(state.sort);

		// Restore user-set row heights
		if (state.resizedRows) {
			// Convert list of row height objects to {id -> height} object for quick lookup
			var resizedRowMappings = state.resizedRows.reduce(function (mappings, item) {
				mappings[item.id] = item.height;
				return mappings;
			}, {});

			for (i = 0, l = cache.rows.length; i < l; i++) {
				var item = cache.rows[i];
				var id = item[this.options.idProperty];

				if (resizedRowMappings.hasOwnProperty(id)) {
					item.height = resizedRowMappings[id];
					item.resized = true;
				}
			}

			cacheRows();
			invalidate();
		}
		return this;
	};


	/**
	 * Scroll the viewport until the given cell position is visible
	 * @method scrollCellIntoView
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row				- Row index
	 * @param	{integer}	cell			- Cell index
	 * @param	{boolean}	doPaging		- If true, will ensure the cell appears at the top of the page
	 *
	 */
	scrollCellIntoView = function (row, cell, doPaging) {
		scrollRowIntoView(row, doPaging);

		var colspan = getColspan(row, cell);
		var left = cache.columnPosLeft[cell],
			right = cache.columnPosRight[cell + (colspan > 1 ? colspan - 1 : 0)],
			scrollRight = scrollLeft + viewportW;

		if (left < scrollLeft) {
			$viewport.scrollLeft(left);
			handleScroll();
			render();
		} else if (right > scrollRight) {
			$viewport.scrollLeft(Math.min(left, right - $viewport[0].clientWidth));
			handleScroll();
			render();
		}
	};


	/**
	 * Scrolls the length of a page
	 * @method scrollPage
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	dir			- Direction of scroll
	 *
	 */
	scrollPage = function (dir) {
		var deltaRows = dir * numVisibleRows,
			targetRow = getRowFromPosition(scrollTop) + deltaRows,
			targetY;

		targetRow = targetRow < 0 ? 0 : targetRow;

		if (variableRowHeight) {
			if (!cache.rowPositions[targetRow]) return;
			targetY = cache.rowPositions[targetRow].top;
		} else {
			// The extra +1 here is to compensate for the 1 pixel spacing between rows
			targetY = targetRow * (self.options.rowHeight + 1 + self.options.rowSpacing);
		}

		scrollTo(targetY);
		render();

		// Move the active cell into the right place if activeFollowsPage is enabled
		if (self.options.activeFollowsPage && self.active && self.active.row !== null) {
			var row = self.active.row + deltaRows,
				dataLength = getDataLength();
			if (row >= dataLength) {
				row = dataLength - 1;
			}
			if (row < 0) {
				row = 0;
			}

			var cell = 0,
				prevCell = null;
			var prevActivePosX = activePosX;
			while (cell <= activePosX) {
				if (canCellBeActive(row, cell)) {
					prevCell = cell;
				}
				cell += getColspan(row, cell);
			}

			if (prevCell !== null) {
				setActiveCellInternal(getCellNode(row, prevCell));
				activePosX = prevActivePosX;
			} else {
				resetActiveCell();
			}
		}
	};


	/**
	 * Scroll viewport until the given row is in view
	 * @method scrollRowIntoView
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row				- Index of row
	 * @param	{boolean}	doPaging		- If true, will ensure row is at top of page,
	 *										otherwise use direction of scroll to determine where
	 */
	scrollRowIntoView = function (row, doPaging) {

		// Determine where the row's page is
		var rowAtTop, rowAtBottom, pos,
			rowHeight = (self.options.rowHeight + 1),
			visible = getVisibleRange();

		// If row is already in view - do nothing
		if (visible.top < row && visible.bottom - 1 > row) return;

		if (variableRowHeight) {
			pos = cache.rowPositions[row];
			rowAtTop = pos.top;
			rowAtBottom = pos.bottom - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0);
		} else {
			rowAtTop = row * rowHeight;
			rowAtBottom = ((row + 1 + self.options.rowSpacing) * rowHeight) - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0);
		}

		// Determine which direction we need to scroll
		var pgdwn, pgup;
		if (!variableRowHeight) {
			pgdwn = row * (self.options.rowHeight + self.options.rowSpacing) > scrollTop + offset;
			pgup = row * (self.options.rowHeight + self.options.rowSpacing) < scrollTop + offset;
		} else {
			pgdwn = pos.bottom > scrollTop + viewportH + offset;
			pgup = pos.top < scrollTop + offset;
		}

		if (pgdwn) {
			// Need to page down?
			scrollTo(doPaging ? rowAtTop : rowAtBottom);
			render();
		} else if (pgup) {
			// or page up?
			scrollTo(doPaging ? rowAtBottom : rowAtTop);
			render();
		}
	};


	/**
	 * Scrolls the viewport to the given position
	 * @method scrollTo
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	y		- Position to scroll to
	 *
	 */
	scrollTo = function (y) {
		y = Math.max(y, 0);
		y = Math.min(y, th - viewportH + (viewportHasHScroll || self.options.frozenColumns > -1 ? window.scrollbarDimensions.height : 0));

		var oldOffset = offset;

		page = Math.min(n - 1, Math.floor(y / ph));
		offset = Math.round(page * cj);

		var newScrollTop = y - offset;

		// If we're in variable height mode, reset the number of visible rows here because when
		// rows are varied this number will change on every scroll
		if (variableRowHeight) calculateVisibleRows();

		if (offset != oldOffset) {
			var range = getVisibleRange(newScrollTop);
			cleanupRows(range);
		}

		if (prevScrollTop != newScrollTop) {
			var scrollTopDelta = Math.abs(newScrollTop - prevScrollTop);
			vScrollDir = (prevScrollTop + oldOffset < newScrollTop + offset) ? 1 : -1;
			lastRenderedScrollTop = (scrollTop = prevScrollTop = newScrollTop);

			// Scroll top-left viewport
			$viewport.eq(0)[0].scrollTop = newScrollTop;

			// If frozen columns are enabled, scroll the top-right viewport
			if (self.options.frozenColumns > -1) {
				$viewport.eq(1)[0].scrollTop = newScrollTop;
			}

			// If frozen rows are enabled, scroll the bottom-left viewport
			if (hasFrozenRows) {
				$viewport.eq(2)[0].scrollTop = newScrollTop;
			}

			self.trigger('viewportchanged', null, {
				scrollLeft: 0,
				scrollTop: scrollTop,
				scrollLeftDelta: 0,
				scrollTopDelta: scrollTopDelta
			});
		}
	};


	/**
	 * Scroll the viewport so the given row is at the top.
	 * @method scrollToRow
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	row		- Row index
	 *
	 */
	this.scrollToRow = function (row) {
		if (!variableRowHeight) {
			// The extra +1 here is to compensate for the spacing between rows
			scrollTo((row * (this.options.rowHeight + 1 + this.options.rowSpacing)) + this.options.rowSpacing);
		} else {
			var pos = cache.rowPositions[row];
			scrollTo(pos.top);
		}

		render();

		return this;
	};


	/**
	 * Select a range of cells
	 * @method selectCells
	 * @memberof DobyGrid
	 *
	 * @param	{integer}	startRow		- Row on which to start selection
	 * @param	{integer}	startCell		- Cell on which to start selection
	 * @param	{integer}	endRow			- Row on which to end selection
	 * @param	{integer}	endCell			- Cell on which to end selection
	 * @param	{boolean}	add				- If true, will add selection as a new range
	 *
	 * @returns {array}
	 */
	this.selectCells = function (startRow, startCell, endRow, endCell, add) {
		if (!this.options.selectable) return;

		// Validate params
		if (startRow === undefined && startCell === undefined && endRow === undefined && endCell === undefined) {
			// If no params given - deselect
			deselectCells();

			return;
		} else {
			var args = ['startRow', 'startCell', 'endRow', 'endCell'],
				cells = [startRow, startCell, endRow, endCell],
				param;

			for (var c = 0, cl = cells.length; c < cl; c++) {
				param = cells[c];
				if (param === undefined) {
					throw new Error('Unable to select cell range because "' + args[c] + '" param is missing.');
				}
			}
		}

		// Define a range
		var range = new CellRange({fromRow: startRow, fromCell: startCell, toRow: endRow, toCell: endCell}, this),
			ranges, i, l, j, k;

		// Remove unselectable rows from the range
		range.excludeUnselectable();

		// If range is fully excluded already -- don't bother continuing.
		if (range.fullyExcluded()) return;

		// Is this is a single cell range that falls within an existing selection range?
		if (range.isSingleCell() && this.selection) {
			for (i = 0, l = this.selection.length; i < l; i++) {
				// Part of a selected range -- we're done. Leave.
				if (this.selection[i].contains(startRow, startCell)) return;

				// Part of an excluded item -- remove from exclusion.
				if (this.selection[i].isExcludedCell(startRow, startCell)) {
					// Remove from exclusion
					var excl_index = this.selection[i].exclusions.indexOf([startRow, startCell]);
					this.selection[i].exclusions.splice(excl_index, 1);

					// Select cell
					var styls = {};
					styls[startRow] = {};
					styls[startRow][cache.activeColumns[startCell].id] = this.options.selectedClass;
					this.updateCellCssStylesOnRenderedRows(styls);
					return;
				}
			}
		}

		if (add) {
			if (!this.selection) this.selection = [];
			ranges = this.selection;
			ranges.push(range);
		} else {
			ranges = [range];
		}

		// Set new selection
		this.selection = ranges;

		// Select the new range
		var cellStyles = {};
		for (i = 0, l = this.selection.length; i < l; i++) {
			for (j = this.selection[i].fromRow; j <= this.selection[i].toRow; j++) {
				// Prevent duplicates
				if (!cellStyles[j]) cellStyles[j] = {};

				// Creates cellStyles object
				for (k = self.selection[i].fromCell; k <= this.selection[i].toCell; k++) {
					// Skip exclusions and non-selectable cells
					if (this.canCellBeSelected(j, k) && !this.selection[i].isExcludedCell(j, k)) {
						cellStyles[j][cache.activeColumns[k].id] = this.options.selectedClass;
					}
				}
			}
		}

		// Select cells
		this.updateCellCssStylesOnRenderedRows(cellStyles);

		this.trigger('selection', this._event, {
			selection: this.selection
		});
	};


	/**
	 * Select a range of rows
	 * @method selectRows
	 * @memberof DobyGrid
	 *
	 * @param	{integer}		fromRow			- Index of the first row to select
	 * @param	{integer}		toRow			- Index of the last row to select
	 * @param	{boolean}		add				- If true, will add selection as a new range
	 *
	 * @return {object}
	 */
	this.selectRows = function (fromRow, toRow, add) {
		// Select all rows in one batch, so it can be saved as a single selection range
		this.selectCells(fromRow, 0, toRow, cache.activeColumns.length - 1, add);

		// Go through all selected rows to add the selected css class
		for (var i = fromRow; i <= toRow; i++) {
			var rowNode = cache.nodes[i] ? cache.nodes[i].rowNode : null;
			if (rowNode) $(rowNode).addClass(this.options.selectedClass);
		}

		return this;
	};


	/**
	 * Internal method for setting the active cell that bypasses any option restrictions
	 * @method setActiveCellInternal
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{DOMObject}		newCell		- Cell node to set as the active cell
	 * @param	{boolean}		setEdit		- If true, will force cell to editable immediately
	 *
	 */
	setActiveCellInternal = function (newCell, setEdit) {
		if (self.active && self.active.node !== null) {
			makeActiveCellNormal();
			$(self.active.node).removeClass("active");
			if (cache.nodes[self.active.row]) {
				$(cache.nodes[self.active.row].rowNode).removeClass("active");
			}
		}

		// Create new active object
		if (!self.active) {
			self.active = {
				cell: null,
				node: null,
				row: null
			};
		}

		var activeCellChanged = self.active.node !== newCell;

		if (newCell !== null) {
			self.active.node = newCell;
			self.active.row = getRowFromNode(self.active.node.parentNode);
			self.active.cell = activePosX = getCellFromNode(self.active.node);

			// If 'setEdit' is not defined, determine if cell is in autoEdit
			if (setEdit === null || setEdit === undefined) {
				setEdit = (self.active.row == getDataLength()) || self.options.autoEdit;
			}

			$(self.active.node).addClass("active");
			$(cache.nodes[self.active.row].rowNode).addClass("active");

			// Make active cell editable
			if (self.options.editable && setEdit && isCellPotentiallyEditable(self.active.row, self.active.cell)) {
				clearTimeout(h_editorLoader);

				if (self.options.asyncEditorLoading) {
					h_editorLoader = setTimeout(function () {
						makeActiveCellEditable();
					}, self.options.asyncEditorLoadDelay);
				} else {
					makeActiveCellEditable();
				}
			}
		} else {
			self.active.row = self.active.cell = null;
		}

		if (activeCellChanged) {
			var eventdata = getActiveCell();
			eventdata.item = self.getRowFromIndex(eventdata.row);
			self.trigger('activecellchange', self._event, eventdata);
		}
	};


	/**
	 * Given a new column definitions object -- updates the grid to use it
	 * @method setColumns
	 * @memberof DobyGrid
	 *
	 * @param	{object}	columns		- Column definitions object
	 *
	 */
	this.setColumns = function (columns) {
		// Copy array
		var oldAggregators = {};
		var oldColumns = this.options.columns.map(function (c) {
			oldAggregators[c.id] = c.aggregators;
			return _.clone(c);
		});

		this.options.columns = enforceWidthLimits(columns);

		validateColumns();
		updateColumnCaches();

		// Clean up sorting for columns that no longer exist
		this.setSorting(_.filter(this.sorting, function (s) {
			return cache.columnsById[s.columnId];
		}));

		this.trigger('columnchange', this._event, {
			columns: columns,
			oldColumns: oldColumns
		});

		this.trigger('statechange', this._event);

		if (initialized) {
			invalidateAllRows();
			renderColumnHeaders();
			removeCssRules();
			createCssRules();
			resizeCanvas(true);
			applyColumnWidths();
			handleScroll();
			self.options.minColumnWidth === "headerContent" && fitColumnsToHeader(true);

			// If aggregators have changed - we will need to refresh to re-draw the
			// aggregator rows.
			var oldAggregatorExists, newActiveAggregator;
			for (var i = 0, l = columns.length; i < l; i++) {
				oldAggregatorExists = oldAggregators[columns[i].id] && oldAggregators[columns[i].id].aggregators;
				newActiveAggregator = _.findWhere((columns[i].aggregators || []), {active: true});

				// Refresh if
				if (
					// There is at least one active aggregator in the new column definitions
					newActiveAggregator && (
						// Aggregators have changed between old and new definitions
						(columns[i].aggregators && columns[i].aggregators.length && !oldAggregatorExists) ||
						(!columns[i].aggregators && oldAggregatorExists)
					)
				) {
					this.collection.refresh();
					break;
				}
			}
		}
	};


	/**
	 * Validates and sets up options for frozen columns and rows
	 * @method setFrozenOptions
	 * @memberof DobyGrid
	 * @private
	 */
	setFrozenOptions = function () {
		// Validate frozenColumns value
		self.options.frozenColumns = (self.options.frozenColumns >= 0 && self.options.frozenColumns < self.options.columns.length) ? parseInt(self.options.frozenColumns) : -1;

		// Validate frozenRow value
		self.options.frozenRows = (self.options.frozenRows >= 0 && self.options.frozenRows < numVisibleRows) ? parseInt(self.options.frozenRows) : -1;

		if (self.options.frozenRows > -1) {
			hasFrozenRows = true;
			frozenRowsHeight = (self.options.frozenRows) * self.options.rowHeight;

			// TODO: This will not work with variableRowHeights
			var dataLength = getDataLength() || this.data.length;

			actualFrozenRow = (self.options.frozenBottom) ? (dataLength - self.options.frozenRows) : self.options.frozenRows;
		} else {
			hasFrozenRows = false;
		}
	};


	/**
	 * Sets the grouping for the grid data view.
	 * @method setGrouping
	 * @memberof DobyGrid
	 *
	 * @param	{array}		options		- List of grouping objects
	 *
	 * @returns {object}
	 */
	this.setGrouping = function (options) {
		this.collection.setGrouping(options);
		return this;
	};


	/**
	 * Entry point for collection.setItem(). See collection.setItem for more info.
	 * @method setItem
	 * @memberof DobyGrid
	 *
	 * @returns {object}
	 */
	this.setItem = function (item_id, attributes) {
		this.collection.setItem(item_id, attributes);
		return this;
	};


	/**
	 * Given a set of options, updates the grid accordingly
	 * @method setOptions
	 * @memberof DobyGrid
	 *
	 * @param	{object}	options			- New options object data
	 *
	 */
	this.setOptions = function (options) {
		makeActiveCellNormal();

		// If toggling "addRow"
		if (options.addRow !== undefined && self.options.addRow !== options.addRow) {
			// Insert if enabling
			if (options.addRow) {
				insertAddRow();
			// Remove if disabling
			} else {
				this.remove('-add-row-');
			}
		}

		// If toggling minColumnWidth options, need to refit column minwidths
		if (options.minColumnWidth && options.minColumnWidth === "headerContent" && self.options.minColumnWidth !== options.minColumnWidth) {
			fitColumnsToHeader();
		}

		// If changing row height, need to recalculate positions
		var recalc_heights = options.rowHeight != self.options.rowHeight;

		$.extend(true, self.options, options);
		validateOptions();

		// Toggling autoHeight needs to DOM manipulation
		if (options.autoHeight) {
			$viewport.addClass(CLS.autoheight);
		} else {
			this.$el.removeAttr('style');
			$viewport.removeClass(CLS.autoheight);
		}

		// If setting new columns - it will auto-re-render, so no need to manually call render
		if (options.columns) {
			this.setColumns(options.columns);
		} else if (!recalc_heights) {
			render();
		}

		setFrozenOptions();
		setScroller();

		if (recalc_heights) {
			invalidateAllRows();
			removeCssRules();
			createCssRules();
			cacheRows();
			resizeCanvas(true);
			applyColumnWidths();
		}

		// If setting new data - this needs to be executed after column changes to ensure
		// additions to aggregators are picked up. Don't do this if columns have changed
		// because setColumns above will perform it's own reset for aggregators if needed.
		if (options.data && !options.columns) {
			this.reset(options.data);
		}

		// Toggling autoHeight requires a resize
		if (options.autoHeight !== undefined && options.autoHeight !== null) {
			this.resize();
		}

		// If toggling auto column width - resize
		if ('autoColumnWidth' in options) {
			// Also make sure that the right resize handles are drawn
			setupColumnResize();
			autosizeColumns();

			// Fire column resize event
			self.trigger('columnresize', this._event, {});
		}

		self.trigger('statechange', this._event, {});
	};


	/**
	 * Sets the height of a given row
	 * @method setRowHeight
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Row index
	 * @param	{integer}	height		- Height to set
	 *
	 */
	setRowHeight = function (row, height) {
		var item = cache.rows[row];

		// Change item height in the data
		item.height = height;
		item.resized = true;

		// Make sure rows below get re-evaluated
		invalidateRows(_.range(row, cache.rows.length));

		if (item._groupRow) {
			// For groups we need to update the grouping options since the group rows
			// will get regenerated, losing their custom height params during re-draws
			item.predef.height = height;

			invalidateRows(_.range(row, cache.rows.length));

			// Re-cache and re-draw
			cacheRows(row);
			render();
		} else {
			// Update the item which will cause the grid to re-render the right bits
			// TODO: This is hacky. There should be a collection.set() method to
			// extend existing data instead of replacing the whole object
			self.collection.setItem(item[self.options.idProperty], item);
		}

		// This will recalculate scroll heights to ensure scrolling is properly handled.
		updateRowCount();
	};


	/**
	 * When frozen columns are used it's not immediately obvious which viewport
	 * controls the scrolling events. This methods sets that up accordingly.
	 * @method setScroller
	 * @memberof DobyGrid
	 * @private
	 *
	 */
	setScroller = function () {
		// When frozen columns are enabled
		if (self.options.frozenColumns > -1) {

			// If frozen rows are enabled too
			if (hasFrozenRows) {
				if (self.options.frozenBottom) {
					$viewportScrollContainerX = $viewport.eq(3);
					$viewportScrollContainerY = $viewport.eq(1);
				} else {
					$viewportScrollContainerX = $viewportScrollContainerY = $viewport.eq(3);
				}
			} else {
				$viewportScrollContainerX = $viewportScrollContainerY = $viewport.eq(1);
			}
		} else {
			if (hasFrozenRows) {
				if (self.options.frozenBottom) {
					$viewportScrollContainerX = $viewport.eq(2);
					$viewportScrollContainerY = $viewport.eq(0);
				} else {
					$viewportScrollContainerX = $viewportScrollContainerY = $viewport.eq(2);
				}
			} else {
				$viewportScrollContainerX = $viewportScrollContainerY = $viewport.eq(0);
			}
		}
	};


	/**
	 * Sets the sorting for the grid data view
	 * @method setSorting
	 * @memberof DobyGrid
	 *
	 * @param	{array}		options		- List of column options to use for sorting
	 *
	 * @returns {object}
	 */
	this.setSorting = function (options) {
		if (!$.isArray(options)) {
			throw new Error('Doby Grid cannot set the sorting because the "options" parameter must be an array of objects.');
		}

		var old_sorting = JSON.parse(JSON.stringify(this.sorting)), i, l;

		if (!this.options.multiColumnSort && options.length > 1) {
			throw new Error('Doby Grid cannot set the sorting given because "multiColumnSort" is disabled and the given sorting options contain multiple columns.');
		}

		// Make sure all selected columns are sortable, and make sure
		// every column has a sort direction set
		var colDef;
		for (i = 0, l = options.length; i < l; i++) {
			colDef = getColumnById(options[i].columnId);
			if (!colDef) {
				throw new Error([
					'Doby Grid cannot sort by "', options[i].columnId,
					'" because that column does not exist.'
				].join(''));
			}
			if (colDef.sortable === false) {
				throw new Error([
					'Doby Grid cannot sort by "', colDef.id,
					'" because that column is not sortable.'
				].join(''));
			}
			if (options[i].sortAsc === null || options[i].sortAsc === undefined) {
				options[i].sortAsc = colDef.sortAsc !== null || colDef.sortAsc !== undefined ? colDef.sortAsc : true;
			}
		}

		// Updating the sorting dictionary. Groups are always sorted first.
		this.sorting = mergeGroupSorting(options);

		// Update the sorting data
		styleSortColumns();

		// Check to see if the sorting has actually changed
		var changed = old_sorting.length != this.sorting.length;
		if (!changed) {
			for (i = 0, l = old_sorting.length; i < l; i++) {
				if (old_sorting[i].columnId != this.sorting[i].columnId	|| old_sorting[i].sortAsc != this.sorting[i].sortAsc) {
					changed = true;
					break;
				}
			}
		}

		if (changed) {
			resetAggregators();

			// Re-process column args into something the execute sorter can understand
			var args = {
				multiColumnSort: this.sorting.length > 1,
				sortCols: []
			}, col;

			for (i = 0, l = this.sorting.length; i < l; i++) {
				col = this.sorting[i];
				colDef = getColumnById(col.columnId);
				args.sortCols.push({
					sortCol: colDef,
					sortAsc: col.sortAsc
				});
			}

			// Manually execute the sorter that will actually re-draw the table
			executeSorter(args);

			// Fire event
			self.trigger('sort', this._event, {
				sort: args
			});

			self.trigger('statechange', this._event);

			// when sorting changed, make sure to recalculate min header with if applicable
			self.options.minColumnWidth === "headerContent" && fitColumnsToHeader();
		}

		return this;
	};


	/**
	 * Allows columns to be re-orderable.
	 * @method setupColumnReorder
	 * @memberof DobyGrid
	 * @private
	 */
	setupColumnReorder = function () {
		if (!self.options.showHeader) return;
		if ($headers.filter(":ui-sortable").length) return;
		$headers.sortable({
			axis: "x",
			containment: "parent",
			cursor: "default",
			distance: 3,
			helper: "clone",
			placeholder: CLS.placeholder + " " + CLS.headercolumn,
			tolerance: "intersection",
			start: function (e, ui) {
				ui.placeholder.width(ui.helper.outerWidth() - headerColumnWidthDiff);
				$(ui.helper).addClass(CLS.headercolumnactive);
			},
			beforeStop: function (e, ui) {
				$(ui.helper).removeClass(CLS.headercolumnactive);
			},
			update: function (e, ui) {
				e.stopPropagation();

				// http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
				var arrayMove = function (arr, old_index, new_index) {
					if (new_index >= arr.length) {
						var k = new_index - arr.length;
						while ((k--) + 1) {
							this.push(undefined);
						}
					}
					arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
				};

				// Get the id of the column that was moved
				var column_order = _.pluck(self.options.columns, 'id'),
					column_id = $(ui.item).attr('id').replace(uid, ""),
					column_index = column_order.indexOf(column_id),

				// Get the id of the column immediately to the left;
					$prev_column = $(ui.item).prev(),

				// Clone the columns so that the 'columnchange' event correctly reports back the old columns
					columns_copy = self.options.columns.map(function (c) {
						return _.clone(c);
					});

				// If no prev column found, assume we're moving to start of grid
				if (!$prev_column.length) {
					// Move column to first position
					arrayMove(columns_copy, column_index, 0);
				} else {
					var prev_column_id = $prev_column.attr('id').replace(uid, ""),

						// Find index of prev column in options
						prev_column_index = column_order.indexOf(prev_column_id);

					// Move column immediately after the previous
					if (column_index > prev_column_index) {
						arrayMove(columns_copy, column_index, prev_column_index + 1);
					} else {
						arrayMove(columns_copy, column_index, prev_column_index);
					}
				}

				self.setColumns(columns_copy);
				setupColumnResize();

				self.trigger('columnreorder', e, {
					columns: self.options.columns
				});
			}
		});
	};


	/**
	 * Enables the resizing of columns.
	 * @method setupColumnResize
	 * @memberof DobyGrid
	 * @private
	 *
	 * @desc
	 * NOTE: This can be optimized
	 * NOTE: Perhaps assign the handle events on the whole header instead of on each element
	 *
	 */
	setupColumnResize = function () {
		if (!self.options.showHeader) return;

		// If resizable columns are disabled -- return
		if (!self.options.resizableColumns) return;

		var pageX, columnElements, firstResizable, lastResizable;

		columnElements = $headers.children("." + CLS.headercolumn);
		var $handle = columnElements.find("." + CLS.handle);
		if ($handle && $handle.length) removeElement($handle[0]);

		columnElements.each(function (i) {
			if (!cache.activeColumns[i].resizable) return;
			if (firstResizable === undefined) firstResizable = i;
			lastResizable = i;
		});

		// No resizable columns found
		if (firstResizable === undefined) return;

		// Assign double-click to auto-resize event
		// This is done once for the whole header because event assignments are expensive
		$headers.on("dblclick", function (event) {
			// Make sure we're clicking on a handle
			if (!$(event.target).closest('.' + CLS.handle).length) return;

			var column = getColumnFromEvent(event);

			resizeColumnToContent(column, event);
		});

		// Create drag handles
		// This has to be done for each drag handle to not conflict with drag reordering
		$.each(columnElements, function (i, columnEl) {
			if (
				i < firstResizable ||
				(self.options.autoColumnWidth && i >= lastResizable) ||
				cache.activeColumns[i].resizable === false
			) return;

			$('<div class="' + CLS.handle + '"><span></span></div>')
				.appendTo(columnEl)
				.on('dragstart', function (event) {
					pageX = event.pageX;
					$(this).parent().addClass(CLS.headercolumndrag);

					// Lock each column's width option to current width
					lockColumnWidths(i);

					// Ensures the leeway has another room to move around
					prepareLeeway(i, pageX);
				})
				.on('drag', function (event) {
					var delta = Math.min(maxPageX, Math.max(minPageX, event.pageX)) - pageX;

					// Sets the new column widths
					resizeColumn(i, delta);

					// Save changes
					applyHeaderAndColumnWidths();
				})
				.on('dragend', function () {

					// This timeout is a hacky solution to prevent the 'click' event for
					// column sorting from firing when resizing the handle on top of the
					// header cell. FIXME: There's got to be a better way!
					setTimeout(function () {
						$(this).parent().removeClass(CLS.headercolumndrag);
					}.bind(this), 1);

					submitColResize();

					// If sticky groups headers are enabled, we need to redraw them as the
					// rendered row is no longer correct
					stickGroupHeaders(scrollTop);
				});
		});
	};


	/**
	 * Allows columns to be sortable via click.
	 * @method setupColumnSort
	 * @memberof DobyGrid
	 * @private
	 */
	setupColumnSort = function () {
		if (!self.options.showHeader) return;

		$headers.click(function (e) {
			self._event = e;

			// If clicking on drag handle - stop
			var preventClick = $(e.target).closest("." + CLS.handle).length || $(e.target).hasClass(CLS.headercolumndrag);
			if (preventClick) return;

			var column = getColumnFromEvent(e);
			if (!column || !column.sortable) return;

			var sortOpts = null;
			for (var i = 0, l = self.sorting.length; i < l; i++) {
				if (self.sorting[i].columnId == column.id && !self.sorting[i].group) {
					sortOpts = JSON.parse(JSON.stringify(self.sorting[i]));
					sortOpts.sortAsc = !sortOpts.sortAsc;
					break;
				}
			}

			var sorting = [];
			// On Shift+Click adjust multi column sort
			if (e.shiftKey && self.options.multiColumnSort) {

				// If that column is already being sorted by, remove it
				if (sortOpts) {
					sorting = JSON.parse(JSON.stringify(self.sorting));
					sorting.splice(i, 1);
				} else {
					sorting = JSON.parse(JSON.stringify(self.sorting));
					sorting.push({
						columnId: column.id,
						sortAsc: column.sortAsc
					});
				}
			} else {
				if (sortOpts) {
					// If we're in multi-sort mode, do not reset sorted columns
					// just flip the direction instead.
					if (self.options.multiColumnSort) {
						sorting = JSON.parse(JSON.stringify(self.sorting));
						sorting[i].sortAsc = !sorting[i].sortAsc;
					} else {
						sorting = [sortOpts];
					}
				} else {
					sorting = [{
						columnId: column.id,
						sortAsc: column.sortAsc
					}];
				}
			}

			self.setSorting(sorting);

			self._event = null;
		});
	};


	/**
	 * Displays an overlay container with custom HTML message which covers the entire grid canvas.
	 * @method showOverlay
	 * @memberof DobyGrid
	 *
	 * @param	{object}	[options]			- Options object for this method
	 * @param	{string}	[options.class]		- Custom CSS class to use for the overlay
	 * @param	{string}	[options.html]		- Custom HTML to insert into the overlay
	 */
	this.showOverlay = function (options) {
		options = options || {};

		// First, clear the viewport
		invalidateAllRows();

		// Scroll all the way up and remove scrollbars
		if ($canvas) {
			h = null;			// Resets the current canvas height cache
			canvasWidth = null;	// Resets the current canvas width cache

			$canvas.height('100%').width('100%');
			scrollTo(0);
		}

		// Create an overlay
		if ($overlay && $overlay.length) removeElement($overlay[0]);
		$overlay = $([
			'<div class="doby-grid-overlay',
			(options.class ? ' ' + options.class : ''),
			'">', (options.html || ""), '</div>'
		].join('')).appendTo($canvas);

		return this;
	};


	/**
	 * Slide out a quick search header bar
	 * @method showQuickFilter
	 * @memberof DobyGrid
	 *
	 * @param	{?string}	[column_id]		- ID of the column we want to focus. Passing in null
	 *										will toggle the quick filter.
	 *
	 * NOTE: Many optimizations can be done here.
	 *
	 */
	this.showQuickFilter = function (column_id) {
		if (!self.options.showHeader || !self.options.quickFilter) return;

		var handleResize = function () {
			// Update viewport
			viewportH = getViewportHeight();
			$viewport.height(viewportH);

			// Resize Canvas to fix the new viewport
			resizeCanvas(true);
		};

		// Toggle off
		if ((column_id === undefined || column_id === null) && $headerFilter) {
			$headerFilter.each(function () {
				removeElement(this);
			});
			$headerFilter = undefined;

			handleResize();

			// Re-focus on the canvas
			$canvas.eq(0).focus();
			return;
		}

		// This is called when user types into any of the input boxes.
		// It's on a 150ms timeout so that fast typing doesn't search really large grid immediately
		var keyTimer;
		var onKeyUp = function (event) {
			// Esc closes the quick filter
			if (event.keyCode == 27) {
				self.showQuickFilter();
				return;
			}

			var value = $(this).val();

			// Empty strings are treated as 'null'
			if (value === '') value = null;

			// Check if filter value has actually changed
			if ($(this).data('old_value') == value) return;

			// Remember this value
			$(this).data('old_value', value);

			if (keyTimer) clearTimeout(keyTimer);
			keyTimer = setTimeout(function () {
				// Build a filter set
				var filterset = [], c, i_value;
				for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
					c = cache.activeColumns[i];
					if (c.quickFilterInput) {
						i_value = c.quickFilterInput.val();
						if (i_value.length) filterset.push([c.id, '~*', i_value]);
					}
				}

				// Submit filter
				self.filter(filterset);
			}, 150);
		};

		// Get column object for the focused column
		var focusedColumn = cache.columnsById[column_id];

		// Draw new filter bar
		if (!$headerFilter) {
			$headerFilter = $();
			$headerFilterL = $('<div class="' + CLS.headerfilter + '"></div>').appendTo($headerScrollerL);
			$headerFilterR = $('<div class="' + CLS.headerfilter + '"></div>').appendTo($headerScrollerR);
			$headerFilter = $headerFilter.add($headerFilterL);
			$headerFilter = $headerFilter.add($headerFilterR);

			// Create a cell for each column
			var column, cell, html;
			for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
				column = cache.activeColumns[i];

				// Create cell
				html = ['<div class="'];
				html.push(CLS.headerfiltercell);
				if (!column.filterable) html.push(' ' + CLS.headerfilterdisabled);
				html.push('">');
				html.push('</div>');
				cell = $(html.join(''));

				if (i <= self.options.frozenColumns || self.options.frozenColumns < 0) {
					cell.appendTo($headerFilterL);
				} else {
					cell.appendTo($headerFilterR);
				}

				// Skip non-filterable columns
				if (!column.filterable) continue;

				// Check if there is already a quick filter value for this column
				var filterValue = null;
				if (self.collection.filterset) {
					for (var j = 0, m = self.collection.filterset.length; j < m; j++) {
						if (self.collection.filterset[j][0] == column.id) {
							filterValue = self.collection.filterset[j][2];
							break;
						}
					}
				}

				// Create input as a reference in the column definition
				column.quickFilterInput = $('<input class="' + CLS.editor + '" type="text"/>')
					.appendTo(cell)
					.data('column_id', column.id)
					.attr('placeholder', getLocale('column.add_quick_filter'))
					.val(filterValue)
					.on('keyup', onKeyUp);

				// Focus input
				if (column_id == column.id) {
					column.quickFilterInput.select().focus();
				}
			}
		} else if (focusedColumn && focusedColumn.quickFilterInput) {
			// Just focus
			focusedColumn.quickFilterInput.select().focus();
		}

		// Set column widths
		applyColumnHeaderWidths();

		handleResize();

		return this;
	};


	/**
	 * Sort the grid by a given column id
	 * @method sortBy
	 * @memberof DobyGrid
	 *
	 * @param	{string}	column_id		- Id of the column by which to sort
	 * @param	{boolean}	ascending		- Is the sort direction ascending?
	 *
	 * @returns {object}
	 */
	this.sortBy = function (column_id, ascending) {
		if (!column_id)	throw new Error('Grid cannot sort by blank value. Column Id must be specified.');
		return this.setSorting([{
			columnId: column_id,
			sortAsc: ascending
		}]);
	};


	/**
	 * Runs the async post render postprocessing on the grid cells
	 * @method startPostProcessing
	 * @memberof DobyGrid
	 * @private
	 */
	startPostProcessing = function () {
		if (!enableAsyncPostRender) return;
		clearTimeout(h_postrender);
		h_postrender = setTimeout(asyncPostProcessRows, self.options.asyncPostRenderDelay);
	};


	/**
	 * Ensures that sticky header groups stick to the top of the viewport.
	 * @method stickGroupHeaders
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	scrollTop		- Current scroll position
	 */
	stickGroupHeaders = function (scrollTop) {
		// Confirm that sticky headers are actually needed
		if (!self.options.stickyGroupRows || !self.isGrouped()) return;

		// Create a stickyGroup cache if it doesn't already exist
		if (!cache.stickyGroups) cache.stickyGroups = [];

		// Find top-most group
		var topRow = getRowFromPosition(scrollTop),
			topGroup = getGroupFromRow(topRow),
			stickyGroups = [topGroup];

		// Group could not be found for some reason. Perhaps because
		// the grid hasn't finished rendering (like during a resize event)
		if (!topGroup) return;

		var buildParentGroups = function (group) {
			if (group.parentGroup) {
				stickyGroups.push(group.parentGroup);
				buildParentGroups(group.parentGroup);
			}
		};

		// Build an array of nested groups to display
		buildParentGroups(topGroup);

		// Check to see if the sticky groups have changed since last render
		var haveStickyGroupsChanged = false;
		for (var s = 0, sl = stickyGroups.length; s < sl; s++) {
			if (!cache.stickyGroups[s] || stickyGroups[s].id !== cache.stickyGroups[s].id) {
				haveStickyGroupsChanged = true;
				break;
			}
		}

		var i = stickyGroups.length,
			group,
			offset = $viewport.eq(0).position().top,
			isFirstGroupCollapsed = i && stickyGroups[0].collapsed ? true : false,
			isFirstGroupEmptyNull = i && stickyGroups[0].value === null && !stickyGroups[0].predef.groupNulls;

		// Reset currently rendered groups
		if (scrollTop === 0 || isFirstGroupCollapsed || isFirstGroupEmptyNull || haveStickyGroupsChanged) {
			cache.stickyRows = [];
			$panes.children('.' + CLS.sticky).remove();
		}

		// If we're at the top - don't draw any sticky groups
		if (scrollTop === 0) return;

		// Cache sticky groups
		cache.stickyGroups = stickyGroups;

		while (i--) {
			group = stickyGroups[i];

			// Only go on if the group is expanded and sticky is enabled
			if (group.collapsed === 0 && group.sticky) {

				stickyIds.push(group[self.options.idProperty]);

				// Check if row is already cached and rendered
				var $cached = cache.stickyRows[i], $clone;

				if ($cached && $cached.length && $cached.attr('rel') == group[self.options.idProperty]) {
					$clone = $cached;
				} else {
					var child = '.' + CLS.sticky + '[rel="' + group[self.options.idProperty] + '"]:first';

					$clone = $panes.children(child);

					if ($clone.length) $clone.remove();

					var stickyIndex = cache.indexById[group[self.options.idProperty]],
						cacheNode = cache.nodes[stickyIndex];

					// If no id found (ie. null group with null groups disabled)
					if (stickyIndex === undefined) continue;

					// Create group row if it doesn't already exist,
					// (due to being outside the viewport)
					if (!cacheNode) {
						var leftrowhtml = [],
							rightrowhtml = [];

						renderRow(leftrowhtml, rightrowhtml, stickyIndex, {
							bottom: stickyIndex,
							leftPx: 0,
							top: stickyIndex,
							rightPx: self.$el.width()
						});

						$clone = $();
						$clone = $clone.add($(leftrowhtml.join('')));
						$clone = $clone.add($(rightrowhtml.join('')));
					} else {
						var $groupHeaderNode = $(cacheNode.rowNode);
						$clone = $groupHeaderNode.clone();
					}

					$clone
						.addClass(CLS.sticky)
						.attr('rel', group[self.options.idProperty])
						.removeClass(CLS.grouptoggle);

					// Inject left-pane sticky
					$clone.eq(0)
						.width($canvas.eq(0).css('width'))
						.appendTo($panes.eq(0));

					// Inject right-pane sticky (for frozen columns)
					if ($clone.length > 1) {
						$clone.eq(1)
							.width($canvas.eq(1).css('width'))
							.appendTo($panes.eq(1));
					}

					// Cache row
					cache.stickyRows[i] = $clone;
				}

				// Stick a clone to the wrapper
				$clone.css('top', offset);

				offset += $clone.outerHeight();
			}
		}
	};


	/**
	 * Styles the column headers according to the current sorting data
	 * @method styleSortColumns
	 * @memberof DobyGrid
	 * @private
	 */
	styleSortColumns = function () {
		if (!self.options.showHeader) return;

		var headerColumnEls = $headers.children();
		headerColumnEls
			.removeClass(CLS.headercolumnsorted)
			.find("." + CLS.sortindicator)
			.removeClass(CLS.sortindicatorasc + " " + CLS.sortindicatordesc);

		$.each(self.sorting, function (i, col) {
			if (col.sortAsc === null) {
				col.sortAsc = true;
			}
			var columnIndex = cache.columnsById[col.columnId];
			if (columnIndex !== null && !col.group) {
				headerColumnEls.eq(columnIndex)
					.addClass(CLS.headercolumnsorted)
					.find("." + CLS.sortindicator)
					.addClass(col.sortAsc ? CLS.sortindicatorasc : CLS.sortindicatordesc);
			}
		});
	};

	/**
	 * Submits the column resize states and calls associated events
	 * @method submitColResize
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{boolean}	silent	- Submit column resize states but don't trigger associated events
	 */
	submitColResize = function (silent) {
		var newWidth, j, c;
		var columnElements = $headers.children('.' + CLS.headercolumn);
		for (j = 0; j < columnElements.length; j++) {
			c = cache.activeColumns[j];
			newWidth = $(columnElements[j]).outerWidth();

			if (c.previousWidth !== newWidth && c.rerenderOnResize) {
				invalidateAllRows();
			}
		}

		updateCanvasWidth(true);
		render();

		if (!silent) {
			self.trigger('columnresize', self._event, {
				columns: self.options.columns
			});
		}

		self.trigger('statechange', self._event);
	};


	/**
	 * Returns a readable representation of a Doby Grid Object
	 * @method toString
	 * @memberof DobyGrid
	 *
	 * @returns {string}
	 */
	this.toString = function () { return "DobyGrid"; };


	/**
	 * Toggles the display of the context menu that appears when the column headers are
	 * right-clicked.
	 * @method toggleContextMenu
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{object}	event		- Javascript event object
	 * @param	{object}	args		- Event object data
	 *
	 */
	toggleContextMenu = function (event, args) {
		event.preventDefault();

		// Prevent propagation of nested grid events
		if (window._DobyGridDropdownEvent === event.timeStamp) return;
		window._DobyGridDropdownEvent = event.timeStamp;

		var column = args.column || false;

		// When a column is chosen from the menu
		var cFn = function (column) {
			return function (event) {
				event.stopPropagation();

				// Clone the columns so that the 'columnchange' event correctly
				// reports back the old columns
				var columns_clone = self.options.columns.map(function (c) {
					var col = _.clone(c);
					if (col.id === column.id) {
						col.visible = !col.visible;
						// Toggle menu
						col.visible ? $(event.currentTarget).addClass('on') : $(event.currentTarget).removeClass('on');
					}
					return col;
				});

				// Update grid
				self.setColumns(columns_clone);
			};
		};

		// Builds a list of all available columns for the user to choose from
		var columns_menu = [],
			undefined_key = '--UNDEFINED--',
			sorted_grouped = _.chain(self.options.columns)
				.sortBy(function (c) { return c.name; })
				.groupBy(function (c) { return c.category !== undefined && c.category !== null ? c.category : undefined_key; })
				.value(),
			category_keys = Object.keys(sorted_grouped).sort(),
			category, category_item;

		var buildColumnsMenu = function (c, target) {
			// Non-removable columns do not appear in the list
			if (!c.removable) return;
			target = target || columns_menu;
			target.push({
				name: c.name !== undefined && c.name !== null ? c.name : c.id,
				fn: cFn(c),
				value: c.visible
			});
		};

		// Process category columns first
		for (var k = 0, m = category_keys.length; k < m; k++) {
			category = category_keys[k];
			if (category == undefined_key) continue;

			// Create the group item
			category_item = {
				name: category,
				menu: []
			};

			for (var i = 0, l = sorted_grouped[category].length; i < l; i++) {
				buildColumnsMenu(sorted_grouped[category][i], category_item.menu);
			}

			columns_menu.push(category_item);
		}

		// Process non-category columns last
		if (sorted_grouped[undefined_key]) {
			for (var c = 0, cl = sorted_grouped[undefined_key].length; c < cl; c++) {
				buildColumnsMenu(sorted_grouped[undefined_key][c]);
			}
		}

		// When an aggregator is chosen from the menu
		var aFn = function (column, aggr_index) {
			return function (event) {
				// If this is the only aggregator available - clicking does nothing
				if (Object.keys(cache.aggregatorsByColumnId[column.id]).length === 1) return;

				// Update menu items
				$(event.target).parent().children('.' + CLS.dropdownitem).removeClass('on');
				$(event.target).addClass('on');
				if (!$(event.target).children('.' + CLS.dropdownicon).length) {
					$(event.target).append('<span class="' + CLS.dropdownicon + '"></span>');
				}

				// Disable old aggregator and enable the new one
				for (var aggr_i in cache.aggregatorsByColumnId[column.id]) {
					cache.aggregatorsByColumnId[column.id][aggr_i].active = (aggr_i == aggr_index);
				}

				// Invalidate all Aggregate rows in the visible range
				var range = getVisibleRange();
				for (var ci = range.top, ct = range.bottom; ci < ct; ci++) {
					if (cache.rows[ci] && cache.rows[ci]._aggregateRow) {
						invalidateRows([ci]);
					}
				}

				// Reset the aggregators each time the aggregators are processsed
				resetAggregators();

				// Re-process aggregators and re-render rows
				self.collection.refresh();
			};
		};

		// Builds a list of all available aggregators for the user to choose from
		var aggregator_menu = [];
		if (column && cache.aggregatorsByColumnId[column.id]) {
			for (var ai in cache.aggregatorsByColumnId[column.id]) {
				aggregator_menu.push({
					fn: aFn(column, ai),
					name: column.aggregators[ai].name,
					value: cache.aggregatorsByColumnId[column.id][ai].active
				});
			}
		}

		/**
		 * Menu data object which will define what the menu will have
		 *
		 * @param	divider		{boolean}		If true, item will be a divider
		 * @param	enabled		{boolean}		Will draw item only if true
		 * @param	name		{string}		Name of menu item to display to user
		 * @param	fn			{function}	Function to execute when item clicked
		 *
		 */
		var menuData = [{
			enabled: column || self.options.quickFilter,
			name: getLocale('column.options'),
			title: true
		}, {
			enabled: column && column.removable,
			name: column ? getLocale('column.remove', {name: column.name}) : '',
			fn: function () {
				self.hideColumn(column.id);
			}
		}, {
			enabled: self.options.quickFilter,
			name: getLocale('column.filtering'),
			menu: [{
				enabled: column,
				name: column ? getLocale('column.filter', {name: column.name}) : '',
				fn: function () {
					self.showQuickFilter(column.id);
					self.dropdown.hide();
				}
			}, {
				enabled: $headerFilter !== undefined,
				name: getLocale('global.hide_filter'),
				fn: function () {
					self.showQuickFilter();
					self.dropdown.hide();
				}
			}]
		}, {
			enabled: column && column.sortable,
			name: getLocale('column.sorting'),
			menu: [{
				enabled: !hasSorting(column.id),
				name: column ? getLocale('column.sort_asc', {name: column.name}) : '',
				fn: function () {
					self.sortBy(column.id, true);
					self.dropdown.hide();
				}
			}, {
				enabled: !hasSorting(column.id),
				name: column ? getLocale('column.sort_desc', {name: column.name}) : '',
				fn: function () {
					self.sortBy(column.id, false);
					self.dropdown.hide();
				}
			}, {
				enabled: self.isSorted() && !hasSorting(column.id),
				name: column ? getLocale('column.add_sort_asc', {name: column.name}) : '',
				fn: function () {
					self.sorting.push({columnId: column.id, sortAsc: true});
					self.setSorting(self.sorting);
					self.dropdown.hide();
				}
			}, {
				enabled: self.isSorted() && !hasSorting(column.id),
				name: column ? getLocale('column.add_sort_desc', {name: column.name}) : '',
				fn: function () {
					self.sorting.push({columnId: column.id, sortAsc: false});
					self.setSorting(self.sorting);
					self.dropdown.hide();
				}
			}, {
				enabled: hasSorting(column.id),
				name: column ? getLocale('column.remove_sort', {name: column.name}) : '',
				fn: function () {
					self.setSorting(_.filter(self.sorting, function (s) {
						return s.columnId != column.id;
					}));
					self.dropdown.hide();
				}
			}]
		}, {
			enabled: self.options.groupable && column && column.groupable,
			name: getLocale('column.grouping'),
			menu: [{
				enabled: !hasGrouping(column.id) || !self.isGrouped(),
				name: column ? getLocale('column.group', {name: column.name}) : '',
				fn: function () {
					self.setGrouping([{
						column_id: column.id
					}]);
					self.dropdown.hide();
				}
			}, {
				enabled: !hasGrouping(column.id) && self.isGrouped(),
				name: column ? getLocale('column.add_group', {name: column.name}) : '',
				fn: function () {
					self.addGrouping(column.id);
					self.dropdown.hide();
				}
			}, {
				enabled: hasGrouping(column.id),
				name: column ? getLocale('column.remove_group', {name: column.name}) : '',
				fn: function () {
					self.removeGrouping(column.id);
					self.dropdown.hide();
				}
			}, {
				enabled: self.isGrouped(),
				name: getLocale("column.groups_clear"),
				fn: function () {
					self.setGrouping();
					self.dropdown.hide();
				}
			}, {
				enabled: self.isGrouped(),
				divider: true
			}, {
				enabled: self.isGrouped(),
				name: getLocale('column.groups_expand'),
				fn: function () {
					self.collection.expandAllGroups();
				}
			}, {
				enabled: self.isGrouped(),
				name: getLocale('column.groups_collapse'),
				fn: function () {
					self.collection.collapseAllGroups();
				}
			}]
		}, {
			enabled: column && column.aggregators !== undefined,
			name: getLocale('column.aggregators'),
			menu: aggregator_menu
		}, {
			name: getLocale('global.grid_options'),
			title: true
		}, {
			name: getLocale('selection.selection'),
			menu: [{
				name: getLocale('selection.select_all', {name: column.name}),
				fn: function () {
					self.selectCells(0, 0, (cache.rows.length - 1), (cache.activeColumns.length - 1));
					self.dropdown.hide();
				}
			}, {
				enabled: column && !isColumnSelected(cache.columnsById[column.id]),
				name: getLocale('selection.select_column', {name: column.name}),
				fn: function () {
					var column_idx = cache.columnsById[column.id];
					self.selectCells(0, column_idx, (cache.rows.length - 1), column_idx);
					self.dropdown.hide();
				}
			}, {
				enabled: args.cell !== undefined && args.cell !== null && !isCellSelected(args.row, args.cell),
				name: getLocale('selection.select_cell'),
				fn: function () {
					self.selectCells(args.row, args.cell, args.row, args.cell);
					self.dropdown.hide();
				}
			}, {
				name: getLocale('selection.deselect_all', {name: column.name}),
				fn: function () {
					deselectCells();
					self.dropdown.hide();
				}
			}, {
				enabled: column && isColumnSelected(cache.columnsById[column.id]),
				name: getLocale('selection.deselect_column', {name: column.name}),
				fn: function () {
					var column_idx = cache.columnsById[column.id];
					// NOTE: This is very slow and inefficient. Build a way to bulk deselect.
					for (var i = 0; i < cache.rows.length - 1; i++) {
						deselectCells(i, column_idx);
					}
				}
			}, {
				enabled: args.cell !== undefined && args.cell !== null && isCellSelected(args.row, args.cell),
				name: getLocale('selection.deselect_cell'),
				fn: function () {
					deselectCells(args.row, args.cell);
					self.dropdown.hide();
				}
			}]
		}, {
			enabled: columns_menu.length > 0,
			name: getLocale('global.columns'),
			menu: columns_menu
		}, {
			enabled: isFileSaverSupported,
			name: getLocale('global.export'),
			menu: [{
				name: getLocale('global.export_csv'),
				fn: function () {
					self.export('csv', function (csv) {
						// Save to file
						var blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
						saveAs(blob, [self.options.exportFileName, ".csv"].join(''));
					});
					self.dropdown.hide();
				}
			}, {
				name: getLocale('global.export_html'),
				fn: function () {
					self.export('html', function (html) {
						// Save to file
						var blob = new Blob([html], {type: "text/html;charset=utf-8"});
						saveAs(blob, [self.options.exportFileName, ".html"].join(''));
					});
					self.dropdown.hide();
				}
			}, {
				enabled: self.isGrouped() && typeof args.row !== 'undefined',
				name: getLocale('global.export_group_csv'),
				fn: function () {
					self.export('csv', function (csv) {
						// Save to file
						var blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
						saveAs(blob, [self.options.exportFileName, ".csv"].join(''));
					}, args.row);
					self.dropdown.hide();
				}
			}, {
				enabled: self.isGrouped() && typeof args.row !== 'undefined',
				name: getLocale('global.export_group_html'),
				fn: function () {
					self.export('html', function (html) {
						// Save to file
						var blob = new Blob([html], {type: "text/html;charset=utf-8"});
						saveAs(blob, [self.options.exportFileName, ".html"].join(''));
					}, args.row);
					self.dropdown.hide();
				}
			}]
		}, {
			name: getLocale('global.auto_width'),
			value: self.options.autoColumnWidth,
			fn: function () {
				self.setOptions({
					autoColumnWidth: !self.options.autoColumnWidth
				});
			}
		}];

		// Add menu extensions at the end
		if (self.options.menuExtensions) {
			// Validates and restricts the menu extensions given by the user
			var validateMenuExtension = function (item) {
				// Ensure functions always close the dropdown
				if (item.fn) {
					var origFn = item.fn;
					item.fn = function (event) {
						var result = origFn(event);
						self.dropdown.hide();
						return result;
					};
				}

				// Validate submenus
				if (item.menu) {
					for (var x = 0, y = item.menu.length; x < y; x++) {
						item.menu[x] = validateMenuExtension(item.menu[x]);
					}
				}

				return item;
			};

			// Add the currentrow item to the arguments
			if (args.row !== undefined && args.row !== null) args.item = cache.rows[args.row];

			var extensions = self.options.menuExtensions(event, self, args),
				activeExtensions = extensions ? extensions.filter(function (e) {
					return e.enabled === undefined || e.enabled;
				}) : [];

			if (activeExtensions.length) {
				// Add title
				var extensionsMenuData = [{
					name: getLocale('global.extensions'),
					title: true
				}];

				for (var q = 0, w = activeExtensions.length; q < w; q++) {
					extensionsMenuData.push(validateMenuExtension(activeExtensions[q]));
				}

				if (self.options.menuExtensionsPosition === 'top') {
					menuData = extensionsMenuData.concat(menuData);
				} else {
					menuData = menuData.concat(extensionsMenuData);
				}
			}
		}

		// Render Menu
		var $menu = $('<div class="' + CLS.contextmenu + '"></div>');
		renderMenu(menuData, $menu);

		var option_change_delay;

		// Hovering on an item that has a submenu should show the submenu
		$menu.on('mouseover', function (event) {
			if (option_change_delay) clearTimeout(option_change_delay);

			var $item = $(event.target).hasClass(CLS.dropdownitem) ? $(event.target) : $(event.target).parent().hasClass(CLS.dropdownitem) ? $(event.target).parent() : null;

			if ($item) {
				option_change_delay = setTimeout(function () {
					// Find any other open menus on this level and close them
					$item.parent().children('.open').removeClass('open');

					$item.addClass('open');
				}, 200);
			}
		});

		// Create dropdown
		self.dropdown = new Dropdown(event, {
			id: column.id,
			menu: $menu,
			parent: self.$el
		});
	};


	/**
	 * Resizes the canvas width
	 * @method updateCanvasWidth
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{boolean}	forceColumnWidthsUpdate		- Force the width of columns to also update?
	 *
	 */
	updateCanvasWidth = function (forceColumnWidthsUpdate) {
		var oldCanvasWidth = canvasWidth,
			oldCanvasWidthL = canvasWidthL,
			oldCanvasWidthR = canvasWidthR,
			widthChanged;

		// Calculate new canvas widths
		canvasWidth = getCanvasWidth();

		// Determine if any of the canvas widths have changed
		widthChanged = canvasWidth !== oldCanvasWidth || canvasWidthL !== oldCanvasWidthL || canvasWidthR !== oldCanvasWidthR;

		// If canvas width has changed
		if (widthChanged) {

			// Handle frozen columns
			if (self.options.frozenColumns > -1) {
				$panes.eq(0).width(canvasWidthL);
				$panes.eq(1).css({
					left: canvasWidthL + 'px'
				});
			} else {
				$panes.eq(0).css({
					right: 0,
					width: 'auto'
				});
				$panes.eq(1).css({
					width: 0
				});
			}

			$canvas.eq(0).width(canvasWidthL);
			$canvas.eq(1).width(self.options.fullWidthRows ? canvasWidth - canvasWidthL : canvasWidthR);

			// Set header widths
			if (self.options.showHeader) $headers.width(getHeadersWidth());

			// Determine if we have horizontal scrolling
			viewportHasHScroll = (canvasWidth > viewportW - window.scrollbarDimensions.width);
		}

		if (widthChanged || forceColumnWidthsUpdate) {
			applyColumnWidths();
		}
	};


	/**
	 * Given an add and remove hash object, adds or removes CSS classes on the given nodes
	 * @method updateCellCssStylesOnRenderedRows
	 * @memberof DobyGrid
	 *
	 * @param	{object}	addedHash		- Which classes should be added to which cells
	 * @param	{object}	removedHash		- Which classes should be removed from which cells
	 *
	 * @example
	 * // Where "4" is the id of the affected row
	 * Example hash object: {
	 *		4: {
	 *			columnId: {
	 *				"myclassname"
	 *			}
	 *		}
	 * }
	 *
	 */
	this.updateCellCssStylesOnRenderedRows = function (addedHash, removedHash) {
		var node, columnId, addedRowHash, removedRowHash;

		for (var row in cache.nodes) {
			removedRowHash = removedHash && removedHash[row];
			addedRowHash = addedHash && addedHash[row];

			if (removedRowHash) {
				for (columnId in removedRowHash) {
					if (!addedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
						node = getCellNode(row, cache.columnsById[columnId]);
						if (node) {
							$(node).removeClass(removedRowHash[columnId]);
						}
					}
				}
			}

			if (addedRowHash) {
				for (columnId in addedRowHash) {
					if (!removedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
						node = getCellNode(row, cache.columnsById[columnId]);
						if (node) {
							$(node).addClass(addedRowHash[columnId]);
						}
					}
				}
			}
		}
	};


	/**
	 * Recalculates the columns caches
	 * @method updateColumnCaches
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{boolean}	[resetAggregators=true]		- Reset the aggregator cache too?
	 *
	 */
	updateColumnCaches = function (resetAggregators) {
		if (resetAggregators === null || resetAggregators === undefined) resetAggregators = true;

		// Pre-calculate cell boundaries.
		cache.columnPosLeft = [];
		cache.columnPosRight = [];
		if (resetAggregators) cache.aggregatorsByColumnId = {};

		var x = 0, column;
		for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
			column = cache.activeColumns[i];

			cache.columnPosLeft[i] = x;
			cache.columnPosRight[i] = x + column.width;
			x += column.width;

			// Cache aggregators
			if (resetAggregators && column.aggregators) {
				for (var j = 0, m = column.aggregators.length; j < m; j++) {
					if (!cache.aggregatorsByColumnId[column.id]) {
						cache.aggregatorsByColumnId[column.id] = {};
					}

					// Create new aggregator instance
					cache.aggregatorsByColumnId[column.id][j] = new column.aggregators[j].fn(column);
					if (typeof(cache.aggregatorsByColumnId[column.id][j].reset) == 'function') {
						cache.aggregatorsByColumnId[column.id][j].reset();
					}
				}
			}
		}
	};


	/**
	 * Re-cache and re-render a single row
	 * @method updateRow
	 * @memberof DobyGrid
	 * @private
	 *
	 * @param	{integer}	row			- Index of the row to re-render
	 *
	 */
	updateRow = function (row) {
		var cacheEntry = cache.nodes[row];
		if (!cacheEntry) return;

		ensureCellNodesInRowsCache(row);

		var d = self.getRowFromIndex(row);

		for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
			if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
				continue;
			}

			columnIdx = columnIdx | 0;
			var m = cache.activeColumns[columnIdx],
				node = cacheEntry.cellNodesByColumnIdx[columnIdx][0];

			if (self.active && row === self.active.row && columnIdx === self.active.cell && self.currentEditor) {
				self.currentEditor.loadValue(d);
			} else if (d) {
				node.innerHTML = getFormatter(d, m)(row, columnIdx, getDataItemValueForColumn(d, m), m, d);
			} else {
				node.innerHTML = "";
			}
		}

		invalidatePostProcessingResults(row);
	};


	/**
	 * Updates the cache of row data
	 * @method updateRowCount
	 * @memberof DobyGrid
	 * @private
	 */
	updateRowCount = function () {
		if (!initialized) return;

		var dataLength = cache.rows.length,
			oldViewportHasVScroll = viewportHasVScroll;

		if (dataLength === 0) {
			viewportHasVScroll = false;
		} else {
			if (variableRowHeight) {
				var rpc = cache.rowPositions[dataLength - 1];
				viewportHasVScroll = rpc && (rpc.bottom > viewportH);
			} else {
				viewportHasVScroll = dataLength * (self.options.rowHeight + self.options.rowSpacing) > viewportH;
			}
		}

		makeActiveCellNormal();

		// remove the rows that are now outside of the data range
		// this helps avoid redundant calls to .remove() when the size of the data
		// decreased by thousands of rows
		for (var i in cache.nodes) {
			if (i >= dataLength) {
				removeRowFromCache(i);
			}
		}

		if (self.active && self.active.node && self.active.row > dataLength) {
			resetActiveCell();
		}

		var oldH = h;
		if (dataLength === 0) {
			th = viewportH - window.scrollbarDimensions.height;
		} else {
			var rowMax;
			if (!variableRowHeight) {
				rowMax = (self.options.rowHeight + self.options.rowSpacing) * dataLength + dataLength;
			} else {
				var pos = dataLength - 1,
					rps = cache.rowPositions[pos];
				rowMax = rps.bottom;
			}

			th = Math.max(rowMax, viewportH - window.scrollbarDimensions.height);
		}

		if (th < window.maxSupportedCssHeight) {
			// just one page
			h = ph = th;
			n = 1;
			cj = 0;
		} else {
			// break into pages
			h = window.maxSupportedCssHeight;
			ph = h / 100;
			n = Math.floor(th / ph);
			cj = (th - h) / (n - 1);
		}

		if (h !== oldH) {
			$canvas.css("height", h);
			scrollTop = $viewport[0].scrollTop;
		}

		var oldScrollTopInRange = (scrollTop + offset <= th - viewportH);

		if (th === 0 || scrollTop === 0) {
			page = offset = 0;
		} else if (oldScrollTopInRange) {
			// maintain virtual position
			scrollTo(scrollTop + offset);
		} else {
			// scroll to bottom
			scrollTo(th - viewportH);
		}

		// If autoColumnWidth is enabled and the scrollbar has disappeared - we need to resize
		if (self.options.autoColumnWidth && oldViewportHasVScroll !== undefined && oldViewportHasVScroll != viewportHasVScroll) {
			autosizeColumns();
		}

		updateCanvasWidth(false);
	};


	/**
	 * Parses the options.columns list to ensure column data is correctly configured.
	 * @method validateColumns
	 * @memberof DobyGrid
	 * @private
	 */
	validateColumns = function () {
		if (!self.options.columns) return;

		cache.activeColumns = [];
		cache.columnsById = {};

		var c, byId = {};
		for (var i = 0, l = self.options.columns.length; i < l; i++) {
			if (self.options.columns[i] === undefined) {
				throw new TypeError("You have an 'undefined' column object in your Grid Options. This is not allowed.");
			}

			if (self.options.columns[i] === null) {
				throw new TypeError("You have a 'null' column object in your Grid Options. This is not allowed.");
			}

			// Set defaults
			c = self.options.columns[i] = $.extend(JSON.parse(JSON.stringify(columnDefaults)), self.options.columns[i]);

			// An "id" is required. If it's missing, auto-generate one
			if (c.id === undefined || c.id === null) {
				c.id = c.field ? c.field + '_' + i : c.name ? c.name + '_' + i : null;
			}

			if (byId[c.id]) {
				throw new Error([
					"You cannot have two columns with the same 'id' value. ",
					"Please change one of the '", c.id, "' column 'id' values."
				].join(''));
			}

			// If any columns require asyncPostRender, enable it on the grid
			if (c.postprocess) enableAsyncPostRender = true;

			// If no width is set, use global default
			if (c.width === undefined || c.width === null) c.width = self.options.columnWidth;

			// If min/max width is set -- use it to reset given width
			if (c.minWidth !== undefined && c.minWidth !== null && c.width < c.minWidth) c.width = c.minWidth;
			if (c.maxWidth !== undefined && c.maxWidth !== null && c.width > c.maxWidth) c.width = c.maxWidth;

			// These params must be functions
			var fn_attrs = ['editor', 'exporter', 'formatter'], attr;
			for (var j = 0, k = fn_attrs.length; j < k; j++) {
				attr = fn_attrs[j];
				if (c[attr] !== undefined && c[attr] !== null && typeof c[attr] !== 'function') {
					throw new Error([
						"Column ", attr, "s must be functions. ",
						"Invalid ", attr, " given for column \"",
						(c.name || c.id), '"'
					].join(""));
				}
			}

			// Aggregators must be arrays
			if (c.aggregators !== undefined && c.aggregators !== null) {
				if (!$.isArray(c.aggregators)) {
					throw new Error([
						"A column's \"aggregators\" value must be array. ",
						"Invalid value given for column \"", (c.name || c.id), "\""
					].join(""));
				}
			}

			// Build active column cache
			if (c.visible !== false) {
				cache.activeColumns.push(c);

				// Build column id cache
				cache.columnsById[c.id] = cache.activeColumns.length - 1;
			}

			byId[c.id] = true;
		}
	},


	/**
	 * Ensures that the given options are valid and complete
	 * @method validateOptions
	 * @memberof DobyGrid
	 * @private
	 */
	validateOptions = function () {
		// Validate loaded JavaScript modules against requested options
		if (self.options.resizableColumns && !$.fn.drag) {
			throw new Error('In order to use "resizable", you must ensure the jquery-ui.draggable module is loaded.');
		}
		if (self.options.reorderable && !$.fn.sortable) {
			throw new Error('In order to use "reorderable", you must ensure the jquery-ui.sortable module is loaded.');
		}

		// Ensure "columns" option is an array
		if (!$.isArray(self.options.columns)) {
			throw new TypeError('The "columns" option must be an array.');
		}

		// Ensure "data" option is an array or a function
		if (
			!$.isArray(self.options.data) &&
			typeof self.options.data !== 'function' &&
			!(self.options.data instanceof Backbone.Collection)
		) {
			throw new TypeError('The "data" option must be an array, a function or a Backbone.Collection.');
		} else {
			if (typeof self.options.data === 'function') {
				// If data is a function - enable remote fetching by instantiating the remote class
				self.fetcher = new self.options.data();
			} else if (self.options.data instanceof Backbone.Collection && self.options.data.DobyGridRemote) {
				// If data is a Backbone.Collection with a DobyGridRemote attribute - also enable remote
				self.fetcher = self.options.data.DobyGridRemote;
			}

			if (self.fetcher) {
				self.fetcher.grid = self;
				self.fetcher.queue = $.when();
			}
		}

		// Ensure "tooltipType" is one of the allowed values
		if (['title', 'popup'].indexOf(self.options.tooltipType) < 0) {
			throw new Error('The "tooltipType" option be either "title" or "popup", not "' + self.options.tooltipType + '".');
		}

		// Warn if "addRow" is used without "editable"
		if (self.options.addRow && !self.options.editable) {
			if (console.warn) console.warn('In order to use "addRow", you must enable the "editable" parameter. The "addRow" option has been disabled.');
			self.options.addRow = false;
		}

		// If 'resizableRows' are enabled, turn on variableRowHeight mode
		if (self.options.resizableRows && !variableRowHeight) {
			variableRowHeight = true;
		}

		// Validate and pre-process
		validateColumns();

		// If the given dataset is a Backbone.Collection - hook up the grid to collection events
		if (self.options.data instanceof Backbone.Collection) bindToCollection();
	};


	/**
	 * Ensures that the results coming back from fetchGroups() are valid.
	 * @method validateRemoteGroups
	 * @memberof DobyGrid
	 * @private
	 */
	validateRemoteGroups = function (groups) {
		if (!$.isArray(groups)) throw new Error("Unable to group rows because the data returned from your remote fetchGroups method is not valid. It must be an array.");

		var gr, groupsByName;
		for (var i = 0, l = groups.length; i < l; i++) {
			groupsByName = {};

			// Ensure 'parent' value is always an array
			if (!$.isArray(groups[i].parent)) groups[i].parent = [groups[i].parent];

			for (var g = 0, gl = groups[i].groups.length; g < gl; g++) {
				gr = groups[i].groups[g];
				if (!groupsByName[gr.value]) groupsByName[gr.value] = {};

				if (
					(!gr.parent && groupsByName[gr.value] === 1) ||
					(gr.parent && groupsByName[gr.value][gr.parent.toString()])
				) {
					console.warn("The data returned from your remote fetchGroups method is not valid. More than 1 group with the value `" + gr.value + "` and parents `" + (gr.parent ? gr.parent.toString() : '') + "` detected at grouping level " + i + ".");
				} else {
					if (gr.parent) {
						groupsByName[gr.value][gr.parent.toString()] = 1;
					} else {
						groupsByName[gr.value] = 1;
					}
				}
			}
		}
	};


	// Initialize the class
	return initialize();
};

module.exports = DobyGrid;

},{"./classes/Aggregate":1,"./classes/CellRange":2,"./classes/CellRangeDecorator":3,"./classes/DefaultEditor":4,"./classes/DefaultFormatter":5,"./classes/Dropdown":6,"./classes/Group":7,"./classes/NonDataItem":8,"./classes/Placeholder":9,"./classes/Tooltip":10,"./utils/classes":12,"./utils/locales":13,"./utils/naturalSort":14,"./utils/removeElement":15}],12:[function(require,module,exports){
"use strict";

var base = 'doby-grid';

module.exports = {
	autoheight:				base + '-autoheight',
	canvas:					base + '-canvas',
	cell:					base + '-cell',
	cellunselectable:		base + '-cell-unselectable',
	clipboard:				base + '-clipboard',
	collapsed:				'collapsed',
	columnname:				base + '-column-name',
	columnspacer:			base + '-column-spacer',
	contextmenu:			base + '-contextmenu',
	dropdown:				base + '-dropdown',
	dropdownmenu:			base + '-dropdown-menu',
	dropdownitem:			base + '-dropdown-item',
	dropdowndivider:		base + '-dropdown-divider',
	dropdownarrow:			base + '-dropdown-arrow',
	dropdownicon:			base + '-dropdown-icon',
	dropdownleft:			base + '-dropdown-left',
	dropdowntitle:			base + '-dropdown-title',
	editor:					base + '-editor',
	empty:					base + '-empty',
	expanded:				'expanded',
	garbage:				'DobyGridGarbageBin',
	group:					base + '-group',
	grouptitle:				base + '-group-title',
	grouptoggle:			base + '-group-toggle',
	gutter:					base + '-gutter',
	guttersVisible:			base + '-gutters-visible',
	handle:					base + '-resizable-handle',
	header:					base + '-header',
	headercolumns:			base + '-header-columns',
	headercolumn:			base + '-header-column',
	headercolumnactive:		base + '-header-column-active',
	headercolumndrag:		base + '-header-column-dragging',
	headercolumnsorted:		base + '-header-column-sorted',
	headerfilter:			base + '-header-filter',
	headerfiltercell:		base + '-header-filter-cell',
	headerfilterdisabled:	base + '-header-filter-disabled',
	headersortable:			'sortable',
	invalid:				'invalid',
	invalidicon:			base + '-invalid-icon',
	left:					base + '-scrollbar-left',
	noright:				base + '-no-right',
	pane:					base + '-pane',
	paneactive:				base + '-pane-active',
	placeholder:			base + '-sortable-placeholder',
	rangedecorator:			base + '-range-decorator',
	rangedecoratorstat:		base + '-range-decorator-stats',
	row:					base + '-row',
	rowdragcontainer:		base + '-row-drag-container',
	rowhandle:				base + '-row-handle',
	rowtotal:				base + '-row-total',
	scrollloader:			base + '-scroll-loader',
	sortindicator:			base + '-sort-indicator',
	sortindicatorasc:		base + '-sort-indicator-asc',
	sortindicatordesc:		base + '-sort-indicator-desc',
	sticky:					base + '-sticky',
	tooltip:				base + '-tooltip',
	tooltiparrow:			base + '-tooltip-arrow',
	viewport:				base + '-viewport'
};

},{}],13:[function(require,module,exports){
module.exports = {
	column: {
		add_group:			'Add Grouping By "{{name}}"',
		add_sort_asc:		'Add Sort By "{{name}}" (Ascending)',
		add_sort_desc:		'Add Sort By "{{name}}" (Descending)',
		add_quick_filter:	'Add Quick Filter...',
		aggregators:		'Aggregators',
		filter:				'Quick Filter by "{{name}}"',
		filtering:			'Filtering',
		group:				'Group By "{{name}}"',
		grouping:			'Grouping',
		groups_clear:		'Clear All Grouping',
		groups_collapse:	'Collapse All Groups',
		groups_expand:		'Expand All Groups',
		options:			'Column Options',
		remove:				'Remove "{{name}}" Column',
		remove_group:		'Remove Grouping By "{{name}}"',
		remove_sort:		'Remove Sort By "{{name}}"',
		sorting:			'Sorting',
		sort_asc:			'Sort By "{{name}}" (Ascending)',
		sort_desc:			'Sort By "{{name}}" (Descending)'
	},
	empty: {
		"default":			'No data available',
		remote:				'No results found',
		filter:				'No items matching that filter'
	},
	global: {
		auto_width:			'Automatically Resize Columns',
		columns:			'Columns',
		export:				'Export',
		export_csv:			'Export Table to CSV',
		export_html:		'Export Table to HTML',
		export_group_csv:	'Export Group to CSV',
		export_group_html:	'Export Group to HTML',
		extensions:			'Extensions',
		grid_options:		'Grid Options',
		hide_filter:		'Hide Quick Filter'
	},
	selection: {
		deselect_all:		'Deselect All',
		deselect_cell:		'Deselect This Cell',
		deselect_column:	'Deselect "{{name}}" Column',
		selection:			'Selection',
		select_all:			'Select All',
		select_cell:		'Select This Cell',
		select_column:		'Select "{{name}}" Column'
	}
};
},{}],14:[function(require,module,exports){
"use strict";

/**
 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
 * @method naturalSort
 */
module.exports = function (a, b) {
	var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
		sre = /(^[ ]*|[ ]*$)/g,
		dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
		hre = /^0x[0-9a-f]+$/i,
		ore = /^0/,
		i = function (s) {
			return ('' + s).toLowerCase() || '' + s;
		},
		// convert all to strings strip whitespace
		x = i(a).replace(sre, '') || '',
		y = i(b).replace(sre, '') || '',
		// chunk/tokenize
		xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
		yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
		// numeric, hex or date detection
		xD = parseInt(x.match(hre), 10) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
		yD = parseInt(y.match(hre), 10) || xD && y.match(dre) && Date.parse(y) || null,
		oFxNcL, oFyNcL;
	// first try and sort Hex codes or Dates
	if (yD)
		if (xD < yD) {
			return -1;
		} else if (xD > yD) {
			return 1;
		}
	// natural sorting through split numeric strings and default strings
	for (var cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
		// find floats not starting with '0', string or 0 if not defined (Clint Priest)
		oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
		oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
		if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
			// handle numeric vs string comparison - number < string - (Kyle Adams)
			return (isNaN(oFxNcL)) ? 1 : -1;
		} else if (typeof oFxNcL !== typeof oFyNcL) {
			// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
			oFxNcL += '';
			oFyNcL += '';
		}
		if (oFxNcL < oFyNcL) return -1;
		if (oFxNcL > oFyNcL) return 1;
	}
	return 0;
};
},{}],15:[function(require,module,exports){
"use strict";

var CLS	= require('./../utils/classes');

/**
 * This seems to be the only reliable way to remove nodes from the DOM without creating a
 * DOM memory leak. See this post:
 * http://stackoverflow.com/questions/768621/how-to-dispose-of-dom-elements-in-javascript-to-avoid-memory-leaks?rq=1
 *
 * @method removeElement
 *
 * @param	{DOMObject}	element			- DOM node to remove
 *
 */
module.exports = function (element) {
	var garbageBin = document.getElementById(CLS.garbage);
	if (!garbageBin) {
		garbageBin = document.createElement('DIV');
		garbageBin.id = CLS.garbage;
		garbageBin.style.display = 'none';
		document.body.appendChild(garbageBin);
	}

	// Move the element to the garbage bin
	garbageBin.appendChild(element);
	garbageBin.innerHTML = '';
};
},{"./../utils/classes":12}]},{},[11])(11)
});