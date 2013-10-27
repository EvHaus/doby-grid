/*jslint browser:true,expr:true,vars:true,plusplus:true,indent:4,maxerr:50*/
/*jshint white: true*/
/*global _, $, define*/

define(['backbone', 'faker'], function (Backbone, Faker) {
	"use strict";

	return [function () {

		// Generate Data
		var collection = new Backbone.Collection();

		for (var i = 0; i < 1000; i++) {
			collection.add({
				id: i,
				name: Faker.Name.findName(),
				city: Faker.Address.city()
			});
		}

		return {
			columns: [{
				id: "id",
				name: "ID",
				field: "id"
			}, {
				id: "name",
				name: "Name",
				field: "name",
				minWidth: 100
			}, {
				id: "city",
				name: "City",
				field: "city"
			}],
			data: collection
		};
	}, function (grid) {

	}];
});