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


	it("should throw an exception when attempting to add() an item with a non-unique id", function () {
		var item = {data: {id: 101, name: 'updated'}}
		expect(function () {
			methodGrid.add(item)
			methodGrid.add(item)
		}).toThrow('You are not allowed to add() items without a unique \'id\' value. A row with id \'' + item.data.id + '\' already exists.')
	})


	// ==========================================================================================


	it("should be able to get() model by id", function () {
		var item = {data: {id: 102, name: 'updated'}}
		methodGrid.add(item)
		var gotten = methodGrid.get(102)
		expect(gotten.data.id).toEqual(102)
	})


	// ==========================================================================================


	it("should be able to get() model by reference", function () {
		var item = {data: {id: 103, name: 'updated'}}
		methodGrid.add(item)
		var gotten = methodGrid.get({data: {id: 103, name: 'updated'}})
		expect(gotten.data.id).toEqual(103)
	})


	// ==========================================================================================


	it("should be able to reset() the grid with a new set of data", function () {
		var newdata = [{data: {id: 1, name: 'test'}}, {data: {id: 2, name: 'test2'}}];
		methodGrid = methodGrid.reset(newdata)
		expect(methodGrid.collection.items).toEqual(newdata)
	})


	// ==========================================================================================


	it("should be able to empty the grid via reset()", function () {
		// Ensure empty alert isn't on
		methodGrid.setOptions({emptyNotice: false})

		methodGrid = methodGrid.reset()
		expect(methodGrid.collection.items).toEqual([])
	})


	// ==========================================================================================


	it("should be able to destroy() the grid", function () {
		methodGrid.destroy()
		expect(methodGrid.$el).toEqual(null)
	})



})