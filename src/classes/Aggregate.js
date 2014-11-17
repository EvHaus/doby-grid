"use strict";

var CLS 		= require('./../utils/classes.js'),
	NonDataItem = require('./NonDataItem.js');

/**
 * @class Aggregate
 * @classdesc Information about data totals.
 * @augments NonDataItem
 *
 * An instance of Aggregate will be created for each totals row and passed to the aggregators
 * so that they can store arbitrary data in it. That data can later be accessed by group totals
 * formatters during the display.
 *
 * @param	{array}		aggregators		- List of aggregators for this object
 *
 * @returns {object}
 */
var Aggregate = function (aggregators) {
	this.aggregators = aggregators;
	this.class = CLS.rowtotal;
	this.columns = {};
	this.editable = false;
	this.focusable = true;
	this.selectable = false;
};

Aggregate.prototype = new NonDataItem();
Aggregate.prototype._aggregateRow = true;

Aggregate.prototype.toString = function () {
	return "Aggregate";
};

Aggregate.prototype.exporter = function (columnDef) {
	if (this.aggregators[columnDef.id]) {
		var aggr;
		for (var aggr_idx in this.aggregators[columnDef.id]) {
			aggr = this.aggregators[columnDef.id][aggr_idx];
			if (aggr.active && aggr.exporter) {
				return aggr.exporter();
			}
		}
	}
	return "";
};

Aggregate.prototype.formatter = function (row, cell, value, columnDef) {
	if (this.aggregators[columnDef.id]) {
		var aggr;
		for (var aggr_idx in this.aggregators[columnDef.id]) {
			aggr = this.aggregators[columnDef.id][aggr_idx];
			if (aggr.active && aggr.formatter) {
				return aggr.formatter();
			}
		}
	}
	return "";
};

module.exports = Aggregate;