// (c) 2015 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

var CellRange = require('../src/classes/CellRange');

describe("CellRange", function () {
	"use strict";

	describe("split()", function () {
		it("should be able to split() a CellRange into two column ranges", function () {
			var range = new CellRange({fromCell: 0, toCell: 10, fromRow: 0, toRow: 10}),
				split = range.split(5),
				result = [
					new CellRange({fromCell: 0, toCell: 5, fromRow: 0, toRow: 10}),
					new CellRange({fromCell: 6, toCell: 10, fromRow: 0, toRow: 10}),
					null,
					null
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});


		// ==========================================================================================


		it("should not split() if split column and row are null", function () {
			var range = new CellRange({fromCell: 0, toCell: 10, fromRow: 0, toRow: 10}),
				split = range.split(),
				result = [
					range,
					null,
					null,
					null
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});


		// ==========================================================================================


		it("should not split() if split column is to the right of the selection", function () {
			var range = new CellRange({fromCell: 0, toCell: 1, fromRow: 0, toRow: 10}),
				split = range.split(5),
				result = [
					range,
					null,
					null,
					null
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});


		// ==========================================================================================


		it("should not split() if split column is to the left of the selection", function () {
			var range = new CellRange({fromCell: 5, toCell: 10, fromRow: 0, toRow: 10}),
				split = range.split(1),
				result = [
					null,
					range,
					null,
					null
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});


		// ==========================================================================================


		it("should be able to split() a CellRange into two row ranges", function () {
			var range = new CellRange({fromCell: 0, toCell: 10, fromRow: 0, toRow: 10}),
				split = range.split(null, 5),
				result = [
					new CellRange({fromCell: 0, toCell: 10, fromRow: 0, toRow: 5}),
					null,
					new CellRange({fromCell: 0, toCell: 10, fromRow: 6, toRow: 10}),
					null
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});


		// ==========================================================================================


		it("should not split() if split row is to the below the selection", function () {
			var range = new CellRange({fromCell: 0, toCell: 10, fromRow: 0, toRow: 1}),
				split = range.split(null, 5),
				result = [
					range,
					null,
					null,
					null
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});

		// ==========================================================================================


		it("should split() into 4 quadrants", function () {
			var range = new CellRange({fromCell: 0, toCell: 10, fromRow: 0, toRow: 10}),
				split = range.split(5, 5),
				result = [
					new CellRange({fromCell: 0, toCell: 5, fromRow: 0, toRow: 5}),
					new CellRange({fromCell: 6, toCell: 10, fromRow: 0, toRow: 5}),
					new CellRange({fromCell: 0, toCell: 5, fromRow: 6, toRow: 10}),
					new CellRange({fromCell: 6, toCell: 10, fromRow: 6, toRow: 10})
				];

			expect(split[0]).toEqual(result[0]);
			expect(split[1]).toEqual(result[1]);
			expect(split[2]).toEqual(result[2]);
			expect(split[3]).toEqual(result[3]);
		});
	});
});
