/* global $ */

"use strict";

var CLS = require('./../utils/classes'),
	removeElement = require('./../utils/removeElement');

/**
 * @class CellRangeDecorator
 * @classdesc Displays an overlay on top of a given cell range
 */
// TODO: Remove getCellNodeBox from the params here
var CellRangeDecorator = function ($target, getCellNodeBox) {
	this.$el = null;
	this.$canvas = $target;
	this.getCellNodeBox = getCellNodeBox;
};

CellRangeDecorator.prototype.show = function (range) {
	if (!this.$el) {
		this.$el = $('<div class="' + CLS.rangedecorator + '"></div>')
			.appendTo(this.$canvas);
		this.$stats = $('<span class="' + CLS.rangedecoratorstat + '"></span>')
			.appendTo(this.$el);
	}

	var from = this.getCellNodeBox(range.fromRow, range.fromCell),
		to = this.getCellNodeBox(range.toRow, range.toCell),
		borderBottom = parseInt(this.$el.css('borderBottomWidth'), 10),
		borderLeft = parseInt(this.$el.css('borderLeftWidth'), 10),
		borderRight = parseInt(this.$el.css('borderRightWidth'), 10),
		borderTop = parseInt(this.$el.css('borderTopWidth'), 10);

	if (from && to) {
		var width = to.right - from.left - borderLeft - borderRight;

		this.$el.css({
			top: from.top,
			left: from.left,
			height: to.bottom - from.top - borderBottom - borderTop,
			width: width
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

CellRangeDecorator.prototype.hide = function () {
	if (this.$el && this.$el.length) {
		removeElement(this.$el[0]);
	}
	this.$el = null;
};

module.exports = CellRangeDecorator;