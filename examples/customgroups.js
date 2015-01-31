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
			data: [],
			keepNullsAtBottom: false,
			quickFilter: true,
			customGroups : true,
			stickyGroupRows: true
		};
	}, function (grid) {
		grid.setGrouping([{
			      column_id: 'language',
			      groups: [{
			          count: 432,
			          value: 'A'
			      }, {
			          count: 192,
			          value: 'B'
			      }]
			 }, {
			      column_id: 'population',
			      groups: [{
			          count: 12,
			          value: '1',
			          parent: 'A'
			      }, {
			          count: 14,
			          value: '2',
			          parent: 'A'
			      }]
			 }]);
	}];
});