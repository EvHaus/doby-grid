/*global _, define*/

define(['faker'], function (Faker) {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 1000; i++) {
			data.push({
				id: 'id_' + i,
				data: {
					id: 'id_' + i,
					name: Faker.Name.findName(),
					age: _.sample(_.range(1, 100))
				},
				columns: {
					0: {
						colspan: _.sample([1, 2, 3])
					},
					1: {
						colspan: _.sample([1, 2])
					},
				}
			});
		}

		return {
			columns: [{
				id: "id",
				name: "ID",
				field: "id",
				formatter: function (row, cell, value, columnDef, data) {
					return data.id;
				},
				sortable: true
			}, {
				id: "name",
				name: "Name",
				field: "name"
			}, {
				id: "age",
				name: "Age",
				field: "age"
			}],
			data: data,
			editable: true
		};
	}];
});