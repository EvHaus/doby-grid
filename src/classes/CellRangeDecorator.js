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