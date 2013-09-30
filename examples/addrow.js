define([], function() {
	return function(DobyGrid) {

		// Generate Data
		var data = []
		for (var i = 0; i < 10; i++) {
			data.push({
				data: {
					id: 'fancy_id_' + i,
					name: "Bob Robert Jr. " + i
				}
			});
		}

		// Generate Grid
		var grid = new DobyGrid({
			addRow: true,
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
				focusable: false,
				formatter: function () {
					return '<button class="add">Add Another Row</button><button class="remove">Remove This Row</button>'
				},
				selectable: false,
				width: 300
			}],
			editable: true,
			data: data
		})

		grid.on('click', function(event, args) {
			event.stopPropagation()

			if ($(event.target).hasClass('add')) {
				i++
				grid.add({data: {id: 'fancy_id_' + i, name: "Bob Robert Jr. " + i}})
			} else if ($(event.target).hasClass('remove')) {
				grid.remove(args.item.data.id)
			}
		})

		return grid

	}
})