/*global $, _, define*/

define(['faker'], function (Faker) {
	"use strict";

	return [function () {

		var data = [];
		for (var i = 0; i < 10; i++) {
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
								var result = 0, column, value1, value2, val;

								// Loops through the columns by which we are sorting
								for (var i = 0, l = options.order.length; i < l; i++) {
									column = options.order[i].columnId;
									value1 = dataRow1.data[column];
									value2 = dataRow2.data[column];

									if (value1 !== value2) {
										val = options.order[i].sortAsc ? (value1 > value2) ? 1 : -1 : (value1 < value2) ? 1 : -1;
										if (val !== 0) return val;
									}
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
				// @opt		order		array		A list of the current sort order objects
				//
				// Expecting results in the following format:
				//
				// [{
				//		column_id: 'first_grouped_column',
				//		groups: [{
				//			count: 432,
				//			value: 'A'
				//		}, {
				//			count: 192,
				//			value: 'B'
				//		}]
				// }, {
				//		column_id: 'second_grouped_column',
				//		groups: [{
				//			count: 12,
				//			value: '1',
				//			parent: 'A'
				//		}, {
				//			count: 14,
				//			value: '2',
				//			parent: 'A'
				//		}]
				// }]
				//
				// @return object
				this.fetchGroups = function (options, callback) {
					// Fake AJAX delay
					return setTimeout(function () {
						var results = [], column_id;

						var generateGroup = function (column_id, data, level, parent_group_value) {
							var groups = [], grouped;

							grouped = _.groupBy(data, function (item) {
								return item.data[column_id];
							});
							_.each(_.keys(grouped).sort(), function (group) {
								groups.push({
									_rows: grouped[group],
									count: grouped[group].length,
									parent: parent_group_value,
									value: group
								});
							});

							// Sort the group results according to request
							groups.sort(function (a, b) {
								var result = 0, val;
								// Loops through the columns by which we are sorting
								for (var i = 0, l = options.order.length; i < l; i++) {
									if (!isNaN(parseInt(a.value, 10))) a.value = parseInt(a.value, 10);
									if (!isNaN(parseInt(b.value, 10))) b.value = parseInt(b.value, 10);

									if (a.value !== b.value) {
										val = options.order[i].sortAsc ? (a.value > b.value) ? 1 : -1 : (a.value < b.value) ? 1 : -1;
										if (val !== 0) return val;
									}
								}

								return result;
							});

							if (level && results[level]) {
								results[level].groups = results[level].groups.concat(groups);
							} else {
								results[level] = {
									column_id: column_id,
									groups: groups
								};
							}
						};

						for (var i = 0, l = options.groups.length; i < l; i++) {
							column_id = options.groups[i].column_id;
							if (i === 0) {
								generateGroup(column_id, data, i);
							} else {
								for (var j = 0, m = results[i - 1].groups.length; j < m; j++) {
									generateGroup(column_id, results[i - 1].groups[j]._rows, i, results[i - 1].groups[j].value);
								}
							}
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
						this.loader = $('<div class="myloader" style="position:absolute;top:0;left:0;right:0;bottom:0;display:table;opacity:0;pointer-events:none;z-index:10;transition:0.1s opacity ease-in-out;text-align:center;height:100%;width:100%;"><div style="display:table-cell;vertical-align:middle;"><span style="background:rgba(255,255,255,0.9);border-radius:8px;padding:10px 20px;border:1px solid rgba(0,0,0,0.2);box-shadow:rgba(0,0,0,0.1) 5px 5px 5px;">Loading...</span></div></div>').appendTo(this.grid.$el);

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