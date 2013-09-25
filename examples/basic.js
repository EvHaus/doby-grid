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

		// Generate Grid
		var grid = new DobyGrid({
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
			}, {
				id: "id2",
				name: "ID",
				field: "id",
				sortable: true
			}, {
				id: "name2",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true
			}, {
				id: "age2",
				name: "Age",
				field: "age",
				sortable: true
			}, {
				id: "city2",
				name: "City",
				field: "city",
				sortable: true
			}, {
				id: "country2",
				name: "Country",
				field: "country",
				sortable: true
			}, {
				id: "id3",
				name: "ID",
				field: "id",
				sortable: true
			}, {
				id: "name3",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true
			}, {
				id: "age3",
				name: "Age",
				field: "age",
				sortable: true
			}, {
				id: "city3",
				name: "City",
				field: "city",
				sortable: true
			}, {
				id: "country3",
				name: "Country",
				field: "country",
				sortable: true
			},{
				id: "id4",
				name: "ID",
				field: "id",
				sortable: true
			}, {
				id: "name4",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true
			}, {
				id: "age4",
				name: "Age",
				field: "age",
				sortable: true
			}, {
				id: "city4",
				name: "City",
				field: "city",
				sortable: true
			}, {
				id: "country4",
				name: "Country",
				field: "country",
				sortable: true
			},{
				id: "id5",
				name: "ID",
				field: "id",
				sortable: true
			}, {
				id: "name5",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true
			}, {
				id: "age5",
				name: "Age",
				field: "age",
				sortable: true
			}, {
				id: "city5",
				name: "City",
				field: "city",
				sortable: true
			}, {
				id: "country5",
				name: "Country",
				field: "country",
				sortable: true
			}],
			data: data
		})

		return grid

	}
})