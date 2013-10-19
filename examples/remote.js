/*jslint browser:true,expr:true,vars:true,plusplus:true,devel:true,indent:4,maxerr:50*/
/*jshint white: true*/
/*global $, _, define*/

define(['faker'], function (Faker) {
	"use strict";

	return [function () {

		var data = [];
		for (var i = 0; i < 10000; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: Faker.Name.findName(),
					age: _.sample([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]),
					city: Faker.Address.city()
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
			}],

			data: function () {

				// count()
				// Expects to return a integer representing the total number of data objects available.
				//
				// @param	options		object		Fetch options
				// @param	callback	function	Callback function
				//
				this.count = function (options, callback) {
					// Fake AJAX delay
					setTimeout(function () {
						callback(data.length);
					}, 100);
				};

				// fetch()
				// Expects to return an array of data objects via the callback.
				// Should return back a jQuery AJAX object.
				//
				// @param	options		object		Fetch options
				// @param	callback	function	Callback function
				//
				// The following options will be passed in:
				//
				// @opt		filters		object		Filters that are applied by the user
				// @opt		limit		integer		The number of items needed
				// @opt		offset		integer		On which row to start fetching
				//
				// @return object
				this.fetch = function (options, callback) {
					// Fake AJAX delay
					return setTimeout(function () {
						var mydata = JSON.parse(JSON.stringify(data));

						// Apply fake sort
						if (options.order.length) {
							mydata.sort(function (dataRow1, dataRow2) {
								var result = 0, column, value1, value2, dir;

								// Loops through the columns by which we are sorting
								for (var i = 0, l = options.order.length; i < l; i++) {
									column = options.order[i].columnId;
									value1 = dataRow1.data[column];
									value2 = dataRow2.data[column];

									// Use natural sort by default
									if (value1 === value2) result += 0;
									else result += options.order[i].sortAsc ? (value1 > value2) : (value1 < value2);
								}

								return result;
							});
						}

						callback(mydata.slice(options.offset, options.offset + options.limit));
					}, 100);
				};

				this.fetchGroups = function (options, callback) {
					callback([]);
				};

				this.onLoading = function () {
					if (!this.grid.$el) return;
					var loader = $('<div class="myloader" style="background:rgba(0,0,0,0.2);position:absolute;top:30px;left:0;right:0;bottom:0;text-align:center;line-height:300px">Loading...</div>')
						.hide()
						.appendTo(this.grid.$el)
						.fadeIn(150);
				};

				this.onLoaded = function () {
					if (!this.grid.$el) return;
					this.grid.$el.children('.myloader')
						.fadeOut(150, function () {
							$(this).remove();
						});
				};
			}
		};
	}];
});