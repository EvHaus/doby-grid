/* global $ */

"use strict";

var CLS 		= require('./../utils/classes.js'),
	Group 		= require('./Group.js');

/**
 * Class that stores information about a group of rows.
 * @class CustomGroup
 *
 * @param	{object}	options		- Custom options for this group item
 */
var CustomGroup = function (options) {
	options = options || {};

	$.extend(this, {
		iscustomgroup: true
	}, options);

};

CustomGroup.prototype = new Group();
CustomGroup.prototype._groupRow = true;

CustomGroup.prototype.class = function (row, item) {
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

CustomGroup.prototype.toString = function () {
	return "CustomGroup";
};

module.exports = CustomGroup;