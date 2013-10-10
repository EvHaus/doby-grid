define([], function() {
	// Generate Grid
	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 10; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: "This is row #" + i,
					category: _.sample(['A','B','C','D'])
				},
				height: _.random(20, 70)
			});
		}

		return {
			autoColumnWidth: true,
			columns: [{
				id: "id",
				name: "ID",
				field: "id"
			}, {
				id: "name",
				name: "Name",
				field: "name"
			}, {
				id: "category",
				name: "Category",
				field: "category"
			}, {
				id: "height",
				name: "Row Height",
				formatter: function(row, cell, value, columnDef, data) {
					return data.height;
				}
			}],
			data: data,
			resizableRows: true
		};
	}, function (grid) {
		//grid.setGrouping(['category']);
	}];
});