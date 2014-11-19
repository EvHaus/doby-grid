"use strict";

var NonDataItem	= require('./NonDataItem');

/**
 * @class Range
 * @classdesc A structure containing a range of cells.
 *
 * @param {object}		data		- Data for the cell range
 * @param {object}		grid		- Current DobyGrid instance
 */
var Range = function (data, grid) {
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
 * @memberof Range
 *
 * @param	{integer}	row			- Row index
 * @param	{integer}	cell		- Cell index
 *
 * @returns {boolean}
 */
Range.prototype.contains = function (row, cell) {
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
 * @memberof Range
 *
 * @param	{integer}	[row]		- Row index for cell to deselect
 * @param	{integer}	[cell]	- Cell index to deselect in the given row
 *
 * @returns {object}
 */
Range.prototype.deselect = function (row, cell) {
	var specific = row !== undefined && row !== null && cell !== undefined && cell !== null,
		cache = this._grid.getCache();

	// Make sure cell is part of range
	if (specific && !this.contains(row, cell)) {
		throw new Error('Unable to deselect cell (' + row + ', ' + cell + ') because it is not part of this Range.');
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
 * @memberof Range
 */
Range.prototype.excludeUnselectable = function () {
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
 * @memberof Range
 *
 * @returns {boolean}
 */
Range.prototype.fullyExcluded = function () {
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
 * @memberof Range
 *
 * @returns {integer}
 */
Range.prototype.getCellCount = function () {
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
 * @memberof Range
 *
 * @param	{integer}	row			- Row index for cell to check
 * @param	{integer}	cell		- Cell index to check in the given row
 */
Range.prototype.isExcludedCell = function (row, cell) {
	if (this.exclusions.length === 0) return false;
	for (var i = 0, l = this.exclusions.length; i < l; i++) {
		if (this.exclusions[i][0] === row && this.exclusions[i][1] === cell) return true;
	}
};


/**
 * Returns whether a row is excluded from this range
 * @method isExcludedRow
 * @memberof Range
 *
 * @param	{integer}	row			- Row index for row to check
 */
Range.prototype.isExcludedRow = function (row) {
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
 * @memberof Range
 *
 * @returns {boolean}
 */
Range.prototype.isSingleCell = function () {
	// TODO: This needs to take colspans into account
	return this.fromRow == this.toRow && this.fromCell == this.toCell;
};


/**
 * Returns whether a range represents a single row.
 * @method isSingleRow
 * @memberof Range
 *
 * @returns {boolean}
 */
Range.prototype.isSingleRow = function () {
	return this.fromRow == this.toRow;
};


/**
 * Converts the cell range values to CSV
 * @method toCSV
 * @memberof Range
 *
 * @returns {string}
 */
Range.prototype.toCSV = function () {
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
 * @memberof Range
 *
 * @returns {string}
 */
Range.prototype.toJSON = function () {
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
 * Converts the cell range values to a list of selected row objects
 * @method toRows
 * @memberof Range
 *
 * @returns {string}
 */
Range.prototype.toRows = function () {
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
 * @memberof Range
 *
 * @returns {string}
 */
Range.prototype.toString = function () {
	if (this.isSingleCell()) {
		return "Range (" + this.fromRow + ":" + this.fromCell + ")";
	} else {
		return "Range (" + this.fromRow + ":" + this.fromCell + " - " + this.toRow + ":" + this.toCell + ")";
	}
};

module.exports = Range;