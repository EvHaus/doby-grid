// doby-grid.js 0.0.1
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

if (typeof define !== 'function' || !define.amd) {
	throw 'You must have require js installed to use Doby Grid';
}

define(['jquery', 'underscore'], function($, _) {
	return function(options) {

		// Current version of the library
		this.VERSION = '0.0.1';


		// DobyGrid()
		// Creates a new DobyGrid instance.
		//
		// @param	options		object		Options for this module
		//
		// @option	icon		string		URL to the application icon
		//
		this.initialize = function(options) {
			return this;
		};


		return this.initialize(options);
	};
});