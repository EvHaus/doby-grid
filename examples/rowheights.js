define(['faker'], function(Faker) {
	// Generate Grid
	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 1000; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					text: Faker.Lorem.words(120).join(' '),
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
				id: "text",
				name: "Text",
				field: "text",
				formatter: function(row, cell, value, columnDef, data) {
					return '<div style="line-height:normal;white-space:normal">' + data.data[columnDef.field] + '</div>';
				}
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
	}];
});