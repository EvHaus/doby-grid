/*global $, _, define*/

define(['faker'], function (Faker) {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 10000; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: Faker.Name.findName(),
					age: _.sample([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
					city: Faker.Address.city(),
					rsvp: _.random(0, 1)
				}
			});
		}

		return {
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
				cache: false,
				id: "rsvp",
				name: "RSVP",
				field: "rsvp",
				sortable: true,
				postprocess: function (data) {
					var icon = data.data.data.rsvp ? 'plus-small' : 'minus-small';
					var img = new Image();
					img.src = '../assets/img/' + icon + '.png';
					img.onload = function () {
						data.$cell.empty();
						$(img)
							.hide()
							.appendTo(data.$cell)
							.fadeIn(250);
					};
				}
			}, {
				cache: true,
				id: "rsvpc",
				name: "Cached RSVP",
				field: "rsvpc",
				sortable: true,
				postprocess: function (data, callback) {
					var icon = data.data.data.rsvp ? 'plus-small' : 'minus-small';
					var img = new Image();
					img.src = '../assets/img/' + icon + '.png';
					img.onload = function () {
						data.$cell.empty();
						$(img)
							.hide()
							.appendTo(data.$cell)
							.fadeIn(250, function () {
								callback();
							});
					};
				}
			}],
			data: data
		};
	}];
});