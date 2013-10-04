// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/

describe("Methods and Data Manipulation", function () {

	var methodGrid = new DobyGrid()

	describe("add()", function () {
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
			methodGrid.add(item, {at: 0})
			var newItems = methodGrid.collection.items;
			var newDataItems = _.filter(newItems, function (i) {return !i.__nonDataRow})
			expect(newDataItems[0]).toEqual(item)
		})


		// ==========================================================================================


		it("should be able to merge data item via add() when adding item with the same id", function () {
			// Prepare for unit test
			methodGrid.reset([{data: {id: 101, name: 'test'}}])

			// Execute
			var item = {data: {id: 101, name: 'updated'}}
			methodGrid.add(item, {merge: true})

			// Validate
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
	})


	// ==========================================================================================


	describe("addColumn()", function () {
		it("should be able to push a new column via addColumn()", function () {
			var col_def = {
				id: "addColumnTest1",
				field: "addColumnTest1"
			}

			methodGrid.addColumn(col_def)

			var lastcol = methodGrid.options.columns[methodGrid.options.columns.length - 1]
			expect(lastcol.id).toEqual(col_def.id);
		})


		// ==========================================================================================


		it("should be able to push a new column via addColumn() 'at' a specific index", function () {
			var col_def = {
				id: "addColumnTest1",
				field: "addColumnTest1"
			}

			var col_def2 = {
				id: "addColumnTest2",
				field: "addColumnTest2"
			}

			methodGrid.addColumn(col_def)
			methodGrid.addColumn(col_def2, {at: 0})

			var firstcol = methodGrid.options.columns[0]
			expect(firstcol.id).toEqual(col_def2.id);
		})


		// ==========================================================================================


		it("should be able to push a column update via addColumn() using merge", function () {
			var col_def = {
				id: "addColumnTest3",
				field: "addColumnTest3"
			}

			methodGrid.addColumn(col_def)

			col_def = JSON.parse(JSON.stringify(col_def))
			col_def.field = 'CHANGED!'

			methodGrid.addColumn(col_def, {merge: true})

			var lastcol = methodGrid.options.columns[methodGrid.options.columns.length - 1]
			expect(lastcol.id).toEqual(col_def.id);
			expect(lastcol.field).toEqual(col_def.field);
		})


		// ==========================================================================================


		it("should throw an error if attempting to addColumn() with 'id' that already exists", function () {
			var col_def = {
				id: "addColumnTest4",
				field: "addColumnTest4"
			}

			methodGrid.addColumn(col_def)

			expect(function() {
				methodGrid.addColumn(col_def)
			}).toThrow("Unable to addColumn() because a column with id '" + col_def.id + "' already exists. Did you want to {merge: true} maybe?");
		})


		// ==========================================================================================


		it("should throw an error if attempting to addColumn() with non data objects", function () {
			var bad_data = [[], 'asd', 123, document.body];
			_.each(bad_data, function(bd) {
				expect(function() {
					methodGrid.addColumn(bd)
				}).toThrow("Unable to addColumn() because the given 'data' param is invalid.");
			})
		})
	})


	// ==========================================================================================


	describe("get()", function () {
		it("should be able to get() model by id", function () {
			// Prepare for test
			var item = {data: {id: 102, name: 'updated'}}
			methodGrid.reset([item])

			// Validate
			var gotten = methodGrid.get(102)
			expect(gotten.data.id).toEqual(102)
		})


		// ==========================================================================================


		it("should be able to get() model by reference", function () {
			// Prepare for test
			var item = {data: {id: 103, name: 'updated'}}
			methodGrid.reset([item])

			// Validate
			var gotten = methodGrid.get({data: {id: 103, name: 'updated'}})
			expect(gotten.data.id).toEqual(103)
		})
	})


	// ==========================================================================================


	describe("reset()", function () {
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
	})


	// ==========================================================================================


	describe("remove()", function () {
		it("should be able to remove() an item from the grid", function () {
			// Prepare grid for test
			var newdata = [{data: {id: 1, name: 'test'}}, {data: {id: 2, name: 'test2'}}];
			methodGrid.reset(newdata)

			methodGrid = methodGrid.remove(2)
			expect(methodGrid.collection.items).toEqual([newdata[0]])
		})
	})


	// ==========================================================================================


	describe("setOptions()", function () {
		it("should be able to reload data using setOptions()", function () {
			methodGrid.setOptions({
				data: [{data: {id: 189, name: 'test'}}, {data: {id: 289, name: 'test2'}}]
			})

			expect(_.pluck(methodGrid.collection.items, 'id')).toEqual([189, 289])
		})
	})


	// ==========================================================================================


	describe("destroy()", function () {
		it("should be able to destroy() the grid", function () {
			methodGrid.destroy()
			expect(methodGrid.$el).toEqual(null)
		})
	})



})