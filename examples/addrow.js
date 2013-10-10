/*jslint browser:true,expr:true,vars:true,plusplus:true,devel:true,indent:4,maxerr:50*/
/*jshint white: true*/
/*global _, $, define*/

define([], function () {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 10; i++) {
			data.push({
				id: 'fancy_id_' + i,
				data: {
					name: "Bob Robert Jr. " + i
				}
			});
		}

		return {
			addRow: true,
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
					return '<button class="add">Add Another Row</button><button class="remove">Remove This Row</button>';
				},
				selectable: false,
				width: 300
			}],
			editable: true,
			data: data
		};
	}, function (grid) {
		grid.on('click', function (event, args) {
			event.stopPropagation();

			if ($(event.target).hasClass('add')) {
				var i = grid.collection.items.length - 1;
				grid.add({data: {name: "Bob Robert Jr. " + i}, id: 'fancy_id_' + i});
			} else if ($(event.target).hasClass('remove')) {
				grid.remove(args.item.id);
			}
		});
	}];
});