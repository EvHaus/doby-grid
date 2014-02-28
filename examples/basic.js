/*jshint loopfunc: true*/
/*global _, define*/

define(['faker', 'dataset'], function (Faker, dataset) {
	"use strict";

	// Generate Grid Options
	return [function () {

		// Generate Columns
		var columns = [];
		for (var q = 0; q < 3; q++) {
			columns.push({
				id: "id" + q,
				name: "ID",
				formatter: function (row, cell, value, columnDef, data) {
					return data.id;
				},
				maxWidth: 150,
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
				id: "email" + q,
				name: "Email",
				field: "email",
				sortable: true,
				tooltip: "Their email address"
			}, {
				id: "company" + q,
				name: "Company",
				field: "company",
				sortable: true,
				tooltip: "The user's company"
			}, {
				id: "random" + q,
				name: "Random Words",
				field: "lorem",
				sortable: true,
				tooltip: "Some random words"
			});
		}

		return {
			columns: columns,
			data: dataset
		};
	}];
});