/* global $ */

"use strict";

var CLS  			= require('./../utils/classes'),
	removeElement	= require('./../utils/removeElement');

var uid = "doby-grid-dd-" + Math.round(1000000 * Math.random());

/**
 * Creates a new dropdown menu.
 * @class Dropdown
 *
 * @param	{object}	[event]			- Javascript event object
 * @param	{object}	[options]		- Additional dropdown options
 *
 * @returns {object}
 */
var Dropdown = function (event, options) {

	// Is the dropdown currently shown?
	this.open = false;

	/**
	 * Initializes the class
	 * @method initialize
	 * @memberof Dropdown
	 */
	this.initialize = function () {
		this.$parent = options.parent || $(event.currentTarget);
		this.$el = options.menu;
		this.id = [uid, CLS.dropdown, options.id].join('_');

		// Create data store in the parent object if it doesn't already exist
		var existing = null;
		if (!this.$parent.data(CLS.dropdown)) {
			this.$parent.data(CLS.dropdown, []);
		} else {
			// Also find the existing dropdown for this id (if it exists)
			existing = this.$parent.data(CLS.dropdown).filter(function (i) {
				return i.id == this.id;
			}.bind(this));
			if (existing) existing = existing[0];
		}

		// If this parent already has a dropdown enabled -- initializing will close it
		if (existing && existing.open) {
			existing.hide();
		} else {
			// Ensure dropdown has the right styling
			this.$el.attr('id', this.id);
			this.$el.addClass(['off', CLS.dropdown].join(' '));
			this.show();
		}

		// Clicking outside - closes the dropdown
		var bodyClose;
		bodyClose = function (e) {
			if (e.target == event.target) return;
			this.hide();
			$(document).off('click', bodyClose);
			$(document).off('context', bodyClose);
		}.bind(this);

		$(document).on('click', bodyClose);
		$(document).on('contextmenu', bodyClose);

		// Esc - closes the dropdown
		var bodyEscape;
		bodyEscape = function (e) {
			if (e.keyCode == 27) {
				this.hide();
				$(document).off('keydown', bodyEscape);
			}
		}.bind(this);
		$(document).one('keydown', bodyEscape);

		return this;
	};


	/**
	 * Positions the dropdown in the right spot
	 * @method position
	 * @memberof Dropdown
	 */
	this.position = function () {
		var top = event.pageY,
			left = event.pageX,
			menu_width = this.$el.outerWidth(),
			menu_height = this.$el.outerHeight(),
			required_width = event.clientX + menu_width,
			required_height = event.clientY + menu_height,
			b = $(document.body),
			available_width = b.width(),
			available_height = b.height();

		// Determine position of main dropdown

		// If no room on the right side, throw dropdown to the left
		if (available_width < required_width) {
			left -= menu_width;
		}

		// If no room on the right side for submenu, throw submenus to the left
		if (available_width < required_width + menu_width) {
			this.$el.addClass(CLS.dropdownleft);
		}

		// If no room on the bottom, throw dropdown upwards
		if (available_height < required_height) {
			top -= menu_height;
		}

		this.$el.css({
			left: Math.max(left, 0),
			top: Math.max(top, 0)
		});

		// Now, loop through all of the submenus and determine which way they should drop
		// depending on how much screen space there is
		var pos, off, height, width, leftright, parentWidth;
		this.$el.children('.' + CLS.dropdownmenu + ':first').find('.' + CLS.dropdownmenu).each(function () {
			pos = $(this).position();
			off = $(this).offset();
			height = $(this).outerHeight();
			width = $(this).outerWidth();
			parentWidth = $(this).parent().outerWidth();

			// Determine whether to drop to left or right
			leftright = (off.left + parentWidth) - Math.min(pos.left, 0) + width > available_width ? 'drop-left' : 'drop-right';
			$(this).addClass(leftright);

			// When dropping left - need to set correct position
			if (leftright == 'drop-left') {
				$(this).css('left', -width + 'px');
			}

			// Determine whether to drop to up or down
			$(this).addClass(event.clientY + height > available_height ? 'drop-up' : 'drop-down');
		});
	};

	return this.initialize();
};


/**
 * Displays the dropdown
 * @method show
 * @memberof Dropdown
 */
Dropdown.prototype.show = function () {
	if (this.open) return;

	this.$el.appendTo(document.body);

	this.position();

	var store = this.$parent.data(CLS.dropdown);
	store.push(this);
	this.$parent.data(CLS.dropdown, store);

	// Animate fade in
	setTimeout(function () {
		this.$el.removeClass('off');
	}.bind(this), 150);

	this.open = true;
};


/**
 * Hides the dropdown
 * @method hide
 * @memberof Dropdown
 */
Dropdown.prototype.hide = function () {
	if (!this.open || !this.$parent) return;

	if (this.$parent.data(CLS.dropdown)) {
		var store = this.$parent.data(CLS.dropdown).filter(function (i) {
			return i != this;
		}.bind(this));

		this.$parent.data(CLS.dropdown, store);

		this.$el.addClass('off');

		// Animate fade out
		setTimeout(function () {
			removeElement(this.$el[0]);
		}.bind(this), 150);

		this.open = false;
	}
};

module.exports = Dropdown;
