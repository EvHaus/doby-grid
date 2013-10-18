/*jslint browser:true,expr:true,vars:true,plusplus:true,devel:true,indent:4,maxerr:50*/
/*jshint white: true*/
/*global _, $, define*/

define([], function () {
	"use strict";

	// Generate Grid Options
	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 50; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					population: _.sample([15, 24, 14, 62, 12, 1, 100]),
					city: ['Venice', 'Vatican City', 'Rome', 'Milan', 'Constantinople'][_.random(0, 4)]
				}
			});
		}

		// Generate Columns
		var columns = [];
		for (var q = 0; q < 5; q++) {
			columns.push({
				aggregator: function (column) {
					this.total = [];
					this.exporter = function () {
						var avg = this.total.reduce(function (a, b) { return a + b; });
						return Math.round(avg / this.total.length);
					};
					this.formatter = function () {
						var avg = this.total.reduce(function (a, b) { return a + b; });
						return "Avg: <strong>" + Math.round(avg / this.total.length) + "</strong>";
					};
					this.process = function (item) {
						this.total.push(item.id);
					};
					return this;
				},
				id: "id" + q,
				name: "ID",
				field: "id",
				sortable: true
			}, {
				aggregator: function (column) {
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
				},
				id: "population" + q,
				name: "Population",
				field: "population",
				minWidth: 100,
				sortable: true
			}, {
				id: "city" + q,
				name: "City",
				field: "city",
				sortable: true
			});
		}

		return {
			columns: columns,
			data: data
		};
	}, function (grid) {
		grid.addGrouping('city1', {collapsed: false});
	}];
});