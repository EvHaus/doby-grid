/* global $ */

"use strict";

var CLS = require('./../utils/classes'),
	removeElement = require('./../utils/removeElement');

/**
 * Show a tooltip on the column header
 * @method showTooltip
 * @memberof DobyGrid
 * @private
 *
 * @param	{object}	event		- Javascript event object
 * @param	{object}	options		- Tooltip options
 *
 */
var Tooltip = function (event, options) {
	options = options || {};

	// Proceed for popup tooltips only
	if (options.type != 'popup') return;

	// Proceed if not on a drag handle
	if ($(event.target).closest('.' + CLS.handle).length) {
		// Trigger mouseleave event so existing tooltips are hidden during resizing
		$(event.target).trigger('mouseleave');
		return;
	}

	var column = options.column;

	// Proceed for valid columns only
	if (!column || !column.tooltip) return;

	var el = $(event.target).closest('.' + CLS.headercolumn);

	// Don't create tooltip if this element already has one open
	if (el.attr('aria-describedby')) return;

	// ID of the tooltip element
	var uid = "doby-grid-" + Math.round(1000000 * Math.random());
	var tooltip_id = uid + '-tooltip-column-' + column.id;

	// Add describe by
	el.attr('aria-describedby', tooltip_id);

	// Assign removal event
	el.one("mouseleave remove", function () {
		// Remove tooltip
		if ($(this).attr('aria-describedby') !== undefined) {
			var tltp = $('#' + tooltip_id);
			tltp.removeClass('on');

			// Animate out
			setTimeout(function () {
				if (tltp && tltp.length) removeElement(tltp[0]);
			}, 200);

			$(this).removeAttr('aria-describedby');
		}
	});

	// Delay rendering by a few milliseconds to prevent rolling over tooltip
	// and for better UX
	setTimeout(function () {
		// Make sure tooltip is still needed
		if (el.attr('aria-describedby') === undefined || !el.is(':visible')) return;

		// Height of the tooltip arrow
		var arrowheight = 10;

		// Build tooltip HTML
		var html = ['<span class="' + CLS.tooltip + '" id="' + tooltip_id + '">'];
		html.push(column.tooltip);
		html.push('<span class="' + CLS.tooltiparrow + '"></span>');
		html.push('</span>');

		// Double check that element doesn't already exist
		if ($('#' + tooltip_id).length) return;

		// Insert into DOM temporarily so we can calculate size
		var tooltip = $(html.join(''));
		tooltip.appendTo(document.body);

		// Calculate position
		var x = el.offset().left + (el.outerWidth() / 2) - (tooltip.outerWidth() / 2),
			y = el.offset().top + el.outerHeight() + arrowheight;

		// Compensate when we get close to the edge
		var arrowoffset = 0,
			win = $(window),
			windowwidth = win.outerWidth();

		if (x < 0) {
			arrowoffset = x;
			x = 0;
		} else if ((x + tooltip.outerWidth()) > windowwidth) {
			arrowoffset = (x + tooltip.outerWidth()) - windowwidth;
			x -= arrowoffset + 1;
		}

		// Position arrow
		var arrow = tooltip.children('.' + CLS.tooltiparrow).first();
		arrow.css('left', (tooltip.outerWidth() / 2) - (arrow.outerWidth() / 2) + arrowoffset);

		// Draw tooltip
		tooltip
			.remove()	// Need to remove it from body and re-insert to ensure Chrome animates
			.addClass('on')
			.attr('style', 'left:' + x + 'px;top:' + (y + 5) + 'px')
			.appendTo(document.body)
			.width(); // Force layout to display transitions

		// Transition in
		tooltip.css('top', y);
	}, 250);
};

module.exports = Tooltip;