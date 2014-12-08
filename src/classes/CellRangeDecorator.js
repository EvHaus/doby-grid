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
 * Given a cell range, returns the target canvas elements
 * @method getTargets
 * @memberof CellRangeDecorator
 *
 * @param	{integer}	canvasIndex		- Id of the canvas to render into
 * @param	{object}	range			- The selection range which to outline
 *
 */
CellRangeDecorator.prototype.render = function (canvasIndex, range) {
	var $target = this.$el[canvasIndex],
		$stats = this.$stats[canvasIndex];

	// Render a new decorator for this canvas
	if (!$target) {
		var $canvas = this.grid.$el.find('.' + CLS.canvas);

		this.$el[canvasIndex] = $('<div class="' + CLS.rangedecorator + '"></div>')
			.appendTo($canvas.eq(canvasIndex));
		$target = this.$el[canvasIndex];

		this.$stats[canvasIndex] = $('<span class="' + CLS.rangedecoratorstat + '"></span>')
			.appendTo(this.$el[canvasIndex]);
		$stats = this.$stats[canvasIndex];
	}

	var from = this.getCellNodeBox(range.fromRow, range.fromCell),
		to = this.getCellNodeBox(range.toRow, range.toCell),
		borderBottom = parseInt($target.css('borderBottomWidth'), 10),
		borderLeft = parseInt($target.css('borderLeftWidth'), 10),
		borderRight = parseInt($target.css('borderRightWidth'), 10),
		borderTop = parseInt($target.css('borderTopWidth'), 10);

	if (from && to) {
		var width = to.right - from.left - borderLeft - borderRight;

		$target.css({
			top: from.top,
			left: from.left,
			height: to.bottom - from.top - borderBottom - borderTop,
			width: width
		});

		// Only display stats box if there is enough room
		if (width > 200) {
			// Calculate number of selected cells
			$stats.show().html([
				'<strong>Selection:</strong> ', range.getCellCount(), ' cells',
				' <strong>From:</strong> ', (range.fromRow + 1), ':', (range.fromCell + 1),
				' <strong>To:</strong> ', (range.toRow + 1), ':', (range.toCell + 1)
			].join(''));
		} else {
			$stats.hide();
		}
	}
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
	if (this.$el === null) {
		this.$el = [];
		this.$stats = [];
	}

	var rangeSplit = range.split(this.grid.options.frozenColumns, this.grid.options.frozenRows);

	// Determine which panes we need to render in
	if (this.grid.options.frozenColumns < 0 || range.fromCell <= this.grid.options.frozenColumns) {
		// Render left-right pane selection
		if (rangeSplit[0]) this.render(0, rangeSplit[0]);
	}

	if (this.grid.options.frozenColumns > -1 && range.toCell > this.grid.options.frozenColumns) {
		// Render top-right pane selection
		if (rangeSplit[1]) this.render(1, rangeSplit[1]);
	}

	// TODO: Handle frozen rows

	return this.$el;
};


/**
 * Destroys the rendered elements
 * @method hide
 * @memberof CellRangeDecorator
 */
CellRangeDecorator.prototype.hide = function () {
	if (this.$el && this.$el.length) {
		$.each(this.$el, function (i, $el) {
			if ($el && $el.length) removeElement($el[0]);
		});
	}
	this.$el = null;
};

module.exports = CellRangeDecorator;