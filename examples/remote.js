/*global $, _, define*/

define(['backbone', 'dataset'], function (Backbone, dataset) {
	"use strict";

	// Use a Backbone data set?
	var backboneset = true;

	// Replicates a server's database filter
	var remote_filter = function (options, item) {
		var result = true;
		if (!options.filters) return result;
		var f, value;
		for (var i = 0, l = options.filters.length; i < l; i++) {
			f = options.filters[i];
			value = item.data[f[0]];
			switch (f[1]) {
			case '=':
				result = value == f[2];
				break;
			case '!=':
				result = value !== f[2];
				break;
			case '>':
				result = value > f[2];
				break;
			case '<':
				result = value < f[2];
				break;
			case '>=':
				result = value >= f[2];
				break;
			case '<=':
				result = value <= f[2];
				break;
			case '~':
				result = value.toString().search(f[2].toString()) !== -1;
				break;
			case '!~':
				result = value.toString().search(f[2].toString()) === -1;
				break;
			case '~*':
				result = value.toString().toLowerCase().search(f[2].toString().toLowerCase()) !== -1;
				break;
			case '!~*':
				result = value.toString().toLowerCase().search(f[2].toString().toLowerCase()) === -1;
				break;
			}
			if (!result) break;
		}

		return result;
	};

	return [function () {

		var timer;

		var count = function (options, callback) {
			// Fake AJAX delay
			if (timer) clearTimeout(timer);
			timer = setTimeout(function () {
				callback(_.filter(dataset, function (item) {
					return remote_filter(options, item);
				}).length);
			}, 100);
		};

		var fetch = function (options, callback) {

			// Fake AJAX delay
			if (timer) clearTimeout(timer);
			timer = setTimeout(function () {
				var results = [];
				if (backboneset) {
					results = new Backbone.Collection();
				}

				// Apply filter
				var mydata = _.filter(dataset, function (item) {
					return remote_filter(options, item);
				});

				// Apply fake sort
				if (options.order.length) {
					mydata.sort(function (dataRow1, dataRow2) {
						var result = 0, column, value1, value2, val;

						// Loops through the columns by which we are sorting
						for (var i = 0, l = options.order.length; i < l; i++) {
							column = options.order[i].columnId;
							value1 = dataRow1.data[column];
							value2 = dataRow2.data[column];

							// Nulls always on the bottom
							if (value1 === null) return 1;
							if (value2 === null) return -1;

							if (value1 !== value2) {
								val = options.order[i].sortAsc ? (value1 > value2) ? 1 : -1 : (value1 < value2) ? 1 : -1;
								if (val !== 0) return val;
							}
						}

						return result;
					});
				}

				if (options.offset !== null && options.offset !== undefined) {
					if (options.limit !== null && options.limit !== undefined) {
						mydata = mydata.slice(options.offset, options.offset + options.limit);
					} else {
						mydata = mydata.slice(options.offset);
					}
				}

				if (backboneset) {
					_.each(mydata, function (i) {
						// Make sure 'id' comes along for the ride
						i.data.id = i.id;
						results.add(i.data);
					});

					callback(results.models);
				} else {
					callback(mydata);
				}
			}, 100);
		};

		var fetchGroups = function (options, callback) {
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
					groups.sort(function (a, b) {
						var result = 0, val;
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
				var main_filter = function (item) {
					return remote_filter(options, item);
				};
				for (var i = 0, l = options.groups.length; i < l; i++) {
					column_id = options.groups[i].column_id;
					if (i === 0) {
						generateGroup(column_id, _.filter(dataset, main_filter), i);
					} else {
						var parentGroup;
						for (var j = 0, m = results[i - 1].groups.length; j < m; j++) {
							if (results[i - 1].groups[j].parent) {
								parentGroup = results[i - 1].groups[j].parent.concat([results[i - 1].groups[j].value]);
							} else {
								parentGroup = [results[i - 1].groups[j].value];
							}

							generateGroup(column_id, results[i - 1].groups[j]._rows, i, parentGroup);
						}
					}
				}

				callback(results);
			}, 5);
		};

		var onLoading = function (loadingVisibleRows) {
			if (!this.grid.$el || !loadingVisibleRows) return;

			// Generate a loader overlay
			if (!this.loader) {
				this.loader = $('<div class="myloader"><div><span>Loading...</span></div></div>').appendTo(this.grid.$el);

				// Start CSS animation
				this.loader.width();
			}

			// Fade in
			this.loader.css('opacity', 1);
		};

		var onLoaded = function (loadingVisibleRows) {
			if (!this.grid.$el || !this.loader || !loadingVisibleRows) return;
			this.loader.css('opacity', 0);
		};

		var remotedata;
		if (backboneset) {
			remotedata = new Backbone.Collection();

			remotedata.DobyGridRemote = {
				count: count,
				fetch: fetch,
				fetchGroups: fetchGroups,
				onLoading: onLoading,
				onLoaded: onLoaded
			};
		} else {
			remotedata = function () {
				this.count = count;
				this.fetch = fetch;
				this.fetchGroups = fetchGroups;
				this.onLoading = onLoading;
				this.onLoaded = onLoaded;
			};
		}

		return {
			columns: [{
				id: "id",
				name: "ID",
				formatter: function (row, cell, value, columnDef, data) {
					if (data.__placeholder) return '';
					return data.id;
				},
				removable: true,
				sortable: true
			}, {
				id: "name",
				name: "Name",
				field: "name",
				minWidth: 100,
				removable: true,
				sortable: true
			}, {
				id: "email",
				name: "Email",
				field: "email",
				removable: true,
				sortable: true
			}, {
				id: "company",
				name: "Company",
				field: "company",
				removable: true,
				sortable: true
			}],

			data: remotedata,
			quickFilter: true,
			rowsToPrefetch: 20
		};
	}];
});
