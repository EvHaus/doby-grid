define([], function() {
	return function(DobyGrid) {

		// Generate Data
		var data = []
		for (var i = 0; i < 10000; i++) {
			data.push({
				data: {
					id: i,
					name: "Pope John "+i,
					age: "100 years",
					city: ['Venice','Vatican City','Rome','Milan','Constantinople'][_.random(0,4)],
					country: "ITA"
				}
			});
		}

		// Generate Columns
		var columns = []
		for (var q = 0; q < 5; q++) {
			columns.push({
				id: "id" + q,
				name: "ID",
				field: "id",
				sortable: true,
				tooltip: "ID of the item"
			}, {
				id: "name" + q,
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true,
				tooltip: "This is the name of the individual"
			}, {
				id: "age" + q,
				name: "Age",
				field: "age",
				sortable: true,
				tooltip: "The age of the culprit"
			}, {
				id: "city" + q,
				name: "City",
				field: "city",
				sortable: true,
				tooltip: "City of birth"
			}, {
				id: "country" + q,
				name: "Country",
				field: "country",
				sortable: true,
				tooltip: "Country of origin"
			})
		}


		// Generate Grid
		var grid = new DobyGrid({
			columns: columns,
			data: data
		})

		return grid

	}
})