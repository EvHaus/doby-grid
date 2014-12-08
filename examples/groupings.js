/*jshint loopfunc: true*/
/*global _, define*/

define([], function () {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 50; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					population: _.sample(_.range(15, 100)),
					elevation: _.sample(_.range(500, 10000)),
					language: _.sample(["English", "French", "Italian", "Latin", null]),
					city: ['Venice', 'Vatican City', 'Rome', 'Milan', 'Constantinople'][_.random(0, 4)]
				}
			});
		}

		// Generate Columns
		var columns = [{
			id: "id",
			name: "ID",
			field: "id",
			sortable: true,
			removable: true
		}, {
			id: "city",
			name: "City",
			field: "city",
			minWidth: 160,
			sortable: true,
			removable: true
		}, {
			category: "Statistical",
			id: "elevation",
			name: "Elevation",
			field: "elevation",
			minWidth: 100,
			sortable: true,
			removable: true
		}, {
			category: "Statistical",
			id: "population",
			name: "Population",
			field: "population",
			minWidth: 100,
			sortable: true,
			removable: true
		}, {
			category: "Statistical",
			id: "language",
			name: "Language",
			field: "language",
			sortable: true,
			removable: true
		}];

		return {
			columns: columns,
			data: data,
			keepNullsAtBottom: false,
			quickFilter: true,
			stickyGroupRows: true
		};
	}, function (grid) {
		grid.setGrouping([{
			column_id: 'language',
			collapsed: false,
			colspan: false,
			groupNulls: false,
			formatter: function (row, cell, value, columnDef) {
				// The "id" column will function similar to a transition colspan row with
				// and icon defining the state of the group collapse.
				if (columnDef.id === 'id') {
					return '<div style="text-align:center"><span class="icon"></span></div>';
				} else {
					// All other rows will display totals for the groups
					return value;
				}
			},
			dataExtractor: function (data, columnDef) {
				var total = columnDef.id === 'language' || columnDef.id == 'city' ? columnDef.name : 0;
				for (var i = 0, l = data.grouprows.length; i < l; i++) {
					if (columnDef.id === 'language') {
						total = data.grouprows[i].data[columnDef.field];
					} else if (columnDef.id !== 'city') {
						total += data.grouprows[i].data[columnDef.field];
					}
				}

				return total;
			}
		}]);
	}];
});