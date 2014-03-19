/*global define, Backbone */

define(['faker'], function (Faker) {
	"use strict";

	// Enable this to use a Backbone Collection instead
	var use_backbone = true;

	return [function () {
		var data, item;

		// Generate Data
		if (use_backbone) {
			data = new Backbone.Collection();
		} else {
			data = [];
		}

		for (var i = 0; i < 10000; i++) {
			item = {
				id: i,
				data: {
					id: i,
					name: Faker.Name.findName(),
					age: "100 years",
					city: Faker.Address.city(),
					country: Faker.Address.ukCountry()
				}
			};

			if (use_backbone) {
				data.add(item.data);
			} else {
				data.push(item);
			}
		}

		return {
			autoColumnWidth: true,
			autoEdit: true,
			columns: [{
				id: "id",
				editable: false,
				name: "ID",
				field: "id",
				sortable: true,
				removable: true
			}, {
				id: "name",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true,
				removable: true
			}, {
				id: "age",
				name: "Age",
				field: "age",
				sortable: true,
				removable: true
			}, {
				id: "city",
				name: "City",
				field: "city",
				sortable: true,
				visible: false,
				removable: true
			}, {
				id: "country",
				name: "Country",
				field: "country",
				sortable: true,
				removable: true
			}],
			data: data,
			//editor: editor,
			editable: true,
			quickFilter: true
		};
	}];
});