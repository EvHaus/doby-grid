// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, nomen: true, indent: 4, maxerr: 50*/
/*global describe, expect, DobyGrid, it*/

describe("Initialization and validation", function () {
	"use strict";

	it("should be accessible via browser script import", function () {
		expect(DobyGrid).toBeDefined();
		expect(typeof(DobyGrid)).toEqual('function');
	});


	// ==========================================================================================


	it("should be able to initialize a grid with default options", function () {
		expect(function () { new DobyGrid(function () {}); }).toThrow();
	});


	// ==========================================================================================


	it("should throw a TypeError the given options param is not an object", function () {
		var tp = new TypeError('The "options" param must be an object.');
		expect(function () { new DobyGrid(1);} ).toThrow(tp);
		expect(function () { new DobyGrid('testing');} ).toThrow(tp);
		expect(function () { new DobyGrid([]);} ).toThrow(tp);
		expect(function () { new DobyGrid(function () {});} ).toThrow(tp);
	});
});