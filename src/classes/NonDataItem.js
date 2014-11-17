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