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
