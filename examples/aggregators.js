/*jshint loopfunc: true*/
/*global _, define*/

define([], function () {
	"use strict";

	var default_aggregators = [{
		name: "Average",
		fn: function (column) {
			this.total = [];
			this.exporter = function () {
				var avg;
				if (this.total.length) {
					avg = this.total.reduce(function (a, b) { return a + b; });
				}
				return Math.round(avg / this.total.length);
			};
			this.formatter = function () {
				var avg;
				if (this.total.length) {
					avg = this.total.reduce(function (a, b) { return a + b; });
				}
				return "Avg: <strong>" + Math.round(avg / this.total.length) + "</strong>";
			};
			this.process = function (item) {
				this.total.push(item.data[column.field]);
			};
			return this;
		},
	}, {
		name: "Total",
		fn: function (column) {
			this.total = 0;
			this.exporter = function () {
				return (this.total || "");
			};
			this.formatter = function () {
				return "Total: <strong>" + this.total + "</strong>";
			};
			this.process = function (item) {
				this.total += (item.data[column.field] || 0);
			};
			return this;
		}
	}];

	// Generate Grid Options
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
			aggregators: default_aggregators,
			id: "elevation",
			name: "Elevation",
			field: "elevation",
			minWidth: 100,
			sortable: true,
			removable: true
		}, {
			category: "Statistical",
			aggregators: default_aggregators,
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
			quickFilter: true
		};
	}, function (grid) {
		grid.addGrouping('city', {collapsed: false});
	}];
});