define([], function() {
	return function(DobyGrid) {

		// Generate Data
		var data = []
		for (var i = 0; i < 10; i++) {
			data.push({
				data: {
					id: i,
					name: "Bob Robert Jr. "+i
				}
			});
		}

		// Generate Grid
		var grid = new DobyGrid({
			addRow: false,
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
				editable: false,
				id: "action",
				name: "Action",
				field: "action",
				formatter: function () {
					return '<div style="text-align:center"><a>Add Another Row</a></div>'
				},
				width: 200
			}],
			editable: true,
			data: data
		})

		grid.on('click', function(event, args) {
			event.stopPropagation()

			if (args.cell == 2) {
				i++
				grid.add({data: {id: i}})
			}
		})

		return grid

	}
})