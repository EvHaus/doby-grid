/*global define*/

define(['faker', 'dataset'], function (Faker, dataset) {
	"use strict";

	// Generate Grid Options
	return [function () {

		var idExtractor = function (item) {
			return item.id;
		};

		// Generate Columns
		var columns = [
			{
				id: "id",
				dataExtractor: idExtractor,
				name: "ID",
				maxWidth: 150,
				sortable: true,
				tooltip: "ID of the item"
			}, {
				id: "name",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true,
				tooltip: "This is the name of the individual"
			}, {
				id: "email",
				name: "Email",
				field: "email",
				sortable: true,
				tooltip: "Their email address"
			}, {
				id: "company",
				name: "Company",
				field: "company",
				sortable: true,
				tooltip: "The user's company"
			}, {
				id: "random",
				name: "Random Words",
				field: "lorem",
				sortable: true,
				tooltip: "Some random words"
			}
		];

		return {
			columns: columns,
			data: dataset,

			menuExtensions: function (event, grid, args) {
				return [{
					icon: '',
					name: "Menu Item",
					menu: [{
						name: "Submenu Item",
						fn: function (event) {
							console.log('Click the submenu.');
						}
					}]
				}, {
					divider: true
				}, {
					name: "Toggle Button",
					value: 'BTN!',
					fn: function (event) {
						console.log('Toggle the button.');
					}
				}]
			},

			// Possible values are "top" and "bottom", with the latter the default.
			menuExtensionsPosition: 'bottom'
		};
	}];
});
