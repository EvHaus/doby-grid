// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/

describe("Methods and Data Manipulation", function () {

	var methodGrid = new DobyGrid()

	it("should be able to insert a new data item via add()", function () {
		var item = {data: {id: 100, name: 'test'}}
		var originalItems = JSON.parse(JSON.stringify(methodGrid.collection.items));
		var originalDataItems = _.filter(originalItems, function (i) {return !i.__nonDataRow})
		methodGrid.add(item)
		var newItems = methodGrid.collection.items;
		var newDataItems = _.filter(newItems, function (i) {return !i.__nonDataRow})
		expect(originalDataItems.length).toEqual(0)
		expect(newDataItems).toEqual([item])
	})


	// ==========================================================================================


	it("should be able to insert a new data item via add() at a specific index", function () {
		var item = {data: {id: 101, name: 'test'}}
		var originalItems = JSON.parse(JSON.stringify(methodGrid.collection.items));
		var originalDataItems = _.filter(originalItems, function (i) {return !i.__nonDataRow})
		methodGrid.add(item, {at: 0})
		var newItems = methodGrid.collection.items;
		var newDataItems = _.filter(newItems, function (i) {return !i.__nonDataRow})
		expect(originalDataItems.length).toBeGreaterThan(0)
		expect(newDataItems[0]).toEqual(item)
	})


	// ==========================================================================================


	it("should be able to merge data item via add() when adding item with the same id", function () {
		var item = {data: {id: 101, name: 'updated'}}
		methodGrid.add(item, {merge: true})
		var newItem = methodGrid.get(101)
		expect(JSON.stringify(item)).toEqual(JSON.stringify(newItem))
	})


	// ==========================================================================================


	it("should not be able to add() data without a unique id", function () {
		var item = {data: {id: 101, name: 'updated'}}
		expect(function () {
			methodGrid.add(item)
		}).toThrow('You are not allowed to add() items without a unique \'id\' value. A row with id \'' + item.data.id + '\' already exists.')
	})


	// ==========================================================================================


	it("should be able to get() model by id", function () {
		var gotten = methodGrid.get(101)
		expect(gotten.data.id).toEqual(101)
	})


	// ==========================================================================================


	it("should be able to get() model by reference", function () {
		var gotten = methodGrid.get({data: {id: 101, name: 'updated'}})
		expect(gotten.data.id).toEqual(101)
	})


	// ==========================================================================================


	it("should be able to destroy() the grid", function () {
		methodGrid.destroy()
		expect(methodGrid.$el).toEqual(null)
	})


})