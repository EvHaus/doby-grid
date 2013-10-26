// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: false, nomen: true, indent: 4, maxerr: 50*/
/*global _, $, describe, document, expect, DobyGrid, Image, it, runs, setFixtures, waitsFor, window*/

describe("Column Options", function () {
	"use strict";


	// ==========================================================================================


	// Utilities for resetting the grid
	var defaultData = function () {
		return JSON.parse(JSON.stringify({
			columns: [
				{id: 'id', field: 'id', name: 'id'},
				{id: 'name', field: 'name', name: 'name'}
			],
			data: [
				{data: {id: 189, name: 'test'}, id: 189},
				{data: {id: 289, name: 'test2'}, id: 289}
			]
		}));
	};

	var resetGrid = function (options) {
		options = options || {};
		var grid = new DobyGrid(options),
			fixture = setFixtures();

		// This is needed for grunt-jasmine tests which doesn't read the CSS
		// from the HTML version of jasmine.
		fixture.attr('style', 'position:absolute;top:0;left:0;opacity:0;width:500px');

		grid.appendTo(fixture);
		return grid;
	};


	// ==========================================================================================


	describe("options.aggregator", function () {
	});
});