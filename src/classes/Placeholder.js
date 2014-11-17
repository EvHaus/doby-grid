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