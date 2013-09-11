// doby-grid.js 0.0.1
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, -W116 */
/*global define */


define([
	'jquery',
	'underscore',
	'backbone',

	// TODO: Find a way to remove jQuery UI and event drag modules from requirements
	'jquery.ui',
	'jquery.event.drag'

], function ($, _, Backbone) {
	return function (options) {

		// Current version of the library
		this.VERSION = '0.0.1';

		// Private
		var self = this,
			createGrid,
			dataview,
			defaultFormatter,
			enableHeaderMenu,
			enableSort,
			getBrowserData,
			getMaxCSSHeight,
			getScrollbarSize,
			Grid,
			initialize,
			metadataprovider,
			processData,
			toggleHeaderContextMenu,
			uid = "doby-grid-" + Math.round(1000000 * Math.random()),
			validateColumns;

		// Default Grid Options
		this.options = _.extend({
			alertOnEmpty:		false,		// Display a "no items" message when dataset is empty?
			asyncEditorLoadDelay: 100,		// Delay amount for asyncEditorLoading
			asyncEditorLoading: false,		// Makes cell editors load asynchronously after a delay
			asyncPostRenderDelay: 50,		// Delay before attempt to post-process cells
			autoEdit:			true,		// Automaticaly go into edit mode when cell is selected
			cellFlashingCssClass: "flashing",	// CSS class to apply for flashing cells via flashCell
			class:				null,		// CSS class to add to the main element
			columns:			[],			// Columns data set
			data:				[],			// An array of objects to render
			dataExtractor:		null,		// Function that gets a column's value from its row data
			defaultColumnWidth: 80,			// Default width for columns
			editable:			false,		// Can the values of this table be edited
			editorFactory:		null,		// A factory object responsible for creating an editor
			enableAddRow:		false,		// If true, a blank row will be displayed at the bottom
			enableAsyncPostRender: false,	// Enables cell post-processing
			enableCellNavigation: true,		// ??
			enableColumnReorder: true,		// Can columns be re-ordered?
			enableTextSelectionOnCells: false,	// ??
			forceFitColumns:	false,		// Prevent horizontal scrolling
			forceSyncScrolling: false,		// ??
			formatterFactory:	null,		// A factory object for creating a formatter
			fullWidthRows:		true,		// Will expand the table rows divs to the full width
			groupable:			true,		// Can the values be grouped
			headerMenu:			true,		// Display context menu for headers
			leaveSpaceForNewRows: false,	// (TODO) Candidate for removal?
			multiColumnSort:	true,		// Allow sorting by multiple columns
			multiSelect:		true,		// ??
			remote:				false,		// Use remote data set
			reorderable:		true,		// Can the columns be re-ordered,
			rowHeight:			28,			// The default height for all rows
			rowPreprocess:		null,		// Function for pre-processing row styling
			selectedCellCssClass: "selected",	// CSS class to apply for selected cells
			uid:				uid,		// TODO: Remove this from options when SlickGrid is gone
			variableRowHeight:	false		// Will enable variable row height mode
		}, options);

		// Default Column Options
		var columnDefaults = {
			defaultSortAsc:		true,		// Is the default sorting direction ascending?
			focusable:			true,		// Can cells in this column be focused?
			groupable:			true,		// Can this columns be grouped?
			headerCssClass:		null,		// CSS class to add to the header
			minWidth:			38,			// What is the minimum column width?
			name:				"",			// Visible name of the column
			removable:			true,		// Can this columns be removed?
			rerenderOnResize:	false,		// Re-render the column when resized?
			resizable:			true,		// Is the column resizable?
			selectable:			true,		// Are cells in this column selectable?
			sortable:			true,		// Is the column sortable?
			width:				this.options.defaultColumnWidth
		};


		// initialize()
		// Creates a new DobyGrid instance
		//
		// @return object
		initialize = function () {

			// Validate loaded JavaScript modules against requested options
			if (self.options.enableColumnReorder && !$.fn.sortable) {
				throw new Error('In other to use "enableColumnReorder", you must ensure the jquery-ui.sortable module is loaded.');
			}

			// Calculate some information about the browser window
			getBrowserData();

			// Validate and pre-process
			validateColumns();

			// TODO: Remove me from here once getFormatter is no longer inside Grid()
			self.options.defaultFormatter = defaultFormatter;

			processData(function () {
				// Create the grid
				self.$el = $('<div class="doby-grid"></div>');
				if (self.options.class) self.$el.addClass(self.options.class);
				self.grid = createGrid();

				// Enable sorting
				enableSort();
			});

			return self;
		};


		// appendTo()
		// Duplicates the jQuery appendTo() function
		//
		// @param	target		object		jQuery object to insert table into
		//
		// @return object
		this.appendTo = function (target) {
			if (!target || !target.length) {
				throw new Error('Doby Grid requires a valid container. "' + $(target).selector + '" does not exist in the DOM.');
			}

			// Insert into target
			this.$el.appendTo(target);

			// Initialize the Grid
			try {
				this.grid.init();
			} catch (e) {
				console.error(e);
			}

			// Register the remote fetching when the viewport changes
			if (this.options.remote) {
				this.grid.onViewportChanged.subscribe(function (e, args) {
					var vp = self.grid.getViewport();
					self.loader.fetch(vp.top, vp.bottom);
				});
			}

			// Enable header menu
			if (this.options.headerMenu) {
				enableHeaderMenu();
			}

			// Resize grid when window is changed
			$(window).resize(function () {
				// Only if the object is visible
				if (!self.$el.is(':visible')) return;
				self.grid.resizeCanvas();
			});

			return this;
		};


		// createGrid()
		// Generates the SlickGrid object
		//
		// @return object
		createGrid = function () {

			// Prepare container
			self.$el.empty().addClass(self.options.uid);

			var grid = new Grid(self.$el, self.dataView, self.options);

			// Add support for row events
			// TODO: Do we still need this?
			/*
			_.each(['onClick', 'onContextMenu', 'onDblClick', 'onMouseEnter', 'onMouseLeave'], function(e) {
				grid[e].subscribe(function(event, args) {
					// Fill in bizarre missing gaps in SlickGrid event args
					if (args.row === undefined || args.cell === undefined) {
						cellargs = grid.getCellFromEvent(event)
						args = _.extend(args, cellargs)
					}

					if (args.row) {
						item = grid.getDataItem(args.row)
						if (item && typeof(item[e]) === 'function') {
							item[e](event, args, item)
						}
					}
				})
			})
			*/

			return grid;
		};


		// dataview()
		// This is a special class that will convert the given dataset into a Model and
		// provide a filtered access to the underlying data.
		//
		// @param	options		object		Data View options
		//
		// @return object
		dataview = function (options) {

			// private

			var self = this,
				defaults = {
				groupItemMetadataProvider: metadataprovider,
				inlineFilters: false,
				remote: false
			},
				idProperty = "id",	// property holding a unique row id
				items = [],			// data by index
				rows = [],			// data by row
				idxById = {},		// indexes by id
				rowsById = null,	// rows by id; lazy-calculated
				filter = null,		// filter function
				updated = null,		// updated item ids
				suspend = false,	// suspends the recalculation
				sortAsc = true,
				sortComparer,
				refreshHints = {},
				prevRefreshHints = {},
				filterArgs,
				filteredItems = [],
				compiledFilter,
				compiledFilterWithCaching,
				filterCache = [],
				groupingInfoDefaults = {	// grouping
					getter: null,
					formatter: null,
					comparer: function (a, b) {
						return a.value - b.value;
					},
					predefinedValues: [],
					aggregators: [],
					aggregateEmpty: false,
					aggregateCollapsed: false,
					aggregateChildGroups: false,
					collapsed: false,
					displayTotalsRow: true
				},
				groupingInfos = [],
				groups = [],
				toggledGroupsByLevel = [],
				groupingDelimiter = ':|:',
				pagesize = 0,
				pagenum = 0,
				totalRows = 0,
				length = null; // Custom length of DataView, for Remote Models

			// Events
			_.extend(this, Backbone.Events);


			options = $.extend(true, {}, defaults, options);


			this.addItem = function (item) {
				items.push(item);
				updateIdxById(items.length - 1);
				this.refresh();
			}

			this.beginUpdate = function () {
				suspend = true;
			}

			// TODO:  lazy totals calculation
			function calculateGroupTotals(group) {
				// TODO:  try moving iterating over groups into compiled accumulator
				var gi = groupingInfos[group.level];
				var isLeafLevel = (group.level == groupingInfos.length);
				var totals = new Slick.GroupTotals();
				var agg, idx = gi.aggregators.length;
				while (idx--) {
					agg = gi.aggregators[idx];
					agg.init();
					gi.compiledAccumulators[idx].call(agg, (!isLeafLevel && gi.aggregateChildGroups) ? group.groups : group.rows);
					agg.storeResult(totals);
				}
				totals.group = group;
				group.totals = totals;
			}

			function calculateTotals(groups, level) {
				level = level || 0;
				var gi = groupingInfos[level];
				var idx = groups.length,
					g;
				while (idx--) {
					g = groups[idx];

					if (g.collapsed && !gi.aggregateCollapsed) {
						continue;
					}

					// Do a depth-first aggregation so that parent setGrouping aggregators can access subgroup totals.
					if (g.groups) {
						calculateTotals(g.groups, level + 1);
					}

					if (gi.aggregators.length && (
						gi.aggregateEmpty || g.rows.length || (g.groups && g.groups.length))) {
						calculateGroupTotals(g);
					}
				}
			}

			// collapseAllGroups()
			//
			// @param	level	integer		Optional level to collapse.
			//								If not specified, applies to all levels.
			//
			this.collapseAllGroups = function (level) {
				expandCollapseAllGroups(level, true);
			}

			// collapseGroup()
			// @param	varArgs		Either a Slick.Group's "groupingKey" property, or a
			//						variable argument list of grouping values denoting a
			//						unique path to the row. For example, calling
			//						collapseGroup('high', '10%') will collapse the '10%' subgroup of
			//						the 'high' setGrouping.
			//
			function collapseGroup(varArgs) {
				var args = Array.prototype.slice.call(arguments);
				var arg0 = args[0];
				if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
					expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, true);
				} else {
					expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), true);
				}
			}

			function compileAccumulatorLoop(aggregator) {
				var accumulatorInfo = getFunctionInfo(aggregator.accumulate);
				var fn = new Function(
					"_items",
					"for (var " + accumulatorInfo.params[0] + ", _i=0, _il=_items.length; _i<_il; _i++) {" +
					accumulatorInfo.params[0] + " = _items[_i]; " +
					accumulatorInfo.body +
					"}");
				fn.displayName = fn.name = "compiledAccumulatorLoop";
				return fn;
			}

			function compileFilter() {
				var filterInfo = getFunctionInfo(filter);

				var filterBody = filterInfo.body
					.replace(/return false\s*([;}]|$)/gi, "{ continue _coreloop; }$1")
					.replace(/return true\s*([;}]|$)/gi, "{ _retval[_idx++] = $item$; continue _coreloop; }$1")
					.replace(/return ([^;}]+?)\s*([;}]|$)/gi,
					"{ if ($1) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");

				// This preserves the function template code after JS compression,
				// so that replace() commands still work as expected.
				var tpl = [
					//"function(_items, _args) { ",
					"var _retval = [], _idx = 0; ",
					"var $item$, $args$ = _args; ",
					"_coreloop: ",
					"for (var _i = 0, _il = _items.length; _i < _il; _i++) { ",
					"$item$ = _items[_i]; ",
					"$filter$; ",
					"} ",
					"return _retval; "
					//"}"
				].join("");

				tpl = tpl.replace(/\$filter\$/gi, filterBody);
				tpl = tpl.replace(/\$item\$/gi, filterInfo.params[0]);
				tpl = tpl.replace(/\$args\$/gi, filterInfo.params[1]);

				var fn = new Function("_items,_args", tpl);
				fn.displayName = fn.name = "compiledFilter";
				return fn;
			}

			function compileFilterWithCaching() {
				var filterInfo = getFunctionInfo(filter);

				var filterBody = filterInfo.body
					.replace(/return false\s*([;}]|$)/gi, "{ continue _coreloop; }$1")
					.replace(/return true\s*([;}]|$)/gi, "{ _cache[_i] = true;_retval[_idx++] = $item$; continue _coreloop; }$1")
					.replace(/return ([^;}]+?)\s*([;}]|$)/gi,
					"{ if ((_cache[_i] = $1)) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");

				// This preserves the function template code after JS compression,
				// so that replace() commands still work as expected.
				var tpl = [
					//"function(_items, _args, _cache) { ",
					"var _retval = [], _idx = 0; ",
					"var $item$, $args$ = _args; ",
					"_coreloop: ",
					"for (var _i = 0, _il = _items.length; _i < _il; _i++) { ",
					"$item$ = _items[_i]; ",
					"if (_cache[_i]) { ",
					"_retval[_idx++] = $item$; ",
					"continue _coreloop; ",
					"} ",
					"$filter$; ",
					"} ",
					"return _retval; "
					//"}"
				].join("");

				tpl = tpl.replace(/\$filter\$/gi, filterBody);
				tpl = tpl.replace(/\$item\$/gi, filterInfo.params[0]);
				tpl = tpl.replace(/\$args\$/gi, filterInfo.params[1]);

				var fn = new Function("_items,_args,_cache", tpl);
				fn.displayName = fn.name = "compiledFilterWithCaching";
				return fn;
			}

			this.deleteItem = function (id) {
				var idx = idxById[id];
				if (idx === undefined) {
					throw "Unable to delete dataview item. Invalid id (" + id + ") supplied.";
				}
				delete idxById[id];
				items.splice(idx, 1);
				updateIdxById(idx);
				if (options.remote) length--;
				this.refresh();
			}

			this.endUpdate = function () {
				suspend = false;
				this.refresh();
			}

			// expandAllGroups()
			// @param	level	integer		Optional level to expand.
			//								If not specified, applies to all levels.
			//
			this.expandAllGroups = function (level) {
				expandCollapseAllGroups(level, false);
			}

			function expandCollapseAllGroups(level, collapse) {
				if (level === null || level === undefined) {
					for (var i = 0; i < groupingInfos.length; i++) {
						toggledGroupsByLevel[i] = {};
						groupingInfos[i].collapsed = collapse;
					}
				} else {
					toggledGroupsByLevel[level] = {};
					groupingInfos[level].collapsed = collapse;
				}
				this.refresh();
			}

			function expandCollapseGroup(level, groupingKey, collapse) {
				toggledGroupsByLevel[level][groupingKey] = groupingInfos[level].collapsed ^ collapse;
				self.refresh();
			}

			// expandGroup()
			// @param	varArgs		Either a Slick.Group's "groupingKey" property, or a
			//						variable argument list of grouping values denoting a
			//						unique path to the row. For example, calling
			//						expandGroup('high', '10%') will expand the '10%' subgroup of
			//						the 'high' setGrouping.
			//
			function expandGroup(varArgs) {
				var args = Array.prototype.slice.call(arguments);
				var arg0 = args[0];
				if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
					expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, false);
				} else {
					expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), false);
				}
			}

			function ensureIdUniqueness() {
				var id;
				for (var i = 0, l = items.length; i < l; i++) {
					id = items[i][idProperty];
					if (id === undefined || idxById[id] !== i) {
						throw "Each data element must implement a unique 'id' property";
					}
				}
			}

			function ensureRowsByIdCache() {
				if (!rowsById) {
					rowsById = {};
					for (var i = 0, l = rows.length; i < l; i++) {
						if (rows[i]) rowsById[rows[i][idProperty]] = i;
					}
				}
			}

			function extractGroups(rows, parentGroup) {
				var group,
					val,
					groups = [],
					groupsByVal = [],
					r,
					level = parentGroup ? parentGroup.level + 1 : 0,
					gi = groupingInfos[level],
					i,
					l;

				for (i = 0, l = gi.predefinedValues.length; i < l; i++) {
					predef = gi.predefinedValues[i];
					val = gi[predef];
					group = groupsByVal[val];
					if (!group) {
						group = new Slick.Group();
						group.value = val;
						group.level = level;
						group.groupingKey = (parentGroup ? parentGroup.groupingKey + groupingDelimiter : '') + val;
						groups[groups.length] = group;
						groupsByVal[val] = group;
					}
				}

				for (i = 0, l = rows.length; i < l; i++) {
					r = rows[i];
					val = gi.getterIsAFn ? gi.getter(r) : r[gi.getter];
					group = groupsByVal[val];
					if (!group) {
						group = new Slick.Group();
						group.value = val;
						group.level = level;
						group.groupingKey = (parentGroup ? parentGroup.groupingKey + groupingDelimiter : '') + val;
						groups[groups.length] = group;
						groupsByVal[val] = group;
					}

					group.rows[group.count++] = r;
				}

				if (level < groupingInfos.length - 1) {
					for (i = 0, l = groups.length; i < l; i++) {
						group = groups[i];
						group.groups = extractGroups(group.rows, group);
					}
				}

				groups.sort(groupingInfos[level].comparer);

				return groups;
			}

			function finalizeGroups(groups, level) {
				level = level || 0;
				var gi = groupingInfos[level],
					groupCollapsed = gi.collapsed,
					toggledGroups = toggledGroupsByLevel[level],
					idx = groups.length,
					g;

				while (idx--) {
					g = groups[idx];
					g.collapsed = groupCollapsed ^ toggledGroups[g.groupingKey];
					g.title = gi.formatter ? gi.formatter(g) : g.value;

					if (g.groups) {
						finalizeGroups(g.groups, level + 1);
						// Let the non-leaf setGrouping rows get garbage-collected.
						// They may have been used by aggregates that go over all of the descendants,
						// but at this point they are no longer needed.
						g.rows = [];
					}
				}
			}

			function flattenGroupedRows(groups, level) {
				level = level || 0;
				var gi = groupingInfos[level],
					groupedRows = [],
					rows, gl = 0,
					g;

				for (var i = 0, l = groups.length; i < l; i++) {
					g = groups[i];
					groupedRows[gl++] = g;

					if (!g.collapsed) {
						rows = g.groups ? flattenGroupedRows(g.groups, level + 1) : g.rows;
						for (var j = 0, m = rows; j < m; j++) {
							groupedRows[gl++] = rows[j];
						}
					}

					if (g.totals && gi.displayTotalsRow && (!g.collapsed || gi.aggregateCollapsed)) {
						groupedRows[gl++] = g.totals;
					}
				}
				return groupedRows;
			}

			function getFilteredAndPagedItems(items) {
				if (filter) {
					var batchFilter = options.inlineFilters ? compiledFilter : uncompiledFilter;
					var batchFilterWithCaching = options.inlineFilters ? compiledFilterWithCaching : uncompiledFilterWithCaching;

					if (refreshHints.isFilterNarrowing) {
						filteredItems = batchFilter(filteredItems, filterArgs);
					} else if (refreshHints.isFilterExpanding) {
						filteredItems = batchFilterWithCaching(items, filterArgs, filterCache);
					} else if (!refreshHints.isFilterUnchanged) {
						filteredItems = batchFilter(items, filterArgs);
					}
				} else {
					// special case:  if not filtering and not paging, the resulting
					// rows collection needs to be a copy so that changes due to sort
					// can be caught
					filteredItems = pagesize ? items : items.concat();
				}

				// get the current page
				var paged;
				if (pagesize) {
					if (filteredItems.length < pagenum * pagesize) {
						pagenum = Math.floor(filteredItems.length / pagesize);
					}
					paged = filteredItems.slice(pagesize * pagenum, pagesize * pagenum + pagesize);
				} else {
					paged = filteredItems;
				}

				return {
					totalRows: filteredItems.length,
					rows: paged
				};
			}

			function getFunctionInfo(fn) {
				var fnRegex = new RegExp(/^function[^(]*\(([^)]*)\)\s*\{([\s\S]*)\}$/),
					matches = fn.toString().match(fnRegex);
				return {
					params: matches[1].split(","),
					body: matches[2]
				};
			}

			this.getGrouping = function () {
				return groupingInfos;
			}

			this.getGroups = function () {
				return groups;
			}

			this.getIdxById = function (id) {
				return idxById[id];
			}

			this.getItem = function (i) {
				return rows[i];
			}

			this.getItemById = function (id) {
				return items[idxById[id]];
			}

			this.getItemByIdx = function (i) {
				return items[i];
			}

			this.getItemMetadata = function (i) {
				var item = rows[i];
				if (item === undefined) {
					return null;
				}

				// overrides for grouping rows
				if (item.__group) {
					return options.groupItemMetadataProvider.getGroupRowMetadata(item);
				}

				// overrides for totals rows
				if (item.__groupTotals) {
					return options.groupItemMetadataProvider.getTotalsRowMetadata(item);
				}

				return null;
			}

			this.getItems = function () {
				return items;
			}

			this.getLength = function () {
				return options.remote ? length : rows.length;
			}

			this.getPagingInfo = function () {
				var totalPages = pagesize ? Math.max(1, Math.ceil(totalRows / pagesize)) : 1;
				return {
					pageSize: pagesize,
					pageNum: pagenum,
					totalRows: totalRows,
					totalPages: totalPages
				};
			}

			this.getRowById = function (id) {
				ensureRowsByIdCache();
				return rowsById[id];
			}

			function getRowDiffs(rows, newRows) {
				var item, r, eitherIsNonData, diff = [];
				var from = 0,
					to = newRows.length;

				if (refreshHints && refreshHints.ignoreDiffsBefore) {
					from = Math.max(0,
						Math.min(newRows.length, refreshHints.ignoreDiffsBefore));
				}

				if (refreshHints && refreshHints.ignoreDiffsAfter) {
					to = Math.min(newRows.length,
						Math.max(0, refreshHints.ignoreDiffsAfter));
				}

				for (var i = from, rl = rows.length; i < to; i++) {
					if (i >= rl) {
						diff[diff.length] = i;
					} else {
						item = newRows[i];
						r = rows[i];
						eitherIsNonData = (item && item.__nonDataRow) || (r && r.__nonDataRow)

						if (item && r && (
							(groupingInfos.length && eitherIsNonData &&
							(item && item.__group !== r.__group) ||
							(item && item.__group) && !item.equals(r)) ||
							// no good way to compare totals since they are arbitrary DTOs
							// deep object comparison is pretty expensive
							// always considering them 'dirty' seems easier for the time being
							(eitherIsNonData && (item.__groupTotals || r.__groupTotals)) ||
							(
								item && item[idProperty] != r[idProperty] ||
								(updated && updated[item[idProperty]])
							))) {
							diff[diff.length] = i;
						}
					}
				}
				return diff;
			}

			this.insertItem = function (insertBefore, item) {
				items.splice(insertBefore, 0, item);
				updateIdxById(insertBefore);
				if (options.remote) length++
				this.refresh();
			}

			this.insertItemAtIdx = function (item, idx) {
				items[idx] = item
				this.refresh();
			}

			this.mapIdsToRows = function (idArray) {
				var rows = [];
				ensureRowsByIdCache();
				for (var i = 0, l = idArray.length; i < l; i++) {
					var row = rowsById[idArray[i]];
					if (row !== null && row !== undefined) {
						rows[rows.length] = row;
					}
				}
				return rows;
			}

			this.mapRowsToIds = function (rowArray) {
				var ids = [];
				for (var i = 0, l = rowArray.length; i < l; i++) {
					if (rowArray[i] < rows.length) {
						ids[ids.length] = rows[rowArray[i]][idProperty];
					}
				}
				return ids;
			}

			function recalc(_items) {
				rowsById = null;

				if (refreshHints.isFilterNarrowing != prevRefreshHints.isFilterNarrowing ||
					refreshHints.isFilterExpanding != prevRefreshHints.isFilterExpanding) {
					filterCache = [];
				}

				var filteredItems = getFilteredAndPagedItems(_items);
				totalRows = filteredItems.totalRows;
				var newRows = filteredItems.rows;

				groups = [];
				if (groupingInfos.length) {
					groups = extractGroups(newRows);
					if (groups.length) {
						calculateTotals(groups);
						finalizeGroups(groups);
						newRows = flattenGroupedRows(groups);
					}
				}

				var diff = getRowDiffs(rows, newRows);

				rows = newRows;

				return diff;
			}

			this.refresh = function () {
				if (suspend) {
					return;
				}

				var countBefore = rows.length;
				var totalRowsBefore = totalRows;

				var diff = recalc(items, filter); // pass as direct refs to avoid closure perf hit

				// if the current page is no longer valid, go to last page and recalc
				// we suffer a performance penalty here, but the main loop (recalc) remains highly optimized
				if (pagesize && totalRows < pagenum * pagesize) {
					pagenum = Math.max(0, Math.ceil(totalRows / pagesize) - 1);
					diff = recalc(items, filter);
				}

				updated = null;
				prevRefreshHints = refreshHints;
				refreshHints = {};

				if (totalRowsBefore != totalRows) {
					this.trigger('onPagingInfoChanged', this.getPagingInfo())
				}

				if (countBefore != rows.length) {
					this.trigger('onRowCountChanged', {
						previous: countBefore,
						current: rows.length
					})
				}
				if (diff.length > 0) {
					this.trigger('onRowsChanged', {
						rows: diff
					})
				}
			}

			// resetLength()
			// Resets the length back to null to ensure remote fetches will be re-executed
			//
			this.resetLength = function () {
				length = null
			}

			this.reSort = function () {
				if (sortComparer) {
					this.sort(sortComparer, sortAsc);
				}
			}

			this.setFilter = function (filterFn) {
				filter = filterFn;
				if (options.inlineFilters) {
					compiledFilter = compileFilter();
					compiledFilterWithCaching = compileFilterWithCaching();
				}
				this.refresh();
			}

			this.setFilterArgs = function (args) {
				filterArgs = args;
			}

			this.setGrouping = function (groupingInfo) {
				groups = [];
				toggledGroupsByLevel = [];
				groupingInfo = groupingInfo || [];
				groupingInfos = (groupingInfo instanceof Array) ? groupingInfo : [groupingInfo];

				for (var i = 0, l = groupingInfos.length; i < l; i++) {
					var gi = groupingInfos[i] = $.extend(true, {}, groupingInfoDefaults, groupingInfos[i]);
					gi.getterIsAFn = typeof gi.getter === "function";

					// pre-compile accumulator loops
					gi.compiledAccumulators = [];
					var idx = gi.aggregators.length;
					while (idx--) {
						gi.compiledAccumulators[idx] = compileAccumulatorLoop(gi.aggregators[idx]);
					}

					toggledGroupsByLevel[i] = {};
				}

				this.refresh();
			}

			this.setItems = function (data, objectIdProperty) {
				if (objectIdProperty !== undefined) {
					idProperty = objectIdProperty;
				}
				items = filteredItems = data;
				idxById = {};
				updateIdxById();
				ensureIdUniqueness();
				this.refresh();
			}

			// setLength()
			// When using a remote model, it's necessary to set the total length
			// since not all data is available on the client at the time of request
			//
			// @param	count	integer		Number of items in the dataview
			//
			this.setLength = function (count) {
				length = count

				// Ensert nulls for all pending items
				for (var i = 0; i < count; i++) {
					if (items[i] === undefined) items[i] = null
				}
				this.refresh();

				return count
			}

			this.setPagingOptions = function (args) {
				if (args.pageSize !== undefined) {
					pagesize = args.pageSize;
					pagenum = pagesize ? Math.min(pagenum, Math.max(0, Math.ceil(totalRows / pagesize) - 1)) : 0;
				}

				if (args.pageNum !== undefined) {
					pagenum = Math.min(args.pageNum, Math.max(0, Math.ceil(totalRows / pagesize) - 1));
				}

				this.trigger('onPagingInfoChanged', getPagingInfo())

				this.refresh();
			}

			this.setRefreshHints = function (hints) {
				refreshHints = hints;
			}

			this.sort = function (comparer, ascending) {
				sortAsc = ascending;
				sortComparer = comparer;
				if (ascending === false) {
					items.reverse();
				}
				items.sort(comparer);
				if (ascending === false) {
					items.reverse();
				}
				idxById = {};
				updateIdxById();
				this.refresh();
			}

			this.syncGridSelection = function (grid, preserveHidden) {
				var selectedRowIds = self.mapRowsToIds(grid.getSelectedRows()),
					inHandler;

				function update() {
					if (selectedRowIds.length > 0) {
						inHandler = true;
						var selectedRows = self.mapIdsToRows(selectedRowIds);
						if (!preserveHidden) {
							selectedRowIds = self.mapRowsToIds(selectedRows);
						}
						grid.setSelectedRows(selectedRows);
						inHandler = false;
					}
				}

				grid.onSelectedRowsChanged.subscribe(function (e, args) {
					if (inHandler) {
						return;
					}
					selectedRowIds = self.mapRowsToIds(grid.getSelectedRows());
				});
			}

			this.syncGridCellCssStyles = function (grid, key) {
				var hashById,
					inHandler;

				// since this method can be called after the cell styles have been set,
				// get the existing ones right away
				storeCellCssStyles(grid.getCellCssStyles(key));

				function storeCellCssStyles(hash) {
					hashById = {};
					for (var row in hash) {
						var id = rows[row][idProperty];
						hashById[id] = hash[row];
					}
				}

				function update() {
					if (hashById) {
						inHandler = true;
						ensureRowsByIdCache();
						var newHash = {};
						for (var id in hashById) {
							var row = rowsById[id];
							if (row !== undefined) {
								newHash[row] = hashById[id];
							}
						}
						grid.setCellCssStyles(key, newHash);
						inHandler = false;
					}
				}

				grid.onCellCssStylesChanged.subscribe(function (e, args) {
					if (inHandler) {
						return;
					}
					if (key != args.key) {
						return;
					}
					if (args.hash) {
						storeCellCssStyles(args.hash);
					}
				});


				this.on('onRowsChanged', function () {update(); })
				this.on('onRowCountChanged', function () {update(); })
			}

			function uncompiledFilter(items, args) {
				var retval = [],
					idx = 0;

				for (var i = 0, ii = items.length; i < ii; i++) {
					if (filter(items[i], args)) {
						retval[idx++] = items[i];
					}
				}

				return retval;
			}

			function uncompiledFilterWithCaching(items, args, cache) {
				var retval = [],
					idx = 0,
					item;

				for (var i = 0, ii = items.length; i < ii; i++) {
					item = items[i];
					if (cache[i]) {
						retval[idx++] = item;
					} else if (filter(item, args)) {
						retval[idx++] = item;
						cache[i] = true;
					}
				}

				return retval;
			}

			function updateIdxById(startingIndex) {
				startingIndex = startingIndex || 0;
				var id;
				for (var i = startingIndex, l = items.length; i < l; i++) {
					if (items[i] === null) continue;
					id = items[i][idProperty];
					if (id === undefined) {
						throw "Each data element must implement a unique 'id' property";
					}
					idxById[id] = i;
				}
			}

			this.updateItem = function (id, item) {
				if (idxById[id] === undefined || id !== item[idProperty]) {
					throw "Invalid or non-matching id";
				}
				items[idxById[id]] = item;
				if (!updated) {
					updated = {};
				}
				updated[id] = true;
				this.refresh();
			}
		}


		// defaultFormatter()
		// Default formatting functions for all cell rendering. Returns an HTML string.
		//
		// @param	row			integer		Index of the row being edited
		// @param	cell		integer		Index of the cell being edited
		// @param	value		string		Data value for the cell
		// @param	columnDef	object		The column definition object for the given column
		// @param	data		object		The full data object for the given cell
		//
		// @return string
		defaultFormatter = function (row, cell, value, columnDef, data) {
			// Never write "undefined" or "null" in the grid -- that's just bad programming
			if (value === undefined || value === null) {
				return "";
			}

			// Some simple HTML escaping
			return (value + "")
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
		}


		// enableHeaderMenu()
		// Enables the column header context menu for managing columns.
		//
		enableHeaderMenu = function () {
			// Subscribe to header menu context clicks
			self.grid.on('onHeaderContextMenu', toggleHeaderContextMenu);
		}


		// enableSort()
		// Adds ability to sort the grid
		//
		enableSort = function () {
			self.grid.on('onSort', function (e, args) {
				executeSorter(args)
			})
		}


		// getBrowserData()
		// Calculates some information about the browser window that will be shared
		// with all grid instances.
		//
		getBrowserData = function () {
			window.maxSupportedCssHeight = window.maxSupportedCssHeight || getMaxCSSHeight();
			window.scrollbarDimensions = window.scrollbarDimensions || getScrollbarSize();
		}


		// getMaxCSSHeight()
		// Some browsers have a limit on the CSS height an element can make use of.
		// Calculate the maximum height we have to play with.
		//
		// @return integer
		getMaxCSSHeight = function () {
			var supportedHeight = 1000000;

			// Firefox reports the height back but still renders blank after ~6M px
			var testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000,
				div = $('<div style="display:none"></div>').appendTo(document.body),
				test;

			while (true) {
				test = supportedHeight * 2;
				div.css("height", test);
				if (test > testUpTo || div.height() !== test) {
					break;
				} else {
					supportedHeight = test;
				}
			}

			div.remove();
			return supportedHeight;
		}


		// getScrollbarSize()
		// Calculates the size of the browser's scrollbar by inserting a temporary element
		// into the DOM and measuring the offset it creates.
		//
		// Returns an object like this: {height: 1000, width: 20}.
		//
		// @return object
		getScrollbarSize = function () {
			var s = 'position:absolute;top:-10000px;left:-10000px;width:100px;height:100px;overflow:scroll',
				c = $("<div style='" + s + "'></div>").appendTo($(document.body)),
				result = {
					width: c.width() - c[0].clientWidth,
					height: c.height() - c[0].clientHeight
				};
			c.remove();
			return result
		}


		/**
		 * Creates a new instance of the grid.
		 * @class SlickGrid
		 * @constructor
		 * @param {Node}              container   Container node to create the grid in.
		 * @param {Array,Object}      data        An array of objects for databinding.
		 * @param {Object}            options     Grid options.
		 **/
		Grid = function (container, data, options) {
			// settings
			var self = this,
				th,				// virtual height
				h,				// real scrollable height
				ph,				// page height
				n,				// number of pages
				cj,				// "jumpiness" coefficient
				page = 0,		// current page
				offset = 0,		// current page offset
				vScrollDir = 1,

			// private
				initialized = false,
				columns = options.columns,
				$container,
				uid = options.uid, // TODO: Remove me from here when possible
				$focusSink, $focusSink2,
				$headerScroller,
				$headers,
				$viewport,
				$canvas,
				$style,
				$boundAncestors,
				stylesheet, columnCssRulesL, columnCssRulesR,
				viewportH, viewportW,
				canvasWidth,
				viewportHasHScroll, viewportHasVScroll,
				headerColumnWidthDiff = 0,
				headerColumnHeightDiff = 0, // border+padding
				cellWidthDiff = 0,
				cellHeightDiff = 0,
				absoluteColumnMinWidth,
				numberOfRows = 0,

				tabbingDirection = 1,
				activePosX,
				activeRow, activeCell,
				activeCellNode = null,
				currentEditor = null,
				serializedEditorValue,
				editController,

				rowsCache = {},
				rowPositionCache = {},
				renderedRows = 0,
				numVisibleRows,
				prevScrollTop = 0,
				scrollTop = 0,
				lastRenderedScrollTop = 0,
				lastRenderedScrollLeft = 0,
				prevScrollLeft = 0,
				scrollLeft = 0,

				selectionModel,
				selectedRows = [],

				plugins = [],
				cellCssClasses = {},

				columnsById = {},
				sortColumns = [],
				columnPosLeft = [],
				columnPosRight = [],

				classfocussink = 'doby-grid-focus',
				classheader = 'doby-grid-header',
				classheadercolumns = 'doby-grid-header-columns',


			// async call handles
				h_editorLoader = null,
				h_render = null,
				h_postrender = null,
				postProcessedRows = {},
				postProcessToRow = null,
				postProcessFromRow = null,

			// perf counters
				counter_rows_rendered = 0,
				counter_rows_removed = 0;

			// Enable events
			_.extend(this, Backbone.Events);


			////////////////////////////////////////////////////////////////////////////////////////
			// Initialization

			this.init = function () {
				$container = $(container);

				// Generate a columnsById cache
				// TODO: This should be moved out of here and into the same place where we validate
				// columns.
				columnsById = {};
				for (var i = 0, l = columns.length; i < l; i++) {
					columnsById[columns[i].id] = i;
				}

				// TODO: Not sure what this is
				editController = {
					"commitCurrentEdit": commitCurrentEdit,
					"cancelCurrentEdit": cancelCurrentEdit
				};

				$focusSink = $('<div class="'+classfocussink+'" tabIndex="0"></div>')
					.appendTo($container);

				$headerScroller = $('<div class="' + classheader + '"></div>')
					.appendTo($container);

				$headers = $('<div class="' + classheadercolumns + '"></div>')
					.appendTo($headerScroller);

				$headers.width(getHeadersWidth());


				$viewport = $("<div class='slick-viewport' style='width:100%;overflow:auto;outline:0;position:relative;;'>").appendTo($container);
				$viewport.css("overflow-y", "auto");

				$canvas = $("<div class='grid-canvas' />").appendTo($viewport);

				$focusSink2 = $focusSink.clone().appendTo($container);

				initialized = true;


				viewportW = parseFloat($.css($container[0], "width", true));

				// header columns and cells may have different padding/border skewing width calculations (box-sizing, hello?)
				// calculate the diff so we can set consistent sizes
				measureCellPaddingAndBorder();

				// for usability reasons, all text selection in SlickGrid is disabled
				// with the exception of input and textarea elements (selection must
				// be enabled there so that editors work as expected); note that
				// selection in grid cells (grid body) is already unavailable in
				// all browsers except IE
				disableSelection($headers); // disable all text selection in header (including input and textarea)

				if (!options.enableTextSelectionOnCells) {
					// disable text selection in grid cells except in input and textarea elements
					// (this is IE-specific, because selectstart event will only fire in IE)
					$viewport.bind("selectstart.ui", function (event) {
						return $(event.target).is("input,textarea");
					});
				}

				updateColumnCaches();
				createColumnHeaders();
				setupColumnSort();
				createCssRules();

				if (options.variableRowHeight) {
					initializeRowPositions();
					cacheRowPositions();
				}

				resizeCanvas();
				bindAncestorScrollEvents();

				$container
					.bind("resize.slickgrid", resizeCanvas);
				$viewport
					// TODO: This is in the SlickGrid 2.2 upgrade, but it breaks ui.grid()
					// custom click handlers. Investigate a merge path.
					//.bind("click", handleClick)
					.bind("scroll", handleScroll);
				$headerScroller
					.bind("contextmenu", handleHeaderContextMenu)
					.bind("click", handleHeaderClick)
					.delegate(".slick-header-column", "mouseenter", handleHeaderMouseEnter)
					.delegate(".slick-header-column", "mouseleave", handleHeaderMouseLeave);
				$focusSink.add($focusSink2)
					.bind("keydown", handleKeyDown);
				$canvas
					.bind("keydown", handleKeyDown)
					.bind("click", handleClick)
					.bind("dblclick", handleDblClick)
					.bind("contextmenu", handleContextMenu)
					.bind("draginit", handleDragInit)
					.bind("dragstart", {
					distance: 3
				}, handleDragStart)
					.bind("drag", handleDrag)
					.bind("dragend", handleDragEnd)
					.delegate(".slick-cell", "mouseenter", handleMouseEnter)
					.delegate(".slick-cell", "mouseleave", handleMouseLeave);


			}

			function registerPlugin(plugin) {
				plugins.unshift(plugin);
				plugin.init(self);
			}

			function unregisterPlugin(plugin) {
				for (var i = plugins.length; i >= 0; i--) {
					if (plugins[i] === plugin) {
						if (plugins[i].destroy) {
							plugins[i].destroy();
						}
						plugins.splice(i, 1);
						break;
					}
				}
			}

			function setSelectionModel(model) {
				if (selectionModel) {
					selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);
					if (selectionModel.destroy) {
						selectionModel.destroy();
					}
				}

				selectionModel = model;
				if (selectionModel) {
					selectionModel.init(self);
					selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged);
				}
			}

			function getSelectionModel() {
				return selectionModel;
			}

			function getCanvasNode() {
				return $canvas[0];
			}

			function getHeadersWidth() {
				var headersWidth = 0;
				for (var i = 0, ii = columns.length; i < ii; i++) {
					var width = columns[i].width;
					headersWidth += width;
				}
				headersWidth += scrollbarDimensions.width;
				return Math.max(headersWidth, viewportW) + 1000;
			}

			function getCanvasWidth() {
				var availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;
				var rowWidth = 0;
				var i = columns.length;
				while (i--) {
					rowWidth += columns[i].width;
				}
				return options.fullWidthRows ? Math.max(rowWidth, availableWidth) : rowWidth;
			}

			function updateCanvasWidth(forceColumnWidthsUpdate) {
				var oldCanvasWidth = canvasWidth;
				canvasWidth = getCanvasWidth();

				if (canvasWidth != oldCanvasWidth) {
					$canvas.width(canvasWidth);
					$headers.width(getHeadersWidth());
					viewportHasHScroll = (canvasWidth > viewportW - scrollbarDimensions.width);
				}

				if (canvasWidth != oldCanvasWidth || forceColumnWidthsUpdate) {
					applyColumnWidths();
				}
			}

			function disableSelection($target) {
				if ($target && $target.jquery) {
					$target
						.attr("unselectable", "on")
						.css("MozUserSelect", "none")
						.bind("selectstart.ui", function () {
						return false;
					}); // from jquery:ui.core.js 1.7.2
				}
			}

			// TODO:  this is static.  need to handle page mutation.

			function bindAncestorScrollEvents() {
				var elem = $canvas[0];
				while ((elem = elem.parentNode) != document.body && elem !== null) {
					// bind to scroll containers only
					if (elem == $viewport[0] || elem.scrollWidth != elem.clientWidth || elem.scrollHeight != elem.clientHeight) {
						var $elem = $(elem);
						if (!$boundAncestors) {
							$boundAncestors = $elem;
						} else {
							$boundAncestors = $boundAncestors.add($elem);
						}
						$elem.bind("scroll." + uid, handleActiveCellPositionChange);
					}
				}
			}

			function unbindAncestorScrollEvents() {
				if (!$boundAncestors) {
					return;
				}
				$boundAncestors.unbind("scroll." + uid);
				$boundAncestors = null;
			}

			function updateColumnHeader(columnId, title, toolTip) {
				if (!initialized) {
					return;
				}
				var idx = getColumnIndex(columnId);
				if (idx === null) {
					return;
				}

				var columnDef = columns[idx];
				var $header = $headers.children().eq(idx);
				if ($header) {
					if (title !== undefined) {
						columns[idx].name = title;
					}
					if (toolTip !== undefined) {
						columns[idx].toolTip = toolTip;
					}

					self.trigger('onBeforeHeaderCellDestroy', {
						"node": $header[0],
						"column": columnDef
					})

					$header
						.attr("tooltip", toolTip || "")
						.children().eq(0).html(title);

					self.trigger('onHeaderCellRendered', {
						"node": $header[0],
						"column": columnDef
					})
				}
			}

			function createColumnHeaders() {
				function onMouseEnter() {
					$(this).addClass("ui-state-hover");
				}

				function onMouseLeave() {
					$(this).removeClass("ui-state-hover");
				}

				$headers.find(".slick-header-column")
					.each(function () {
					var columnDef = $(this).data("column");
					if (columnDef) {
						self.trigger('onBeforeHeaderCellDestroy', {
							"node": this,
							"column": columnDef
						})
					}
				});
				$headers.empty();
				$headers.width(getHeadersWidth());

				for (var i = 0; i < columns.length; i++) {
					var m = columns[i];

					var header = $("<div class='slick-header-column' />")
						.html("<span class='slick-column-name'>" + m.name + "</span>")
						.width(m.width - headerColumnWidthDiff)
						.attr("id", "" + uid + m.id)
						.attr("tooltip", m.toolTip || "")
						.data("column", m)
						.addClass(m.headerCssClass || "")
						.appendTo($headers);

					if (options.enableColumnReorder || m.sortable) {
						header
							.on('mouseenter', onMouseEnter)
							.on('mouseleave', onMouseLeave);
					}

					if (m.sortable) {
						header.addClass("slick-header-sortable");
						header.append("<span class='slick-sort-indicator' />");
					}

					self.trigger('onHeaderCellRendered', {
						"node": header[0],
						"column": m
					})
				}

				setSortColumns(sortColumns);
				setupColumnResize();
				if (options.enableColumnReorder) {
					setupColumnReorder();
				}
			}

			function setupColumnSort() {
				$headers.click(function (e) {
					// temporary workaround for a bug in jQuery 1.7.1 (http://bugs.jquery.com/ticket/11328)
					e.metaKey = e.metaKey || e.ctrlKey;

					if ($(e.target).hasClass("slick-resizable-handle") || $(e.target).closest(".slick-resizable-handle").length) {
						return;
					}

					var $col = $(e.target).closest(".slick-header-column");
					if (!$col.length) {
						return;
					}

					var column = $col.data("column");
					if (column.sortable) {
						var sortOpts = null;
						var i = 0;
						for (; i < sortColumns.length; i++) {
							if (sortColumns[i].columnId == column.id) {
								sortOpts = sortColumns[i];
								sortOpts.sortAsc = !sortOpts.sortAsc;
								break;
							}
						}

						if (e.metaKey && options.multiColumnSort) {
							if (sortOpts) {
								sortColumns.splice(i, 1);
							}
						} else {
							if ((!e.shiftKey && !e.metaKey) || !options.multiColumnSort) {
								sortColumns = [];
							}

							if (!sortOpts) {
								sortOpts = {
									columnId: column.id,
									sortAsc: column.defaultSortAsc
								};
								sortColumns.push(sortOpts);
							} else if (sortColumns.length === 0) {
								sortColumns.push(sortOpts);
							}
						}

						setSortColumns(sortColumns);

						if (!options.multiColumnSort) {
							self.trigger('onSort', {
								multiColumnSort: false,
								sortCol: column,
								sortAsc: sortOpts.sortAsc
							})
						} else {
							self.trigger('onSort', {
								multiColumnSort: true,
								sortCols: $.map(sortColumns, function (col) {
									return {
										sortCol: columns[getColumnIndex(col.columnId)],
										sortAsc: col.sortAsc
									};
								})
							})
						}
					}
				});
			}

			function setupColumnReorder() {
				$headers.filter(":ui-sortable").sortable("destroy");
				$headers.sortable({
					containment: "parent",
					distance: 3,
					axis: "x",
					cursor: "default",
					tolerance: "intersection",
					helper: "clone",
					placeholder: "slick-sortable-placeholder slick-header-column",
					forcePlaceholderSize: true,
					start: function (e, ui) {
						$(ui.helper).addClass("slick-header-column-active");
					},
					beforeStop: function (e, ui) {
						$(ui.helper).removeClass("slick-header-column-active");
					},
					stop: function (e) {
						var reorderedIds = $headers.sortable("toArray");
						var reorderedColumns = [];
						for (var i = 0; i < reorderedIds.length; i++) {
							reorderedColumns.push(columns[getColumnIndex(reorderedIds[i].replace(uid, ""))]);
						}
						setColumns(reorderedColumns);

						self.trigger('onColumnsReordered')
						e.stopPropagation();
						setupColumnResize();
					}
				});
			}

			function setupColumnResize() {
				var $col, j, c, pageX, columnElements, minPageX, maxPageX, firstResizable, lastResizable;
				columnElements = $headers.children();
				columnElements.find(".slick-resizable-handle").remove();
				columnElements.each(function (i, e) {
					if (columns[i].resizable) {
						if (firstResizable === undefined) {
							firstResizable = i;
						}
						lastResizable = i;
					}
				});
				if (firstResizable === undefined) {
					return;
				}

				var lockColumnWidths = function (i) {
					columnElements.each(function (i, e) {
						columns[i].previousWidth = $(e).outerWidth();
					});
				}

				var resizeColumn = function (i, d) {
					var actualMinWidth;
					x = d
					if (d < 0) { // shrink column
						for (j = i; j >= 0; j--) {
							c = columns[j];
							if (c.resizable) {
								actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
								if (x && c.previousWidth + x < actualMinWidth) {
									x += c.previousWidth - actualMinWidth;
									c.width = actualMinWidth;
								} else {
									c.width = c.previousWidth + x;
									x = 0;
								}
							}
						}

						if (options.forceFitColumns) {
							x = -d;
							for (j = i + 1; j < columnElements.length; j++) {
								c = columns[j];
								if (c.resizable) {
									if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
										x -= c.maxWidth - c.previousWidth;
										c.width = c.maxWidth;
									} else {
										c.width = c.previousWidth + x;
										x = 0;
									}
								}
							}
						}
					} else { // stretch column
						for (j = i; j >= 0; j--) {
							c = columns[j];
							if (c.resizable) {
								if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
									x -= c.maxWidth - c.previousWidth;
									c.width = c.maxWidth;
								} else {
									c.width = c.previousWidth + x;
									x = 0;
								}
							}
						}

						if (options.forceFitColumns) {
							x = -d;
							for (j = i + 1; j < columnElements.length; j++) {
								c = columns[j];
								if (c.resizable) {
									actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
									if (x && c.previousWidth + x < actualMinWidth) {
										x += c.previousWidth - actualMinWidth;
										c.width = actualMinWidth;
									} else {
										c.width = c.previousWidth + x;
										x = 0;
									}
								}
							}
						}
					}
				}

				var prepareLeeway = function (i, pageX) {
					var shrinkLeewayOnRight = null,
						stretchLeewayOnRight = null;

					if (options.forceFitColumns) {
						shrinkLeewayOnRight = 0;
						stretchLeewayOnRight = 0;
						// colums on right affect maxPageX/minPageX
						for (j = i + 1; j < columnElements.length; j++) {
							c = columns[j];
							if (c.resizable) {
								if (stretchLeewayOnRight !== null) {
									if (c.maxWidth) {
										stretchLeewayOnRight += c.maxWidth - c.previousWidth;
									} else {
										stretchLeewayOnRight = null;
									}
								}
								shrinkLeewayOnRight += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
							}
						}
					}
					var shrinkLeewayOnLeft = 0,
						stretchLeewayOnLeft = 0;
					for (j = 0; j <= i; j++) {
						// columns on left only affect minPageX
						c = columns[j];
						if (c.resizable) {
							if (stretchLeewayOnLeft !== null) {
								if (c.maxWidth) {
									stretchLeewayOnLeft += c.maxWidth - c.previousWidth;
								} else {
									stretchLeewayOnLeft = null;
								}
							}
							shrinkLeewayOnLeft += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
						}
					}
					if (shrinkLeewayOnRight === null) {
						shrinkLeewayOnRight = 100000;
					}
					if (shrinkLeewayOnLeft === null) {
						shrinkLeewayOnLeft = 100000;
					}
					if (stretchLeewayOnRight === null) {
						stretchLeewayOnRight = 100000;
					}
					if (stretchLeewayOnLeft === null) {
						stretchLeewayOnLeft = 100000;
					}
					maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
					minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
				}

				var applyColWidths = function () {
					applyColumnHeaderWidths();
					if (options.syncColumnCellResize) {
						applyColumnWidths();
					}
				}

				var submitColResize = function () {
					var newWidth;
					for (j = 0; j < columnElements.length; j++) {
						c = columns[j];
						newWidth = $(columnElements[j]).outerWidth();

						if (c.previousWidth !== newWidth && c.rerenderOnResize) {
							invalidateAllRows();
						}
					}

					updateCanvasWidth(true);
					render();
					self.trigger('onColumnsResized')
				}

				columnElements.each(function (i, e) {
					if (i < firstResizable || (options.forceFitColumns && i >= lastResizable)) {
						return;
					}
					$col = $(e);

					$("<div class='slick-resizable-handle'><span></span></div>")
						.appendTo(e)
						.bind("dragstart", function (e, dd) {
							pageX = e.pageX;
							$(this).parent().addClass("slick-header-column-active");

							// lock each column's width option to current width
							lockColumnWidths(i)

							// Ensures the leeway has another room to move around
							prepareLeeway(i, pageX)
						})
						.bind("drag", function (e, dd) {

							var d = Math.min(maxPageX, Math.max(minPageX, e.pageX)) - pageX;

							// Sets the new column widths
							resizeColumn(i, d)

							// Save changes
							applyColWidths()
						})
						.bind("dragend", function (e, dd) {
							$(this).parent().removeClass("slick-header-column-active");
							submitColResize()
						})
						.on("dblclick", function (event) {
							var columnEl = $(event.currentTarget).parent(),
								currentWidth = columnEl.width(),
								headerPadding = columnEl.outerWidth() - columnEl.width(),
								column_index,
								column;

							// Find the column data object
							for (q = 0, l = columnElements.length; q < l; q++) {
								if (columnElements[q] == columnEl[0]) {
									column_index = q
									column = columns[q]
									break
								}
							}

							// Column is not resizable -- goodbye
							if (!column.resizable) return

							// Determine the width of the column name text
							var name = columnEl.children('.slick-column-name:first')
							name.css('overflow', 'visible')
							columnEl.width('auto')
							var headerWidth = columnEl.outerWidth() + 3
							name.css('overflow', '')
							columnEl.width(currentWidth)

							// Determine the width of the widest visible value
							var cellWidths = [headerWidth],
								right;
							$canvas.find('.l' + column_index + ':visible')
								.removeClass('r' + column_index)
								.each(function () {
									w = $(this).outerWidth() + headerPadding
									if (cellWidths.indexOf(w) < 0) cellWidths.push(w)
								})
								.addClass('r' + column_index)

							var newWidth = Math.max.apply(null, cellWidths)

							if (currentWidth < newWidth) {
								var diff = newWidth - column.width

								// Duplicate the drag functionality
								lockColumnWidths(i)
								prepareLeeway(i, pageX)
								resizeColumn(i, diff)
								applyColWidths()
								submitColResize()
							}
						})

				});
			}

			function getVBoxDelta($el) {
				var p = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
				var delta = 0;
				$.each(p, function (n, val) {
					delta += parseFloat($el.css(val)) || 0;
				});
				return delta;
			}

			function measureCellPaddingAndBorder() {
				var el;
				var h = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
				var v = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];

				el = $("<div class='slick-header-column' style='visibility:hidden'>-</div>").appendTo($headers);
				headerColumnWidthDiff = headerColumnHeightDiff = 0;
				$.each(h, function (n, val) {
					headerColumnWidthDiff += parseFloat(el.css(val)) || 0;
				});
				$.each(v, function (n, val) {
					headerColumnHeightDiff += parseFloat(el.css(val)) || 0;
				});
				el.remove();

				var r = $("<div class='slick-row' />").appendTo($canvas);
				el = $("<div class='slick-cell' id='' style='visibility:hidden'>-</div>").appendTo(r);
				cellWidthDiff = cellHeightDiff = 0;
				$.each(h, function (n, val) {
					cellWidthDiff += parseFloat(el.css(val)) || 0;
				});
				$.each(v, function (n, val) {
					cellHeightDiff += parseFloat(el.css(val)) || 0;
				});
				r.remove();

				absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
			}

			function createCssRules() {
				$style = $("<style type='text/css' rel='stylesheet' />").appendTo($("head"));
				var rowHeight = (options.rowHeight - cellHeightDiff);
				var rules = [
					"." + uid + " .slick-header-column {left: 1000px}",
					"." + uid + " .slick-cell {height:" + rowHeight + "px;line-height:" + rowHeight + "px}",
					"." + uid + " .slick-row {height:" + options.rowHeight + "px}"
				];

				for (var i = 0; i < columns.length; i++) {
					rules.push("." + uid + " .l" + i + " { }");
					rules.push("." + uid + " .r" + i + " { }");
				}

				if ($style[0].styleSheet) { // IE
					$style[0].styleSheet.cssText = rules.join(" ");
				} else {
					$style[0].appendChild(document.createTextNode(rules.join(" ")));
				}
			}

			function initializeRowPositions() {
				rowPositionCache = {
					0: {
						top: 0,
						height: options.rowHeight,
						bottom: options.rowHeight
					}
				};
			}

			function cacheRowPositions() {
				initializeRowPositions();

				for (var i = 0, l = getDataLength(); i < l; i++) {
					var metadata = data.getItemMetadata && data.getItemMetadata(i);

					rowPositionCache[i] = {
						top: (rowPositionCache[i - 1]) ? (rowPositionCache[i - 1].bottom - offset) : 0,
						height: (metadata && metadata.rows && metadata.rows[i]) ? metadata.rows[i].height : options.rowHeight
					}

					rowPositionCache[i].bottom = rowPositionCache[i].top + rowPositionCache[i].height;
				}
			}

			function getColumnCssRules(idx) {
				if (!stylesheet) {
					var sheets = document.styleSheets,
						i;
					for (i = 0; i < sheets.length; i++) {
						if ((sheets[i].ownerNode || sheets[i].owningElement) == $style[0]) {
							stylesheet = sheets[i];
							break;
						}
					}

					if (!stylesheet) {
						throw new Error("Cannot find stylesheet.");
					}

					// find and cache column CSS rules
					columnCssRulesL = [];
					columnCssRulesR = [];
					var cssRules = (stylesheet.cssRules || stylesheet.rules);
					var matches, columnIdx;
					for (i = 0; i < cssRules.length; i++) {
						var selector = cssRules[i].selectorText
						matches = new RegExp(/\.l\d+/).exec(selector);
						if (matches) {
							columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
							columnCssRulesL[columnIdx] = cssRules[i];
						} else {
							matches = new RegExp(/\.r\d+/).exec(selector)
							if (matches) {
								columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
								columnCssRulesR[columnIdx] = cssRules[i];
							}
						}
					}
				}

				return {
					"left": columnCssRulesL[idx],
					"right": columnCssRulesR[idx]
				};
			}

			function removeCssRules() {
				$style.remove();
				stylesheet = null;
			}

			function destroy() {
				self.trigger('onBeforeDestroy');

				var i = plugins.length;
				while (i--) {
					unregisterPlugin(plugins[i]);
				}

				if (options.enableColumnReorder) {
					$headers.filter(":ui-sortable").sortable("destroy");
				}

				unbindAncestorScrollEvents();
				$container.unbind(".slickgrid");
				removeCssRules();

				$canvas.unbind("draginit dragstart dragend drag");
				$container.empty().removeClass(uid);
			}


			////////////////////////////////////////////////////////////////////////////////////////
			// General

			function getEditController() {
				return editController;
			}

			function getColumnIndex(id) {
				return columnsById[id];
			}

			function autosizeColumns() {
				var i, c,
					widths = [],
					shrinkLeeway = 0,
					total = 0,
					prevTotal,
					availWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;

				for (i = 0; i < columns.length; i++) {
					c = columns[i];
					widths.push(c.width);
					total += c.width;
					if (c.resizable) {
						shrinkLeeway += c.width - Math.max(c.minWidth, absoluteColumnMinWidth);
					}
				}

				// shrink
				prevTotal = total;
				while (total > availWidth && shrinkLeeway) {
					var shrinkProportion = (total - availWidth) / shrinkLeeway;
					for (i = 0; i < columns.length && total > availWidth; i++) {
						c = columns[i];
						var width = widths[i];
						if (!c.resizable || width <= c.minWidth || width <= absoluteColumnMinWidth) {
							continue;
						}
						var absMinWidth = Math.max(c.minWidth, absoluteColumnMinWidth);
						var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
						shrinkSize = Math.min(shrinkSize, width - absMinWidth);
						total -= shrinkSize;
						shrinkLeeway -= shrinkSize;
						widths[i] -= shrinkSize;
					}
					if (prevTotal == total) { // avoid infinite loop
						break;
					}
					prevTotal = total;
				}

				// grow
				prevTotal = total;
				while (total < availWidth) {
					var growProportion = availWidth / total;
					for (i = 0; i < columns.length && total < availWidth; i++) {
						c = columns[i];
						if (!c.resizable || c.maxWidth <= c.width) {
							continue;
						}
						var growSize = Math.min(Math.floor(growProportion * c.width) - c.width, (c.maxWidth - c.width) || 1000000) || 1;
						total += growSize;
						widths[i] += growSize;
					}
					if (prevTotal == total) { // avoid infinite loop
						break;
					}
					prevTotal = total;
				}

				var reRender = false;
				for (i = 0; i < columns.length; i++) {
					if (columns[i].rerenderOnResize && columns[i].width != widths[i]) {
						reRender = true;
					}
					columns[i].width = widths[i];
				}

				applyColumnHeaderWidths();
				updateCanvasWidth(true);
				if (reRender) {
					invalidateAllRows();
					render();
				}
			}

			function applyColumnHeaderWidths() {
				if (!initialized) {
					return;
				}
				var h;
				for (var i = 0, headers = $headers.children(), ii = headers.length; i < ii; i++) {
					h = $(headers[i]);
					if (h.width() !== columns[i].width - headerColumnWidthDiff) {
						h.width(columns[i].width - headerColumnWidthDiff);
					}
				}

				updateColumnCaches();
			}

			function applyColumnWidths() {
				var x = 0,
					w, rule;
				for (var i = 0; i < columns.length; i++) {
					w = columns[i].width;

					rule = getColumnCssRules(i);
					rule.left.style.left = x + "px";
					rule.right.style.right = (canvasWidth - x - w) + "px";

					x += columns[i].width;
				}
			}

			function setSortColumn(columnId, ascending) {
				setSortColumns([{
						columnId: columnId,
						sortAsc: ascending
					}]);
			}

			function setSortColumns(cols) {
				sortColumns = cols;

				var headerColumnEls = $headers.children();
				headerColumnEls
					.removeClass("slick-header-column-sorted")
					.find(".slick-sort-indicator")
					.removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");

				$.each(sortColumns, function (i, col) {
					if (col.sortAsc === null) {
						col.sortAsc = true;
					}
					var columnIndex = getColumnIndex(col.columnId);
					if (columnIndex !== null) {
						headerColumnEls.eq(columnIndex)
							.addClass("slick-header-column-sorted")
							.find(".slick-sort-indicator")
							.addClass(col.sortAsc ? "slick-sort-indicator-asc" : "slick-sort-indicator-desc");
					}
				});
			}

			function getSortColumns() {
				return sortColumns;
			}

			function handleSelectedRangesChanged(e, ranges) {
				selectedRows = [];
				var hash = {};
				for (var i = 0; i < ranges.length; i++) {
					for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
						if (!hash[j]) { // prevent duplicates
							selectedRows.push(j);
							hash[j] = {};
						}
						for (var k = ranges[i].fromCell; k <= ranges[i].toCell; k++) {
							if (canCellBeSelected(j, k)) {
								hash[j][columns[k].id] = options.selectedCellCssClass;
							}
						}
					}
				}

				setCellCssStyles(options.selectedCellCssClass, hash);

				self.trigger('onSelectedRowsChanged', {
					rows: getSelectedRows()
				})
			}

			function getColumns() {
				return columns;
			}

			function updateColumnCaches() {
				// Pre-calculate cell boundaries.
				columnPosLeft = [];
				columnPosRight = [];
				var x = 0;
				for (var i = 0, ii = columns.length; i < ii; i++) {
					columnPosLeft[i] = x;
					columnPosRight[i] = x + columns[i].width;
					x += columns[i].width;
				}
			}

			function setColumns(columnDefinitions) {
				columns = columnDefinitions;

				columnsById = {};
				for (var i = 0, l = columns.length; i < l; i++) {
					m = columns[i];
					// TODO: Extend defaults
					columnsById[m.id] = i;
					if (m.minWidth && m.width < m.minWidth) {
						m.width = m.minWidth;
					}
					if (m.maxWidth && m.width > m.maxWidth) {
						m.width = m.maxWidth;
					}
				}

				updateColumnCaches();

				self.trigger('onColumnsChanged', {
					columns: columnDefinitions
				})

				if (initialized) {
					invalidateAllRows();
					createColumnHeaders();
					removeCssRules();
					createCssRules();
					resizeCanvas();
					applyColumnWidths();
					handleScroll();
				}
			}

			function getOptions() {
				return options;
			}

			function setData(newData, scrollToTop) {
				data = newData;
				invalidateAllRows();
				updateRowCount();
				if (scrollToTop) {
					scrollTo(0);
				}
			}

			function getData() {
				return data;
			}

			function getDataLength() {
				if (data.getLength) {
					return data.getLength();
				} else {
					return data.length;
				}
			}

			function getDataLengthIncludingAddNew() {
				return getDataLength() + (options.enableAddRow ? 1 : 0);
			}

			function getDataItem(i) {
				if (data.getItem) {
					return data.getItem(i);
				} else {
					return data[i];
				}
			}

			function getContainerNode() {
				return $container.get(0);
			}

			//////////////////////////////////////////////////////////////////////////////////////////////
			// Rendering / Scrolling

			function getRowTop(row) {
				return options.rowHeight * row - offset;
			}

			function scrollTo(y) {
				y = Math.max(y, 0);
				y = Math.min(y, th - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0));

				var oldOffset = offset;

				page = Math.min(n - 1, Math.floor(y / ph));
				offset = Math.round(page * cj);
				var newScrollTop = y - offset;

				if (offset != oldOffset) {
					var range = getVisibleRange(newScrollTop);
					cleanupRows(range);
					if (!options.variableRowHeight) updateRowPositions();
				}

				if (prevScrollTop != newScrollTop) {
					vScrollDir = (prevScrollTop + oldOffset < newScrollTop + offset) ? 1 : -1;
					$viewport[0].scrollTop = (lastRenderedScrollTop = scrollTop = prevScrollTop = newScrollTop);

					self.trigger('onViewportChanged')
				}
			}

			function getFormatter(row, column) {
				var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);

				// look up by id, then index
				var columnOverrides = rowMetadata &&
					rowMetadata.columns &&
					(rowMetadata.columns[column.id] || rowMetadata.columns[getColumnIndex(column.id)]);

				return (columnOverrides && columnOverrides.formatter) ||
					(rowMetadata && rowMetadata.formatter) ||
					column.formatter ||
					(options.formatterFactory && options.formatterFactory.getFormatter(column)) ||
					options.defaultFormatter;
			}

			function getEditor(row, cell) {
				var column = columns[cell];
				var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
				var columnMetadata = rowMetadata && rowMetadata.columns;

				if (columnMetadata && columnMetadata[column.id] && columnMetadata[column.id].editor !== undefined) {
					return columnMetadata[column.id].editor;
				}
				if (columnMetadata && columnMetadata[cell] && columnMetadata[cell].editor !== undefined) {
					return columnMetadata[cell].editor;
				}

				return column.editor || (options.editorFactory && options.editorFactory.getEditor(column));
			}


			// getDataItemValueForColumns()
			// Given an item object and a column definition, returns the value of the column
			// to display in the cell.
			//
			// @param	item		object		Data row object from the dataset
			// @param	columnDef	object		Column definition object for the given column
			//
			// @return string
			function getDataItemValueForColumn(item, columnDef) {
				// If a custom extractor is specified -- use that
				if (options.dataExtractor) return options.dataExtractor(item, columnDef);

				// Backbone Model support
				if (item instanceof Backbone.Model) {
					return item.get(columnDef.field)
				}

				return item.data[columnDef.field]
			}

			function appendRowHtml(stringArray, row, range, dataLength) {
				var d = getDataItem(row);
				var dataLoading = row < dataLength && !d;
				var rowCss = "slick-row" +
					(dataLoading ? " loading" : "") +
					(row === activeRow ? " active" : "") +
					(row % 2 == 1 ? " odd" : "");

				var metadata = data.getItemMetadata && data.getItemMetadata(row);

				if (metadata && metadata.cssClasses) {
					rowCss += " " + metadata.cssClasses;
				}

				if (!options.variableRowHeight) {
					stringArray.push("<div class='" + rowCss + "' style='top:" + getRowTop(row) + "px'>");
				} else {
					stringArray.push("<div class='");
					stringArray.push(rowCss);
					stringArray.push("' style='top:");
					stringArray.push(rowPositionCache[row].top);
					stringArray.push("px;");
					stringArray.push(
					(rowPositionCache[row].height != options.rowHeight) ? "height:" + rowPositionCache[row].height + "px;" : "");
					stringArray.push("'>");
				}

				var colspan, m;
				for (var i = 0, ii = columns.length; i < ii; i++) {
					m = columns[i];
					colspan = 1;
					if (metadata && metadata.columns) {
						var columnData = metadata.columns[m.id] || metadata.columns[i];
						colspan = (columnData && columnData.colspan) || 1;
						if (colspan === "*") {
							colspan = ii - i;
						}
					}

					// Do not render cells outside of the viewport.
					if (columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
						if (columnPosLeft[i] > range.rightPx) {
							// All columns to the right are outside the range.
							break;
						}

						appendCellHtml(stringArray, row, i, colspan, d);
					}

					if (colspan > 1) {
						i += (colspan - 1);
					}
				}

				stringArray.push("</div>");
			}

			function appendCellHtml(stringArray, row, cell, colspan, item) {
				var m = columns[cell];
				var cellCss = "slick-cell l" + cell + " r" + Math.min(columns.length - 1, cell + colspan - 1) + (m.cssClass ? " " + m.cssClass : "");
				if (row === activeRow && cell === activeCell) {
					cellCss += (" active");
				}

				// TODO:  merge them together in the setter
				for (var key in cellCssClasses) {
					if (cellCssClasses[key][row] && cellCssClasses[key][row][m.id]) {
						cellCss += (" " + cellCssClasses[key][row][m.id]);
					}
				}

				if (!options.variableRowHeight) {
					stringArray.push("<div class='" + cellCss + "'>");
				} else {
					stringArray.push("<div class='");
					stringArray.push(cellCss);
					stringArray.push("'");

					if (rowPositionCache[row].height != options.rowHeight) {
						stringArray.push("style='height:" + (rowPositionCache[row].height - cellHeightDiff) + "px;'");
					}

					stringArray.push(">");
				}

				// if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
				if (item) {
					var value = getDataItemValueForColumn(item, m);
					try {
						stringArray.push(getFormatter(row, m)(row, cell, value, m, item));
					} catch (e) {
						stringArray.push('')
						console.error("Cell failed to render due to failed column formatter. Error: " + e.message, e)
					}
				}

				stringArray.push("</div>");

				rowsCache[row].cellRenderQueue.push(cell);
				rowsCache[row].cellColSpans[cell] = colspan;
			}


			function cleanupRows(rangeToKeep) {
				for (var i in rowsCache) {
					if (((i = parseInt(i, 10)) !== activeRow) && (i < rangeToKeep.top || i > rangeToKeep.bottom)) {
						removeRowFromCache(i);
					}
				}
			}

			function invalidate() {
				updateRowCount();
				invalidateAllRows();
				render();
			}

			function invalidateAllRows() {
				if (currentEditor) {
					makeActiveCellNormal();
				}
				for (var row in rowsCache) {
					removeRowFromCache(row);
				}
			}

			function removeRowFromCache(row) {
				var cacheEntry = rowsCache[row];
				if (!cacheEntry) {
					return;
				}
				$canvas[0].removeChild(cacheEntry.rowNode);
				delete rowsCache[row];
				delete postProcessedRows[row];
				renderedRows--;
				counter_rows_removed++;
			}

			function invalidateRows(rows) {
				var i, rl;
				if (!rows || !rows.length) {
					return;
				}
				vScrollDir = 0;
				for (i = 0, rl = rows.length; i < rl; i++) {
					if (currentEditor && activeRow === rows[i]) {
						makeActiveCellNormal();
					}
					if (rowsCache[rows[i]]) {
						removeRowFromCache(rows[i]);
					}
				}
			}

			function invalidateRow(row) {
				invalidateRows([row]);
			}

			function updateCell(row, cell) {
				var cellNode = getCellNode(row, cell);
				if (!cellNode) {
					return;
				}

				var m = columns[cell],
					d = getDataItem(row);
				if (currentEditor && activeRow === row && activeCell === cell) {
					currentEditor.loadValue(d);
				} else {
					cellNode.innerHTML = d ? getFormatter(row, m)(row, cell, getDataItemValueForColumn(d, m), m, d) : "";
					invalidatePostProcessingResults(row);
				}
			}

			function updateRow(row) {
				var cacheEntry = rowsCache[row];
				if (!cacheEntry) {
					return;
				}

				ensureCellNodesInRowsCache(row);

				var d = getDataItem(row);

				for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
					if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
						continue;
					}

					columnIdx = columnIdx | 0;
					var m = columns[columnIdx],
						node = cacheEntry.cellNodesByColumnIdx[columnIdx];

					if (row === activeRow && columnIdx === activeCell && currentEditor) {
						currentEditor.loadValue(d);
					} else if (d) {
						node.innerHTML = getFormatter(row, m)(row, columnIdx, getDataItemValueForColumn(d, m), m, d);
					} else {
						node.innerHTML = "";
					}
				}

				invalidatePostProcessingResults(row);
			}

			function getViewportHeight() {
				return parseFloat($.css($container[0], "height", true)) -
					parseFloat($.css($container[0], "paddingTop", true)) -
					parseFloat($.css($container[0], "paddingBottom", true)) -
					parseFloat($.css($headerScroller[0], "height")) - getVBoxDelta($headerScroller);
			}

			function resizeCanvas() {
				if (!initialized) {
					return;
				}
				viewportH = getViewportHeight();

				if (!options.variableRowHeight) {
					numVisibleRows = Math.ceil(viewportH / options.rowHeight);
				} else {
					numVisibleRows = Math.ceil(getRowFromPosition(viewportH));
				}
				viewportW = parseFloat($.css($container[0], "width", true));
				$viewport.height(viewportH);

				if (options.forceFitColumns) {
					autosizeColumns();
				}

				updateRowCount();
				handleScroll();
				// Since the width has changed, force the render() to reevaluate virtually rendered cells.
				lastRenderedScrollLeft = -1;
				render();
			}

			function updateRowCount() {
				var dataLength = getDataLength();
				if (!initialized) {
					return;
				}

				if (options.variableRowHeight) {
					cacheRowPositions();
				}

				var numberOfRows = getDataLengthIncludingAddNew() +
					(options.leaveSpaceForNewRows ? numVisibleRows - 1 : 0);

				var oldViewportHasVScroll = viewportHasVScroll;

				if (!options.variableRowHeight) {
					viewportHasVScroll = numberOfRows * options.rowHeight > viewportH;
				} else {
					if (numberOfRows === 0) {
						viewportHasVScroll = false
					} else {
						var rpc = rowPositionCache[numberOfRows - 1]
						viewportHasVScroll = rpc && (rpc.bottom > viewportH);
					}
				}

				// remove the rows that are now outside of the data range
				// this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
				var l = getDataLengthIncludingAddNew() - 1;
				for (var i in rowsCache) {
					if (i >= l) {
						removeRowFromCache(i);
					}
				}

				if (activeCellNode && activeRow > l) {
					resetActiveCell();
				}

				var oldH = h;
				if (!options.variableRowHeight) {
					th = Math.max(options.rowHeight * numberOfRows, viewportH - scrollbarDimensions.height);
				} else {
					if (numberOfRows === 0) {
						th = viewportH - scrollbarDimensions.height
					} else {
						var rps = rowPositionCache[numberOfRows - 1];
						var	rowMax = rps.bottom;

						if (options.enableAddRow) rowMax += options.rowHeight

						th = Math.max(rowMax, viewportH - scrollbarDimensions.height);
					}
				}

				if (th < maxSupportedCssHeight) {
					// just one page
					h = ph = th;
					n = 1;
					cj = 0;
				} else {
					// break into pages
					h = maxSupportedCssHeight;
					ph = h / 100;
					n = Math.floor(th / ph);
					cj = (th - h) / (n - 1);
				}

				if (h !== oldH) {
					$canvas.css("height", h);
					scrollTop = $viewport[0].scrollTop;
				}

				var oldScrollTopInRange = (scrollTop + offset <= th - viewportH);

				if (th === 0 || scrollTop === 0) {
					page = offset = 0;
				} else if (oldScrollTopInRange) {
					// maintain virtual position
					scrollTo(scrollTop + offset);
				} else {
					// scroll to bottom
					scrollTo(th - viewportH);
				}

				if (options.forceFitColumns && oldViewportHasVScroll != viewportHasVScroll) {
					autosizeColumns();
				}
				updateCanvasWidth(false);
			}

			function getVisibleRange(viewportTop, viewportLeft) {
				if (viewportTop === undefined || viewportTop === null) {
					viewportTop = scrollTop;
				}
				if (viewportLeft === undefined || viewportLeft === null) {
					viewportLeft = scrollLeft;
				}

				if (!options.variableRowHeight) {
					return {
						top: getRowFromPosition(viewportTop),
						bottom: getRowFromPosition(viewportTop + viewportH) + 1,
						leftPx: viewportLeft,
						rightPx: viewportLeft + viewportW
					};
				} else {
					var rowTop = Math.floor(getRowFromPosition(viewportTop + offset));
					var rowBottom = Math.ceil(getRowFromPosition(viewportTop + offset + viewportH));

					return {
						top: rowTop,
						bottom: rowBottom,
						leftPx: viewportLeft,
						rightPx: viewportLeft + viewportW
					};
				}
			}

			function getRowFromPosition(maxPosition) {
				var result = null
				if (!options.variableRowHeight) {
					result = Math.floor((maxPosition + offset) / options.rowHeight);
				} else {

					var row = 0;
					var rowsInPosCache = getDataLength();

					if (rowsInPosCache) {
						// Loop through the row position cache and break when
						// the row is found
						for (var i = 0; i < rowsInPosCache; i++) {
							if (rowPositionCache[i].top <= maxPosition && rowPositionCache[i].bottom >= maxPosition) {
								row = i;
								continue;
							}
						}

						// Return the last row in the grid
						if (maxPosition > rowPositionCache[rowsInPosCache - 1].bottom) {
							row = rowsInPosCache - 1;
						}
					} else {
						// TODO: This is a hack to get remote+variableRowHeight working. I'm not sure
						// why this works as. Investigate later.
						row = Math.floor((maxPosition + offset) / options.rowHeight)
					}

					result = row;
				}

				return result
			}

			function getRenderedRange(viewportTop, viewportLeft) {
				var range = getVisibleRange(viewportTop, viewportLeft),
					buffer = null;
				if (!options.variableRowHeight) {
					buffer = Math.round(viewportH / options.rowHeight);
				} else {
					buffer = Math.round(getRowFromPosition(viewportH));
				}
				var minBuffer = 3;

				if (vScrollDir == -1) {
					range.top -= buffer;
					range.bottom += minBuffer;
				} else if (vScrollDir == 1) {
					range.top -= minBuffer;
					range.bottom += buffer;
				} else {
					range.top -= minBuffer;
					range.bottom += minBuffer;
				}

				range.top = Math.max(0, range.top);
				range.bottom = Math.min(getDataLengthIncludingAddNew() - 1, range.bottom);

				range.leftPx -= viewportW;
				range.rightPx += viewportW;

				range.leftPx = Math.max(0, range.leftPx);
				range.rightPx = Math.min(canvasWidth, range.rightPx);

				return range;
			}

			function ensureCellNodesInRowsCache(row) {
				var cacheEntry = rowsCache[row];
				if (cacheEntry) {
					if (cacheEntry.cellRenderQueue.length) {
						var lastChild = cacheEntry.rowNode.lastChild;
						while (cacheEntry.cellRenderQueue.length) {
							var columnIdx = cacheEntry.cellRenderQueue.pop();
							cacheEntry.cellNodesByColumnIdx[columnIdx] = lastChild;
							lastChild = lastChild.previousSibling;
						}
					}
				}
			}

			function cleanUpCells(range, row) {
				var totalCellsRemoved = 0;
				var cacheEntry = rowsCache[row];

				// Remove cells outside the range.
				var cellsToRemove = [];
				for (var i in cacheEntry.cellNodesByColumnIdx) {
					// I really hate it when people mess with Array.prototype.
					if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)) {
						continue;
					}

					// This is a string, so it needs to be cast back to a number.
					i = i | 0;

					var colspan = cacheEntry.cellColSpans[i];
					if (columnPosLeft[i] > range.rightPx ||
						columnPosRight[Math.min(columns.length - 1, i + colspan - 1)] < range.leftPx) {
						if (!(row == activeRow && i == activeCell)) {
							cellsToRemove.push(i);
						}
					}
				}

				var cellToRemove;
				while ((cellToRemove = cellsToRemove.pop()) !== null && cellToRemove) {
					cacheEntry.rowNode.removeChild(cacheEntry.cellNodesByColumnIdx[cellToRemove]);
					delete cacheEntry.cellColSpans[cellToRemove];
					delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
					if (postProcessedRows[row]) {
						delete postProcessedRows[row][cellToRemove];
					}
					totalCellsRemoved++;
				}
			}

			function cleanUpAndRenderCells(range) {
				var cacheEntry;
				var stringArray = [];
				var processedRows = [];
				var cellsAdded;
				var totalCellsAdded = 0;
				var colspan;

				for (var row = range.top, btm = range.bottom; row <= btm; row++) {
					cacheEntry = rowsCache[row];
					if (!cacheEntry) {
						continue;
					}

					// cellRenderQueue populated in renderRows() needs to be cleared first
					ensureCellNodesInRowsCache(row);

					cleanUpCells(range, row);

					// Render missing cells.
					cellsAdded = 0;

					var metadata = data.getItemMetadata && data.getItemMetadata(row);
					metadata = metadata && metadata.columns;

					var d = getDataItem(row);

					// TODO:  shorten this loop (index? heuristics? binary search?)
					for (var i = 0, ii = columns.length; i < ii; i++) {
						// Cells to the right are outside the range.
						if (columnPosLeft[i] > range.rightPx) {
							break;
						}

						// Already rendered.
						if ((colspan = cacheEntry.cellColSpans[i]) !== null) {
							i += (colspan > 1 ? colspan - 1 : 0);
							continue;
						}

						colspan = 1;
						if (metadata) {
							var columnData = metadata[columns[i].id] || metadata[i];
							colspan = (columnData && columnData.colspan) || 1;
							if (colspan === "*") {
								colspan = ii - i;
							}
						}

						if (columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
							appendCellHtml(stringArray, row, i, colspan, d);
							cellsAdded++;
						}

						i += (colspan > 1 ? colspan - 1 : 0);
					}

					if (cellsAdded) {
						totalCellsAdded += cellsAdded;
						processedRows.push(row);
					}
				}

				if (!stringArray.length) {
					return;
				}

				var x = document.createElement("div");
				x.innerHTML = stringArray.join("");

				var processedRow;
				var node;
				while ((processedRow = processedRows.pop()) !== null) {
					cacheEntry = rowsCache[processedRow];
					var columnIdx;
					while ((columnIdx = cacheEntry.cellRenderQueue.pop()) !== null) {
						node = x.lastChild;
						cacheEntry.rowNode.appendChild(node);
						cacheEntry.cellNodesByColumnIdx[columnIdx] = node;
					}
				}
			}

			function renderRows(range) {
				var parentNode = $canvas[0],
					stringArray = [],
					rows = [],
					needToReselectCell = false,
					dataLength = getDataLength(),
					i;


				for (i = range.top, ii = range.bottom; i <= ii; i++) {
					if (rowsCache[i]) {
						continue;
					}
					renderedRows++;
					rows.push(i);

					// Create an entry right away so that appendRowHtml() can
					// start populatating it.
					rowsCache[i] = {
						"rowNode": null,

						// ColSpans of rendered cells (by column idx).
						// Can also be used for checking whether a cell has been rendered.
						"cellColSpans": [],

						// Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
						"cellNodesByColumnIdx": [],

						// Column indices of cell nodes that have been rendered, but not yet indexed in
						// cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
						// end of the row.
						"cellRenderQueue": []
					};

					appendRowHtml(stringArray, i, range, dataLength);
					if (activeCellNode && activeRow === i) {
						needToReselectCell = true;
					}
					counter_rows_rendered++;
				}

				if (!rows.length) {
					return;
				}

				var x = document.createElement("div");
				x.innerHTML = stringArray.join("");

				for (i = 0, ii = rows.length; i < ii; i++) {
					rowsCache[rows[i]].rowNode = parentNode.appendChild(x.firstChild);
				}

				if (needToReselectCell) {
					activeCellNode = getCellNode(activeRow, activeCell);
				}
			}

			function startPostProcessing() {
				if (!options.enableAsyncPostRender) {
					return;
				}
				clearTimeout(h_postrender);
				h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
			}

			function invalidatePostProcessingResults(row) {
				delete postProcessedRows[row];
				postProcessFromRow = Math.min(postProcessFromRow, row);
				postProcessToRow = Math.max(postProcessToRow, row);
				startPostProcessing();
			}

			function updateRowPositions() {
				for (var row in rowsCache) {
					rowsCache[row].rowNode.style.top = getRowTop(row) + "px";
				}
			}

			function render() {
				if (!initialized) {
					return;
				}
				var visible = getVisibleRange();
				var rendered = getRenderedRange();

				// remove rows no longer in the viewport
				cleanupRows(rendered);

				// add new rows & missing cells in existing rows
				if (lastRenderedScrollLeft != scrollLeft) {
					cleanUpAndRenderCells(rendered);
				}

				// render missing rows
				renderRows(rendered);

				postProcessFromRow = visible.top;
				postProcessToRow = Math.min(getDataLengthIncludingAddNew() - 1, visible.bottom);
				startPostProcessing();

				lastRenderedScrollTop = scrollTop;
				lastRenderedScrollLeft = scrollLeft;
				h_render = null;
			}

			function handleScroll() {
				scrollTop = $viewport[0].scrollTop;
				scrollLeft = $viewport[0].scrollLeft;
				var vScrollDist = Math.abs(scrollTop - prevScrollTop);
				var hScrollDist = Math.abs(scrollLeft - prevScrollLeft);

				if (hScrollDist) {
					prevScrollLeft = scrollLeft;
					$headerScroller[0].scrollLeft = scrollLeft;
				}

				if (vScrollDist) {
					vScrollDir = prevScrollTop < scrollTop ? 1 : -1;
					prevScrollTop = scrollTop;

					// switch virtual pages if needed
					if (vScrollDist < viewportH) {
						scrollTo(scrollTop + offset);
					} else {
						var oldOffset = offset;
						if (h == viewportH) {
							page = 0;
						} else {
							page = Math.min(n - 1, Math.floor(scrollTop * ((th - viewportH) / (h - viewportH)) * (1 / ph)));
						}
						offset = Math.round(page * cj);
						if (oldOffset != offset) {
							invalidateAllRows();
						}
					}
				}

				if (hScrollDist || vScrollDist) {
					if (h_render) {
						clearTimeout(h_render);
					}

					if (Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
						Math.abs(lastRenderedScrollLeft - scrollLeft) > 20) {
						if (options.forceSyncScrolling || (
							Math.abs(lastRenderedScrollTop - scrollTop) < viewportH &&
							Math.abs(lastRenderedScrollLeft - scrollLeft) < viewportW)) {
							render();
						} else {
							h_render = setTimeout(render, 50);
						}

						self.trigger('onViewportChanged')
					}
				}

				self.trigger('onScroll', {
					scrollLeft: scrollLeft,
					scrollTop: scrollTop
				})
			}

			function asyncPostProcessRows() {
				while (postProcessFromRow <= postProcessToRow) {
					var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--;
					var cacheEntry = rowsCache[row];
					if (!cacheEntry || row >= getDataLength()) {
						continue;
					}

					if (!postProcessedRows[row]) {
						postProcessedRows[row] = {};
					}

					ensureCellNodesInRowsCache(row);
					for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
						if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
							continue;
						}

						columnIdx = columnIdx | 0;

						var m = columns[columnIdx];
						if (m.asyncPostRender && !postProcessedRows[row][columnIdx]) {
							var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
							if (node) {
								m.asyncPostRender(node, row, getDataItem(row), m);
							}
							if (postProcessedRows[row]) postProcessedRows[row][columnIdx] = true;
						}
					}

					h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
					return;
				}
			}

			function updateCellCssStylesOnRenderedRows(addedHash, removedHash) {
				var node, columnId, addedRowHash, removedRowHash;
				for (var row in rowsCache) {
					removedRowHash = removedHash && removedHash[row];
					addedRowHash = addedHash && addedHash[row];

					if (removedRowHash) {
						for (columnId in removedRowHash) {
							if (!addedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
								node = getCellNode(row, getColumnIndex(columnId));
								if (node) {
									$(node).removeClass(removedRowHash[columnId]);
								}
							}
						}
					}

					if (addedRowHash) {
						for (columnId in addedRowHash) {
							if (!removedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
								node = getCellNode(row, getColumnIndex(columnId));
								if (node) {
									$(node).addClass(addedRowHash[columnId]);
								}
							}
						}
					}
				}
			}

			function addCellCssStyles(key, hash) {
				if (cellCssClasses[key]) {
					throw "addCellCssStyles: cell CSS hash with key '" + key + "' already exists.";
				}

				cellCssClasses[key] = hash;
				updateCellCssStylesOnRenderedRows(hash, null);

				self.trigger('onCellCssStylesChanged', {
					"key": key,
					"hash": hash
				})
			}

			function removeCellCssStyles(key) {
				if (!cellCssClasses[key]) {
					return;
				}

				updateCellCssStylesOnRenderedRows(null, cellCssClasses[key]);
				delete cellCssClasses[key];

				self.trigger('onCellCssStylesChanged', {
					"key": key,
					"hash": null
				})
			}

			function setCellCssStyles(key, hash) {
				var prevHash = cellCssClasses[key];

				cellCssClasses[key] = hash;
				updateCellCssStylesOnRenderedRows(hash, prevHash);

				self.trigger('onCellCssStylesChanged', {
					"key": key,
					"hash": hash
				})
			}

			function getCellCssStyles(key) {
				return cellCssClasses[key];
			}

			function flashCell(row, cell, speed) {
				speed = speed || 100;
				if (rowsCache[row]) {
					var $cell = $(getCellNode(row, cell));

					var toggleCellClassfunction = function (times) {
						if (!times) {
							return;
						}
						setTimeout(function () {
							$cell.queue(function () {
								$cell.toggleClass(options.cellFlashingCssClass).dequeue();
								toggleCellClass(times - 1);
							});
						},
							speed);
					}

					toggleCellClass(4);
				}
			}

			//////////////////////////////////////////////////////////////////////////////////////////////
			// Interactivity

			function handleDragInit(e, dd) {
				var cell = getCellFromEvent(e);
				if (!cell || !cellExists(cell.row, cell.cell)) {
					return false;
				}

				self.trigger('onDragInit', dd)

				// if nobody claims to be handling drag'n'drop by stopping immediate propagation,
				// cancel out of it
				return false;
			}

			function handleDragStart(e, dd) {
				var cell = getCellFromEvent(e);
				if (!cell || !cellExists(cell.row, cell.cell)) {
					return false;
				}

				self.trigger('onDragStart', dd)

				return false;
			}

			function handleDrag(e, dd) {
				self.trigger('onDrag', dd)
			}

			function handleDragEnd(e, dd) {
				self.trigger('onDragEnd', dd)
			}

			function handleKeyDown(e) {
				self.trigger('onKeyDown', {
					row: activeRow,
					cell: activeCell
				})
				var handled = e.isImmediatePropagationStopped();

				if (!handled) {
					if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
						if (e.which == 27) {
							cancelEditAndSetFocus();
						} else if (e.which == 34) {
							navigatePageDown();
							handled = true;
						} else if (e.which == 33) {
							navigatePageUp();
							handled = true;
						} else if (e.which == 37) {
							handled = navigateLeft();
						} else if (e.which == 39) {
							handled = navigateRight();
						} else if (e.which == 38) {
							handled = navigateUp();
						} else if (e.which == 40) {
							handled = navigateDown();
						} else if (e.which == 9) {
							handled = navigateNext();
						} else if (e.which == 13) {
							if (options.editable) {
								if (currentEditor) {
									// adding new row
									if (activeRow === getDataLength()) {
										navigateDown();
									} else {
										commitEditAndSetFocus();
									}
								}
							}
							handled = true;
						}
					} else if (e.which == 9 && e.shiftKey && !e.ctrlKey && !e.altKey) {
						handled = navigatePrev();
					}
				}

				if (handled) {
					// the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
					e.stopPropagation();
					e.preventDefault();
					try {
						e.originalEvent.keyCode = 0; // prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
					}
					// ignore exceptions - setting the original event's keycode throws access denied exception for "Ctrl"
					// (hitting control key only, nothing else), "Shift" (maybe others)
					catch (error) {}
				}
			}

			function handleClick(e) {
				if (!currentEditor) {
					// if this click resulted in some cell child node getting focus,
					// don't steal it back - keyboard events will still bubble up
					// IE9+ seems to default DIVs to tabIndex=0 instead of -1, so check for cell
					// clicks directly.
					if (e.target != document.activeElement || $(e.target).hasClass("slick-cell")) {
						setFocus();
					}
				}

				var cell = getCellFromEvent(e);
				if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
					return;
				}

				self.trigger('onClick', {
					row: cell.row,
					cell: cell.cell
				})
				if (e.isImmediatePropagationStopped()) {
					return;
				}

				if ((activeCell != cell.cell || activeRow != cell.row) && canCellBeActive(cell.row, cell.cell)) {
					scrollRowIntoView(cell.row, false);
					setActiveCellInternal(getCellNode(cell.row, cell.cell));
				}
			}

			function handleContextMenu(e) {
				var $cell = $(e.target).closest(".slick-cell", $canvas);
				if ($cell.length === 0) {
					return;
				}

				// are we editing this cell?
				if (activeCellNode === $cell[0] && currentEditor !== null) {
					return;
				}

				self.trigger('onContextMenu')
			}

			function handleDblClick(e) {
				var cell = getCellFromEvent(e);
				if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
					return;
				}

				self.trigger('onDblClick', {
					row: cell.row,
					cell: cell.cell
				})
				if (e.isImmediatePropagationStopped()) {
					return;
				}

				if (options.editable) {
					gotoCell(cell.row, cell.cell, true);
				}
			}

			function handleHeaderMouseEnter(e) {
				self.trigger('onHeaderMouseEnter', {
					"column": $(this).data("column")
				})
			}

			function handleHeaderMouseLeave(e) {
				self.trigger('onHeaderMouseLeave', {
					"column": $(this).data("column")
				})
			}

			function handleHeaderContextMenu(e) {
				var $header = $(e.target).closest(".slick-header-column", "."+classheadercolumns);
				var column = $header && $header.data("column");
				self.trigger('onHeaderContextMenu', {
					column: column
				})
			}

			function handleHeaderClick(e) {
				var $header = $(e.target).closest(".slick-header-column", "."+classheadercolumns);
				var column = $header && $header.data("column");
				if (column) {
					self.trigger('onHeaderClick', {
						column: column
					})
				}
			}

			function handleMouseEnter(e) {
				self.trigger('onMouseEnter')
			}

			function handleMouseLeave(e) {
				self.trigger('onMouseLeave')
			}

			function cellExists(row, cell) {
				return !(row < 0 || row >= getDataLength() || cell < 0 || cell >= columns.length);
			}

			function getCellFromPoint(x, y) {
				var row;
				if (!options.variableRowHeight) {
					row = getRowFromPosition(y);
				} else {
					row = Math.floor(getRowFromPosition(y + offset));
				}

				var cell = 0;

				var w = 0;
				for (var i = 0; i < columns.length && w < x; i++) {
					w += columns[i].width;
					cell++;
				}

				if (cell < 0) {
					cell = 0;
				}

				return {
					row: row,
					cell: cell - 1
				};
			}

			function getCellFromNode(cellNode) {
				// read column number from .l<columnNumber> CSS class
				var cls = /l\d+/.exec(cellNode.className);
				if (!cls) {
					throw "getCellFromNode: cannot get cell - " + cellNode.className;
				}
				return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
			}

			function getRowFromNode(rowNode) {
				for (var row in rowsCache) {
					if (rowsCache[row].rowNode === rowNode) {
						return row | 0;
					}
				}

				return null;
			}

			function getCellFromEvent(e) {
				var $cell = $(e.target).closest(".slick-cell", $canvas);
				if (!$cell.length) {
					return null;
				}

				var row = getRowFromNode($cell[0].parentNode);
				var cell = getCellFromNode($cell[0]);

				if (row === null || cell === null) {
					return null;
				} else {
					return {
						"row": row,
						"cell": cell
					};
				}
			}

			function getCellNodeBox(row, cell) {
				if (!cellExists(row, cell)) {
					return null;
				}

				var y1, y2;

				if (!options.variableRowHeight) {
					y1 = getRowTop(row);
					y2 = y1 + options.rowHeight - 1;
				} else {
					y1 = rowPositionCache[row].top - offset;
					y2 = y1 + rowPositionCache[row].height - 1;
				}

				var x1 = 0;
				for (var i = 0; i < cell; i++) {
					x1 += columns[i].width;
				}
				var x2 = x1 + columns[cell].width;

				return {
					top: y1,
					left: x1,
					bottom: y2,
					right: x2
				};
			}

			//////////////////////////////////////////////////////////////////////////////////////////////
			// Cell switching

			function resetActiveCell() {
				setActiveCellInternal(null, false);
			}

			function setFocus() {
				if (tabbingDirection == -1) {
					$focusSink[0].focus();
				} else {
					$focusSink2[0].focus();
				}
			}

			function scrollCellIntoView(row, cell, doPaging) {
				scrollRowIntoView(row, doPaging);

				var colspan = getColspan(row, cell);
				var left = columnPosLeft[cell],
					right = columnPosRight[cell + (colspan > 1 ? colspan - 1 : 0)],
					scrollRight = scrollLeft + viewportW;

				if (left < scrollLeft) {
					$viewport.scrollLeft(left);
					handleScroll();
					render();
				} else if (right > scrollRight) {
					$viewport.scrollLeft(Math.min(left, right - $viewport[0].clientWidth));
					handleScroll();
					render();
				}
			}

			function setActiveCellInternal(newCell, opt_editMode) {
				if (activeCellNode !== null) {
					makeActiveCellNormal();
					$(activeCellNode).removeClass("active");
					if (rowsCache[activeRow]) {
						$(rowsCache[activeRow].rowNode).removeClass("active");
					}
				}

				var activeCellChanged = (activeCellNode !== newCell);
				activeCellNode = newCell;

				if (activeCellNode !== null) {
					activeRow = getRowFromNode(activeCellNode.parentNode);
					activeCell = activePosX = getCellFromNode(activeCellNode);

					if (opt_editMode === null) {
						opt_editMode = (activeRow == getDataLength()) || options.autoEdit;
					}

					$(activeCellNode).addClass("active");
					$(rowsCache[activeRow].rowNode).addClass("active");

					if (options.editable && opt_editMode && isCellPotentiallyEditable(activeRow, activeCell)) {
						clearTimeout(h_editorLoader);

						if (options.asyncEditorLoading) {
							h_editorLoader = setTimeout(function () {
								makeActiveCellEditable();
							}, options.asyncEditorLoadDelay);
						} else {
							makeActiveCellEditable();
						}
					}
				} else {
					activeRow = activeCell = null;
				}

				if (activeCellChanged) {
					self.trigger('onActiveCellChanged', getActiveCell())
				}
			}

			function clearTextSelection() {
				if (document.selection && document.selection.empty) {
					try {
						//IE fails here if selected element is not in dom
						document.selection.empty();
					} catch (e) {}
				} else if (window.getSelection) {
					var sel = window.getSelection();
					if (sel && sel.removeAllRanges) {
						sel.removeAllRanges();
					}
				}
			}

			function isCellPotentiallyEditable(row, cell) {
				// is the data for this row loaded?
				if (row < getDataLength() && !getDataItem(row)) {
					return false;
				}

				// are we in the Add New row?  can we create new from this cell?
				if (columns[cell].cannotTriggerInsert && row >= getDataLength()) {
					return false;
				}

				// does this cell have an editor?
				if (!getEditor(row, cell)) {
					return false;
				}

				return true;
			}

			function makeActiveCellNormal() {
				if (!currentEditor) {
					return;
				}
				self.trigger('onBeforeCellEditorDestroy', {
					editor: currentEditor
				})
				currentEditor.destroy();
				currentEditor = null;

				if (activeCellNode) {
					var d = getDataItem(activeRow);
					$(activeCellNode).removeClass("editable invalid");
					if (d) {
						var column = columns[activeCell];
						var formatter = getFormatter(activeRow, column);
						activeCellNode.innerHTML = formatter(activeRow, activeCell, getDataItemValueForColumn(d, column), column, d);
						invalidatePostProcessingResults(activeRow);
					}
				}

				// if there previously was text selected on a page (such as selected text in the edit cell just removed),
				// IE can't set focus to anything else correctly
				if (navigator.userAgent.toLowerCase().match(/msie/)) {
					clearTextSelection();
				}
			}

			function makeActiveCellEditable(editor) {
				if (!activeCellNode) {
					return;
				}
				if (!options.editable) {
					throw "Grid : makeActiveCellEditable : should never get called when options.editable is false";
				}

				// cancel pending async call if there is one
				clearTimeout(h_editorLoader);

				if (!isCellPotentiallyEditable(activeRow, activeCell)) {
					return;
				}

				var columnDef = columns[activeCell];
				var item = getDataItem(activeRow);

				if (self.trigger('onCellCssStylesChanged', {
					row: activeRow,
					cell: activeCell,
					item: item,
					column: columnDef
				}) === false) {
					setFocus();
					return;
				}

				$(activeCellNode).addClass("editable");

				// don't clear the cell if a custom editor is passed through
				if (!editor) {
					activeCellNode.innerHTML = "";
				}

				var edtr = editor || getEditor(activeRow, activeCell)

				currentEditor = new edtr({
					grid: self,
					gridPosition: absBox($container[0]),
					position: absBox(activeCellNode),
					container: activeCellNode,
					column: columnDef,
					item: item || {},
					commitChanges: commitEditAndSetFocus,
					cancelChanges: cancelEditAndSetFocus
				});

				if (item) {
					currentEditor.loadValue(item);
				}

				serializedEditorValue = currentEditor.serializeValue();

				if (currentEditor.position) {
					handleActiveCellPositionChange();
				}
			}

			function commitEditAndSetFocus() {
				// if the commit fails, it would do so due to a validation error
				// if so, do not steal the focus from the editor
				setFocus();
				if (options.autoEdit) {
					navigateDown();
				}
			}

			function cancelEditAndSetFocus() {
				setFocus();
			}

			function absBox(elem) {
				var box = {
					top: elem.offsetTop,
					left: elem.offsetLeft,
					bottom: 0,
					right: 0,
					width: $(elem).outerWidth(),
					height: $(elem).outerHeight(),
					visible: true
				};
				box.bottom = box.top + box.height;
				box.right = box.left + box.width;

				// walk up the tree
				var offsetParent = elem.offsetParent;
				while ((elem = elem.parentNode) != document.body) {
					if (box.visible && elem.scrollHeight != elem.offsetHeight && $(elem).css("overflowY") != "visible") {
						box.visible = box.bottom > elem.scrollTop && box.top < elem.scrollTop + elem.clientHeight;
					}

					if (box.visible && elem.scrollWidth != elem.offsetWidth && $(elem).css("overflowX") != "visible") {
						box.visible = box.right > elem.scrollLeft && box.left < elem.scrollLeft + elem.clientWidth;
					}

					box.left -= elem.scrollLeft;
					box.top -= elem.scrollTop;

					if (elem === offsetParent) {
						box.left += elem.offsetLeft;
						box.top += elem.offsetTop;
						offsetParent = elem.offsetParent;
					}

					box.bottom = box.top + box.height;
					box.right = box.left + box.width;
				}

				return box;
			}

			function getActiveCellPosition() {
				return absBox(activeCellNode);
			}

			function getGridPosition() {
				return absBox($container[0])
			}

			function handleActiveCellPositionChange() {
				if (!activeCellNode) {
					return;
				}

				self.trigger('onActiveCellPositionChanged')

				if (currentEditor) {
					var cellBox = getActiveCellPosition();
					if (currentEditor.show && currentEditor.hide) {
						if (!cellBox.visible) {
							currentEditor.hide();
						} else {
							currentEditor.show();
						}
					}

					if (currentEditor.position) {
						currentEditor.position(cellBox);
					}
				}
			}

			function getCellEditor() {
				return currentEditor;
			}

			function getActiveCell() {
				if (!activeCellNode) {
					return null;
				} else {
					return {
						row: activeRow,
						cell: activeCell
					};
				}
			}

			function getActiveCellNode() {
				return activeCellNode;
			}

			function scrollRowIntoView(row, doPaging) {
				var rowAtTop, rowAtBottom;

				if (!options.variableRowHeight) {
					rowAtTop = row * options.rowHeight;
					rowAtBottom = (row + 1) * options.rowHeight - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0);
				} else {
					rowAtTop = rowPositionCache[row].top;
					rowAtBottom = rowPositionCache[row].bottom - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0);
				}


				// need to page down?
				var pgdwn,
					pgup;
				if (!options.variableRowHeight) {
					pgdwn = (row + 1) * options.rowHeight > scrollTop + viewportH + offset
					pgup = row * options.rowHeight < scrollTop + offset
				} else {
					pgdwn = rowPositionCache[row].bottom > scrollTop + viewportH + offset
					pgup = rowPositionCache[row].top < scrollTop + offset
				}

				if (pgdwn) {
					scrollTo(doPaging ? rowAtTop : rowAtBottom);
					render();
				}
				// or page up?
				else if (pgup) {
					scrollTo(doPaging ? rowAtBottom : rowAtTop);
					render();
				}
			}

			function scrollRowToTop(row) {
				if (!options.variableRowHeight) {
					scrollTo(row * options.rowHeight);
				} else {
					scrollTo(rowPositionCache[row].top);
				}
				render();
			}

			function scrollPage(dir) {
				var deltaRows = dir * numVisibleRows;
				scrollTo((getRowFromPosition(scrollTop) + deltaRows) * options.rowHeight);
				render();

				if (options.enableCellNavigation && activeRow !== null) {
					var row = activeRow + deltaRows;
					if (row >= getDataLengthIncludingAddNew()) {
						row = getDataLengthIncludingAddNew() - 1;
					}
					if (row < 0) {
						row = 0;
					}

					var cell = 0,
						prevCell = null;
					var prevActivePosX = activePosX;
					while (cell <= activePosX) {
						if (canCellBeActive(row, cell)) {
							prevCell = cell;
						}
						cell += getColspan(row, cell);
					}

					if (prevCell !== null) {
						setActiveCellInternal(getCellNode(row, prevCell));
						activePosX = prevActivePosX;
					} else {
						resetActiveCell();
					}
				}
			}

			function navigatePageDown() {
				scrollPage(1);
			}

			function navigatePageUp() {
				scrollPage(-1);
			}

			function getColspan(row, cell) {
				var metadata = data.getItemMetadata && data.getItemMetadata(row);
				if (!metadata || !metadata.columns) {
					return 1;
				}

				var columnData = metadata.columns[columns[cell].id] || metadata.columns[cell];
				var colspan = (columnData && columnData.colspan);
				if (colspan === "*") {
					colspan = columns.length - cell;
				} else {
					colspan = colspan || 1;
				}

				return colspan;
			}

			function findFirstFocusableCell(row) {
				var cell = 0;
				while (cell < columns.length) {
					if (canCellBeActive(row, cell)) {
						return cell;
					}
					cell += getColspan(row, cell);
				}
				return null;
			}

			function findLastFocusableCell(row) {
				var cell = 0;
				var lastFocusableCell = null;
				while (cell < columns.length) {
					if (canCellBeActive(row, cell)) {
						lastFocusableCell = cell;
					}
					cell += getColspan(row, cell);
				}
				return lastFocusableCell;
			}

			function gotoRight(row, cell, posX) {
				if (cell >= columns.length) {
					return null;
				}

				do {
					cell += getColspan(row, cell);
				}
				while (cell < columns.length && !canCellBeActive(row, cell));

				if (cell < columns.length) {
					return {
						"row": row,
						"cell": cell,
						"posX": cell
					};
				}
				return null;
			}

			function gotoLeft(row, cell, posX) {
				if (cell <= 0) {
					return null;
				}

				var firstFocusableCell = findFirstFocusableCell(row);
				if (firstFocusableCell === null || firstFocusableCell >= cell) {
					return null;
				}

				var prev = {
					"row": row,
					"cell": firstFocusableCell,
					"posX": firstFocusableCell
				};
				var pos;
				while (true) {
					pos = gotoRight(prev.row, prev.cell, prev.posX);
					if (!pos) {
						return null;
					}
					if (pos.cell >= cell) {
						return prev;
					}
					prev = pos;
				}
			}

			function gotoDown(row, cell, posX) {
				var prevCell;
				while (true) {
					if (++row >= getDataLengthIncludingAddNew()) {
						return null;
					}

					prevCell = cell = 0;
					while (cell <= posX) {
						prevCell = cell;
						cell += getColspan(row, cell);
					}

					if (canCellBeActive(row, prevCell)) {
						return {
							"row": row,
							"cell": prevCell,
							"posX": posX
						};
					}
				}
			}

			function gotoUp(row, cell, posX) {
				var prevCell;
				while (true) {
					if (--row < 0) {
						return null;
					}

					prevCell = cell = 0;
					while (cell <= posX) {
						prevCell = cell;
						cell += getColspan(row, cell);
					}

					if (canCellBeActive(row, prevCell)) {
						return {
							"row": row,
							"cell": prevCell,
							"posX": posX
						};
					}
				}
			}

			function gotoNext(row, cell, posX) {
				if (row === null && cell === null) {
					row = cell = posX = 0;
					if (canCellBeActive(row, cell)) {
						return {
							"row": row,
							"cell": cell,
							"posX": cell
						};
					}
				}

				var pos = gotoRight(row, cell, posX);
				if (pos) {
					return pos;
				}

				var firstFocusableCell = null;
				while (++row < getDataLengthIncludingAddNew()) {
					firstFocusableCell = findFirstFocusableCell(row);
					if (firstFocusableCell !== null) {
						return {
							"row": row,
							"cell": firstFocusableCell,
							"posX": firstFocusableCell
						};
					}
				}
				return null;
			}

			function gotoPrev(row, cell, posX) {
				if (row === null && cell === null) {
					row = getDataLengthIncludingAddNew() - 1;
					cell = posX = columns.length - 1;
					if (canCellBeActive(row, cell)) {
						return {
							"row": row,
							"cell": cell,
							"posX": cell
						};
					}
				}

				var pos;
				var lastSelectableCell;
				while (!pos) {
					pos = gotoLeft(row, cell, posX);
					if (pos) {
						break;
					}
					if (--row < 0) {
						return null;
					}

					cell = 0;
					lastSelectableCell = findLastFocusableCell(row);
					if (lastSelectableCell !== null) {
						pos = {
							"row": row,
							"cell": lastSelectableCell,
							"posX": lastSelectableCell
						};
					}
				}
				return pos;
			}

			function navigateRight() {
				return navigate("right");
			}

			function navigateLeft() {
				return navigate("left");
			}

			function navigateDown() {
				return navigate("down");
			}

			function navigateUp() {
				return navigate("up");
			}

			function navigateNext() {
				return navigate("next");
			}

			function navigatePrev() {
				return navigate("prev");
			}

			/**
			 * @param {string} dir Navigation direction.
			 * @return {boolean} Whether navigation resulted in a change of active cell.
			 */
			function navigate(dir) {
				if (!options.enableCellNavigation) {
					return false;
				}

				if (!activeCellNode && dir != "prev" && dir != "next") {
					return false;
				}

				setFocus();

				var tabbingDirections = {
					"up": -1,
					"down": 1,
					"left": -1,
					"right": 1,
					"prev": -1,
					"next": 1
				};
				tabbingDirection = tabbingDirections[dir];

				var stepFunctions = {
					"up": gotoUp,
					"down": gotoDown,
					"left": gotoLeft,
					"right": gotoRight,
					"prev": gotoPrev,
					"next": gotoNext
				};
				var stepFn = stepFunctions[dir];
				var pos = stepFn(activeRow, activeCell, activePosX);
				if (pos) {
					var isAddNewRow = (pos.row == getDataLength());
					scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);
					setActiveCellInternal(getCellNode(pos.row, pos.cell));
					activePosX = pos.posX;
					return true;
				} else {
					setActiveCellInternal(getCellNode(activeRow, activeCell));
					return false;
				}
			}

			function getCellNode(row, cell) {
				if (rowsCache[row]) {
					ensureCellNodesInRowsCache(row);
					return rowsCache[row].cellNodesByColumnIdx[cell];
				}
				return null;
			}

			function setActiveCell(row, cell) {
				if (!initialized) {
					return;
				}
				if (row > getDataLength() || row < 0 || cell >= columns.length || cell < 0) {
					return;
				}

				if (!options.enableCellNavigation) {
					return;
				}

				scrollCellIntoView(row, cell, false);
				setActiveCellInternal(getCellNode(row, cell), false);
			}

			function canCellBeActive(row, cell) {
				if (!options.enableCellNavigation || row >= getDataLengthIncludingAddNew() ||
					row < 0 || cell >= columns.length || cell < 0) {
					return false;
				}

				var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
				if (rowMetadata && typeof rowMetadata.focusable === "boolean") {
					return rowMetadata.focusable;
				}

				var columnMetadata = rowMetadata && rowMetadata.columns;
				if (columnMetadata && columnMetadata[columns[cell].id] && typeof columnMetadata[columns[cell].id].focusable === "boolean") {
					return columnMetadata[columns[cell].id].focusable;
				}
				if (columnMetadata && columnMetadata[cell] && typeof columnMetadata[cell].focusable === "boolean") {
					return columnMetadata[cell].focusable;
				}

				return columns[cell].focusable;
			}

			function canCellBeSelected(row, cell) {
				if (row >= getDataLength() || row < 0 || cell >= columns.length || cell < 0) {
					return false;
				}

				var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
				if (rowMetadata && typeof rowMetadata.selectable === "boolean") {
					return rowMetadata.selectable;
				}

				var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[columns[cell].id] || rowMetadata.columns[cell]);
				if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
					return columnMetadata.selectable;
				}

				return columns[cell].selectable;
			}

			function gotoCell(row, cell, forceEdit) {
				if (!initialized) {
					return;
				}
				if (!canCellBeActive(row, cell)) {
					return;
				}

				scrollCellIntoView(row, cell, false);

				var newCell = getCellNode(row, cell);

				// if selecting the 'add new' row, start editing right away
				setActiveCellInternal(newCell, forceEdit || (row === getDataLength()) || options.autoEdit);

				// if no editor was created, set the focus back on the grid
				if (!currentEditor) {
					setFocus();
				}
			}


			//////////////////////////////////////////////////////////////////////////////////////////////
			// IEditor implementation for the editor lock

			function commitCurrentEdit() {
				var item = getDataItem(activeRow);
				var column = columns[activeCell];

				if (currentEditor) {
					if (currentEditor.isValueChanged()) {
						var validationResults = currentEditor.validate();

						if (validationResults.valid) {
							if (activeRow < getDataLength()) {
								var editCommand = {
									row: activeRow,
									cell: activeCell,
									editor: currentEditor,
									serializedValue: currentEditor.serializeValue(),
									prevSerializedValue: serializedEditorValue,
									execute: function () {
										this.editor.applyValue(item, this.serializedValue);
										updateRow(this.row);
									},
									undo: function () {
										this.editor.applyValue(item, this.prevSerializedValue);
										updateRow(this.row);
									}
								};

								if (options.editCommandHandler) {
									makeActiveCellNormal();
									options.editCommandHandler(item, column, editCommand);
								} else {
									editCommand.execute();
									makeActiveCellNormal();
								}

								self.trigger('onCellChange', {
									row: activeRow,
									cell: activeCell,
									item: item
								});
							} else {
								var newItem = {};
								currentEditor.applyValue(newItem, currentEditor.serializeValue());
								makeActiveCellNormal();

								self.trigger('onAddNewRow', {
									item: newItem,
									column: column
								});
							}

							return true;
						} else {
							// Re-add the CSS class to trigger transitions, if any.
							$(activeCellNode).removeClass("invalid");
							$(activeCellNode).width(); // force layout
							$(activeCellNode).addClass("invalid");

							self.trigger('onValidationError', {
								editor: currentEditor,
								cellNode: activeCellNode,
								validationResults: validationResults,
								row: activeRow,
								cell: activeCell,
								column: column
							});

							currentEditor.focus();
							return false;
						}
					}

					makeActiveCellNormal();
				}
				return true;
			}

			function cancelCurrentEdit() {
				makeActiveCellNormal();
				return true;
			}

			function rowsToRanges(rows) {
				var ranges = [];
				var lastCell = columns.length - 1;
				for (var i = 0; i < rows.length; i++) {
					ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
				}
				return ranges;
			}

			function getSelectedRows() {
				if (!selectionModel) {
					throw "Selection model is not set";
				}
				return selectedRows;
			}

			function setSelectedRows(rows) {
				if (!selectionModel) {
					throw "Selection model is not set";
				}
				selectionModel.setSelectedRanges(rowsToRanges(rows));
			}

			//////////////////////////////////////////////////////////////////////////////////////
			// Public API

			$.extend(this, {
				// Methods
				"registerPlugin": registerPlugin,
				"unregisterPlugin": unregisterPlugin,
				"getColumns": getColumns,
				"setColumns": setColumns,
				"getColumnIndex": getColumnIndex,
				"updateColumnHeader": updateColumnHeader,
				"setSortColumn": setSortColumn,
				"setSortColumns": setSortColumns,
				"getSortColumns": getSortColumns,
				"autosizeColumns": autosizeColumns,
				"getOptions": getOptions,
				"getData": getData,
				"getDataLength": getDataLength,
				"getDataItem": getDataItem,
				"setData": setData,
				"getSelectionModel": getSelectionModel,
				"setSelectionModel": setSelectionModel,
				"getSelectedRows": getSelectedRows,
				"setSelectedRows": setSelectedRows,
				"getContainerNode": getContainerNode,

				"render": render,
				"invalidate": invalidate,
				"invalidateRow": invalidateRow,
				"invalidateRows": invalidateRows,
				"invalidateAllRows": invalidateAllRows,
				"updateCell": updateCell,
				"updateRow": updateRow,
				"getViewport": getVisibleRange,
				"getRenderedRange": getRenderedRange,
				"resizeCanvas": resizeCanvas,
				"updateRowCount": updateRowCount,
				"scrollRowIntoView": scrollRowIntoView,
				"scrollRowToTop": scrollRowToTop,
				"scrollCellIntoView": scrollCellIntoView,
				"getCanvasNode": getCanvasNode,
				"focus": setFocus,

				"getCellFromPoint": getCellFromPoint,
				"getCellFromEvent": getCellFromEvent,
				"getActiveCell": getActiveCell,
				"setActiveCell": setActiveCell,
				"getActiveCellNode": getActiveCellNode,
				"getActiveCellPosition": getActiveCellPosition,
				"resetActiveCell": resetActiveCell,
				"editActiveCell": makeActiveCellEditable,
				"getCellEditor": getCellEditor,
				"getCellNode": getCellNode,
				"getCellNodeBox": getCellNodeBox,
				"canCellBeSelected": canCellBeSelected,
				"canCellBeActive": canCellBeActive,
				"navigatePrev": navigatePrev,
				"navigateNext": navigateNext,
				"navigateUp": navigateUp,
				"navigateDown": navigateDown,
				"navigateLeft": navigateLeft,
				"navigateRight": navigateRight,
				"navigatePageUp": navigatePageUp,
				"navigatePageDown": navigatePageDown,
				"gotoCell": gotoCell,
				"getGridPosition": getGridPosition,
				"flashCell": flashCell,
				"addCellCssStyles": addCellCssStyles,
				"setCellCssStyles": setCellCssStyles,
				"removeCellCssStyles": removeCellCssStyles,
				"getCellCssStyles": getCellCssStyles,

				"destroy": destroy,

				// IEditor implementation
				"getEditController": getEditController
			});
		}


		// metadataprovider()
		// Provides item metadata for group (Slick.Group) and totals (Slick.Totals)
		// rows produced by the DataView. This metadata overrides the default behavior
		// and formatting of those rows so that they appear and function correctly when
		// processed by the grid.
		//
		// This class also acts as a grid plugin providing event handlers to expand & collapse
		// groups. If "grid.registerPlugin(...)" is not called, expand & collapse will not work.
		//
		// @param	options		object		Data View options
		//
		// @return object
		metadataprovider = function (options) {
			var _grid;
			var _defaults = {
				groupCssClass: "slick-group",
				groupTitleCssClass: "slick-group-title",
				totalsCssClass: "slick-group-totals",
				groupFocusable: true,
				totalsFocusable: false,
				toggleCssClass: "slick-group-toggle",
				toggleExpandedCssClass: "expanded",
				toggleCollapsedCssClass: "collapsed",
				enableExpandCollapse: true,
				groupFormatter: defaultGroupCellFormatter,
				totalsFormatter: defaultTotalsCellFormatter
			};

			options = $.extend(true, {}, _defaults, options);


			function defaultGroupCellFormatter(row, cell, value, columnDef, item) {
				if (!options.enableExpandCollapse) {
					return item.title;
				}

				var indentation = item.level * 15 + "px";

				return "<span class='" + options.toggleCssClass + " " +
					(item.collapsed ? options.toggleCollapsedCssClass : options.toggleExpandedCssClass) +
					"' style='margin-left:" + indentation + "'>" +
					"<span class='icon icon16'></span>" +
					"<span class='" + options.groupTitleCssClass + "' level='" + item.level + "'>" +
					item.title +
					"</span></span>";
			}

			function defaultTotalsCellFormatter(row, cell, value, columnDef, item) {
				return (columnDef.groupTotalsFormatter && columnDef.groupTotalsFormatter(item, columnDef)) || "";
			}


			function init(grid) {
				_grid = grid;
				_grid.onClick.subscribe(handleGridClick);
				_grid.onKeyDown.subscribe(handleGridKeyDown);

			}

			function destroy() {
				if (_grid) {
					_grid.onClick.unsubscribe(handleGridClick);
					_grid.onKeyDown.unsubscribe(handleGridKeyDown);
				}
			}

			function handleGridClick(e, args) {
				var item = this.getDataItem(args.row),
					isToggler = $(e.target).hasClass(options.toggleCssClass) || $(e.target).closest('.' + options.toggleCssClass).length

				if (item && item instanceof Slick.Group && isToggler) {
					if (item.collapsed) {
						this.getData().expandGroup(item.groupingKey);
					} else {
						this.getData().collapseGroup(item.groupingKey);
					}

					e.stopImmediatePropagation();
					e.preventDefault();
				}
			}

			// TODO:  add -/+ handling

			function handleGridKeyDown(e, args) {
				if (options.enableExpandCollapse && (e.which == $.ui.keyCode.SPACE)) {
					var activeCell = this.getActiveCell();
					if (activeCell) {
						var item = this.getDataItem(activeCell.row);
						if (item && item instanceof Slick.Group) {
							if (item.collapsed) {
								this.getData().expandGroup(item.groupingKey);
							} else {
								this.getData().collapseGroup(item.groupingKey);
							}

							e.stopImmediatePropagation();
							e.preventDefault();
						}
					}
				}
			}

			function getGroupRowMetadata(item) {
				return {
					selectable: false,
					focusable: options.groupFocusable,
					cssClasses: options.groupCssClass,
					columns: {
						0: {
							colspan: "*",
							formatter: options.groupFormatter,
							editor: null
						}
					}
				};
			}

			function getTotalsRowMetadata(item) {
				return {
					selectable: false,
					focusable: options.totalsFocusable,
					cssClasses: options.totalsCssClass,
					formatter: options.totalsFormatter,
					editor: null
				};
			}


			return {
				"init": init,
				"destroy": destroy,
				"getGroupRowMetadata": getGroupRowMetadata,
				"getTotalsRowMetadata": getTotalsRowMetadata
			};
		}


		// processData()
		// Parses the options.data parameter to ensure the data set is formatter correctly.
		// Creates a new Data View object to handle the data.
		//
		// @param	callback	function	Callback function
		//
		// @return
		processData = function (callback) {

			// Create a new Data View
			self.dataView = new dataview({
				remote: self.options.remote
			})

			// Item Metadata overwrites. This provides support for row-specific overwrites
			// like custom row height and colspans.
			self.dataView.getItemMetadata = function (row) {
				var item = this.getItem(row);

				// For remote models -- skip rows that don't have data yet
				if (!item) return

				// Empty Alert
				if (item.__alert) {
					return {
						selectable: false,
						focusable: false,
						cssClasses: "ui-grid-alert",
						columns: {
							0: {
								colspan: "*",
								formatter: function (row, cell, value, columnDef, data) {
									return data.data.data.msg
								},
								editor: null
							}
						}
					}
				}

				// Group headers should return their own metadata object
				if (item.__nonDataRow) return self.gimp.getGroupRowMetadata(item)

				var obj = {
					columns: {},
					rows: {}
				}

				// Add support for variable row 'height'
				if (item.height) {
					obj.rows[row] = {
						height: item.height
					}
				}

				// Add support for 'fullspan'
				if (item.fullspan) {
					obj.columns[0] = {
						colspan: '*'
					}
				}

				// Add support for 'cssClass'
				if (self.options.rowPreprocess) {
					obj = $.extend(obj, self.options.rowPreprocess(row, item))
				}

				return obj
			}

			if (self.options.data) {
				self.dataView.beginUpdate();

				// Backbone.Collection
				if (self.options.data instanceof Backbone.Collection) {
					self.options.data.each(function (item) {
						self.dataView.addItem(item)
					})
				}

				// Normal Data
				else {
					// Make sure every row has an id
					for (var i = 0, l = self.options.data.length; i < l; i++) {
						item = self.options.data[i];
						if (!item.id) {
							item.id = item.data.id
						}
					}

					self.dataView.setItems(self.options.data)
				}

				self.dataView.endUpdate();
			}


			// Data View Events
			self.dataView.on('onRowCountChanged', function (e, args) {
				// Re-render when rows are inserted or removed
				self.grid.updateRowCount();
				self.grid.render();
			})

			self.dataView.on('onRowsChanged', function (e, args) {
				// Re-render when rows are changed
				self.grid.invalidateRows(args.rows);
				self.grid.render();
			});


			// Remote Data Handling
			if (self.options.remote) {
				self.loader = new RemoteModel(self.options.data)

				self.loader.onDataLoading.subscribe(function () {showLoader()});
				self.loader.onDataLoaded.subscribe(function (e, args) {
					for (var i = args.from; i <= args.to; i++) {
						self.grid.invalidateRow(i);
					}

					// Display alert if empty
					if (self.options.alertOnEmpty && self.dataView.getLength() === 0) {
						// Need to clear cache to reset dataview lengths
						self.loader.clearCache()

						// Insert row
						insertEmptyAlert()

						// Manually tell collection it's 1 units long
						self.dataView.setLength(1)
					}

					self.grid.updateRowCount();
					self.grid.render();

					hideLoader()
				});

				return callback()
			} else {
				// Display alert if empty
				if (self.options.alertOnEmpty && self.dataView.getLength() === 0) {
					insertEmptyAlert()
				}
			}

			return callback()
		}


		// validateColumns()
		// Parses the options.columns list to ensure column data is correctly configured.
		//
		validateColumns = function () {
			if (!self.options.columns && !(self.options.data instanceof Backbone.Collection)) {
				return
			}

			// If a Backbone Collection is given as the data set without any columns,
			// use the known columns for that collection as the default
			if (self.options.data instanceof Backbone.Collection) {
				buildColumnsFromCollection()
			}

			for (var i = 0, l = self.options.columns.length; i < l; i++) {
				// Set defaults
				// TODO: This is ugly. Can anything be done?
				c = self.options.columns[i]
				c = self.options.columns[i] = _.extend(JSON.parse(JSON.stringify(columnDefaults)), c);

				// An "id" is required. If it's missing, auto-generate one
				if (!c.id) c.id = c.field + '_' + i || c.name + '_' + i

				// TODO: If editable, ensure columns have a default "Slick.Editors.Text" editor set
				//if (self.options.editable && c.editor === undefined) c.editor = Slick.Editors.Text

				// TODO: This is temporarily here until grouping via remote data can be enabled
				if (self.options.remote) c.groupable = false

				// Convert "tooltip" param to a Cumul8-friendly tooltip
				if (c.tooltip) {
					cssClass = c.headerCssClass ? c.headerCssClass + " tooltip" : "tooltip"
					c.headerCssClass = cssClass
					c.toolTip = c.tooltip
				}

				// If any columns require asyncPostRender, enable it on the grid
				// TODO: Fix this so that you can remove "enableAsyncPostRender" from the main options
				if (c.asyncPostRender && !enableAsyncPostRender) {
					enableAsyncPostRender = true
				}

				// If min/max width is set -- use it to reset given width
				if (c.minWidth && c.width < c.minWidth) c.width = c.minWidth;
				if (c.maxWidth && c.width > c.maxWidth)	c.width = c.maxWidth;
			}
		}


		// Initialize the class
		return initialize();
	};
})