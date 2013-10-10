/*jslint browser:true,expr:true,vars:true,plusplus:true,devel:true,indent:4,maxerr:50*/
/*jshint white: true*/
/*global $, _, define*/

define([], function () {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 10000; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: "Pope John " + i,
					age: "100 years",
					city: ['Venice', 'Vatican City', 'Rome'][_.random(0, 2)],
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
				postprocess: function (data, callback) {
					var icon = data.data.data.rsvp ? 'plus-circle' : 'minus-circle';
					var img = new Image();
					img.src = '../assets/img/' + icon + '.png';
					img.onload = function () {
						data.cell.empty();
						$(img)
							.hide()
							.appendTo(data.cell)
							.fadeIn(250, function () {
								callback();
							});
					};
				},
			}, {
				cache: true,
				id: "rsvpc",
				name: "Cached RSVP",
				field: "rsvpc",
				sortable: true,
				postprocess: function (data, callback) {
					var icon = data.data.data.rsvp ? 'plus-circle' : 'minus-circle';
					var img = new Image();
					img.src = '../assets/img/' + icon + '.png';
					img.onload = function () {
						data.cell.empty();
						$(img)
							.hide()
							.appendTo(data.cell)
							.fadeIn(250, function () {
								callback();
							});
					};
				},
			}],
			data: data
		};
	}];
});