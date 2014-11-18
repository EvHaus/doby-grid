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