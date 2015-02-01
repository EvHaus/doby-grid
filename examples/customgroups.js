/*jshint loopfunc: true*/
/*global _, define*/

/** This advanced example shows how groups can be used with more flexibility with the custom grouping feature **/
define([], function () {
	"use strict";

	// Get the full qualified group name i.e. the subgroup "1" of parent group "A" would get: "A,1" and so on
	var getFullGroupValue = function(group){
			var parentValue = "";
			if(group.parentGroup){
				parentValue = getFullGroupValue(group.parentGroup);
			}
			return parentValue ? parentValue + "," + group.value : group.value;
	};

	var groupsLoaded = {};

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
					city: ['Venice', 'Vatican City', 'Rome', 'Milan', 'Constantinople'][_.random(0, 4)],
					customGroup: ['A', 'B', 'A,2'][_.random(0, 2)],
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
		},{
			// this column contains the "path" to the group that the item belongs to
			id: "customGroup",
			name: "customGroup",
			field: "customGroup",
			visible: false,
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

		// Add two levels of custom grouping, with a custom getter and formatter function
		grid.setCustomGrouping([{
		    getter: function(r){var p = r.data.customGroup.split(","); if(p[0]) return p[0]; return null},
		    formatter: function(r, c, v, def, data){
		    	var html = "";
		    	html += data.collapsed ? "+" : "-";
		    	html += " " + data.value;
		    	return html;
		    },
		    groupNulls: false,
		    groups: [{
		        count: 432,
		        value: 'A'
		    }, {
		        count: 192,
		        value: 'B'
		    }]
		}, {
		    getter: function(r){var p = r.data.customGroup.split(","); if(p[1]) return p[1]; return null},
		    formatter: function(r, c, v, def, data){
		    	var html = "";
		    	html += data.collapsed ? "+" : "-";
		    	html += " " + data.value;
		    	return html;
		    },
		    groupNulls: false,
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

		// When the group header is clicked, load addional items of the group
		grid.on("groupheaderclick", function(event, options){
			var item = options.item;
			var data = [];
			if(item.level < 1) return;

			// This could be an ajax call or other asynchronous calls
			setTimeout(function(){
				var fullValue = getFullGroupValue(item);
				if(groupsLoaded[fullValue]) return;
				for (var i = 0; i < 25; i++) {
					data.push({
						id: "new_" + item.value + "_" + i,
						data: {
							id: "new_" + item.value + "_" + i,
							population: _.sample(_.range(15, 100)),
							elevation: _.sample(_.range(500, 10000)),
							language: _.sample(["English", "French", "Italian", "Latin", null]),
							city: ['Venice', 'Vatican City', 'Rome', 'Milan', 'Constantinople'][_.random(0, 4)],
							customGroup: fullValue,
						}
					});
				}
				grid.add(data);	
				groupsLoaded[fullValue] = true;
			}, 500);
		});
	}];
});