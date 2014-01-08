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
				// Via callback, should return an array of data objects for the given options set.
				//
				// Should return back a pointer to your jQuery AJAX object.
				//
				// @param	options		object		Fetch options
				// @param	callback	function	Callback function
				//
				// The following options will be passed in:
				//
				// @opt		columns		array		List of currently active column objects
				// @opt		filters		object		Filters that are applied by the user
				// @opt		limit		integer		The number of items needed
				// @opt		offset		integer		On which row to start fetching
				// @opt		order		array		A list of the current sort order objects
				//
				// @return object
				this.fetch = function (options, callback) {
					// Fake AJAX delay
					return setTimeout(function () {
						var mydata = JSON.parse(JSON.stringify(data));

						// Apply fake sort
						if (options.order.length) {
							mydata.sort(function (dataRow1, dataRow2) {
								var result = 0, column, value1, value2;

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

						// Apply fake offset and fake limit
						callback(mydata.slice(options.offset, options.offset + options.limit));
					}, 100);
				};


				// fetchGroups()
				// Via callback, should return the values for a given group request with the group value
				// and the count for each group.
				//
				// Should return back a pointer to your jQuery AJAX object.
				//
				// @param	options		object		Grouping options
				// @param	callback	function	Callback function
				//
				// The following options will be passed in:
				//
				// @opt		groups		array		A list of grouping objects currently enabled
				//
				// @return object
				this.fetchGroups = function (options, callback) {
					// Fake AJAX delay
					return setTimeout(function () {
						// TODO: Support nested groups somehow
						var c_idx = 0,
							column_id = options.groups[c_idx].column_id,
							grouped = _.groupBy(data, function (item) {
								return item.data[column_id];
							}),
							results = [];

						// Generate results
						for (var group in grouped) {
							results.push({
								column_id: column_id,
								count: grouped[group].length,
								groups: null, // TODO: For nested groups
								value: group
							});
						}

						callback(results);
					}, 100);
				};


				// onLoading()
				// This function will be called when the grid begins processing a request. This is your chance
				// to draw a progress bar or loading spinner.
				//
				this.onLoading = function () {
					if (!this.grid.$el) return;

					// Generate a loader overlay
					if (!this.loader) {
						this.loader = $('<div class="myloader" style="background:rgba(0,0,0,0.2);position:absolute;top:30px;left:0;right:0;bottom:0;text-align:center;line-height:300px;opacity:0;pointer-events:none;z-index:10;transition:0.1s opacity ease-in-out">Loading...</div>').appendTo(this.grid.$el);

						// Start CSS animation
						this.loader.width();
					}

					// Fade in
					this.loader.css('opacity', 1);
				};


				// onLoaded()
				// This function will be called when the grid stops processing a request.
				//
				this.onLoaded = function () {
					if (!this.grid.$el || !this.loader) return;
					this.loader.css('opacity', 0);
				};
			}
		};
	}];
});