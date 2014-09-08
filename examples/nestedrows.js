/*jshint loopfunc: true*/
/*global _, $, define */

define(['dobygrid', 'backbone'], function (DobyGrid, Backbone) {
	"use strict";

	// Set to true to use Backbone Collections
	var useBackbone = false;

	return [function () {

		// Generate Data
		var data = useBackbone ? new Backbone.Collection() : [], rowdata, model;
		for (var i = 0; i < 50; i++) {
			rowdata = {
				id: 'product_' + i,
				name: _.sample(["Coffee Pot", "Mug", "Frying Pan", "Rice Cooker"]),
				price: _.sample(["$2.00", "$20.15", "$4.99"])
			};

			if (useBackbone) {
				model = new Backbone.Model(rowdata);
				data.add(model);
			} else {
				model = {
					id: rowdata.id,
					data: rowdata
				};
				data.push(model);
			}

			// These properties must be attached to the model, not to the data key
			$.extend(model, {
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
								class: "nopad",
								colspan: "*",
								formatter: function () {
									return '<div style="text-align:center;">Loading components...</div>';
								},
								postprocess: function (data) {
									var subdata = [];

									for (var i = 0; i < 100; i++) {
										subdata.push({
											id: 'component-' + i,
											data: {
												component: _.sample(["Bolt", "Screw", "Pipe"]),
												price: _.sample(["$0.15", "$0.35", "$0.99"])
											}
										});
									}

									data.$cell.empty();
									new DobyGrid({
										columns: [
											{
												id: 'id',
												name: 'Component #',
												field: 'id',
												formatter: function (row, cell, value, columnDef, data) {
													return data.id;
												}
											}, {
												id: 'component',
												name: 'Component',
												field: 'component'
											}, {
												id: 'price',
												name: 'Price',
												field: 'price'
											}
										],
										data: subdata
									}).appendTo(data.$cell);
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
				filterable: false,
				focusable: false,
				formatter: function () {
					return '<div style="background:rgba(255,0,0,0.1);box-shadow:red 0 0 0 2px inset;height:100px;width:100px"></div>';
				},
				groupable: false,
				selectable: false,
				sortable: false,
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
				filterable: false,
				focusable: false,
				formatter: function () {
					return '<button class="toggler">Toggle Product Details</button>';
				},
				selectable: false,
				width: 200
			}],
			data: data,
			quickFilter: true,
			rowHeight: 100
		};
	}, function (grid) {
		grid.on('click', function (event, args) {
			event.stopPropagation();

			// Toggle product details
			if ($(event.target).hasClass('toggler')) {
				args.item.rows[0].collapsed = !args.item.rows[0].collapsed;
				grid.setItem(args.item.id, args.item);
			}
		});
	}];
});