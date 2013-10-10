/*jslint browser:true,expr:true,vars:true,plusplus:true,devel:true,indent:4,maxerr:50*/
/*jshint white: true*/
/*global _, $, define*/

define([], function () {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 50; i++) {
			data.push({
				id: 'product_' + i,
				data: {
					name: _.sample(["Coffee Pot", "Mug", "Frying Pan", "Rice Cooker"]),
					price: _.sample(["$2.00", "$20.15", "$4.99"])
				},
				columns: {
					0: {
						class: "nopad"
					}
				},
				rows: {
					0: {
						collapsed: true,
						height: 250,
						columns: {
							0: {
								colspan: "*",
								formatter: function () {
									return "DETAILS"
								}
							}
						}
					}
				}
			});
		}

		return {
			columns: [{
				id: "picture",
				name: "Picture",
				field: "picture",
				formatter: function (row, cell, value, columnDef, data) {
					return '<div style="border:2px solid rgba(0,0,0,0.4);background:rgba(0,0,0,0.05);height:94px;width:94px"></div>';
				},
				focusable: false,
				selectable: false,
				width: 100
			}, {
				id: "id",
				name: "Product #",
				field: "id",
				formatter: function (row, cell, value, columnDef, data) {
					return data.id;
				}
			}, {
				id: "name",
				name: "Name",
				field: "name"
			}, {
				id: "price",
				name: "Price",
				field: "price"
			}, {
				id: "details",
				name: "Details",
				formatter: function () {
					return '<button class="toggler">Toggle Product Details</button>';
				},
				focusable: false,
				selectable: false,
				width: 200
			}],
			data: data,
			rowHeight: 100
		};
	}, function (grid) {
		grid.on('click', function (event, args) {
			event.stopPropagation();

			// Toggle product details
			if ($(event.target).hasClass('toggler')) {
				grid.setItem(args.item.id, {
					rows: {
						0: {
							collapsed: !args.item.rows[0].collapsed
						}
					}
				});
			}
		});
	}];
});