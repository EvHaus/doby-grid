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