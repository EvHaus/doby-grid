define([], function() {
	return function(DobyGrid) {

		// Generate Grid
		var grid = new DobyGrid({
			autoColumnWidth: true,
			columns: [{
				id: "id",
				name: "ID",
				field: "id",
				sortable: true
			}, {
				id: "name",
				name: "Name",
				field: "name",
				sortable: true
			}, {
				id: "city",
				name: "City",
				field: "city",
				sortable: true
			}, {
				id: "country",
				name: "Country",
				field: "country"
			}]
		})

		return grid

	}
})