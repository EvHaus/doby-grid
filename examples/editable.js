define([], function() {
	return [function () {

		// Generate Data
		var data = []
		for (var i = 0; i < 10000; i++) {
			data.push({
				data: {
					id: i,
					name: "Pope John "+i,
					age: "100 years",
					city: ['Venice','Vatican City','Rome'][_.random(0,2)],
					country: "ITA"
				}
			});
		}

		return {
			autoColumnWidth: true,
			autoEdit: true,
			columns: [{
				id: "id",
				name: "ID",
				field: "id",
				sortable: true
			}, {
				id: "name",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true
			}, {
				id: "age",
				name: "Age",
				field: "age",
				sortable: true
			}, {
				id: "city",
				name: "City",
				field: "city",
				sortable: true
			}, {
				id: "country",
				name: "Country",
				field: "country",
				sortable: true
			}],
			data: data,
			editable: true
		}
	}]
})