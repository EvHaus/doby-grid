// doby-grid.js
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/

describe("Rendering", function () {

	// Default options for the grid
	var options = {
		autoDestroy: false,
		columns: [{
			id: "id",
			name: "ID",
			field: "id"
		}, {
			id: "name",
			name: "Name",
			field: "name"
		}],
		data: [{
			data: {
				id: 1,
				name: "Some Name"
			}
		}]
	}

	// Create a new grid inside a fixture
	var grid = new DobyGrid(options)
	var fixture = setFixtures('<div id="text-container"></div>')
	grid.appendTo(fixture)


	// ==========================================================================================


	it("should append the grid to a container via appendTo()", function () {
		expect(fixture).toContain('div.doby-grid')
	})


	// ==========================================================================================


	it("should return a DobyGrid object via appendTo()", function () {
		expect(grid instanceof DobyGrid).toEqual(true)
		expect(typeof(grid)).toEqual('object')
	})


	// ==========================================================================================


	describe("Column Headers", function () {


		it("should render the expected number of column headers", function () {
			expect(grid.$el.find('.doby-grid-header-column').length).toEqual(options.columns.length)
		})


	})


	// ==========================================================================================


	describe("Grid Body", function () {


		it("should render the expected number of columns for every row", function () {
			expect(grid.$el.find('.doby-grid-row:first .doby-grid-cell').length).toEqual(options.columns.length)
		})


		// ==========================================================================================


		it("should automatically render a new row when you use add()", function () {
			var newrow = {data: {id: 2, name: "adding a new row"}}
			grid.add(newrow)
			var lastcell = grid.$el.find('.doby-grid-row:last-child .doby-grid-cell:last-child').text()
			expect(lastcell).toEqual(newrow.data.name)
		})


		// ==========================================================================================


		it("should render collapsed group headers when adding grouping", function () {
			gcolumn = options.columns[1]

			// Add some additional rows for testing
			grid.add([
				{data: {id: 3, name: "adding a new row"}},
				{data: {id: 4, name: "adding a new row"}},
				{data: {id: 5, name: "adding a new row"}},
				{data: {id: 6, name: "adding a new row"}}
			])

			// Group by column
			grid.addGrouping(gcolumn.id)

			// Figure out how many groups to expect
			groups = _.groupBy(grid.collection.items, function (i) { return i.data[gcolumn.field]})
			groups = _.keys(groups)

			// Grab the grid rows
			rows = grid.$el.find('.doby-grid-row')

			// Expect to find as many group headers as there are different values
			expect(rows.length).toEqual(groups.length)
			expect(rows).toHaveClass('doby-grid-group')

			// Clear grouping
			grid.setGrouping()
		})


		// ==========================================================================================


		it("should render an empty notice when there is no data", function () {
			// Ensure empty notice is on
			grid.setOptions({emptyNotice: true})

			// Empty the grid
			grid.reset()

			// Check to see if alert was rendered
			expect(grid.$el).toContain('.doby-grid-alert')

			// Disable empty notice
			grid.setOptions({emptyNotice: false})
		})


		// ==========================================================================================


		it("should remove the relevant row from the DOM when calling remove()", function () {
			// Prepare the grid for testing
			grid.reset([{data: {id: 1}}, {data: {id: 2}}])

			// Remove the second row
			grid.remove(2)

			// Check to see if the right row was removed
			rows = grid.$el.find('.doby-grid-row')
			cell = $(rows[0]).children('.doby-grid-cell:first').first()
			expect(rows.length).toEqual(1)

			// Make sure the first row is left behind
			expect(cell.text()).toEqual('1')
		})


		// ==========================================================================================


		it("should render a special row at the end of the grid when using 'addRow'", function () {
			// Prepare data for test
			grid.setOptions({
				addRow: true,
				data: [{data: {id: 1, name: "one"}}, {data: {id: 2, name: "two"}}],
				editable: true
			})

			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').each(function () {
				expect(this).toBeEmpty()
			})

			// Disable to prevent conflict with other tests
			grid.setOptions({addRow: false, editable: false})

			// Make sure row is removed
			grid.$el.find('.doby-grid-row:last-child .doby-grid-cell').each(function () {
				expect(this).not.toBeEmpty()
			})
		})


		// ==========================================================================================


		it("should enable variable row height mode when an item is add()ed with a custom height", function () {
			// Reset
			grid.reset([{data: {id: 1, name: 'test'}}])

			// Insert
			grid.add({data: {id: 2, name: 'test'}, height: 1500})

			// Make sure row has the right height
			grid.$el.find('.doby-grid-row:last-child').each(function () {
				expect($(this).height()).toEqual(1500)
			})
		})

	})


})