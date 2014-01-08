// doby-grid.js 0.0.1
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint browser: true, vars: true, plusplus: true, indent: 4, maxerr: 50*/
/*jshint expr: true, white: true*/
/*global console, define, saveAs*/

(function (root, factory) {
	"use strict";

	// Add AMD support
	if (typeof define === 'function' && define.amd) {
		define([
			'jquery',
			'underscore',
			'backbone'
		], function ($, _, Backbone) {
			// Export global even in AMD case in case this script is loaded with
			// others that may still expect a global Backbone.
			return factory(root, $, _, Backbone);
		});
	} else {
		// Browser globals
		root.DobyGrid = factory(root, (root.jQuery || root.$), root._, root.Backbone);
	}
}(this, function (root, $, _, Backbone) {
	"use strict";

	var DobyGrid = function (options) {
		options = options || {};

		// Name of this Doby component
		this.NAME = 'doby-grid';

		// Current version of the library
		this.VERSION = '0.0.1';

		// Ensure options are an object
		if (typeof options !== "object" || _.isArray(options)) {
			throw new TypeError('The "options" param must be an object.');
		}

		// Handle console logs if they aren't enabled
		if (typeof window.console !== "object") window.console = {};

		// Private
		var self = this,
			$canvas,
			$headers,
			$headerFilter,
			$headerScroller,
			$style,
			$viewport,
			absoluteColumnMinWidth,
			activePosX,
			Aggregate,
			applyColumnHeaderWidths,
			applyColumnWidths,
			asyncPostProcessRows,
			autosizeColumns,
			bindCellRangeSelect,
			bindRowResize,
			cache = {
				activeColumns: [],	// Stores the list of columns that are active
				aggregatorsByColumnId: {},
				columnPosLeft: [],
				columnPosRight: [],
				columnsById: {},
				indexById: {},
				nodes: {},
				postprocess: {},
				rowPositions: {},
				rows: []
			},
			cacheRows,
			calculateVisibleRows,
			canCellBeActive,
			canCellBeSelected,
			canvasWidth,
			cellExists,
			cellHeightDiff = 0,
			CellRangeDecorator,
			cellWidthDiff = 0,
			cj,				// "jumpiness" coefficient
			classalert = this.NAME + '-alert',
			classcell = this.NAME + '-cell',
			classclipboard = this.NAME + '-clipboard',
			classcollapsed = 'collapsed',
			classcolumnname = this.NAME + '-column-name',
			classcontextmenu = this.NAME + '-contextmenu',
			classdropdown = this.NAME + '-dropdown',
			classdropdownmenu = classdropdown + '-menu',
			classdropdownitem = classdropdown + '-item',
			classdropdowndivider = classdropdown + '-divider',
			classdropdownarrow = classdropdown + '-arrow',
			classdropdownicon = classdropdown + '-icon',
			classdropdownleft = classdropdown + '-left',
			classexpanded = 'expanded',
			classgroup = this.NAME + '-group',
			classgrouptitle = this.NAME + '-group-title',
			classgrouptoggle = this.NAME + '-group-toggle',
			classhandle = this.NAME + '-resizable-handle',
			classheader = this.NAME + '-header',
			classheadercolumns = this.NAME + '-header-columns',
			classheadercolumn = this.NAME + '-header-column',
			classheadercolumnactive = this.NAME + '-header-column-active',
			classheadercolumndrag = this.NAME + '-header-column-dragging',
			classheadercolumnsorted = this.NAME + '-header-column-sorted',
			classheaderfilter = this.NAME + '-header-filter',
			classheaderfiltercell = this.NAME + '-header-filter-cell',
			classheadersortable = 'sortable',
			classinvalid = 'invalid',
			classnoright = this.NAME + '-no-right',
			classplaceholder = this.NAME + '-sortable-placeholder',
			classrangedecorator = this.NAME + '-range-decorator',
			classrow = this.NAME + '-row',
			classrowdragcontainer = this.NAME + '-row-drag-container',
			classrowhandle = this.NAME + '-row-handle',
			classrowtotal = this.NAME + '-row-total',
			classsortindicator = this.NAME + '-sort-indicator',
			classsortindicatorasc = classsortindicator + '-asc',
			classsortindicatordesc = classsortindicator + '-desc',
			classtooltip = this.NAME + '-tooltip',
			classtooltiparrow = this.NAME + '-tooltip-arrow',
			classviewport = this.NAME + '-viewport',
			classcanvas = this.NAME + '-canvas',
			cleanUpAndRenderCells,
			cleanUpCells,
			cleanupRows,
			clearTextSelection,
			Collection,
			columnCssRulesL,
			columnCssRulesR,
			commitCurrentEdit,
			copySelected,
			counter_rows_rendered = 0,
			createCssRules,
			createGrid,
			createGroupingObject,
			currentEditor = null,
			defaultEditor,
			defaultFormatter,
			deselectCells,
			disableSelection,
			Dropdown,
			enableAsyncPostRender = false,	// Does grid have any columns that require post-processing
			ensureCellNodesInRowsCache,
			executeSorter,
			findFirstFocusableCell,
			findLastFocusableCell,
			generatePlaceholders,
			getActiveCell,
			getBrowserData,
			getCanvasWidth,
			getCaretPosition,
			getCellFromEvent,
			getCellFromNode,
			getCellFromPoint,
			getCellNode,
			getCellNodeBox,
			getColumnById,
			getColumnCssRules,
			getColumnContentWidth,
			getColumnFromEvent,
			getColspan,
			getDataItem,
			getDataItemValueForColumn,
			getDataLength,
			getEditor,
			getFormatter,
			getHeadersWidth,
			getLocale,
			getMaxCSSHeight,
			getRenderedRange,
			getRowFromNode,
			getRowFromPosition,
			getScrollbarSize,
			getValueFromItem,
			getVBoxDelta,
			getViewportHeight,
			getVisibleRange,
			gotoCell,
			gotoDown,
			gotoLeft,
			gotoNext,
			gotoPrev,
			gotoRight,
			gotoUp,
			Group,
			h,				// real scrollable height
			h_editorLoader = null,
			h_render = null,
			h_postrender = null,
			handleClick,
			handleContextMenu,
			handleDblClick,
			handleHeaderContextMenu,
			handleHeaderClick,
			handleKeyDown,
			handleScroll,
			handleWindowResize,
			hasGrouping,
			hasSorting,
			headerColumnWidthDiff = 0,
			headerColumnHeightDiff = 0, // border+padding
			idProperty = "id",	// property holding a unique row id
			isFileSaverSupported = typeof window.Blob === "function",
			initialize,
			initialized = false,
			insertAddRow,
			invalidate,
			invalidateAllRows,
			invalidatePostProcessingResults,
			invalidateRow,
			invalidateRows,
			isCellPotentiallyEditable,
			isCellSelected,
			isColumnSelected,
			lastRenderedScrollLeft = 0,
			lastRenderedScrollTop = 0,
			bindToCollection,
			makeActiveCellEditable,
			makeActiveCellNormal,
			measureCellPadding,
			n,				// number of pages
			naturalSort,
			navigate,
			NonDataItem = function (data) {
				// NonDataItem()
				// A base class that all special / non-data rows (like Group) derive from.
				//
				// @param	data		object		Data object for this item
				//
				this.__nonDataRow = true;
				if (data) $.extend(this, data);
			},
			numVisibleRows,
			offset = 0,		// current page offset
			page = 0,		// current page
			ph,				// page height
			Placeholder,
			postProcessFromRow = null,
			postProcessToRow = null,
			prevScrollLeft = 0,
			prevScrollTop = 0,
			Range,
			remote = false,		// Should data be fetched remotely?
			remoteAllLoaded,
			remoteLoaded,
			remoteCount,
			remoteFetch,
			remoteFetchGroups,
			remoteRequest = null,
			remoteTimer = null,
			removeCssRules,
			removeInvalidRanges,
			removeRowFromCache,
			render,
			renderCell,
			renderColumnHeaders,
			renderMenu,
			renderRow,
			renderRows,
			resetActiveCell,
			resizeCanvas,
			scrollCellIntoView,
			scrollLeft = 0,
			scrollPage,
			scrollRowIntoView,
			scrollTo,
			scrollTop = 0,
			serializedEditorValue,
			setActiveCellInternal,
			setRowHeight,
			setupColumnReorder,
			setupColumnResize,
			setupColumnSort,
			showQuickFilter,
			showTooltip,
			startPostProcessing,
			stylesheet,
			styleSortColumns,
			tabbingDirection = 1,
			th,				// virtual height
			toggleHeaderContextMenu,
			uid = this.NAME + "-" + Math.round(1000000 * Math.random()),
			updateCanvasWidth,
			updateCellCssStylesOnRenderedRows,
			updateColumnCaches,
			updateRow,
			updateRowCount,
			validateColumns,
			validateOptions,
			variableRowHeight,
			viewportH,
			viewportHasHScroll,
			viewportHasVScroll,
			viewportW,
			vScrollDir = 1;

		NonDataItem.prototype.toString = function () { return "NonDataItem"; };

		// Default Grid Options
		this.options = $.extend({
			activeFollowsPage:		false,
			activateSelection:		true,
			addRow:					false,
			asyncEditorLoadDelay:	100,
			asyncEditorLoading:		false,
			asyncPostRenderDelay:	25,
			autoColumnWidth:		false,
			autoDestroy:			true,
			autoEdit:				true,
			"class":				null,
			clipboard:				"csv",
			columns:				[],
			ctrlSelect:				true,
			data:					[],
			dataExtractor:			null,
			columnWidth:			80,
			editable:				false,
			editor:					null,
			emptyNotice:			true,
			exportFileName:			"doby-grid-export",
			formatter:				null,
			fullWidthRows:			true,
			groupable:				true,
			headerMenu:				true,
			keyboardNavigation:		true,
			lineHeightOffset:		-1,
			locale: {
				column: {
					add_group:			'Add Grouping By "{{name}}"',
					add_sort_asc:		'Add Sort By "{{name}}" (Ascending)',
					add_sort_desc:		'Add Sort By "{{name}}" (Descending)',
					aggregators:		'Aggregators',
					deselect:			'Deselect Column',
					filter:				'Quick Filter on "{{name}}"',
					group:				'Group By "{{name}}"',
					grouping:			'Grouping',
					groups_clear:		'Clear All Grouping',
					groups_collapse:	'Collapse All Groups',
					groups_expand:		'Expand All Groups',
					remove:				'Remove "{{name}}" Column',
					remove_group:		'Remove Grouping By "{{name}}"',
					remove_sort:		'Remove Sort By "{{name}}"',
					select:				'Select Column',
					sorting:			'Sorting',
					sort_asc:			'Sort By "{{name}}" (Ascending)',
					sort_desc:			'Sort By "{{name}}" (Descending)'
				},
				empty: {
					"default":			'No data available',
					remote:				'No results found',
					filter:				'No items matching that filter'
				},
				global: {
					auto_width:			'Automatically Resize Columns',
					columns:			'Columns',
					export:				'Export',
					export_csv:			'Export Table to CSV',
					export_html:		'Export Table to HTML',
					hide_filter:		'Hide Quick Filter'
				}
			},
			multiColumnSort:		true,
			quickFilter:			false,
			remoteScrollTime:		200,
			resizableColumns:		true,
			resizableRows:			false,
			resizeCells:			false,
			reorderable:			true,
			rowHeight:				28,
			selectable:				true,
			selectedClass:			"selected",
			shiftSelect:			true,
			tooltipType:			"popup",
			virtualScroll:			true
		}, options);

		// Default Column Options
		var columnDefaults = {
			cache:				false,
			"class":			null,
			comparator:			null,
			editable:			null,
			focusable:			true,
			groupable:			true,
			headerClass:		null,
			id:					null,
			maxWidth:			null,
			minWidth:			42,
			name:				"",
			postprocess:		null,
			removable:			false,
			rerenderOnResize:	false,
			resizable:			true,
			selectable:			true,
			sortable:			true,
			sortAsc:			true,
			tooltip:			null,
			visible:			true,
			width:				null
		};

		// Enable events
		$.extend(this, Backbone.Events);

		// Stores the current event object
		this._event = null;

		// Stores the currently active cell
		this.active = null;

		// Stores the currently selected cell range
		this.selection = null;

		// Stores the current sorting objects
		this.sorting = [];


		// initialize()
		// Creates a new DobyGrid instance
		//
		// @return object
		initialize = function () {

			// Ensure the options we were given are all valid and complete
			validateOptions();

			// Calculate some information about the browser window
			getBrowserData();

			// Cache some column stuff (needed to intialize a collection with aggregators)
			updateColumnCaches();

			// Create a new data collection
			self.collection = new Collection(self);

			// Insert an 'addRow' row
			if (self.options.addRow) insertAddRow();

			// Create the grid
			createGrid();

			if (self.options.selectable) bindCellRangeSelect();

			return self;
		};


		// activate()
		// Given a row and cell index, will set that cell as the active in the grid
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		this.activate = function (row, cell) {
			if (!initialized) return;
			if (row === undefined || cell === undefined) {
				resetActiveCell();
				return;
			}
			if (row > getDataLength() || row < 0 || cell >= cache.activeColumns.length || cell < 0 || !canCellBeActive(row, cell)) return;
			scrollCellIntoView(row, cell, false);
			setActiveCellInternal(getCellNode(row, cell), false);
			return this;
		};


		// add()
		// Entry point for collection.add(). See collection.add for more info.
		//
		this.add = function (models, options) {
			this.collection.add(models, options);
			return this;
		};


		// addColumn()
		// Inserts a new column into the grid
		//
		// @param	data			object		Column data object
		// @param	options			object		(Optional) Additional options for handling the insert.
		//
		// @return object
		this.addColumn = function (data, options) {
			if (!data || typeof data !== 'object' || $.isArray(data) || data instanceof HTMLElement) {
				throw new Error("Unable to addColumn() because the given 'data' param is invalid.");
			}

			options = options || {};

			// Check for a column with the same id
			var existing = cache.columnsById[data.id];
			if (existing !== undefined) {
				if (options.merge !== true) {
					var err = ["Unable to addColumn() because a column with id '" + data.id];
					err.push("' already exists. Did you want to {merge: true} maybe?");
					throw new Error(err.join(''));
				} else {
					// Merge column with existing
					for (var i = 0, l = this.options.columns.length; i < l; i++) {
						if (this.options.columns[i].id != data.id) continue;
						$.extend(this.options.columns[i], data);
					}
					return this;
				}
			}

			var columns = this.options.columns;
			if (options.at === null || options.at === undefined) {
				columns.push(data);
			} else {
				columns.splice(columns, options.at, data);
			}

			// Set the grid columns
			self.setColumns(columns);
			return this;
		};


		// addGrouping()
		// Add to the grouping object given the 'id' of a column. Allows you to
		// create nested groupings.
		//
		// @param	column_id		string		Id of the column to group by
		// @param	options			object		(Optional) Additional grouping options.
		//
		// @return object
		this.addGrouping = function (column_id, options) {
			// Is grouping enabled
			if (!self.options.groupable) throw new Error('Cannot execute "addGrouping" because "options.groupable" is disabled.');

			options = options || {};

			if (column_id === null || column_id === undefined) throw new Error("Unable to add grouping to grid because the 'column_id' value is missing.");

			var grouping = hasGrouping(column_id);
			if (!grouping) {
				// Use the column_id shortcut to extend the options
				options.column_id = column_id;

				// Add to grouping
				this.collection.groups.push(options);

				// Set new grouping
				this.setGrouping(this.collection.groups);
			}
			return this;
		};


		// Aggregate()
		// Information about data totals.
		// An instance of Aggregates will be created for each totals row and passed to the aggregators
		// so that they can store arbitrary data in it. That data can later be accessed by group totals
		// formatters during the display.
		//
		Aggregate = function (aggregators) {
			this.aggregators = aggregators;
			this.class = classrowtotal;
			this.columns = {};
			this.editable = false;
			this.focusable = true;
			this.selectable = false;
		};

		Aggregate.prototype = new NonDataItem();

		Aggregate.prototype.toString = function () { return "Aggregate"; };

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
				initialized = true;

				// Calculate viewport width
				viewportW = parseFloat($.css(this.$el[0], "width", true));

				// Calculate caches, dimensions and prepare layout
				measureCellPadding();
				disableSelection($headers);
				renderColumnHeaders();
				setupColumnSort();
				createCssRules();
				cacheRows();
				resizeCanvas();

				// If we're using remote data, start by fetching the data set length
				if (remote) {
					remoteCount(function () {
						// If we haven't scrolled anywhere yet - fetch the first page
						if ($viewport[0].scrollTop === 0) {
							remoteFetch();
						}
					});

					// Subscribe to scroll events
					this.on('viewportchanged', function () {
						remoteFetch();
					});
				}

				// Assign events

				this.$el
					.on("resize." + this.NAME, resizeCanvas);

				if (this.options.autoDestroy) {
					this.$el.one("remove", function () {
						// Self-destroy when the element is deleted
						self.destroy();
					});
				}

				$viewport
					.on("scroll", handleScroll);

				$headerScroller
					.on("contextmenu", handleHeaderContextMenu)
					.on("click", handleHeaderClick);

				// Events for column header tooltips
				if (self.options.tooltipType != 'title') {
					$headerScroller
						.on("mouseover", function (event) {
							// Show tooltips
							showTooltip(event);
						});
				}

				$canvas
					.on("keydown", handleKeyDown)
					.on("click", handleClick)
					.on("dblclick", handleDblClick)
					.on("contextmenu", handleContextMenu)
					.on("mouseenter", function () {
						// Focus on the canvas when the mouse is in it
						var ae = document.activeElement;
						if (ae != this && !$(this).has($(ae)).length) {
							$(this).focus();
						}
					});

				if (this.options.resizableRows) {
					bindRowResize();
				}

			} catch (e) {
				if (console.error) console.error(e);
			}

			// Enable header menu
			if (this.options.headerMenu) {
				// Subscribe to header menu context clicks
				this.on('headercontextmenu', toggleHeaderContextMenu);
			}

			// Resize grid when window is changed
			$(window).on('resize', handleWindowResize);

			return this;
		};


		// applyColumnHeaderWidths()
		// Ensures that the header column widths are all set correctly
		//
		// @param	headers		array		(Optional) Header column DOM elements to resize
		//
		applyColumnHeaderWidths = function (headers) {
			if (!initialized) return;
			if (!headers) headers = $headers.children();

			// Auto-sizes the quick filter headers too
			var qHeaders = null;
			if ($headerFilter !== undefined) {
				qHeaders = $headerFilter.children();
			}

			var i, l, w, styl;
			for (i = 0, l = headers.length; i < l; i++) {
				w = cache.activeColumns[i].width - headerColumnWidthDiff;

				styl = ['width:', w, 'px'].join('');

				// Style the header
				$(headers[i]).attr('style', styl);

				// Style the quick filter
				if (qHeaders && qHeaders[i]) $(qHeaders[i]).attr('style', styl);
			}

			updateColumnCaches();
		};


		// applyColumnWidths()
		// Sets the widths of the columns to what they should be
		//
		applyColumnWidths = function () {
			// The -1 here is to compensate for the border spacing between cells
			var x = -1, c, w, rule, i, l, r;

			for (i = 0, l = cache.activeColumns.length; i < l; i++) {
				c = cache.activeColumns[i];
				w = c.width;

				// Left
				rule = getColumnCssRules(i);
				rule.left.style.left = x + "px";

				// Right
				// The -2 here is to compensate for the border spacing between cells
				r = canvasWidth - x - w - 2;

				// If this is the last column, and there is no vertical scrollbar, and
				// do not allow negative spacing on the right otherwise we get a gap
				if (i + 1 === l && r < 0 && !viewportHasVScroll) r = 0;

				rule.right.style.right = r + "px";

				// The +1 here is to compensate for the border spacing between cells
				x += c.width + 1;
			}
		};


		// asyncPostProcessRows()
		// Processing the post-render action on all cells that need it
		//
		asyncPostProcessRows = function () {
			var dataLength = getDataLength(),
				cb = function () {
					var columnIdx = cache.columnsById[this.id];
					if (this.cache) {
						cache.postprocess[row][columnIdx] = $(node).html();
					}
				};

			while (postProcessFromRow <= postProcessToRow) {
				var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--,
					cacheEntry = cache.nodes[row],
					columnIdx;

				if (!cacheEntry || row >= dataLength) {
					continue;
				}

				if (!cache.postprocess[row]) cache.postprocess[row] = {};

				ensureCellNodesInRowsCache(row);
				for (columnIdx in cacheEntry.cellNodesByColumnIdx) {
					if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
						continue;
					}

					columnIdx = columnIdx || 0;

					var col = cache.activeColumns[columnIdx],
						postprocess = col.postprocess,
						rowdata = cache.rows[row],
						rd_cols = rowdata.columns;

					// Check to see if a row-specific column override exists
					if (rd_cols && rd_cols[columnIdx] && rd_cols[columnIdx].postprocess) {
						postprocess = rd_cols[columnIdx].postprocess;
					}

					// If row has no caching set -- run the postprocessing
					if (postprocess && !cache.postprocess[row][columnIdx]) {
						var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
						if (node) {
							postprocess({
								cell: $(node),
								column: col,
								data: getDataItem(row),
								rowIndex: row
							}, cb.bind(col));
						}
					}
				}

				h_postrender = setTimeout(asyncPostProcessRows, self.options.asyncPostRenderDelay);
				return;
			}
		};


		// autosizeColumns()
		// Resizes all column to try and fit them into the available screen width
		//
		autosizeColumns = function () {
			var i, c,
				widths = [],
				shrinkLeeway = 0,
				total = 0,
				prevTotal,
				growProportion, max, growSize,
				availWidth = viewportHasVScroll ? viewportW - window.scrollbarDimensions.width : viewportW;

			// Compensate for the separators between columns
			availWidth -= cache.activeColumns.length;

			// Calculate the current total width of columns
			for (i = 0; i < cache.activeColumns.length; i++) {
				c = cache.activeColumns[i];

				// Skip invisible columns
				if (c.visible === false) continue;

				widths.push(c.width);
				total += c.width;

				if (c.resizable) {
					shrinkLeeway += c.width - Math.max((c.minWidth || 0), absoluteColumnMinWidth);
				}
			}

			// Shrink
			prevTotal = total;
			while (total > availWidth && shrinkLeeway) {
				var shrinkProportion = (total - availWidth) / shrinkLeeway;
				for (i = 0; i < cache.activeColumns.length && total > availWidth; i++) {
					c = cache.activeColumns[i];
					var width = widths[i];
					if (c.visible === false || !c.resizable || width <= (c.minWidth || 0) || width <= absoluteColumnMinWidth) {
						continue;
					}
					var absMinWidth = Math.max(c.minWidth, absoluteColumnMinWidth);
					var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
					shrinkSize = Math.min(shrinkSize, width - absMinWidth);
					total -= shrinkSize;
					shrinkLeeway -= shrinkSize;
					widths[i] -= shrinkSize;
				}
				if (prevTotal <= total) { // avoid infinite loop
					break;
				}
				prevTotal = total;
			}

			// Grow
			prevTotal = total;
			while (total < availWidth) {
				growProportion = availWidth / total;
				for (i = 0; i < cache.activeColumns.length && total < availWidth; i++) {
					c = cache.activeColumns[i];
					if (c.visible === false || !c.resizable || (c.maxWidth && c.maxWidth <= c.width)) continue;

					// Make sure we don't get bigger than the max width
					max = 1000000;
					if (c.maxWidth && (c.maxWidth - c.width)) max = (c.maxWidth - c.width);

					growSize = Math.min(Math.floor(growProportion * c.width) - c.width, max) || 1;

					total += growSize;
					widths[i] += growSize;
				}

				if (prevTotal >= total) { // avoid infinite loop
					break;
				}
				prevTotal = total;
			}

			// Set new values
			var reRender = false, col;
			for (i = 0; i < cache.activeColumns.length; i++) {
				col = cache.activeColumns[i];

				// Skip invisible columns
				if (col.visible === false) continue;

				if (!reRender && col.rerenderOnResize && col.width != widths[i]) reRender = true;
				cache.activeColumns[i].width = widths[i];
			}

			applyColumnHeaderWidths();
			updateCanvasWidth(true);

			if (reRender) {
				invalidateAllRows();
				render();
			}
		};


		// bindCellRangeSelect()
		// Enable events used to select cell ranges via click + drag
		//
		bindCellRangeSelect = function () {
			var decorator = new CellRangeDecorator(),
				_dragging = null;

			$canvas
				.on('draginit', function (event) {
					// Prevent the grid from cancelling drag'n'drop by default
					event.stopImmediatePropagation();

					// Deselect any text the user may have selected
					clearTextSelection();
				})
				.on('dragstart', function (event, dd) {
					var cell = getCellFromEvent(event);
					if (!cell) return;

					// This prevents you from starting to drag on a cell that can't be selected
					if (canCellBeSelected(cell.row, cell.cell)) {
						_dragging = true;
						event.stopImmediatePropagation();
					}

					if (!_dragging) return;

					var start = getCellFromPoint(
						dd.startX - $(this).offset().left,
						dd.startY - $(this).offset().top
					);

					// Store a custom "_range" in the event attributes
					dd._range = {
						end: start,
						start: start
					};

					return decorator.show(new Range(start.row, start.cell));
				})
				.on('drag', function (event, dd) {
					if (!_dragging) return;

					event.stopImmediatePropagation();

					var end = getCellFromPoint(
						event.pageX - $(this).offset().left,
						event.pageY - $(this).offset().top);

					if (!canCellBeSelected(end.row, end.cell)) return;

					dd._range.end = end;
					decorator.show(new Range(dd._range.start.row, dd._range.start.cell, end.row, end.cell));

					// Set the active cell as you drag. This is default spreadsheet behavior.
					if (self.options.activateSelection && canCellBeActive(end.row, end.cell)) {
						setActiveCellInternal(getCellNode(end.row, end.cell), false);
					}
				})
				.on('dragend', function (event, dd) {
					if (!_dragging) return;
					_dragging = false;

					event.stopImmediatePropagation();

					decorator.hide();

					self._event = event;

					// Dragging always selects a new range unless Shift key is held down
					if (!event.shiftKey) deselectCells();

					self.selectCells(
						dd._range.start.row,
						dd._range.start.cell,
						dd._range.end.row,
						dd._range.end.cell,
						event.shiftKey
					);
					self._event = null;

					// Automatically go into edit mode
					if (self.options.activateSelection) {
						makeActiveCellEditable();
					}
				});
		};


		// bindRowResize()
		// Binds the necessary events to handle row resizing
		//
		bindRowResize = function () {
			$canvas
				.on('dragstart', function (event, dd) {
					if (!$(event.target).hasClass(classrowhandle)) return;
					event.stopImmediatePropagation();

					dd._row = getRowFromNode($(event.target).parent()[0]);
					dd._rowNode = cache.nodes[dd._row].rowNode;

					// Grab all the row nodes below the current row
					dd._rowsBelow = [];
					$(dd._rowNode).siblings().each(function () {
						// If the row is below the dragged one - collected it
						var r = getRowFromNode(this);
						if (r > dd._row) dd._rowsBelow.push(this);
					});

					// Put the rows below into a temporary container
					$(dd._rowsBelow).wrapAll('<div class="' + classrowdragcontainer + '"></div>');
					dd._container = $(dd._rowsBelow).parent();
				})
				.on('drag', function (event, dd) {
					if (dd._row === undefined) return;

					// Resize current row
					var node = dd._rowNode,
						pos = cache.rowPositions[dd._row],
						height = (pos.height || self.options.rowHeight);
					dd._height = height + dd.deltaY;

					// Do not allow invisible heights
					if (dd._height < 5) dd._height = 5;

					// Apply height and line-height
					$(node).height(dd._height);
					$(node).css('line-height', (dd._height + self.options.lineHeightOffset) + 'px');

					// Drag and container of rows below
					dd._container.css({marginTop: (dd._height - height) + 'px'});
				})
				.on('dragend', function (event, dd) {
					if (dd._row === undefined) return;

					// Unwrap rows below
					$(dd._rowsBelow).unwrap();

					setRowHeight(dd._row, dd._height);
				});
		};


		// cacheRows()
		// Walks through the data and caches positions for all the rows into
		// the 'cache.rowPositions' object
		//
		// @param	from		integer		(Optional) Start to cache from which row?
		// @param	indexOnly	boolean		(Optional) If true, will only perform a re-index
		//
		cacheRows = function (from, indexOnly) {
			from = from || 0;

			// Start cache object
			if (from === 0) {
				cache.indexById = {};
				if (!indexOnly && variableRowHeight) {
					cache.rowPositions = {
						0: {
							top: 0,
							height: self.options.rowHeight,
							bottom: self.options.rowHeight
						}
					};
				}
			}

			var item, data;
			for (var i = from, l = cache.rows.length; i < l; i++) {
				item = cache.rows[i];

				// Cache by item id
				// NOTE: This is currently the slowest part of grid initialization. Can it be done
				// lazily since this is only used for get/add/remove.
				cache.indexById[item[idProperty]] = i;

				// Cache row position
				if (!indexOnly && variableRowHeight) {
					data = {
						top: (cache.rowPositions[i - 1]) ? (cache.rowPositions[i - 1].bottom - offset) : 0
					};

					// The extra 1 is here to compesate for the 1px space between rows
					data.top += (i === 0 ? 0 : 1);

					if (item.height && item.height != self.options.rowHeight) {
						data.height = item.height;
					}

					data.bottom = data.top + (data.height || self.options.rowHeight);

					cache.rowPositions[i] = data;
				}
			}
		};


		// calculateVisibleRows()
		// Calculates the number of currently visible rows in the viewport. Partially visible rows are
		// included in the calculation.
		//
		// @return integer
		calculateVisibleRows = function () {
			// When in variable row height mode we need to find which actual rows are at the
			// top and bottom of the viewport
			if (variableRowHeight) {
				var scrollTop = $viewport[0].scrollTop,
					bottomRow = getRowFromPosition(viewportH + scrollTop);
				numVisibleRows = bottomRow - getRowFromPosition(scrollTop);

			// When in fixed right height mode - we can make a much faster calculation
			} else {
				numVisibleRows = Math.floor(viewportH / (self.options.rowHeight + 1));
			}
		};


		// canCellBeActive()
		// Can a given cell be activated?
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return boolean
		canCellBeActive = function (row, cell) {
			if (!self.options.keyboardNavigation || row >= getDataLength() ||
				row < 0 || cell >= cache.activeColumns.length || cell < 0) {
				return false;
			}

			var item = self.collection.getItem(row);
			if (typeof item.focusable === "boolean") return item.focusable;

			var columnMetadata = item.columns;
			if (
				columnMetadata &&
				columnMetadata[cache.activeColumns[cell].id] &&
				typeof columnMetadata[cache.activeColumns[cell].id].focusable === "boolean"
			) {
				return columnMetadata[cache.activeColumns[cell].id].focusable;
			}
			if (columnMetadata && columnMetadata[cell] && typeof columnMetadata[cell].focusable === "boolean") {
				return columnMetadata[cell].focusable;
			}

			return cache.activeColumns[cell].focusable;
		};


		// canCellBeSelected()
		// Can a given cell be selected?
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return boolean
		canCellBeSelected = function (row, cell) {
			if (row >= getDataLength() || row < 0 || cell >= cache.activeColumns.length || cell < 0) {
				return false;
			}

			var item = self.collection.getItem(row);
			if (typeof item.selectable === "boolean") {
				return item.selectable;
			}

			var columnMetadata = item.columns && (item.columns[cache.activeColumns[cell].id] || item.columns[cell]);
			if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
				return columnMetadata.selectable;
			}

			return cache.activeColumns[cell].selectable;
		};


		// cellExists()
		// Returns true if the requested cell exists in the data set
		//
		// @param	row		integer		Index of the row
		// @param	cell	integer		Index of the cell
		//
		// @return bolean
		cellExists = function (row, cell) {
			return !(row < 0 || row >= getDataLength() || cell < 0 || cell >= cache.activeColumns.length);
		};


		// CellRangeDecorator()
		// Displays an overlay on top of a given cell range.
		//
		CellRangeDecorator = function () {
			this.$el = null;

			this.show = function (range) {
				if (!this.$el) {
					this.$el = $('<div class="' + classrangedecorator + '"></div>')
						.appendTo($canvas);
				}

				var from = getCellNodeBox(range.fromRow, range.fromCell),
					to = getCellNodeBox(range.toRow, range.toCell),
					borderBottom = parseInt(this.$el.css('borderBottomWidth'), 10),
					borderLeft = parseInt(this.$el.css('borderLeftWidth'), 10),
					borderRight = parseInt(this.$el.css('borderRightWidth'), 10),
					borderTop = parseInt(this.$el.css('borderTopWidth'), 10);

				if (from && to) {
					this.$el.css({
						top: from.top,
						left: from.left,
						height: to.bottom - from.top - borderBottom - borderTop,
						width: to.right - from.left - borderLeft - borderRight
					});
				}

				return this.$el;
			};

			this.hide = function () {
				if (this.$el) {
					this.$el.remove();
					this.$el = null;
				}
			};
		};


		// cleanUpAndRenderCells()
		// Re-renders existing cells
		//
		// @param		range		object		Cell range to render
		//
		cleanUpAndRenderCells = function (range) {
			var cacheEntry,
				stringArray = [],
				processedRows = [],
				cellsAdded,
				totalCellsAdded = 0,
				colspan;

			for (var row = range.top, btm = range.bottom; row <= btm; row++) {
				cacheEntry = cache.nodes[row];
				if (!cacheEntry) {
					continue;
				}

				// cellRenderQueue populated in renderRows() needs to be cleared first
				ensureCellNodesInRowsCache(row);

				cleanUpCells(range, row);

				// Render missing cells.
				cellsAdded = 0;

				var item = self.collection.getItem(row),
					metadata = item.columns,
					d = getDataItem(row);

				for (var i = 0, ii = cache.activeColumns.length; i < ii; i++) {
					// Cells to the right are outside the range.
					if (cache.columnPosLeft[i] > range.rightPx) {
						break;
					}

					// Already rendered.
					if ((colspan = cacheEntry.cellColSpans[i]) !== null) {
						i += (colspan > 1 ? colspan - 1 : 0);
						continue;
					}

					colspan = 1;
					if (metadata) {
						var columnData = metadata[cache.activeColumns[i].id] || metadata[i];
						colspan = (columnData && columnData.colspan) || 1;
						if (colspan === "*") {
							colspan = ii - i;
						}
					}

					if (cache.columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
						renderCell(stringArray, row, i, colspan, d);
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
				cacheEntry = cache.nodes[processedRow];
				var columnIdx;
				while ((columnIdx = cacheEntry.cellRenderQueue.pop()) !== null) {
					node = x.lastChild;
					cacheEntry.rowNode.appendChild(node);
					cacheEntry.cellNodesByColumnIdx[columnIdx] = node;
				}
			}
		};


		// cleanUpCells()
		// Cleanup the cell cache
		//
		// @param	range	object		Data about the range to clean up
		// @param	row		integer		Which row to clean up
		//
		cleanUpCells = function (range, row) {
			var totalCellsRemoved = 0;
			var cacheEntry = cache.nodes[row];

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
				if (cache.columnPosLeft[i] > range.rightPx ||
					cache.columnPosRight[Math.min(cache.activeColumns.length - 1, i + colspan - 1)] < range.leftPx) {
					if (self.active && !(row == self.active.row && i == self.active.cell)) {
						cellsToRemove.push(i);
					}
				}
			}

			var cellToRemove;
			while ((cellToRemove = cellsToRemove.pop()) !== null && cellToRemove) {
				cacheEntry.rowNode.removeChild(cacheEntry.cellNodesByColumnIdx[cellToRemove]);
				delete cacheEntry.cellColSpans[cellToRemove];
				delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
				if (cache.postprocess[row]) {
					delete cache.postprocess[row][cellToRemove];
				}
				totalCellsRemoved++;
			}
		};


		// cleanupRows()
		// Cleans the row cache
		//
		// @param	rangeToKeep		object		A range of top/bottom values to keep
		//
		cleanupRows = function (rangeToKeep) {
			var acr = self.active && 'row' in self.active ? self.active.row : null;
			for (var i in cache.nodes) {
				if (((i = parseInt(i, 10)) !== acr) && (i < rangeToKeep.top || i > rangeToKeep.bottom)) {
					removeRowFromCache(i);
				}
			}
		};


		// clearTextSelection()
		// If user has somethinge selected - clears that selection
		//
		clearTextSelection = function () {
			if (document.selection && document.selection.empty) {
				try {
					// IE fails here if selected element is not in DOM
					document.selection.empty();
				} catch (e) {}
			} else if (window.getSelection) {
				var sel = window.getSelection();
				if (sel && sel.removeAllRanges) {
					sel.removeAllRanges();
				}
			}
		};


		// commitCurrentEdit()
		// Processes edit operations using the current editor
		//
		commitCurrentEdit = function () {
			if (!self.active || !currentEditor) return true;

			var item = getDataItem(self.active.row),
				column = cache.activeColumns[self.active.cell];

			var showInvalid = function () {
				// Re-add the CSS class to trigger transitions, if any.
				$(self.active.node)
					.removeClass(classinvalid)
					.width(); // force layout
				$(self.active.node).addClass(classinvalid);

				self.trigger('validationerror', self._event, {
					editor: currentEditor,
					cellNode: self.active.node,
					validationResults: validationResults,
					row: self.active.row,
					cell: self.active.cell,
					column: column
				});

				currentEditor.focus();
			};

			if (currentEditor.isValueChanged()) {
				var validationResults = currentEditor.validate();

				if (validationResults.valid) {
					// If we're inside an "addRow", create a duplicate and write to that
					if (item.__addRow) {
						var newItem = {
							data: {}
						};

						// Add row
						currentEditor.applyValue(newItem, currentEditor.serializeValue());

						// Make sure item has an id
						if ((!newItem.data.id && !newItem.id) ||
							newItem.id in cache.indexById ||
							newItem.data.id in cache.indexById
						) {
							validationResults = {
								valid: false,
								msg: "Unable to create a new item without a unique 'id' value."
							};
							showInvalid();
							return;
						}

						self.add(newItem);

						self.trigger('newrow', self._event, {
							item: newItem,
							column: column
						});
					} else {
						// See if we have a cell range selected
						if (self.selection) {
							// TODO: Send multiple values to the editor for edit
						}

						// Execute the operation
						currentEditor.applyValue(item, currentEditor.serializeValue());
						updateRow(self.active.row);

						// Reset active cell
						makeActiveCellNormal();

						self.trigger('change', self._event, {
							row: self.active.row,
							cell: self.active.cell,
							item: item
						});
					}

					return true;
				} else {
					showInvalid();
					return false;
				}
			}

			makeActiveCellNormal();
			return true;
		};


		// copySelected()
		// Copies the selected cell(s) to the clipboard
		//
		copySelected = function () {
			var result;

			// Do we have a cell range selection?
			if (self.selection) {
				if (self.options.clipboard == 'csv') {
					result = self.selection[0].toCSV();
				} else if (self.options.clipboard == 'json') {
					result = JSON.stringify(self.selection[0].toJSON());
				}
			}

			// Do we have an active cell?
			if (!result && self.active && self.active.node) {
				var row = getRowFromNode(self.active.node.parentNode),
					cell = getCellFromNode(self.active.node),
					item = cache.rows[row],
					column = cache.activeColumns[cell];
				result = getValueFromItem(item, column);
			}

			// Send to clipboard by creating a dummy container with the text selected
			// and letting the browser execute the default clipboard behavior. Similar to:
			// http://stackoverflow.com/questions/17527870/how-does-trello-access-the-users-clipboard
			if (result) {
				$('<textarea class="' + classclipboard + '"></textarea>')
					.val(result)
					.appendTo(self.$el)
					.focus()
					.select()
					.on('keyup', function () {
						$(this).remove();
					});
			}
		};


		// createCssRules()
		// Generates the CSS styling that will drive the dimensions of the grid cells
		//
		createCssRules = function () {
			$style = $('<style type="text/css" rel="stylesheet"></style>').appendTo($("head"));
			var rowHeight = self.options.rowHeight - cellHeightDiff;
			var rules = [
				"#" + uid + " ." + classrow + "{height:" + rowHeight + "px;line-height:" + (rowHeight + self.options.lineHeightOffset) + "px}"
			];

			for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
				rules.push("#" + uid + " .l" + i + "{}");
				rules.push("#" + uid + " .r" + i + "{}");
			}

			$style[0].appendChild(document.createTextNode(rules.join("\n")));
		};


		// createGrid()
		// Generates the grid elements
		//
		// @return object
		createGrid = function () {

			// Create the container
			var cclasses = [self.NAME];
			if (self.options.class) cclasses.push(self.options.class);

			self.$el = $('<div class="' + cclasses.join(' ') + '" id="' + uid + '"></div>');

			// Create the global grid elements
			$headerScroller = $('<div class="' + classheader + '"></div>')
					.appendTo(self.$el);

			$headers = $('<div class="' + classheadercolumns + '"></div>')
				.appendTo($headerScroller)
				.width(getHeadersWidth());

			$viewport = $('<div class="' + classviewport + '"></div>').appendTo(self.$el);

			// The tabindex here ensures we can focus on this element
			// otherwise we can't assign keyboard events
			$canvas = $('<div class="' + classcanvas + '" tabindex="0"></div>').appendTo($viewport);

		};


		// createGroupingObject()
		// Given a grouping object, extends it with the defaults.
		//
		// @param	grouping	object		A column grouping object
		//
		// @return object
		createGroupingObject = function (grouping) {
			if (!grouping) throw new Error("Unable to create group because grouping object is missing.");

			if (grouping.column_id === undefined) throw new Error("Unable to create grouping object because 'column_id' is missing.");

			var column = getColumnById(grouping.column_id);

			var result = $.extend({

				collapsed: true,	// All groups start off being collapsed

				column_id: column.id,

				comparer: function (a, b) {
					return naturalSort(a.value, b.value);
				},

				formatter: function (g) {
					var h = [
						"<strong>" + column.name + ":</strong> ",
						(g.value === null ? '-empty-' : g.value),
						' <span class="count">(<strong>' + g.count + '</strong> item'
					];
					if (g.count !== 1) h.push("s");
					h.push(")</span>");
					return h.join('');
				},

				getter: function (item) {
					return getDataItemValueForColumn(item, column);
				},

				grouprows: []

			}, grouping);

			return result;
		};


		// Collection()
		// This is a special class that looks an awful lot like Backbone.Collection and it
		// stores and manipulates the data set for this grid. So why not just use a Backbone.Collection?
		//	1) It's super slow for large data sets: https://github.com/jashkenas/backbone/issues/2760
		//	2) In order for 'remote' fetching to work nicely with scrolling, the collection has to
		//		simulate objects that haven't been fetched from the server yet. Backbone doesn't allow
		//		you to have "fake" data in their collections without some serious hacking.
		//
		// @param	grid		object		Reference pointer to the grid instance
		//
		// @return object
		Collection = function (grid) {

			// Private Variables

			var self = this,
				filterCache = [],
				filteredItems = [],
				groupingDelimiter = ':|:',
				pagenum = 0,
				pagesize = 0,
				prevRefreshHints = {},
				refreshHints = {},
				rowsById = null,	// rows by id; lazy-calculated
				sortAsc = true,
				sortComparer,
				suspend = false,	// suspends the recalculation
				toggledGroupsByLevel = [],
				totalRows = 0,
				updated = null,		// updated item ids

			// Private Methods

				expandCollapseGroup,
				extractGroups,
				finalizeGroups,
				flattenGroupedRows,
				getFilteredAndPagedItems,
				getRowDiffs,
				insertEmptyAlert,
				parse,
				processAggregators,
				processGroupAggregators,
				recalc,
				uncompiledFilter,
				uncompiledFilterWithCaching,
				validate;


			// Events
			$.extend(this, Backbone.Events);

			// Items by index
			this.items = [];

			// Filter function
			this.filter = null;

			// Group definitions
			this.groups = [];

			// Size of the collection
			this.length = 0;


			// initialize()
			// Initializes the Data View
			//
			// @return object
			this.initialize = function () {

				// If we have normal data - set it now
				if (!remote && grid.options.data) {
					this.reset(grid.options.data);
				}

				return this;
			};


			// add()
			// Add models to the collection.
			//
			// @param	models		array, object		Object(s) to add to the collection
			// @param	options		object				Additional options
			//
			// @return object
			this.add = function (models, options) {
				if (!_.isArray(models)) models = models ? [models] : [];
				options = options || {};
				var at = options.at, model, existing, toAdd = [];

				// Parse models
				parse(models);

				// Merge existing models and collect the new ones
				for (var i = 0, l = models.length; i < l; i++) {
					model = models[i];
					existing = this.get(model);

					// For remote models, check if we're inserting 'at' an index with place holders
					if (remote && at !== undefined && this.items[at + i] instanceof Placeholder) {
						existing = this.items[at + i];
					}

					if (existing) {
						if (options.merge) {
							this.setItem(existing[idProperty], model);
						} else {
							throw ["You are not allowed to add() items without a unique 'id' value. ",
							"A row with id '" + existing[idProperty] + "' already exists."].join('');
						}
					} else {
						toAdd.push(model);
					}
				}

				// Add the new models
				if (toAdd.length) {
					// If data used to be empty, with an alert - remove alert
					if (grid.options.emptyNotice && this.items.length == 1 && this.items[0].__alert) {
						this.remove(this.items[0][idProperty]);
					}

					// If "addRow" is enabled, make sure we don't insert below it
					if (grid.options.addRow && (
							(at && at > this.items.length) ||
							at === null || at === undefined
						) && !('__addRow' in toAdd[0])
					) {
						at = this.items.length - 1;
					}

					// If we're working with a Backbone.Collection - use native Backbone functions.
					// As you can add items both to DobyGrid and the original Backbone Collection.
					// So the items might already be there.
					if (this.items instanceof Backbone.Collection) {
						this.items.add(toAdd);
					} else {
						if (at !== null && at !== undefined) {
							Array.prototype.splice.apply(this.items, [at, 0].concat(toAdd));
							cacheRows((at > 0 ? at - 1 : 0));
						} else {
							var prevLength = this.items.length;
							Array.prototype.push.apply(this.items, toAdd);
							cacheRows(prevLength > 0 ? prevLength - 1 : 0);
						}
					}
				}

				// If not updating silently, reload grid
				if (!options.silent) {
					this.refresh();
				}

				return this;
			};


			// collapseAllGroups()
			//
			// @param	level	integer		Optional level to collapse.
			//								If not specified, applies to all levels.
			//
			this.collapseAllGroups = function (level) {
				this.expandCollapseAllGroups(level, true);
			};


			// collapseGroup()
			// Collapse a group
			this.collapseGroup = function () {
				var args = Array.prototype.slice.call(arguments),
					arg0 = args[0];
				if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
					expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, true);
				} else {
					expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), true);
				}
			};


			// expandAllGroups()
			// @param	level	integer		Optional level to expand.
			//								If not specified, applies to all levels.
			this.expandAllGroups = function (level) {
				this.expandCollapseAllGroups(level, false);
			};


			// expandCollapseAllGroups()
			// Handles expading/collapsing for all groups in batch
			//
			// @param	level		integer		Optional level to expand
			// @param	collapse	boolean		Collapse or expand?
			//
			this.expandCollapseAllGroups = function (level, collapse) {
				if (level === null || level === undefined) {
					for (var i = 0, l = this.groups.length; i < l; i++) {
						toggledGroupsByLevel[i] = {};
						this.groups[i].collapsed = collapse;
					}
				} else {
					toggledGroupsByLevel[level] = {};
					this.groups[level].collapsed = collapse;
				}

				this.refresh();
			};


			// expandCollapseGroup()
			// Handles collapsing and expanding of groups
			//
			// @param	level			integer		Which level are we toggling
			// @param	group_id		integer		Which group key are we toggling
			// @param	collapse		boolean		Collapse? Otherwise expand.
			//
			expandCollapseGroup = function (level, group_id, collapse) {
				toggledGroupsByLevel[level][group_id] = self.groups[level].collapsed ^ collapse;
				self.refresh();
			};


			// expandGroup()
			// Expands a collapsed group
			this.expandGroup = function () {
				var args = Array.prototype.slice.call(arguments),
					arg0 = args[0];

				if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
					expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, false);
				} else {
					expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), false);
				}
			};


			// ensureCellNodesInRowsCache()
			// Make sure cell nodes are cached for a given row
			//
			// @param	row		integer		Row index
			//
			ensureCellNodesInRowsCache = function (row) {
				var cacheEntry = cache.nodes[row];
				if (cacheEntry) {
					if (cacheEntry.cellRenderQueue.length) {
						var lastChild = $(cacheEntry.rowNode).children('.' + classcell + '').last()[0];
						while (cacheEntry.cellRenderQueue.length) {
							var columnIdx = cacheEntry.cellRenderQueue.pop();
							cacheEntry.cellNodesByColumnIdx[columnIdx] = lastChild;
							lastChild = lastChild.previousSibling;
						}
					}
				}
			};


			// extractGroups()
			// Generates new group objects from the given rows
			//
			// @param	rows			array		The list of data objects to group
			// @param	parentGroup		object		The parent group object
			// @param	callback		function	Callback function
			//
			// @return array
			extractGroups = function (rows, parentGroup, callback) {
				var group,
					val,
					groups = [],
					groupsByVal = {},
					r,
					level = parentGroup ? parentGroup.level + 1 : 0,
					gi = self.groups[level],
					i, l, aggregateRow;

				var processGroups = function (remote_groups) {

					var createGroupObject = function (g) {
						var grp = new Group();
						grp.collapsed = gi.collapsed;
						if (g) grp.count = g.count;
						grp.value = g ? g.value : val;
						grp.level = level;
						grp.predef = gi;
						grp.id = '__group' + (parentGroup ? parentGroup.id + groupingDelimiter : '') + (g ? g.value : val);

						// Remember the group rows in the grouping objects
						gi.grouprows.push(grp);

						return grp;
					};

					// If we are given a set of remote_groups, use them to generate new group objects
					if (remote_groups) {
						for (i = 0, l = remote_groups.length; i < l; i++) {
							group = createGroupObject(remote_groups[i]);
							groups.push(group);
							groupsByVal[remote_groups[i].value] = group;
						}
					}

					// Loop through the rows in the group and create group header rows as needed
					for (i = 0, l = rows.length; i < l; i++) {
						r = rows[i];

						// The global grid aggregate should at the very end of the grid. Remember it here
						// And then we'll add it at the very end.
						if (r instanceof Aggregate && r.__gridAggregate) {
							aggregateRow = r;
							continue;
						}

						// If this is a real item - store it with it's group, otherwise for remote
						// placeholder items - store into the next available group
						if (r instanceof Placeholder && remote_groups) {
							// Find a group that isn't full yet - and put the placeholder there
							// FIXME: This is potentially dangerous since a placeholder will be inserted
							// into a group that has real rows pending insert. Which will cause the group
							// counts to be incorrect. The solution here is to process placeholders after
							// all real items.
							for (var g = 0, gl = groups.length; g < gl; g++) {
								if (groups[g].grouprows.length < groups[g].count) {
									group = groups[g];
									break;
								}
							}
						} else {
							val = typeof gi.getter === "function" ? gi.getter(r) : r[gi.getter];

							// Store groups by value if the getter
							group = groupsByVal[val];
						}

						// Create a new group header row, if it doesn't already exist for this group
						if (!group) {
							group = createGroupObject();
							groups.push(group);
							groupsByVal[val] = group;
						}

						group.grouprows.push(r);

						// Do not increment count for remote groups because we already have the right count
						if (!remote_groups)	group.count++;
					}

					// Nest groups
					if (level < self.groups.length - 1) {
						var setGroups = function (result) {
							group.groups = result;
						};

						for (i = 0, l = groups.length; i < l; i++) {
							group = groups[i];

							// Do not treat aggreates as groups
							if (group instanceof Aggregate) continue;

							extractGroups(group.grouprows, group, setGroups);
						}
					}

					// Sort the groups
					groups.sort(self.groups[level].comparer);

					// If there's a global grid aggregate - put it at the end of the grid
					if (aggregateRow) groups.push(aggregateRow);

					callback(groups);
				};

				// Remote groups needs to be extracted from the remote source
				if (remote) {
					remoteFetchGroups(function (results) {
						processGroups(results);
					});
				} else {
					processGroups();
				}
			};


			// finalizeGroups()
			// Ensure the group objects have valid data and the states are set correctly
			//
			// @param	group		array		Groups to validate
			// @param	level		integer		Which level to validate
			//
			finalizeGroups = function (groups, level) {
				level = level || 0;
				var gi = self.groups[level],
					toggledGroups = toggledGroupsByLevel[level],
					idx = groups.length,
					g;

				while (idx--) {
					g = groups[idx];

					g.collapsed = gi.collapsed ^ toggledGroups[g.id];
					g.title = gi.formatter ? gi.formatter(g) : g.value;

					if (g.groups) {
						finalizeGroups(g.groups, level + 1);
						// Let the non-leaf setGrouping rows get garbage-collected.
						// They may have been used by aggregates that go over all of the descendants,
						// but at this point they are no longer needed.
						g.grouprows = [];
					}
				}
			};


			// flattenGroupedRows()
			// Given a list of groups and the nesting levels returns the list of grouped rows that are
			// expanded.
			//
			// @param	group		array		List of group objects
			// @param	level		integer		Level of group nesting to scan
			//
			// @return array
			flattenGroupedRows = function (groups, level) {
				level = level || 0;
				var groupedRows = [],
					rows, gl = 0,
					g;

				for (var i = 0, l = groups.length; i < l; i++) {
					g = groups[i];
					groupedRows[gl++] = g;

					if (!g.collapsed) {
						rows = g.groups ? flattenGroupedRows(g.groups, level + 1) : g.grouprows;
						if (!rows) continue;
						for (var j = 0, m = rows.length; j < m; j++) {
							groupedRows[gl++] = rows[j];
						}
					}
				}

				return groupedRows;
			};


			// getFilteredAndPagedItems()
			// Runs the data through the filters (if any).
			//
			// @param	items		array		List of items to filter through
			//
			// @return object
			getFilteredAndPagedItems = function (items) {
				items = items instanceof Backbone.Collection ? items.models : items;

				if (self.filter) {
					var batchFilter = uncompiledFilter;
					var batchFilterWithCaching = uncompiledFilterWithCaching;

					if (refreshHints.isFilterNarrowing) {
						filteredItems = batchFilter(filteredItems);
					} else if (refreshHints.isFilterExpanding) {
						filteredItems = batchFilterWithCaching(items, filterCache);
					} else if (!refreshHints.isFilterUnchanged) {
						filteredItems = batchFilter(items);
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
			};


			// getItem()
			// Given an index, retrieves that row item from the cache
			//
			// @param	i	integer		Row index
			//
			this.getItem = function (i) {
				return cache.rows[i];
			};


			// get()
			// Get a model from collection, specified by an id, or by passing in a model.
			// The model gets generated on demand as generating all models at the start would
			// make the grid take a very long time to initialize. This way, users will always
			// see model objects, but internally the grid can make use of direct item references
			// when performance is important.
			//
			// @param		obj		object, integer		Model reference or model id
			//
			// @return object
			this.get = function (obj) {
				if (obj === null) return void 0;
				var id = obj;
				if (typeof obj == 'object') {
					id = obj[idProperty] || obj.data[idProperty];
					if (!id) return null;
				}

				return this.items[cache.indexById[id]];
			};


			// getRowDiffs()
			// Given two lists of row data objects, returns a list of indexes of the rows which
			// are changed. This will tell the grid what needs to be re-cached and re-rendered.
			//
			// @param	rows		array		List of current rows
			// @param	newRows		array		List of new rows
			//
			// @return array
			getRowDiffs = function (rows, newRows) {
				var item, r, eitherIsNonData, diff = [];
				var from = 0,
					to = newRows.length;

				if (refreshHints && refreshHints.ignoreDiffsBefore) {
					from = Math.max(0, Math.min(newRows.length, refreshHints.ignoreDiffsBefore));
				}

				if (refreshHints && refreshHints.ignoreDiffsAfter) {
					to = Math.min(newRows.length, Math.max(0, refreshHints.ignoreDiffsAfter));
				}

				for (var i = from, rl = rows.length; i < to; i++) {
					if (i >= rl) {
						diff[diff.length] = i;
					} else {
						item = newRows[i];
						r = rows[i];
						eitherIsNonData = (item && item.__nonDataRow) || (r && r.__nonDataRow);

						// Determine if 'r' is different from 'item'
						if (item && r &&
							(
								// Compare group with non group
								(item instanceof Group && !(r instanceof Group)) ||
								(!(item instanceof Group) && r instanceof Group) ||
								// Compare two groups
								(
									self.groups.length && eitherIsNonData &&
									(item && item instanceof Group) && (item[idProperty] != r[idProperty]) ||
									(item && item instanceof Group) && (item.collapsed != r.collapsed)
								) ||
								// Compare between different non-data types
								(
									eitherIsNonData &&
									// no good way to compare totals since they are arbitrary DTOs
									// deep object comparison is pretty expensive
									// always considering them 'dirty' seems easier for the time being
									(item instanceof Aggregate || r instanceof Aggregate)
								) ||
								// Compare between different data object ids
								(
									item && item[idProperty] != r[idProperty] ||
									(updated && updated[item[idProperty]])
								)
							)
						) {
							diff[diff.length] = i;
						}
					}
				}

				return diff;
			};


			// insertEmptyAlert()
			// When the grid is empty and the empty alert is enabled -- add a NonDataItem to the grid
			//
			// @param	items	array		Array of items to insert into
			//
			insertEmptyAlert = function (items) {
				var obj = new NonDataItem({
					__alert: true,
					id: '-empty-alert-message-',
					selectable: false,
					focusable: false,
					class: classalert,
					columns: {
						0: {
							colspan: "*",
							formatter: function () {
								return getLocale("empty.default");
							},
							editor: null
						}
					}
				});

				items.push(obj);
			};


			// parse()
			// Given a list of items objects to convert to models, returns a list of parsed items.
			// This also checks to see if we need to enable variable height support.
			//
			// @param	item		array		List of objects
			//
			// @return array
			parse = function (items) {
				items = items instanceof Backbone.Collection ? items.models : items;

				var i, l, childrow, item;
				for (i = 0, l = items.length; i < l; i++) {
					item = items[i];

					// Validate that idProperty exists
					if (item[idProperty] === undefined || item[idProperty] === null) {
						throw "Each data item must have a unique 'id' key. The following item is missing an 'id': " + JSON.stringify(item);
					}

					// Check for children columns
					if (item.rows) {
						for (var rowIdx in item.rows) {
							childrow = item.rows[rowIdx];
							if (!variableRowHeight && childrow.height && childrow.height != grid.options.rowHeight) {
								variableRowHeight = true;
								break;
							}

							// Detect if nested postprocessing is needed via columns
							if (childrow.columns && !enableAsyncPostRender) {
								for (var childclmn in childrow.columns) {
									if (enableAsyncPostRender) break;
									if (childrow.columns[childclmn].postprocess) enableAsyncPostRender = true;
								}
							}

						}
					}

					// Detect if variable row heights are used
					if (!variableRowHeight && item.height && item.height !== grid.options.rowHeight) {
						variableRowHeight = true;
					}

					// Detect if nested postprocessing is needed via columns
					if (item.columns && !enableAsyncPostRender) {
						for (var clmn in item.columns) {
							if (enableAsyncPostRender) break;
							if (item.columns[clmn].postprocess) enableAsyncPostRender = true;
						}
					}
				}

				return items;
			};


			// processAggregators()
			// Processes any aggregrators that are enabled and caches their results.
			// Then inserts new Aggregate rows that are needed.
			processAggregators = function () {
				var item, i, l, active_aggregator;

				// Loop through the data and process the aggregators
				for (i = 0, l = self.items.length; i < l; i++) {
					if (self.items instanceof Backbone.Collection) {
						item = self.items.at(i);
					} else {
						item = self.items[i];
					}

					// Skip existing Aggregator rows
					if (item instanceof Aggregate) continue;

					for (var column_id in cache.aggregatorsByColumnId) {
						active_aggregator = null;
						for (var aggreg_idx in cache.aggregatorsByColumnId[column_id]) {
							if (typeof cache.aggregatorsByColumnId[column_id][aggreg_idx].process === 'function') {
								if (active_aggregator === null && cache.aggregatorsByColumnId[column_id][aggreg_idx].active) {
									active_aggregator = aggreg_idx;
								}

								cache.aggregatorsByColumnId[column_id][aggreg_idx].process(item);
							}
						}

						// If no active aggregator specified - enable the first one
						if (active_aggregator === null) {
							active_aggregator = 0;
							cache.aggregatorsByColumnId[column_id][active_aggregator].active = true;
						}
					}
				}

				// Insert grid totals row
				var gridAggregate = new Aggregate(cache.aggregatorsByColumnId);

				// Mark this is the grid-level aggregate
				gridAggregate.__gridAggregate = true;

				if (self.items instanceof Backbone.Collection) {
					self.items.models.push(gridAggregate);
				} else {
					self.items.push(gridAggregate);
				}
			};


			// processGroupAggregators()
			// Processes the aggregation methods for each group.
			// Then inserts new Aggregate rows at the bottom of each.
			processGroupAggregators = function (groups) {
				// For each group we're going to generate a new aggregate row
				var i, l, group, item, column, column_id, ii, ll, aggreg_idx;
				for (i = 0, l = groups.length; i < l; i++) {
					group = groups[i];

					// Make sure this is a group row
					if (!(group instanceof Group)) continue;

					// Create a new aggregators instance for each column
					group.aggregators = {};
					for (column_id in cache.aggregatorsByColumnId) {
						// NOTE: This can be optimized
						column = getColumnById(column_id);

						group.aggregators[column_id] = {};
						for (aggreg_idx in cache.aggregatorsByColumnId[column_id]) {
							group.aggregators[column_id][aggreg_idx] = new column.aggregators[aggreg_idx].fn(column);

							if (cache.aggregatorsByColumnId[column_id][aggreg_idx].active) {
								group.aggregators[column_id][aggreg_idx].active = true;
							}
						}
					}

					// Loop through the group row data and process the aggregators
					for (ii = 0, ll = groups[i].grouprows.length; ii < ll; ii++) {
						item = groups[i].grouprows[ii];
						for (column_id in group.aggregators) {
							for (aggreg_idx in group.aggregators[column_id]) {
								group.aggregators[column_id][aggreg_idx].process(item);
							}
						}
					}

					// Insert grid totals row
					group.grouprows.push(new Aggregate(group.aggregators));
				}
			};


			// recalc()
			// Given a list of rows we're viewing determines which of them need to be re-rendered
			//
			// @param		_items		array		List of rows to render
			// @param		callback	function	Callback function
			//
			// @return array
			recalc = function (_items, callback) {
				rowsById = null;

				if (refreshHints.isFilterNarrowing != prevRefreshHints.isFilterNarrowing ||
					refreshHints.isFilterExpanding != prevRefreshHints.isFilterExpanding) {
					filterCache = [];
				}

				var filteredItems = getFilteredAndPagedItems(_items);
				totalRows = filteredItems.totalRows;
				var newRows = filteredItems.rows;

				var processChildRows = function () {
					// Insert child rows
					var cRow, ri = 0;
					for (var i = 0, l = newRows.length; i < l; i++) {
						if (newRows[i].rows) {
							for (var r in newRows[i].rows) {
								if (newRows[i].rows[r].collapsed) continue;
								cRow = new NonDataItem(newRows[i].rows[r]);
								cRow.parent = newRows[i];
								newRows.splice((i + ri + 1), 0, cRow);
								ri++;
							}
						}
					}

					var diff = getRowDiffs(cache.rows, newRows);

					cache.rows = newRows;

					if (diff.length) {
						// Recache positions using the flattened group data
						cacheRows(0);
					}

					callback(diff);
				};

				// Insert group rows
				// NOTE: This is called when groups are collapsed and expanded which causes extractGroups
				// to be executed again -- there is no reason this needs to happen. Optimize.
				var groups = [];
				if (self.groups.length) {
					extractGroups(newRows, null, function (result) {
						groups = result;
						if (groups.length) {
							if (Object.keys(cache.aggregatorsByColumnId).length) {
								processGroupAggregators(groups);
							}
							finalizeGroups(groups);
							newRows = flattenGroupedRows(groups);
						}

						processChildRows();
					});
				} else {
					processChildRows();
				}
			};


			// refresh()
			// Automatically re-render the grid when rows have changed
			//
			this.refresh = function () {
				if (suspend) return;

				var countBefore = cache.rows.length,
					diff;

				var process = function () {
					updated = null;
					prevRefreshHints = refreshHints;
					refreshHints = {};

					// Change the length of the collection to the new number of rows
					this.length = cache.rows.length;

					if (countBefore != cache.rows.length) {
						updateRowCount();

						this.trigger('onRowCountChanged', {}, {
							previous: countBefore,
							current: cache.rows.length
						});
					}

					if (diff.length > 0) {
						invalidateRows(diff);
						render();

						this.trigger('onRowsChanged', {}, {
							rows: diff
						});
					}
				}.bind(this);

				// Recalculate changed rows
				recalc(this.items, function (result) {
					diff = result;

					// If the current page is no longer valid, go to last page and recalc
					// we suffer a performance penalty here, but the main loop (recalc)
					// remains highly optimized
					if (pagesize && totalRows < pagenum * pagesize) {
						pagenum = Math.max(0, Math.ceil(totalRows / pagesize) - 1);
						recalc(this.items, function (result) {
							diff = result;
							process();
						});
					} else {
						process();
					}
				}.bind(this));
			};


			// remove()
			// Removes an item from the collection
			//
			// @param	id		string		ID of the row item
			//
			this.remove = function (id) {
				if (id === undefined || id === null) {
					throw new Error("Unable to delete collection item. Invalid 'id' supplied.");
				}

				var idx = cache.indexById[id];
				if (idx === null || idx === undefined) {
					throw new Error(["Unable to remove row '", id, "' because no such row could be found in the grid."].join(''));
				}

				// Remove from items
				if (this.items instanceof Backbone.Collection) {
					this.items.remove(id);
				} else {
					this.items.splice(idx, 1);
				}

				// Clear cache
				delete cache.indexById[id];
				delete cache.rowPositions[idx];

				// Recache positions from affected row
				cacheRows(idx);

				// Re-render grid
				this.refresh();
			};


			// reset()
			// Given an array of items, binds those items to the data view collection, generates
			// index caches and checks for id uniqueness.
			//
			// @param	models		array		Array of objects
			// @param	recache		boolean		(Optional) Force a recache of positions and rows
			//
			this.reset = function (models, recache) {
				if (!models) models = [];
				suspend = true;

				// Make sure that rows are re-cached too. This is needed to make sure you can reset
				// rows with 'id' values that previously existed
				if (recache) cache.rows = [];

				// Parse data
				parse(models);

				// Load items and validate
				this.items = filteredItems = validate(models);

				// Process aggregators
				if (Object.keys(cache.aggregatorsByColumnId).length) {
					processAggregators();
				}

				if (recache) {
					cacheRows();
				}

				suspend = false;

				this.refresh();
			};


			// setGrouping()
			// Sets the current grouping settings
			//
			// @param	options		array		List of grouping objects
			//
			this.setGrouping = function (options) {
				// Is grouping enabled
				if (!grid.options.groupable) throw new Error('Cannot execute "setGrouping" because "options.groupable" is disabled.');

				options = options || [];

				if (!$.isArray(options)) throw new Error('Unable to set grouping because given options is not an array. Given: ' + JSON.stringify(options));

				// If resetting grouping - reset toggle cache
				if (!options.length) toggledGroupsByLevel = [];

				// Reset group cache
				var i, l, groups = [], col;
				for (i = 0, l = options.length; i < l; i++) {
					col = getColumnById(options[i].column_id);

					if (col === undefined) {
						throw new Error('Cannot add grouping for column "' + options[i].column_id + '" because no such column could be found.');
					}

					if (col.groupable === false) {
						throw new Error('Cannot add grouping for column "' + col.id + '" because "options.groupable" is disabled for that column.');
					}

					if (!toggledGroupsByLevel[i]) toggledGroupsByLevel[i] = {};

					// Extend using a default grouping object nad add to groups
					groups.push(createGroupingObject(options[i]));
				}

				// Set groups
				this.groups = groups;

				// Reload the grid with the new grouping
				this.refresh();
			};


			// setItem()
			// Update and redraw an existing items. If item being replaced is a Placeholder,
			// it is replaced entirely, otherwise object is extended.
			//
			// @param	id		string		The id of the item to update
			// @param	data	object		The data to use for the item
			//
			// @return object
			this.setItem = function (id, data) {
				if (cache.indexById[id] === undefined) {
					throw new Error("Unable to update item (id: " + id + "). Invalid or non-matching id");
				}

				// Update the row cache and the item
				var idx = cache.indexById[id];

				if (cache.rows[idx] instanceof Placeholder || this.items[i] instanceof Backbone.Model) {
					cache.rows[idx] = data;
				} else {
					cache.rows[idx] = $.extend(true, cache.rows[idx], data);
				}

				// ID may have changed for the item so update the index by id too.
				// This is most relevant in remote grids where real IDs replace placeholder IDs
				cache.indexById[data.id] = idx;

				// Find the data item and update it
				if (this.items instanceof Backbone.Collection) {
					this.items.set(data, {add: false, remove: false});
				} else {
					for (var i = 0, l = this.items.length; i < l; i++) {
						if (this.items[i].id == id) {
							if (this.items[i] instanceof Placeholder) {
								this.items[i] = data;
							} else {
								this.items[i] = $.extend(true, this.items[i], data);
							}
							break;
						}
					}
				}

				// If the rows were changed we need to invalidate the rows below
				if (data.rows) {
					invalidateRows(_.range(idx, cache.rows.length));
				}

				// Store the ids that were updated so the refresh knows which row to update
				if (!updated) updated = {};
				updated[id] = true;

				this.refresh();
			};


			// sort()
			// Performs the sort operation and refreshes the grid render
			//
			// @param	comparer	function		The function to use to render
			// @param	ascending	boolean			Is the direction ascending?
			//
			this.sort = function (comparer, ascending) {
				sortAsc = ascending;
				sortComparer = comparer;
				if (ascending === false) {
					this.items.reverse();
				}

				// Backbone Collection sorting is done through a defined comparator
				if (this.items instanceof Backbone.Collection) {
					this.items.comparator = comparer;
					this.items.sort();
				} else {
					this.items.sort(comparer);
				}

				if (ascending === false) {
					this.items.reverse();
				}

				// TODO: This only needs to re-index ID, not recalculate positions.
				// Maybe update cacheRows to support different modes?
				cacheRows(null, true);
				this.refresh();
			};


			// uncompiledFilter()
			// Runs the given items through the active filters in the collection
			//
			// @param	items	array		List of items to filter
			//
			// @retun array
			uncompiledFilter = function (items) {
				var retval = [],
					idx = 0;

				for (var i = 0, ii = items.length; i < ii; i++) {
					if (self.filter(items[i])) {
						retval[idx++] = items[i];
					}
				}

				return retval;
			};


			// uncompiledFilterWithCaching()
			// Runs the given items through the active filters in the collection,
			// and caches the results.
			//
			// @param	items	array		List of items to filter
			//
			// @retun array
			uncompiledFilterWithCaching = function (items, cache) {
				var retval = [],
					idx = 0,
					item;

				for (var i = 0, ii = items.length; i < ii; i++) {
					item = items[i];
					if (cache[i]) {
						retval[idx++] = item;
					} else if (self.filter(item)) {
						retval[idx++] = item;
						cache[i] = true;
					}
				}

				return retval;
			};


			// validate()
			// Ensures that the given items are valid. Returns a list of validated items.
			//
			// @param	items		array		Array of models to validate
			//
			// @return array
			validate = function (items) {
				// If no data - add an empty alert
				if (grid.options.emptyNotice && !items.length) insertEmptyAlert(items);

				return items;
			};

			return this.initialize();
		};


		// defaultEditor()
		// Default editor object that handles cell reformatting and processing of edits
		//
		// @param	options		object		Editor arguments
		//
		defaultEditor = function (options) {

			// initialize()
			// The editor is actived when an active cell in the grid is focused.
			// This should generate any DOM elements you want to use for your editor.
			//
			this.initialize = function () {
				// Will hold the current value of the item being edited
				this.loadValue(options.item);

				var value = this.currentValue;
				if (value === null || value === undefined) value = "";

				this.$input = $('<input type="text" class="editor" value="' + value + '"/>')
					.appendTo(options.cell)
					.on("keydown", function (event) {
						// Escape out of here on 'Tab', 'Enter', 'Home, 'End', 'Page Up' and 'Page Down'
						// so that the grid can capture that event
						if ([9, 13, 33, 34, 35, 36].indexOf(event.which) >= 0) {
							event.preventDefault();
							return;
						}

						// Esc
						if (event.which == 27) return;

						// Check if position of cursor is on the ends, if it's not then
						// left or right arrow keys will prevent editor from saving
						// results and will instead, move the text cursor
						var pos = getCaretPosition(this);

						if ((pos === null && event.which != 38 && event.which != 40) ||
							(pos > 0 && event.which === 37) ||
							(pos < $(this).val().length && event.which === 39)
						) {
							event.stopImmediatePropagation();
						}
					})
					.focus()
					.select();
			};


			// applyValue()
			// This is the function that will update the data model in the grid.
			//
			// @param	item		object		The data model for the item being edited
			// @param	value		string		The user-input value being entered
			//
			this.applyValue = function (item, value) {
				// Make sure we always have an id for our item
				if (!('id' in item) && options.column.field == 'id') {
					item.id = value;
				}

				item.data[options.column.field] = value;
			};


			// cancel()
			// Cancel the edit and return the cell to its default state
			//
			this.cancel = function () {
				makeActiveCellNormal();
			};


			// destroy()
			// Destroys any elements your editor has created.
			//
			this.destroy = function () {
				this.$input.remove();
			};


			// focus()
			// When the cell with an initialized editor is focused
			//
			this.focus = function () {
				this.$input.focus();
			};


			// getValue()
			// Gets the current value of whatever the user has inputted
			//
			// @return string
			this.getValue = function () {
				return this.$input.val();
			};


			// isValueChanged()
			// Determines whether or not the value has changed
			//
			// @return boolean
			this.isValueChanged = function () {
				return (!(this.$input.val() === "" && this.currentValue === null)) && (this.$input.val() != this.currentValue);
			};


			// loadValue()
			// Loads the current value for the item
			//
			// @param	item	object		Data model object that is being edited
			//
			this.loadValue = function (item) {
				if (!item || !item.data) return null;
				this.currentValue = item.data[options.column.field] || null;
				return this.currentValue;
			};


			// serializeValue()
			// Process the input value before submitting it
			//
			this.serializeValue = function () {
				return this.$input.val();
			};


			// setValue()
			// Sets the value inside your editor, in case some internal grid calls needs to do
			// it dynamically.
			//
			// @param	val		string		Value to set
			//
			this.setValue = function (val) {
				this.$input.val(val);
			};


			// validate()
			// Validation step for the value before allowing a save. Should return back
			// and object with two keys: `valid` (boolean) and `msg` (string) for the error
			// message (if any).
			//
			// @return object
			this.validate = function () {
				var value = this.getValue();

				// TODO: Add support for this
				if (options.column.validator) {
					var validationResults = options.column.validator(value);
					if (!validationResults.valid) {
						return validationResults;
					}
				}

				return {
					valid: true,
					msg: null
				};
			};

			return this.initialize();
		};


		// defaultFormatter()
		// Default formatting functions for all cell rendering. Returns an HTML string.
		//
		// @param	row			integer		Index of the row is located
		// @param	cell		integer		Index of the
		// @param	value		string		The value of this cell from the data object for this row
		// @param	columnDef	object		The column definition object for the given column
		// @param	data		object		The full data object for the given cell
		//
		// @return string
		defaultFormatter = function (row, cell, value) {
			// Never write "undefined" or "null" in the grid -- that's just bad programming
			if (value === undefined || value === null) {
				return "";
			}

			// Some simple HTML escaping
			return (value + "")
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
		};


		// deselectCells()
		// Deselects all selected cell ranges, or a specific cell specified.
		//
		// @param	row		integer		(Optional) Row index for cell to deselect
		// @param	cell	integer		(Optional) Cell index to deselect in the given row
		//
		deselectCells = function (row, cell) {
			// Nothing to deselect
			if (!self.selection) return;

			var specific = row !== undefined && row !== null && cell !== undefined && cell !== null;

			// Go through the selection ranges and deselect as needed
			for (var i = 0, l = self.selection.length; i < l; i++) {
				// To deselect a specific cell we first need to make sure its in the selection Range
				if (specific) {
					if (self.selection[i].contains(row, cell)) {
						self.selection[i].deselect(row, cell);
					}
				} else {
					self.selection[i].deselect();
				}
			}

			// If deselecting everything - remove selection store
			if (!specific) self.selection = null;

			// Did the user exclude all values of any ranges? If so - destroy that range.
			if (self.selection) {
				var cleanranges = [];
				for (i = 0, l = self.selection.length; i < l; i++) {
					if (!self.selection[i].fullyExcluded()) {
						cleanranges.push(self.selection[i]);
					}
				}

				if (cleanranges.length === 0) {
					self.selection = null;
				} else {
					self.selection = cleanranges;
				}
			}
		};


		// destroy()
		// Destroy the grid and clean up any events that have been assigned
		//
		this.destroy = function () {
			// If reorderable, destroy sortable jQuery plugin
			if (this.options.reorderable) {
				$headers.filter(":ui-sortable").sortable("destroy");
			}

			if (this.$el && this.$el.length) {
				// Prevent double destroy call when calling directly
				this.$el.unbind('remove');
				this.$el.remove();
				this.$el = null;
			}

			// Remove CSS Rules
			removeCssRules();

			// Remove window resize binding
			$(window).off('resize', handleWindowResize);
		};


		// disableSelection()
		// Disable all text selection in header (including input and textarea).
		//
		// For usability reasons, all text selection is disabled
		// with the exception of input and textarea elements (selection must
		// be enabled there so that editors work as expected); note that
		// selection in grid cells (grid body) is already unavailable in
		// all browsers except IE
		//
		// @param	$target		object		Target to use as selection curtain
		//
		disableSelection = function ($target) {
			if ($target && $target.jquery) {
				$target
					.attr("unselectable", "on")
					.css("MozUserSelect", "none")
					.on("selectstart.ui", function () {
					return false;
				}); // from jquery:ui.core.js 1.7.2
			}
		};


		// Dropdown()
		// Creates a new dropdown menu.
		//
		// @param	event		object		Javascript event object
		// @param	options		object		Additional dropdown options
		//
		// @return object
		Dropdown = function (event, options) {

			var self = this;

			// Is the dropdown currently shown?
			this.open = false;

			this.initialize = function () {
				this.$parent = options.parent || $(event.currentTarget);
				this.$el = options.menu;
				this.id = [uid, classdropdown, options.id].join('_');

				// Create data store in the parent object if it doesn't already exist
				var existing = null;
				if (!this.$parent.data(classdropdown)) {
					this.$parent.data(classdropdown, []);
				} else {
					// Also find the existing dropdown for this id (if it exists)
					existing = this.$parent.data(classdropdown).filter(function (i) {
						return i.id == self.id;
					});
					if (existing) existing = existing[0];
				}

				// If this parent already has a dropdown enabled -- initializing will close it
				if (existing && existing.open) {
					existing.hide();
				} else {
					// Ensure dropdown has the right styling
					this.$el.attr('id', this.id);
					this.$el.addClass(['off', classdropdown].join(' '));
					this.show();
				}

				// Clicking outside - closes the dropdown
				var bodyEscape;
				bodyEscape = function (e) {
					if (e.target == event.target) return;
					self.hide();
					$(document).off('click', bodyEscape);
					$(document).off('context', bodyEscape);
				};

				$(document).on('click', bodyEscape);
				$(document).on('contextmenu', bodyEscape);

				return this;
			};


			// show()
			// Displays the dropdown
			//
			this.show = function () {
				if (this.open) return;

				this.$el.appendTo(this.$parent);

				this.position();

				var store = this.$parent.data(classdropdown);
				store.push(this);
				this.$parent.data(classdropdown, store);

				// Animate fade in
				setTimeout(function () {
					self.$el.removeClass('off');
				}, 150);

				this.open = true;
			};


			// hide()
			// Hides the dropdown
			//
			this.hide = function () {
				if (!this.open || !this.$parent) return;

				if (this.$parent.data(classdropdown)) {
					var store = this.$parent.data(classdropdown).filter(function (i) {
						return i != self;
					});

					this.$parent.data(classdropdown, store);

					this.$el.addClass('off');

					// Animate fade out
					setTimeout(function () {
						self.$el.remove();
					}, 150);

					this.open = false;
				}
			};


			// position()
			// Positions the dropdown in the right spot
			//
			this.position = function () {
				var top = event.clientY - this.$parent.offset().top,
					left = event.clientX - this.$parent.offset().left,
					menu_width = this.$el.outerWidth(),
					required_space = left + menu_width,
					available_space = this.$el.parent().width();

				// If no room on the right side, throw dropdown to the left
				if (available_space < required_space) {
					left -= menu_width;
				}

				// If no room on the right side for submenu, throw submenus to the left
				if (available_space < required_space + menu_width) {
					this.$el.addClass(classdropdownleft);
				}

				this.$el.css({
					left: left,
					top: top
				});
			};

			return this.initialize();
		};


		// executeSorter()
		// Re-sorts the data set and re-renders the grid
		//
		// @param	args		object		Slick.Event sort data
		//
		executeSorter = function (args) {
			var cols = args.sortCols;

			// If remote, and not all data is fetched - sort on server
			if (remote && !remoteAllLoaded()) {
				// Refill the collection with placeholders
				generatePlaceholders();

				// Clear the row cache to ensure when new data comes in the grid refreshes
				cache.rows = [];

				// Ask the Remote fetcher to refetch the data -- this time using the new sort settings
				remoteFetch();
				return;
			}

			self.collection.sort(function (dataRow1, dataRow2) {
				var column, field, sign, value1, value2, result = 0;

				// Loops through the columns by which we are sorting
				for (var i = 0, l = cols.length; i < l; i++) {
					column = cols[i].sortCol;
					field = column.field;
					sign = cols[i].sortAsc ? 1 : -1;

					// Do not attempt to sort Aggregators. They will always go to the bottom.
					if (dataRow1 instanceof Aggregate) return 1;
					if (dataRow2 instanceof Aggregate) return -1;

					value1 = getDataItemValueForColumn(dataRow1, column);
					value2 = getDataItemValueForColumn(dataRow2, column);

					// Use custom column comparer if it exists
					if (typeof(column.comparator) === 'function') {
						return column.comparator(value1, value2) * sign;
					} else {
						// Always keep null values on the bottom
						if (value1 === null && value2 === null) return 0;
						if (value1 === null) return 1;
						if (value2 === null) return -1;

						// Use natural sort by default
						result += naturalSort(value1, value2) * sign;
					}
				}

				return result;
			});
		};


		// export()
		// Export all grid data to a format of your choice. Available formats are 'csv' and 'html'.
		// TODO: Exporting remote grid should prompt user what to export, all data, or what's loaded.
		//
		// @param	format		string		Which format to export to
		//
		// @return string
		this.export = function (format) {
			var allowed = ['csv', 'html'];
			if (allowed.indexOf(format) < 0) throw new Error('Sorry, "' + format + '" is not a supported format for export.');

			// First collect all the data as an array of arrays
			var result = [], i, l, row, ii, ll, val;

			if (format === 'html') {
				result.push('<table><thead><tr>');
			}

			// Get header
			var header = [];
			for (i = 0, l = cache.activeColumns.length; i < l; i++) {
				val = cache.activeColumns[i].name || "";
				if (format === 'csv') {
					// Escape quotes
					val = val.replace(/\"/g, '\"');

					header.push(['"', val, '"'].join(''));
				} else if (format === 'html') {
					header.push('<th>');
					header.push(val);
					header.push('</th>');
				}
			}

			if (format === 'csv') {
				result.push(header.join(','));
			} else if (format === 'html') {
				result.push(header.join(''));
				result.push('</tr></thead><tbody>');
			}

			// Get data
			for (i = 0, l = this.collection.items.length; i < l; i++) {
				// Don't export non-data
				if (this.collection.items[i] instanceof NonDataItem) continue;

				row = [];
				if (format === 'html') row.push('<tr>');
				for (ii = 0, ll = cache.activeColumns.length; ii < ll; ii++) {

					if (this.collection.items instanceof Backbone.Collection) {
						val = getValueFromItem(this.collection.items.at(i), cache.activeColumns[ii]);
					} else {
						val = getValueFromItem(this.collection.items[i], cache.activeColumns[ii]);
					}

					if (format === 'csv') {
						// Escape quotes
						val = val !== null && val !== undefined ? val.toString().replace(/\"/g, '\"') : '';

						row.push(['"', val, '"'].join(''));
					} else if (format === 'html') {
						row.push('<td>');
						row.push(val);
						row.push('</td>');
					}
				}
				if (format === 'csv') {
					result.push(row.join(','));
				} else if (format === 'html') {
					row.push('</tr>');
					result.push(row.join(''));
				}

			}

			if (format === 'html') {
				result.push('</tbody></table>');
			}

			if (format === 'csv') {
				result = result.join("\n");
			} else if (format === 'html') {
				result = result.join("");
			}

			return result;
		};


		// filter()
		// Filters the grid using a given function
		//
		// @param	filter	function		Function to use for filtering items
		//
		// @return object
		this.filter = function (filter) {
			// Set collection filter
			this.collection.filter = filter;

			// Refresh the grid with the filtered data
			this.collection.refresh();

			return this;
		};


		// findFirstFocusableCell()
		// Given a row, returns the index of first focusable cell in that row
		//
		// @param	row		integer		Row index
		//
		// return integer
		findFirstFocusableCell = function (row) {
			var cell = 0;
			while (cell < cache.activeColumns.length) {
				if (canCellBeActive(row, cell)) {
					return cell;
				}
				cell += getColspan(row, cell);
			}
			return null;
		};


		// findLastFocusableCell()
		// Given a row, returns the index of last focusable cell in that row
		//
		// @param	row		integer		Row index
		//
		// return integer
		findLastFocusableCell = function (row) {
			var cell = 0;
			var lastFocusableCell = null;
			while (cell < cache.activeColumns.length) {
				if (canCellBeActive(row, cell)) {
					lastFocusableCell = cell;
				}
				cell += getColspan(row, cell);
			}
			return lastFocusableCell;
		};


		// generatePlaceholders()
		// Replaces the entire collection with Placeholder objects
		//
		generatePlaceholders = function () {
			// Reset the collection
			self.collection.items = [];

			// Populate the collection with placeholders
			var phId, ph;
			for (var i = 0, l = self.collection.length; i < l; i++) {
				phId = 'placeholder-' + i;
				ph = new Placeholder({id: phId});
				self.collection.items.push(ph);
				cache.indexById[phId] = ph;
			}
		};


		// get()
		// Entry point for collection.get(). See collection.get for more info.
		//
		this.get = function (id) {
			return this.collection.get(id);
		};


		// getActive()
		// Gets the active cell row/cell indexes
		//
		// @return object
		getActiveCell = function () {
			if (!self.active || !self.active.node) {
				return null;
			} else {
				return {
					row: self.active.row,
					cell: self.active.cell
				};
			}
		};


		// getBrowserData()
		// Calculates some information about the browser window that will be shared
		// with all grid instances.
		//
		getBrowserData = function () {
			window.maxSupportedCssHeight = window.maxSupportedCssHeight || getMaxCSSHeight();
			window.scrollbarDimensions = window.scrollbarDimensions || getScrollbarSize();
		};


		// getCanvasWidth()
		// Gets the width of the current canvas area (usually the viewport)
		//
		// @return integer
		getCanvasWidth = function () {
			var availableWidth = viewportW - (viewportHasVScroll ? window.scrollbarDimensions.width : 0),
				rowWidth = 0, i, l;

			for (i = 0, l = cache.activeColumns.length; i < l; i++) {
				// The 1 here is to compensate for the spacer between columns.
				// TODO: Move this to a variable instead in case users want to modify this spacing.
				rowWidth += cache.activeColumns[i].width - 1;
			}

			// When fullWidthRows disable - keep canvas as big as the dat only
			return self.options.fullWidthRows ? Math.max(rowWidth, availableWidth) : (rowWidth + l * 2);
		};


		// getCaretPosition()
		// Given an input field object, will tell you where the cursor is positioned
		//
		// @param	input		DOM		Input dom element
		//
		// @return integer
		getCaretPosition = function (input) {
			var pos = 0;

			// IE Specific
			if (document.selection) {
				input.focus();
				var oSel = document.selection.createRange();
				oSel.moveStart('character', -input.value.length);
				pos = oSel.text.length;
			}
			// If text is selected -- return null
			else if (input.selectionStart !== input.selectionEnd) {
				return null;
			// Find cursor position
			} else if (input.selectionStart || input.selectionStart == '0') {
				pos = input.selectionStart;
			}

			return pos;
		};


		// getCellFromNode()
		// Given a cell node, returns the cell index in that row
		//
		// @param	cellNode	DOM		DOM object for the cell
		//
		// @return integer
		getCellFromNode = function (cellNode) {
			// read column number from .l<columnNumber> CSS class
			var cls = /l\d+/.exec(cellNode.className);
			if (!cls) {
				throw "getCellFromNode: cannot get cell - " + cellNode.className;
			}
			return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
		};


		// getCellFromPoint()
		// Find the cell that corresponds to the given x, y coordinates in the canvas
		//
		// @param	x	integer		x pixel position
		// @param	y	integer		y pixel position
		//
		// @retrun object
		getCellFromPoint = function (x, y) {
			var row = getRowFromPosition(y),
				cell = 0,
				w = 0;

			for (var i = 0, l = cache.activeColumns.length; i < l && w < x; i++) {
				w += cache.activeColumns[i].width;
				cell++;
			}

			if (cell < 0) cell = 0;

			return {
				cell: cell - 1,
				row: row
			};
		};


		// getCellNode()
		// Given a row and cell index, returns the DOM node for that cell
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return DOM object
		getCellNode = function (row, cell) {
			if (cache.nodes[row]) {
				ensureCellNodesInRowsCache(row);
				return cache.nodes[row].cellNodesByColumnIdx[cell];
			}
			return null;
		};


		// getCellNodeBox()
		// Given a row and cell index, returns the node size for that cell DOM
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return DOM object
		getCellNodeBox = function (row, cell) {
			if (!cellExists(row, cell)) return null;

			var y1, y2;
			if (variableRowHeight) {
				var pos = cache.rowPositions[row];
				y1 = pos.top - 1;
				y2 = y1 + (pos.height || self.options.rowHeight) + 2;
			} else {
				y1 = self.options.rowHeight * row - offset + row - 1;
				y2 = y1 + self.options.rowHeight + 2;
			}
			var x1 = -1;

			for (var i = 0; i < cell; i++) {
				x1 += cache.activeColumns[i].width + 1;
			}

			var x2 = x1 + cache.activeColumns[cell].width + 2;

			return {
				bottom: y2,
				left: x1,
				right: x2,
				top: y1
			};
		};


		// getCellFromEvent()
		// Given an event object, gets the cell that generated the event
		//
		// @param	e		object		Javascript event object
		//
		// @return object
		getCellFromEvent = function (e) {
			var $cell = $(e.target).closest("." + classcell, $canvas);
			if (!$cell.length) return null;

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
		};


		// getColspan()
		// Given a row and cell index, returns the colspan for that cell
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// return integer
		getColspan = function (row, cell) {
			var item = self.collection.getItem(row);
			if (!item.columns) return 1;

			var columnData = item.columns[cache.activeColumns[cell].id] || item.columns[cell];
			var colspan = (columnData && columnData.colspan);
			if (colspan === "*") {
				colspan = cache.activeColumns.length - cell;
			} else {
				colspan = colspan || 1;
			}

			return colspan;
		};


		// getColumnById()
		// Returns the column object given the column id
		//
		// @param	column_id		string		Id the column to lookup
		//
		// @return object
		getColumnById = function (column_id) {
			return _.findWhere(self.options.columns, {id: column_id});
		};


		// getColumnCssRules()
		// Gets the CSS rules for the given columns
		//
		// @param	idx		integer		Index of the column to get rules for
		//
		// @return object
		getColumnCssRules = function (idx) {
			if (!stylesheet) {
				var sheets = document.styleSheets, i, l;
				for (i = 0, l = sheets.length; i < l; i++) {
					if ((sheets[i].ownerNode || sheets[i].owningElement) == $style[0]) {
						stylesheet = sheets[i];
						break;
					}
				}

				if (!stylesheet) throw new Error("Cannot find stylesheet.");

				// find and cache column CSS rules
				columnCssRulesL = [];
				columnCssRulesR = [];
				var cssRules = (stylesheet.cssRules || stylesheet.rules);
				var matches, columnIdx;
				for (i = 0; i < cssRules.length; i++) {
					var selector = cssRules[i].selectorText;
					matches = new RegExp(/\.l\d+/).exec(selector);
					if (matches) {
						columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
						columnCssRulesL[columnIdx] = cssRules[i];
					} else {
						matches = new RegExp(/\.r\d+/).exec(selector);
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
		};


		// getColumnContentWidth()
		// Returns the width of the content in the given column. Used for auto resizing columns to their
		// content via double-click on the resize handle.
		//
		// @param	column_index	integer		Index of the column to calculate data for
		//
		// @return integer
		getColumnContentWidth = function (column_index) {
			var columnElements = $headers.children(),
				$column = $(columnElements[column_index]),
				currentWidth = $column.width(),
				headerPadding = parseInt($column.css('paddingLeft'), 10) + parseInt($column.css('paddingRight'), 10),
				cellWidths = [];

			// Determine the width of the column name text
			var name = $column.children('.' + classcolumnname + ':first');
			name.css('overflow', 'visible');
			$column.width('auto');
			// The extra 1 is needed here because text-overflow: ellipsis
			// seems to kick in 1 pixel too early.
			var headerWidth = $column.width() + headerPadding + 1;
			name.css('overflow', '');
			$column.width(currentWidth);
			cellWidths.push(headerWidth);

			// Determine the width of the widest visible value
			$canvas.find('.l' + column_index + '.r' + column_index + ':visible')
				.removeClass('r' + column_index)
				.each(function () {
					var w = $(this).outerWidth();
					if (cellWidths.indexOf(w) < 0) cellWidths.push(w);
				})
				.addClass('r' + column_index);

			// If new width is smaller than min width - use min width
			return Math.max.apply(null, cellWidths);
		};


		// getColumnFromEvent()
		// Given an event object, attempts to figure out which column was acted upon
		//
		// @param	event	object		Javascript event object
		//
		// @return object
		getColumnFromEvent = function (event) {
			var $column = $(event.target).closest("." + classheadercolumn + ':not(.' + classplaceholder + ')'),
				column_id = $column && $column.length ? $column.attr('id').replace(uid, '') : null;

			return column_id ? getColumnById(column_id) : null;
		};


		// getDataItem()
		// Given an item's index returns its data object
		//
		// @param	i	integer		Index of the data item
		//
		// @return object
		getDataItem = function (i) {
			if (self.collection.getItem) {
				return self.collection.getItem(i);
			} else {
				return self.collection[i];
			}
		};


		// getDataItemValueForColumns()
		// Given an item object and a column definition, returns the value of the column
		// to display in the cell.
		//
		// @param	item		object		Data row object from the dataset
		// @param	columnDef	object		Column definition object for the given column
		//
		// @return string
		getDataItemValueForColumn = function (item, columnDef) {
			// If a custom extractor is specified -- use that
			if (self.options.dataExtractor) return self.options.dataExtractor(item, columnDef);

			// Backbone Model
			if (item instanceof Backbone.Model) return item.get(columnDef.field);

			// Group headers
			if (item instanceof Group) return item.value;

			return item.data ? item.data[columnDef.field] : null;
		};


		// getDataLength()
		// Gets the number of items in the data set
		//
		// @return integer
		getDataLength = function () {
			if (!self.collection) return 0;
			return self.collection.length;
		};


		// getEditor()
		// Given a row and cell index, returns the editor factory for that cell
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return function
		getEditor = function (row, cell) {
			var column = cache.activeColumns[cell],
				item = self.collection.getItem(row),
				columnMetadata = item.columns;

			// Get the editor from the column definition
			if (columnMetadata && columnMetadata[column.id] && columnMetadata[column.id].editor !== undefined) {
				return columnMetadata[column.id].editor;
			}
			if (columnMetadata && columnMetadata[cell] && columnMetadata[cell].editor !== undefined) {
				return columnMetadata[cell].editor;
			}

			// If no column editor, use editor in the options, otherwise use defaultEditor
			return column.editor || (self.options.editor && self.options.editor.getEditor(column)) || defaultEditor;
		};


		// getFormatter()
		// Given a row and column, returns the formatter function for that cell
		//
		// @param	row		integer		Index of the row
		// @param	column	object		Column data object
		//
		// @return function
		getFormatter = function (row, column) {
			var item = self.collection.getItem(row);

			// Check if item has column overrides
			var columnOverrides = item.columns && (item.columns[column.id] || item.columns[cache.columnsById[column.id]]);

			// Pick formatter starting at the item formatter and working down to the default
			return item.formatter ? item.formatter.bind(item) : null ||
				(columnOverrides && columnOverrides.formatter) ||
				column.formatter ||
				self.options.formatter ||
				defaultFormatter;
		};


		// getHeadersWidth()
		// Gets the total width of the column headers, or the viewport (whichever is bigger)
		//
		// @return integer
		getHeadersWidth = function () {
			var headersWidth = 0;

			// For each column - get its width
			for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
				// The extra one here is to compensate for the column spacing created with a border
				headersWidth += cache.activeColumns[i].width + 1;
			}

			// Include the width of the scrollbar
			headersWidth += window.scrollbarDimensions.width;

			return Math.max(headersWidth, viewportW) + 1000;
		};


		// getLocale()
		// Formats a string of text for display to the end user
		//
		// @param	key		string		Key string to fetch in locale object
		// @param	data	object		Object to pass in
		//
		// @return string
		getLocale = function (key, data) {
			data = data || {};

			// Convert "a.b.c" notation to reference in options.locale
			var string = self.options.locale;
			_.each(key.split('.'), function (p) {
				string = string[p];
			});

			if (!string) {
				throw new Error('Doby Grid does not have a locale string defined for "' + key + '"');
			}

			// Parse data object and return locale string
			return _.template(string, data, {
				interpolate: /\{\{(.+?)\}\}/gim
			});
		};


		// getMaxCSS ()
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
		};


		// getRenderedRange()
		// Given viewport coordinates, returns the range of rendered rows
		//
		// @param	viewportTop		integer
		getRenderedRange = function (viewportTop, viewportLeft) {
			var range = getVisibleRange(viewportTop, viewportLeft),
				buffer,
				minBuffer = 3;

			if (!variableRowHeight) {
				buffer = Math.round(viewportH / self.options.rowHeight);
			} else {
				buffer = Math.round(getRowFromPosition(viewportH));
			}

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
			range.bottom = Math.min(getDataLength() - 1, range.bottom);

			range.leftPx -= viewportW;
			range.rightPx += viewportW;

			range.leftPx = Math.max(0, range.leftPx);
			range.rightPx = Math.min(canvasWidth, range.rightPx);

			return range;
		};


		// getRowFromNode()
		// Given a DOM node, returns the row index for that row
		//
		// @param	rowNode		object		DOM object
		//
		// @return integer
		getRowFromNode = function (rowNode) {
			for (var row in cache.nodes) {
				if (cache.nodes[row].rowNode === rowNode) {
					return row | 0;
				}
			}

			return null;
		};


		// getRowFromPosition()
		// Given a pixel position, returns the row index for that position.
		//
		// @param	maxPosition		integer		Top scroll position
		//
		// @return integer
		getRowFromPosition = function (maxPosition) {
			if (!variableRowHeight) {
				return Math.floor((maxPosition + offset) / (self.options.rowHeight + 1));
			}

			var row = 0, rowLength = cache.rows.length,	pos, lastpos, i;

			if (rowLength) {
				// Loop through the row position cache and break when the row is found
				for (i = 0; i < rowLength; i++) {
					pos = cache.rowPositions[i];
					if (pos.top <= maxPosition && pos.bottom >= maxPosition) {
						row = i;
						continue;
					}
				}

				// If we've gone past the bottom
				// Return the last row in the grid
				lastpos = cache.rowPositions[rowLength - 1];
				if (maxPosition > lastpos.bottom) row = rowLength - 1;

				return row;
			}
		};


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
			return result;
		};


		// getValueFromItem()
		// Given a data item, returns the value of that cell for all export functions
		//
		// @param	item		object		Data item from the collection
		// @param	column		object		Column object for the field to pull
		//
		// @return string
		getValueFromItem = function (item, column) {
			// First check for an exporter function for this specific item
			if (typeof item.exporter === 'function') {
				return item.exporter(column, item).toString();
			}

			// Second check for an exporter function for this column
			if (column.exporter && typeof column.exporter === 'function') {
				return column.exporter(column, item).toString();
			}

			// Then check for regular data
			return getDataItemValueForColumn(item, column);
		};


		// getVBoxDelta()
		// Given an elements, gets its padding and border offset size
		//
		// @param	$el		object		Element to scan
		//
		// @return integer
		getVBoxDelta = function ($el) {
			var p = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
			var delta = 0;
			$.each(p, function (n, val) {
				delta += parseFloat($el.css(val)) || 0;
			});
			return delta;
		};


		// getViewportHeight()
		// Calculates the height of the current viewport
		//
		// @return integer
		getViewportHeight = function () {
			return parseFloat($.css(self.$el[0], "height", true)) -
				parseFloat($.css(self.$el[0], "paddingTop", true)) -
				parseFloat($.css(self.$el[0], "paddingBottom", true)) -
				parseFloat($.css($headerScroller[0], "height")) - getVBoxDelta($headerScroller);
		};


		// getVisibleRange()
		// Gets the currently visible range of the grid. This is the range we'll be rendering
		//
		// @param	viewportTop		integer		The current top offset
		// @param	viewportLeft	integer		The current left offset
		//
		// @return object
		getVisibleRange = function (viewportTop, viewportLeft) {
			if (viewportTop === undefined || viewportTop === null) viewportTop = scrollTop;
			if (viewportLeft === undefined || viewportLeft === null) viewportLeft = scrollLeft;

			var rowTop, rowBottom;

			if (!variableRowHeight) {
				rowTop = getRowFromPosition(viewportTop);
				rowBottom = getRowFromPosition(viewportTop + viewportH) + 1;
			} else {
				rowTop = Math.floor(getRowFromPosition(viewportTop + offset));
				rowBottom = Math.ceil(getRowFromPosition(viewportTop + offset + viewportH));
			}

			return {
				top: rowTop,
				bottom: rowBottom,
				leftPx: viewportLeft,
				rightPx: viewportLeft + viewportW
			};
		};


		// gotoCell()
		// Activates a given cell
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		// @param	forceEdit	boolean		TODO: ???
		//
		gotoCell = function (row, cell, forceEdit) {
			if (!initialized) return;
			if (!canCellBeActive(row, cell)) return;

			scrollCellIntoView(row, cell, false);

			var newCell = getCellNode(row, cell);

			// if selecting the 'add new' row, start editing right away
			setActiveCellInternal(newCell, forceEdit || (row === getDataLength()) || self.options.autoEdit);
		};


		// gotoDown()
		// Activates the cell below the currently active one
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		// @param	posX		integer		TODO: ???
		//
		gotoDown = function (row, cell, posX) {
			var prevCell,
				dataLength = getDataLength();
			while (true) {
				if (++row >= dataLength) {
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
		};


		// gotoLeft()
		// Activates the cell to the left the currently active one
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		//
		gotoLeft = function (row, cell) {
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
		};


		// gotoNext()
		// Activates the next available cell in the grid (either left, or first in next row)
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		// @param	posX		integer		TODO: ???
		//
		gotoNext = function (row, cell, posX) {
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

			var firstFocusableCell = null,
				dataLength = getDataLength();

			while (++row < dataLength) {
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
		};


		// gotoPrev()
		// Activates the previous cell to the current one
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		// @param	posX		integer		TODO: ???
		//
		gotoPrev = function (row, cell, posX) {
			if (row === null && cell === null) {
				row = getDataLength() - 1;
				cell = posX = cache.activeColumns.length - 1;
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
		};


		// gotoRight()
		// Activates the cell to the right the currently active one
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		//
		gotoRight = function (row, cell) {
			if (cell >= cache.activeColumns.length) return null;

			do {
				cell += getColspan(row, cell);
			}
			while (cell < cache.activeColumns.length && !canCellBeActive(row, cell));

			if (cell < cache.activeColumns.length) {
				return {
					"row": row,
					"cell": cell,
					"posX": cell
				};
			}
			return null;
		};


		// gotoUp()
		// Activates the cell above the currently active one
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		// @param	posX		integer		TODO: ???
		//
		gotoUp = function (row, cell, posX) {
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
		};


		// Group()
		// Class that stores information about a group of rows.
		//
		Group = function () {
			this.count = 0;				// Number of rows in the group
			this.groups = null;			// Sub-groups that are part of this group
			this.id = null;				// A unique key used to identify the group
			this.level = 0;				// Grouping level, starting with 0 (for nesting groups)
			this.grouprows = [];		// Rows that are part of this group
			this.selectable = false;	// Don't allow selecting groups
			this.title = null;			// Formatted display value of the group
			this.value = null;			// Grouping value
		};

		Group.prototype = new NonDataItem();
		Group.prototype.class = function () {
			var collapseclass = (this.collapsed ? classcollapsed : classexpanded);
			return [classgroup, classgrouptoggle, collapseclass].join(' ');
		};
		Group.prototype.columns = {
			0: {
				colspan: "*",
				formatter: function (row, cell, value, columnDef, item) {
					var indent = item.level * 15;
					return [(indent ? '<span style="margin-left:' + indent + 'px">' : ''),
						'<span class="icon"></span>',
						'<span class="' + classgrouptitle + '" level="' + item.level + '">',
						item.title,
						'</span>',
						(indent ? '</span>' : '')
					].join('');
				}
			}
		};
		Group.prototype.toString = function () { return "Group"; };


		// handleClick()
		// Handles the click events on cells
		//
		// @param	e	object		Javascript event object
		//
		handleClick = function (e) {
			var cell = getCellFromEvent(e);
			if (!cell || (currentEditor !== null &&
				(self.active && self.active.row == cell.row && self.active.cell == cell.cell))
			) {
				return;
			}

			// Get item from cell
			var item = getDataItem(cell.row);

			// Handle group expand/collapse
			if (item && item instanceof Group) {
				var isToggler = $(e.target).hasClass(classgrouptoggle) || $(e.target).closest('.' + classgrouptoggle).length;

				if (isToggler) {
					if (item.collapsed) {
						self.collection.expandGroup(item[idProperty]);
					} else {
						self.collection.collapseGroup(item[idProperty]);
					}

					e.stopImmediatePropagation();
					e.preventDefault();

					return;
				}
			}

			self.trigger('click', e, {
				row: cell.row,
				cell: cell.cell,
				item: item
			});

			if (e.isImmediatePropagationStopped()) return;

			// Set clicked cells to active
			if (canCellBeActive(cell.row, cell.cell)) {
				// If holding down "Shift" key and another cell is already active - use this to
				// select a cell range.
				if (self.options.shiftSelect && e.shiftKey && self.active) {
					// Deselect anything we had selected before
					deselectCells();

					self.selectCells(self.active.row, self.active.cell, cell.row, cell.cell);
				}

				// Support for "Ctrl" / "Command" clicks
				if (self.options.ctrlSelect && (e.ctrlKey || e.metaKey) && self.active) {

					// Is the cell already selected? If so - deselect it
					if (isCellSelected(cell.row, cell.cell)) {
						deselectCells(cell.row, cell.cell);
						return;
					}

					// Select the currently active cell
					if (!self.selection) {
						self.selectCells(self.active.row, self.active.cell, self.active.row, self.active.cell, true);
					}

					// Select the cell the user chose
					self.selectCells(cell.row, cell.cell, cell.row, cell.cell, true);
					return;
				}

				scrollRowIntoView(cell.row, false);
				setActiveCellInternal(getCellNode(cell.row, cell.cell));
			}
		};


		// handleContextMenu()
		// Handles the context menu events on cells
		//
		// @param	e	object		Javascript event object
		//
		handleContextMenu = function (e) {
			var $cell = $(e.target).closest("." + classcell, $canvas);
			if ($cell.length === 0) return;

			// Are we editing this cell?
			if (self.active && self.active.node === $cell[0] && currentEditor !== null) return;

			self.trigger('contextmenu', e);
		};


		// handleDblClick()
		// Handles the double click events on cells
		//
		// @param	e	object		Javascript event object
		//
		handleDblClick = function (e) {
			var cell = getCellFromEvent(e);
			if (!cell || (currentEditor !== null && (self.active && self.active.row == cell.row && self.active.cell == cell.cell))) {
				return;
			}

			self.trigger('dblclick', e, {
				row: cell.row,
				cell: cell.cell
			});

			if (e.isImmediatePropagationStopped()) return;

			if (self.options.editable) {
				gotoCell(cell.row, cell.cell, true);
			}
		};


		// handleHeaderClick()
		// Handles the header click events
		//
		// @param	event		object		Event object
		//
		handleHeaderClick = function (event) {
			var column = getColumnFromEvent(event);
			if (column) {
				self.trigger('headerclick', event, {
					column: column
				});
			}
		};


		// handleHeaderContextMenu()
		// Triggers the header context menu events
		//
		// @param	event		object		Event object
		//
		handleHeaderContextMenu = function (event) {
			var column = getColumnFromEvent(event);
			self.trigger('headercontextmenu', event, {
				column: column
			});
		};


		// handleKeyDown()
		// Handles the key down events on cells. These are our keyboard shortcuts.
		//
		// @param	e	object		Javascript event object
		//
		handleKeyDown = function (e) {
			if (self.active) {
				self.trigger('keydown', e, {
					row: self.active.row,
					cell: self.active.cell
				});
			}

			var handled = e.isImmediatePropagationStopped();

			this._event = e;

			if (!handled) {
				// Ctrl/Command + C
				if (e.which == 67 && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
					copySelected();
				} else if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
					// Esc
					if (e.which == 27) {
						if (self.options.editable && currentEditor) {
							currentEditor.cancel();

							// Return focus back to the canvas
							$canvas.focus();
							handled = true;
						} else if (self.selection) {
							// If something is selected remove the selection range
							deselectCells();
						} else if (self.active) {
							// If something is active - remove the active state
							self.activate();
						}
					// Page Down
					} else if (e.which == 34) {
						scrollPage(1);
						handled = true;
					// Page Up
					} else if (e.which == 33) {
						scrollPage(-1);
						handled = true;
					// Home
					} else if (e.which == 36) {
						self.scrollToRow(0);
						handled = true;
					// End
					} else if (e.which == 35) {
						self.scrollToRow(self.collection.items.length - 1);
						handled = true;
					// Left Arrow
					} else if (e.which == 37) {
						if (self.options.editable && currentEditor) {
							if (commitCurrentEdit()) {
								handled = navigate("left");
							}
						} else {
							handled = navigate("left");
						}
					// Right Arrow
					} else if (e.which == 39) {
						if (self.options.editable && currentEditor) {
							if (commitCurrentEdit()) {
								handled = navigate("right");
							}
						} else {
							handled = navigate("right");
						}
					// Up Arrow
					} else if (e.which == 38) {
						if (self.options.editable && currentEditor) {
							if (commitCurrentEdit()) {
								handled = navigate("up");
							}
						} else {
							handled = navigate("up");
						}
					// Down Arrow
					} else if (e.which == 40) {
						if (self.options.editable && currentEditor) {
							if (commitCurrentEdit()) {
								handled = navigate("down");
							}
						} else {
							handled = navigate("down");
						}
					// Tab
					} else if (e.which == 9) {
						if (self.options.editable && currentEditor) {
							if (commitCurrentEdit()) {
								handled = navigate("next");
							}
						} else {
							handled = navigate("next");
						}
					// Enter
					} else if (e.which == 13) {
						if (self.options.editable && currentEditor) {
							if (commitCurrentEdit()) {
								handled = navigate("down");
							}
						} else {
							handled = navigate("down");
						}
					}
				// Shift Tab
				} else if (e.which == 9 && e.shiftKey && !e.ctrlKey && !e.altKey) {
					if (self.options.editable && currentEditor) {
						if (commitCurrentEdit()) {
							handled = navigate("prev");
						}
					} else {
						handled = navigate("prev");
					}
				}
			}

			this._event = null;

			if (handled) {
				// the event has been handled so don't let parent element
				// (bubbling/propagation) or browser (default) handle it
				e.stopPropagation();
				e.preventDefault();

				try {
					// prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
					e.originalEvent.which = 0;
				}
				// ignore exceptions - setting the original event's keycode
				// throws access denied exception for "Ctrl" (hitting control key only,
				// nothing else), "Shift" (maybe others)
				catch (error) {}
			}
		};


		// handleScroll()
		// Handles the offsets and event that need to fire when a user is scrolling
		//
		// @param	event		object		Javascript event object
		//
		handleScroll = function (event) {
			scrollTop = $viewport[0].scrollTop;
			scrollLeft = $viewport[0].scrollLeft;

			var vScrollDist = Math.abs(scrollTop - prevScrollTop),
				hScrollDist = Math.abs(scrollLeft - prevScrollLeft);

			// Horizontal Scroll
			if (hScrollDist) {
				prevScrollLeft = scrollLeft;
				$headerScroller[0].scrollLeft = scrollLeft;
			}

			// Vertical Scroll
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

			// Any Scroll
			if (hScrollDist || vScrollDist) {
				if (h_render) clearTimeout(h_render);

				if (Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
					Math.abs(lastRenderedScrollLeft - scrollLeft) > 20) {
					if (!self.options.virtualScroll || (
						Math.abs(lastRenderedScrollTop - scrollTop) < viewportH &&
						Math.abs(lastRenderedScrollLeft - scrollLeft) < viewportW)) {
						render();
					} else {
						h_render = setTimeout(function () {
							render();
							h_render = null;
						}, 50);
					}

					self.trigger('viewportchanged', event, {});
				}
			}

			self.trigger('scroll', event, {
				scrollLeft: scrollLeft,
				scrollTop: scrollTop
			});
		};


		// handleWindowResize()
		// Event that fires when the window is resize
		//
		handleWindowResize = function () {
			// Only if the object is visible
			if (!self.$el.is(':visible')) return;
			resizeCanvas();
		};


		// hasGrouping()
		// Given a column's id, check to see if it is currently grouped. If it is, returns the grouping
		// object. Otherwise returns false.
		//
		// @param	column_id	string		ID of the column to check grouping for
		//
		// @return boolean, object
		hasGrouping = function (column_id) {
			if (!column_id) return false;

			// Does this column even exist?
			var column = getColumnById(column_id);
			if (!column) return false;

			// Try to grab the grouping object
			var grouping = _.groupBy(self.collection.groups, function (g) { return g.column_id; });

			// Return the grouping object
			return grouping[column_id] && grouping[column_id].length ? grouping[column_id][0] : false;
		};


		// hasSorting()
		// Returns true if there is a sorting enabled for a given column id.
		//
		// @param	column_id	string		ID of the column to check sorting for
		//
		// @return boolean
		hasSorting = function (column_id) {
			if (!column_id) return false;
			var column_ids = _.pluck(self.sorting, 'columnId');
			return column_ids.indexOf(column_id) >= 0;
		};



		// insertAddRow()
		// Inserts a new row to the end of the collection used for adding new rows to the grid
		//
		//
		insertAddRow = function () {
			var obj = new NonDataItem({
				__addRow: true,
				data: {},
				formatter: function () {
					return "";
				},
				id: '-add-row-',
			});

			self.collection.add(obj);
		};


		// isCellPotentiallyEditable()
		// Determines if a given cell is editable
		//
		// @param	row		integer		ID of the row
		// @param	cell	integer		ID of the cell
		//
		// @return boolean
		isCellPotentiallyEditable = function (row, cell) {
			var dataLength = getDataLength();

			// Is this column editable?
			if (cache.activeColumns[cell].editable === false) return false;

			// Is the data for this row loaded?
			if (row < dataLength && !getDataItem(row)) return false;

			// does this cell have an editor?
			if (!getEditor(row, cell)) return false;

			return true;
		};


		// isCellSelected()
		// Returns true if the given row/cell index combination yields a selected cell
		//
		// @param	row		integer		Index of row of the cell
		// @param	cell	integer		Index of the cell in the row
		//
		// @return boolean
		isCellSelected = function (row, cell) {
			if (!self.selection) return false;
			var s;
			for (var i = 0, l = self.selection.length; i < l; i++) {
				s = self.selection[i];
				if (s.contains(row, cell)) return true;
			}
			return false;
		};


		// isColumnSelected()
		// Returns true if all the cells for a given column are selected
		//
		// @param	column_idx	integer		Index of the column to check
		//
		// @return boolean
		isColumnSelected = function (column_idx) {
			if (!self.selection) return false;

			var selectable_rows = self.collection.length;
			if (self.collection.items[self.collection.items.length - 1].__gridAggregate) selectable_rows--;

			var s;
			for (var i = 0, l = self.selection.length; i < l; i++) {
				s = self.selection[i];
				if (s.fromRow === 0 && s.toRow === selectable_rows && s.fromCell >= column_idx && s.toCell <= column_idx) {
					return true;
				}
			}
			return false;
		};


		// invalidate()
		// Clears the caching for all rows counts and positions
		//
		invalidate = function () {
			updateRowCount();
			invalidateAllRows();
			render();
		};


		// invalidateAllRows()
		// Clears the caching for all rows caches
		//
		invalidateAllRows = function () {
			if (currentEditor) {
				makeActiveCellNormal();
			}
			for (var row in cache.nodes) {
				removeRowFromCache(row);
			}
		};


		// invalidatePostProcessingResults()
		// Clears the caching for all post processing for a row
		//
		// @param	row		integer		Row index
		//
		invalidatePostProcessingResults = function (row) {
			delete cache.postprocess[row];
			postProcessFromRow = Math.min(postProcessFromRow, row);
			postProcessToRow = Math.max(postProcessToRow, row);
			startPostProcessing();
		};


		// invalidateRow()
		// Clears the caching for a specific row
		//
		// @param	row		integer		Row index
		//
		invalidateRow = function (row) {
			invalidateRows([row]);
		};


		// invalidateRows()
		// Clear the cache for a given set of rows
		//
		// @param	rows	array		List of row indices to invalidate
		//
		invalidateRows = function (rows) {
			if (!rows || !rows.length) return;

			vScrollDir = 0;

			for (var i = 0, l = rows.length; i < l; i++) {
				if (currentEditor && self.active && self.active.row === rows[i]) {
					makeActiveCellNormal();
				}

				if (cache.nodes[rows[i]]) {
					removeRowFromCache(rows[i]);
				}
			}
		};


		// isGrouped()
		// Returns true if the grid is currently grouped by a value
		//
		// @return boolean
		this.isGrouped = function () {
			return this.collection.groups.length ? true : false;
		};


		// isSorted()
		// Returns true if the grid is currently sorted by a value
		//
		// @return boolean
		this.isSorted = function () {
			return this.sorting.length ? true : false;
		};


		// bindToCollection()
		// When the given data set is a Backbone Collection - this function will link
		// up common Collection events to the grid.
		//
		bindToCollection = function () {
			self.options.data
				.on('add', function (model) {
					// Ignore NonDataRows
					if (model.get('__nonDataRow')) return;

					// When new items are added to the collection - add them to the grid
					self.add(model);
				})
				.on('change', function (model) {
					// When items are changed - re-render the right row
					self.setItem(model.id, model);
				})
				.on('remove', function (model) {
					// When items are removed - remove the right row
					self.remove(model.id);
				})
				.on('sort', function () {
					// Tell the collection to refresh everything
					self.collection.refresh();

					// When sorting - invalidate and re-render all rows
					invalidate();
				});
		};


		// makeActiveCellEditable()
		// Makes the currently active cell editable
		//
		// @param	editor		function		Editor factory to use
		//
		makeActiveCellEditable = function (editor) {
			if (!self.active || !self.active.node || self.options.editable !== true) return;

			// Cancel pending async call if there is one
			clearTimeout(h_editorLoader);

			var columnDef = cache.activeColumns[self.active.cell];
			var item = getDataItem(self.active.row);

			$(self.active.node).addClass("editable");

			// If no editor is given, clear the cell
			if (!editor) self.active.node.innerHTML = "";

			var CellEditor = editor || getEditor(self.active.row, self.active.cell);

			currentEditor = new CellEditor({
				grid: self,
				cell: self.active.node,
				column: columnDef,
				item: item || {},
				commitChanges: function () {
					// if the commit fails, it would do so due to a validation error
					// if so, do not steal the focus from the editor
					if (self.options.autoEdit) {
						navigate('down');
					}
				}
			});

			serializedEditorValue = currentEditor.serializeValue();
		};


		// makeActiveCellNormal()
		// Handler for cell styling when using an editor
		//
		makeActiveCellNormal = function () {
			if (!currentEditor) return;

			/*self.trigger('onBeforeCellEditorDestroy', {}, {
				editor: currentEditor
			});*/

			currentEditor.destroy();
			currentEditor = null;

			if (self.active && self.active.node) {
				var d = getDataItem(self.active.row);
				$(self.active.node).removeClass("editable invalid");
				if (d) {
					var column = cache.activeColumns[self.active.cell];
					var formatter = getFormatter(self.active.row, column);
					self.active.node.innerHTML = formatter(self.active.row, self.active.cell, getDataItemValueForColumn(d, column), column, d);
					invalidatePostProcessingResults(self.active.row);
				}
			}
		};


		// measureCellPadding()
		// Header columns and cells may have different padding skewing width
		// calculations (box-sizing, hello?) calculate the diff so we can set consistent sizes
		//
		measureCellPadding = function () {
			var h = ["paddingLeft", "paddingRight"],
				v = ["paddingTop", "paddingBottom"];

			var el = $('<div class="' + classheadercolumn + '" style="visibility:hidden">-</div>')
				.appendTo($headers);

			headerColumnWidthDiff = headerColumnHeightDiff = 0;

			if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
				$.each(h, function (n, val) {
					headerColumnWidthDiff += parseFloat(el.css(val)) || 0;
				});
				$.each(v, function (n, val) {
					headerColumnHeightDiff += parseFloat(el.css(val)) || 0;
				});
			}
			el.remove();

			var r = $('<div class="' + classrow + '"></div>').appendTo($canvas);
			el = $('<div class="' + classcell + '" style="visibility:hidden">-</div>').appendTo(r);
			cellWidthDiff = cellHeightDiff = 0;

			if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
				$.each(h, function (n, val) {
					cellWidthDiff += parseFloat(el.css(val)) || 0;
				});
				$.each(v, function (n, val) {
					cellHeightDiff += parseFloat(el.css(val)) || 0;
				});
			}
			r.remove();

			absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
		};


		// naturalSort()
		// Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
		// Author: Jim Palmer (based on chunking idea from Dave Koelle)
		//
		naturalSort = function (a, b) {
			var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
				sre = /(^[ ]*|[ ]*$)/g,
				dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
				hre = /^0x[0-9a-f]+$/i,
				ore = /^0/,
				i = function (s) {
					return ('' + s).toLowerCase() || '' + s;
				},
				// convert all to strings strip whitespace
				x = i(a).replace(sre, '') || '',
				y = i(b).replace(sre, '') || '',
				// chunk/tokenize
				xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
				yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
				// numeric, hex or date detection
				xD = parseInt(x.match(hre), 10) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
				yD = parseInt(y.match(hre), 10) || xD && y.match(dre) && Date.parse(y) || null,
				oFxNcL, oFyNcL;
			// first try and sort Hex codes or Dates
			if (yD)
				if (xD < yD) return -1;
				else if (xD > yD) return 1;
			// natural sorting through split numeric strings and default strings
			for (var cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
				// find floats not starting with '0', string or 0 if not defined (Clint Priest)
				oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
				oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
				// handle numeric vs string comparison - number < string - (Kyle Adams)
				if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
					return (isNaN(oFxNcL)) ? 1 : -1;
				}
				// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
				else if (typeof oFxNcL !== typeof oFyNcL) {
					oFxNcL += '';
					oFyNcL += '';
				}
				if (oFxNcL < oFyNcL) return -1;
				if (oFxNcL > oFyNcL) return 1;
			}
			return 0;
		};


		// navigate()
		// Enables cell navigation via keyboard shortcuts. Returns true if
		// navigation resulted in a change of active cell.
		//
		// @param	dir		string			Navigation direction
		//
		// @return boolean
		navigate = function (dir) {
			if (!self.options.keyboardNavigation) return false;

			if ((!self.active || !self.active.node) && dir != "prev" && dir != "next") {
				return false;
			}

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
			var pos = stepFn(self.active ? self.active.row : null, self.active ? self.active.cell : null, activePosX);
			if (pos) {
				var isAddNewRow = (pos.row == getDataLength());
				scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);
				setActiveCellInternal(getCellNode(pos.row, pos.cell));
				activePosX = pos.posX;
				return true;
			} else {
				setActiveCellInternal(getCellNode(self.active ? self.active.row : null, self.active ? self.active.cell : null));
				return false;
			}
		};


		// Placeholder()
		// An item object used as a placeholder for a remote item.
		//
		Placeholder = function (data) {
			if (data) $.extend(this, data);
		};

		Placeholder.prototype = new NonDataItem();
		Placeholder.prototype.toString = function () { return "Placeholder"; };


		// Range()
		// A structure containing a range of cells.
		//
		// @param fromRow	integer		Starting row
		// @param fromCell	integer		Starting cell
		// @param toRow		integer		(Optional) Ending row. Defaults to 'fromRow'
		// @param toCell	integer		(Optional) Ending cell. Defaults to 'fromCell'
		//
		Range = function (fromRow, fromCell, toRow, toCell) {
			toRow = toRow === undefined ? fromRow : toRow;
			toCell = toCell === undefined ? fromCell : toCell;

			// The index of the rows and cells that define the range
			this.fromRow = Math.min(fromRow, toRow);
			this.fromCell = Math.min(fromCell, toCell);
			this.toRow = Math.max(fromRow, toRow);
			this.toCell = Math.max(fromCell, toCell);

			// Cell exclusions
			this.exclusions = [];
		};


		// contains()
		// Returns whether a range contains a given cell
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return boolean
		Range.prototype.contains = function (row, cell) {
			return row >= this.fromRow &&
				row <= this.toRow &&
				cell >= this.fromCell &&
				cell <= this.toCell &&
				!this.isExcludedCell(row, cell);
		};


		// deselect()
		// Deselects the range, or a specific cell in the range. Returns the Range object.
		//
		// @param	row		integer		(Optional) Row index for cell to deselect
		// @param	cell	integer		(Optional) Cell index to deselect in the given row
		//
		// @return object
		Range.prototype.deselect = function (row, cell) {
			var specific = row !== undefined && row !== null && cell !== undefined && cell !== null;

			// Make sure cell is part of range
			if (specific && !this.contains(row, cell)) {
				throw new Error('Unable to deselect cell (' + row + ', ' + cell + ') because it is not part of this Range.');
			}

			// If deselecting a specific cell -- add it to the exclusion list
			if (specific) this.exclusions.push([row, cell]);

			// Get rows we want to deselect items
			var selectedRows = [];
			if (row === undefined || row === null) {
				for (var j = this.fromRow; j <= this.toRow; j++) {
					if (selectedRows.indexOf(j) < 0) selectedRows.push(j);
				}
			} else {
				selectedRows.push(row);
			}

			// Build key/value object for classes we want to clear
			var clear = {}, styles = {};

			// If we have a specific cell to deselect, just do that one
			if (cell !== undefined && cell !== undefined) {
				clear[cache.activeColumns[cell].id] = self.options.selectedClass;
			} else {
				for (var ic = 0, lc = cache.activeColumns.length; ic < lc; ic++) {
					clear[cache.activeColumns[ic].id] = self.options.selectedClass;
				}
			}

			// Do the same for every row that we're clearing
			for (var iw = 0, lw = selectedRows.length; iw < lw; iw++) {
				styles[selectedRows[iw]] = clear;
			}

			// Update cell node styling
			updateCellCssStylesOnRenderedRows(null, styles);

			return this;
		};


		// excludeUnselectable()
		// Validates that all cells in the range are selectable, if not - adds them to the exclusions
		//
		Range.prototype.excludeUnselectable = function () {
			for (var row = this.fromRow; row <= this.toRow; row++) {
				for (var cell = this.fromCell; cell <= this.toCell; cell++) {
					if (!canCellBeSelected(row, cell)) {
						this.exclusions.push([row, cell]);
					}
				}
			}
		};


		// fullyExcluded()
		// Returns whether the range is fully excluded
		//
		// @return boolean
		Range.prototype.fullyExcluded = function () {
			for (var row = this.fromRow; row <= this.toRow; row++) {
				for (var cell = this.fromCell; cell <= this.toCell; cell++) {
					if (!this.isExcludedCell(row, cell)) return false;
				}
			}
			return true;
		};


		// isExcludedCell()
		// Returns whether a cell is excluded in this range
		//
		// @param	row		integer		Row index for cell to check
		// @param	cell	integer		Cell index to check in the given row
		//
		Range.prototype.isExcludedCell = function (row, cell) {
			if (this.exclusions.length === 0) return false;
			for (var i = 0, l = this.exclusions.length; i < l; i++) {
				if (this.exclusions[i][0] === row && this.exclusions[i][1] === cell) return true;
			}
		};


		// isSingleCell()
		// Returns whether a range represents a single cell
		//
		// @return boolean
		Range.prototype.isSingleCell = function () {
			return this.fromRow == this.toRow && this.fromCell == this.toCell;
		};


		// isSingleRow()
		// Returns whether a range represents a single row.
		//
		// @return boolean
		Range.prototype.isSingleRow = function () {
			return this.fromRow == this.toRow;
		};


		// toCSV()
		// Converts the cell range values to CSV
		//
		// @return string
		Range.prototype.toCSV = function () {
			var json = this.toJSON(),
				csv = [];
			for (var i = 0, l = json.length; i < l; i++) {
				csv.push('"' + json[i].join('","') + '"');
			}
			return csv.join('\n');
		};


		// toJSON()
		// Converts the cell range values to JSON
		//
		// @return string
		Range.prototype.toJSON = function () {
			var json = [], column, row, data;
			for (var i = this.fromRow; i <= this.toRow; i++) {
				row = cache.rows[i];

				// Skip NonData rows
				if (row instanceof NonDataItem) continue;

				data = [];
				for (var c = this.fromCell; c <= this.toCell; c++) {
					// Replace excluded items with blanks
					if (this.isExcludedCell(row, c)) {
						data.push(null);
					} else {
						column = cache.activeColumns[c];
						data.push(getValueFromItem(row, column));
					}
				}
				json.push(data);
			}
			return json;
		};


		// toString()
		// Returns a readable representation of a range
		//
		// @return string
		Range.prototype.toString = function () {
			if (this.isSingleCell()) {
				return "Range (" + this.fromRow + ":" + this.fromCell + ")";
			} else {
				return "Range (" + this.fromRow + ":" + this.fromCell + " - " + this.toRow + ":" + this.toCell + ")";
			}
		};


		// remoteAllLoaded()
		// Returns true if all remote data is loaded
		//
		remoteAllLoaded = function () {
			// Do we have any placeholders?
			for (var i = 0, l = cache.rows.length; i < l; i++) {
				if (cache.rows[i] instanceof Placeholder) {
					return false;
				}
			}
			return true;
		};


		// remoteCount()
		// Executes a remote data count fetch, savs it as the collection length
		// then calls the callback.
		//
		// @param	callback	function	Callback function
		//
		remoteCount = function (callback) {
			var options = {};

			// TODO: Add an options.filters variable in here
			remote.count(options, function (result) {
				// Set collection length
				self.collection.length = result;

				// Fill the collection with placeholders
				generatePlaceholders();

				// Updating the row count here will ensure the scrollbar is rendered the right size
				updateRowCount();

				// Now that we have placeholders and the right row count - update the viewport with blanks
				self.collection.refresh();

				// Now go and fetch the real items
				callback();
			});
		};


		// remoteFetch()
		// Executes a remote data fetch and re-renders the grid with the new data.
		//
		remoteFetch = function () {
			var vp = getVisibleRange(),
				from = vp.top,
				to = vp.bottom;

			// If scrolling fast, abort pending requests
			if (remoteRequest && typeof remoteRequest.abort === 'function') {
				remoteRequest.abort();
			}

			// Also cancel previous execution entirely (if scrolling really really fast)
			if (remoteTimer !== null) clearTimeout(remoteTimer);

			// Don't attempt to fetch more results than there are
			if (from < 0) from = 0;
			if (self.collection.length > 0) to = Math.min(to, self.collection.length - 1);

			// Strip out the range that is already loaded
			var newFrom, newTo;
			for (var i = from; i <= to; i++) {
				if (!cache.rows[i] || cache.rows[i] instanceof Placeholder) {
					if (newFrom === undefined) newFrom = i;
					newTo = i;
				}
			}

			// If everything is already loaded - simply process the rows via remoteLoaded()
			if (newFrom === undefined) {
				remoteLoaded();
				return;
			}

			// Put the request on a timer so that when users scroll quickly they don't fire off
			// hundreds of requests for no good reason.
			remoteTimer = setTimeout(function () {
				try {
					// Fire onLoading callback
					if (typeof remote.onLoading === 'function') remote.onLoading();

					// Builds the options we need to give the fetcher
					var options = {
						columns: cache.activeColumns,
						//filters: null, TODO: Enable remote filtering here
						limit: newTo - newFrom + 1,
						offset: newFrom,
						order: self.sorting
					};

					remoteRequest = remote.fetch(options, function (results) {
						// Add items to collection
						self.collection.add(results, {at: newFrom, merge: true});

						// Empty the request variable so it doesn't get aborted on scroll
						remoteRequest = null;

						// Fire loaded function to process the changes
						remoteLoaded(newFrom, newTo);

						// Fire onLoaded callback
						if (typeof remote.onLoaded === 'function') remote.onLoaded();
					});
				} catch (err) {
					throw new Error('Doby Grid remote fetching failed due to: ' + err);
				}
			}, self.options.remoteScrollTime);
		};


		// remoteFetchGroups()
		// Executes a remote data fetch for group objects
		//
		// @param	callback	function	Callback function
		//
		remoteFetchGroups = function (callback) {
			// If grouping fast, abort pending requests
			if (remoteRequest && typeof remoteRequest.abort === 'function') {
				remoteRequest.abort();
			}

			// If we have a cache -- load that
			if (cache.remoteGroups) {
				callback(cache.remoteGroups);
			} else {
				var options = {
					groups: self.collection.groups
				};

				// Fire onLoading callback
				if (typeof remote.onLoading === 'function') remote.onLoading();

				// Begin remote fetch request
				remoteRequest = remote.fetchGroups(options, function (results) {
					// Empty the request variable so it doesn't get aborted on scroll
					remoteRequest = null;

					// Cache the results for this column
					cache.remoteGroups = results;

					// Return results via callback
					callback(results);

					// Fire onLoaded callback
					if (typeof remote.onLoaded === 'function') remote.onLoaded();
				});
			}
		};


		// remoteLoaded()
		// After remote data is fetched, this function is called to refresh the grid accordingly.
		//
		// @param	from	integer		Row index from which to start fetching
		// @param	to		integer		Row index until when to fetch
		//
		remoteLoaded = function (from, to) {
			// Invalidate edited rows
			for (var i = from; i <= to; i++) {
				invalidateRow(i);
			}

//			// TODO: Display alert if empty
//			if (self.options.alertOnEmpty && self.dataView.getLength() === 0) {
//				// Need to clear cache to reset dataview lengths
//				self.loader.clearCache()
//
//				// Insert row
//				insertEmptyAlert()
//
//				// Manually tell collection it's 1 units long
//				self.dataView.setLength(1)
//			}

			updateRowCount();
			render();
		};



		// remove()
		// Removes a row of data from the grid
		//
		// @param	id			integer		Lookup data object via id instead
		//
		// @return object
		this.remove = function (id) {
			// TODO: Convert this to use a similar to input to Backbone.Collection.remove()
			this.collection.remove(id);
			return this;
		};


		// removeColumn()
		// Removes a column from the grid
		//
		// @param	column		integer		'id' key of the column definition
		//
		// @return object
		this.removeColumn = function (column) {
			if (!column) return this;
			if (typeof column == 'object') column = column.id;

			var colDef;
			var newcolumns = this.options.columns.filter(function (c) {
				if (c.id == column) {
					colDef = c;
					if (c.removable !== true) {
						throw new Error('Cannot remove column "' + c.id + '" because it is not removable.');
					}
				}
				return c.id != column;
			});

			if (!colDef) throw new Error('Cannot remove column "' + column + '" because no such column exists.');

			// If column had a grouping - remove that grouping
			if (hasGrouping(column)) {
				this.removeGrouping(column);
			}

			// If column has a Quick Filter element - remove it
			var qf;
			if (colDef && colDef.quickFilterInput) {
				colDef.quickFilterInput.parent().remove();
				qf = true;
			}

			self.setColumns(newcolumns);

			// If Quick Filter was on, we need to resize column headers here to get rid of some artifacts
			if (qf) applyColumnHeaderWidths();

			return this;
		};


		// removeCssRules()
		// Removes the CSS rules specific to this grid instance
		//
		removeCssRules = function () {
			if ($style) $style.remove();
			stylesheet = null;
		};


		// removeGrouping()
		// Remove column grouping for a given 'id' of a column.
		//
		// @param	column		string		Id of the column to remove group for
		//
		// @return object
		this.removeGrouping = function (column) {
			if (!column) return;
			if (typeof column == 'object') column = column.id;

			var columnGrouping = hasGrouping(column);
			if (columnGrouping) {
				// Remove that grouping from the groups
				this.collection.groups.splice(this.collection.groups.indexOf(columnGrouping), 1);

				// Update grouping
				this.setGrouping(this.collection.groups);
			}
			return this;
		};


		// removeInvalidRanges()
		// Given a list of cell ranges, removes the ranges that are not allowed due to cells
		// not being selectable
		//
		// @param	ranges		array		List of Range objects
		//
		// @return array
		removeInvalidRanges = function (ranges) {
			var result = [];
			for (var i = 0, l = ranges.length; i < l; i++) {
				var r = ranges[i];
				if (canCellBeSelected(r.fromRow, r.fromCell) && canCellBeSelected(r.toRow, r.toCell)) {
					result.push(r);
				}
			}

			return result;
		};


		// removeRowFromCache()
		// Given a row index, removes that row from the cache
		//
		// @param	row		integer		Row index to remvoe
		//
		removeRowFromCache = function (row) {
			var cacheEntry = cache.nodes[row], col;
			if (!cacheEntry) return;

			$canvas[0].removeChild(cacheEntry.rowNode);
			delete cache.nodes[row];

			// Clear postprocessing cache (only for non-cached columns)
			if (cache.postprocess[row]) {
				for (var i in cache.postprocess[row]) {
					col = cache.activeColumns[i];
					if (!col.cache) {
						delete cache.postprocess[row][i];
					}
				}
			}
		};


		// render()
		// Renders the viewport of the grid
		//
		render = function () {
			if (!initialized) return;

			var visible = getVisibleRange(),
				rendered = getRenderedRange();

			// Remove rows no longer in the viewport
			cleanupRows(rendered);

			// Add new rows & missing cells in existing rows
			// Handles horizontal scrolling and cell reveal
			if (lastRenderedScrollLeft != scrollLeft) {
				cleanUpAndRenderCells(rendered);
			}

			// If there is no vertical scroll and we're auto-sized. Remove the right column.
			if (self.$el) {
				if (!viewportHasVScroll && self.options.autoColumnWidth) {
					self.$el.addClass(classnoright);
				} else {
					self.$el.removeClass(classnoright);
				}
			}

			// Render missing rows
			renderRows(rendered);

			// Post process rows
			postProcessFromRow = visible.top;
			postProcessToRow = Math.min(getDataLength() - 1, visible.bottom);
			startPostProcessing();

			// Save scroll positions
			lastRenderedScrollTop = scrollTop;
			lastRenderedScrollLeft = scrollLeft;
		};


		// renderCell()
		// Generates the HTML content for a given cell and adds it to the output cache
		//
		// @param	result		array		Output array to which to append
		// @param	row			integer		Current row index
		// @param	cell		integer		Current cell index
		// @param	colspan		integer		Colspan of this cell
		// @param	item		object		Data object for this cell
		//
		renderCell = function (result, row, cell, colspan, item) {
			var m = cache.activeColumns[cell],
				mColumns = item && item.columns || {},
				rowI = Math.min(cache.activeColumns.length - 1, cell + colspan - 1),

				// Group rows do not inherit column class
				mClass = item instanceof Group ? "" : (m.class ? typeof m.class === "function" ? m.class() : m.class : null),

				cellCss = [classcell, "l" + cell, "r" + rowI];

			if (mClass) cellCss.push(mClass);
			if (self.active && row === self.active.row && cell === self.active.cell) cellCss.push("active");
			if (mColumns[cell] && mColumns[cell].class) cellCss.push(mColumns[cell].class);
			if (isCellSelected(row, cell)) cellCss.push(self.options.selectedClass);

			result.push('<div class="' + cellCss.join(" ") + '">');

			// If this is a cached, postprocessed row -- use the cache
			if (m.cache && m.postprocess && cache.postprocess[row] && cache.postprocess[row][cell]) {
				result.push(cache.postprocess[row][cell]);
			} else if (item) {
				// if there is a corresponding row (if not, this is the Add New row or
				// this data hasn't been loaded yet)

				var value = getDataItemValueForColumn(item, m);
				try {
					result.push(getFormatter(row, m)(row, cell, value, m, item));
				} catch (e) {
					result.push('');
					if (console.error) console.error("Cell failed to render due to failed column formatter. Error: " + e.message, e);
				}
			}

			result.push("</div>");

			cache.nodes[row].cellRenderQueue.push(cell);
			cache.nodes[row].cellColSpans[cell] = colspan;
		};


		// renderColumnHeaders()
		// Creates the column header elements.
		//
		renderColumnHeaders = function () {
			if (!$headers.is(':empty')) {
				$headers.empty();
				$headers.width(getHeadersWidth());
			}

			// Render columns
			var column, html = [], classes, w;
			for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
				column = cache.activeColumns[i];

				// Determine classes
				classes = [classheadercolumn, (column.headerClass || "")];
				if (column.sortable) classes.push(classheadersortable);

				// Determine width
				w = column.width - headerColumnWidthDiff;

				html.push('<div class="' + classes.join(' ') + '" style="width:' + w + 'px" ');
				html.push('id="' + (uid + column.id) + '"');

				// Tooltips
				if (column.tooltip !== undefined && column.tooltip !== null && self.options.tooltipType == 'title') {
					html.push(' title="' + column.tooltip + '"');
				}

				html.push('>');
				html.push('<span class="' + classcolumnname + '">' + column.name + '</span>');

				if (column.sortable) {
					html.push('<span class="' + classsortindicator + '"></span>');
				}

				html.push('</div>');
			}
			$headers.append(html.join(''));

			// Style the column headers accordingly
			styleSortColumns();

			if (self.options.resizableColumns) setupColumnResize();
			if (self.options.reorderable) setupColumnReorder();
		};


		// renderMenu()
		// Function for recursively rendering menu components for a Dropdown menu
		//
		// @param	menu		object		A menu data object to render
		// @param	$parent		object		DOM object into which to insert the rendered HTML
		//
		renderMenu = function (menu, $parent) {
			var $menu = $(['<div class="', classdropdownmenu, '"></div>'].join(''));
			_.each(menu, function (item) {
				if (item.enabled !== undefined && !item.enabled) return;
				if (item.divider) {
					$menu.append(['<div class="', classdropdowndivider, '"></div>'].join(''));
				} else {
					var label = (item.name || ""),
						cls = "";
					if (item.value !== undefined) {
						if (item.value) cls = " on";
						label += ['<span class="', classdropdownicon, '"></span>'].join('');
					}

					var html = ['<div class="', classdropdownitem, ' ', cls, '">', label, '</div>'].join(''),
						$el = $(html).appendTo($menu);

					// Submenus
					if (item.menu) {
						$el.append(['<span class="', classdropdownarrow, '"></span>'].join(''));
						renderMenu(item.menu, $el);
					}

					// Click function
					$el.click(function (event) {
						if (typeof item.fn === 'function') {
							item.fn.bind(this)(event);
						} else if (item.menu) {
							// If item has a menu - clicking should not close the dropdown
							event.stopPropagation();
						}
					});
				}
			});
			$menu.appendTo($parent);
		};


		// renderRow()
		// Generates the HTML content for a given cell and adds it to the output cache
		//
		// @param	stringArray		array		Output array to which to append
		// @param	row				integer		Current row index
		// @param	range			object		Viewport range to display
		//
		renderRow = function (stringArray, row, range) {
			var d = getDataItem(row),
				rowCss = classrow +
					(self.active && row === self.active.row ? " active" : "") +
					(row % 2 === 1 ? " odd" : ""),
				top, pos = {};

			if (variableRowHeight) {
				pos = cache.rowPositions[row];
				top = (pos.top - offset);
			} else {
				top = self.options.rowHeight * row - offset + (row * 1);
			}

			if (d && d.class) rowCss += " " + (typeof d.class === 'function' ? d.class() : d.class);

			stringArray.push("<div class='" + rowCss + "' style='top:" + top + "px");

			// In variable row height mode we need some fancy ways to determine height
			if (variableRowHeight && pos.height) {
				var rowheight = pos.height - cellHeightDiff;
				stringArray.push(';height:' + rowheight + 'px;line-height:' + (rowheight + self.options.lineHeightOffset) + 'px');
			}

			stringArray.push("'>");

			var colspan, m, i, l;
			for (i = 0, l = cache.activeColumns.length; i < l; i++) {
				m = cache.activeColumns[i];

				colspan = 1;

				// Render custom columns
				if (d && d.columns) {
					var columnData = d.columns[m.id] || d.columns[i];
					colspan = (columnData && columnData.colspan) || 1;
					if (colspan === "*") {
						colspan = l - i;
					}
				}

				// Do not render cells outside of the viewport.
				if (cache.columnPosRight[Math.min(l - 1, i + colspan - 1)] > range.leftPx) {
					if (cache.columnPosLeft[i] > range.rightPx) {
						// All columns to the right are outside the range.
						break;
					}

					renderCell(stringArray, row, i, colspan, d);
				}

				if (colspan > 1) {
					i += (colspan - 1);
				}
			}

			// Add row resizing handle
			if (self.options.resizableRows && d.resizable !== false) {
				stringArray.push('<div class="');
				stringArray.push(classrowhandle);
				stringArray.push('"></div>');
			}

			stringArray.push("</div>");
		};


		// renderRows()
		// Renders the rows of the grid
		//
		// @param	range		object		Range of rows to render
		//
		renderRows = function (range) {
			var stringArray = [],
				rows = [],
				needToReselectCell = false,
				i, ii;

			for (i = range.top, ii = range.bottom; i <= ii; i++) {
				// Don't re-render cached nodes
				if (cache.nodes[i]) continue;

				rows.push(i);

				// Create an entry right away so that renderRow() can
				// start populatating it.
				cache.nodes[i] = {
					rowNode: null,

					// ColSpans of rendered cells (by column idx).
					// Can also be used for checking whether a cell has been rendered.
					cellColSpans: [],

					// Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
					cellNodesByColumnIdx: [],

					// Column indices of cell nodes that have been rendered, but not yet indexed in
					// cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
					// end of the row.
					cellRenderQueue: []
				};

				renderRow(stringArray, i, range);
				if (self.active && self.active.node && self.active.row === i) {
					needToReselectCell = true;
				}
				counter_rows_rendered++;
			}

			if (!rows.length) return;

			var x = document.createElement("div");
			x.innerHTML = stringArray.join("");

			// Cache the row nodes
			for (i = 0, ii = rows.length; i < ii; i++) {
				cache.nodes[rows[i]].rowNode = $canvas[0].appendChild(x.firstChild);
			}

			if (needToReselectCell) {
				self.active.node = getCellNode(self.active.row, self.active.cell);
			}
		};


		// reset()
		// Entry point for collection.reset(). See collection.reset for more info.
		//
		this.reset = function (models) {
			this.collection.reset(models, true);
			return this;
		};


		// resetActiveCell()
		// Reset the current active cell
		//
		resetActiveCell = function () {
			setActiveCellInternal(null, false);
		};


		// resize()
		// Force the resize and re-draw of the grid (for when coming out of an invisible element)
		//
		// @return object
		this.resize = function () {
			// Resize the grid
			resizeCanvas();
			invalidate();
			return this;
		};


		// resizeCanvas()
		// Resizes the canvas based on the current viewport dimensions
		//
		resizeCanvas = function () {
			if (!initialized) return;

			viewportH = getViewportHeight();

			// Save the currently visible number of rows
			calculateVisibleRows();

			viewportW = parseFloat($.css(self.$el[0], "width", true));
			$viewport.height(viewportH);

			updateRowCount();

			if (self.options.autoColumnWidth) autosizeColumns();

			// TODO: This was in SlickGrid, but it's probably there to catch active cells being
			// out of bounds after a resize. There's got to be a better way to catch that
			// instead of calling handleScroll() which is pretty slow
			//handleScroll();

			// Since the width has changed, force the render() to reevaluate virtually rendered cells.
			lastRenderedScrollLeft = -1;
			render();
		};


		// scrollCellIntoView()
		// Scroll the viewport until the given cell position is visible
		//
		// @param	row			integer		Row index
		// @param	cell		integer		Cell index
		// @param	doPaging	boolean		If true, will ensure the cell appears at the top of the page
		//
		scrollCellIntoView = function (row, cell, doPaging) {
			scrollRowIntoView(row, doPaging);

			var colspan = getColspan(row, cell);
			var left = cache.columnPosLeft[cell],
				right = cache.columnPosRight[cell + (colspan > 1 ? colspan - 1 : 0)],
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
		};


		// scrollPage()
		// Scrolls the length of a page
		//
		// @param	dir		integer		Direction of scroll
		//
		scrollPage = function (dir) {
			var deltaRows = dir * numVisibleRows,
				targetRow = getRowFromPosition(scrollTop) + deltaRows,
				targetY;

			targetRow = targetRow < 0 ? 0 : targetRow;

			if (variableRowHeight) {
				if (!cache.rowPositions[targetRow]) return;
				targetY = cache.rowPositions[targetRow].top;
			} else {
				// The extra +1 here is to compensate for the 1 pixel spacing between rows
				targetY = targetRow * (self.options.rowHeight + 1);
			}

			scrollTo(targetY);
			render();

			if (self.options.activeFollowsPage && self.active && self.active.row !== null) {
				var row = self.active.row + deltaRows,
					dataLength = getDataLength();
				if (row >= dataLength) {
					row = dataLength - 1;
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
		};


		// scrollRowIntoView()
		// Scroll viewport until the given row is in view
		//
		// @param	row			integer		Index of row
		// @param	doPaging	boolean		If true, will ensure row is at top of page,
		//									otherwise use direction of scroll to determine where
		//
		scrollRowIntoView = function (row, doPaging) {

			// Determine where the row's page is
			var rowAtTop, rowAtBottom, pos;
			if (variableRowHeight) {
				pos = cache.rowPositions[row];
				rowAtTop = pos.top;
				rowAtBottom = pos.bottom - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0);
			} else {
				rowAtTop = row * self.options.rowHeight;
				rowAtBottom = ((row + 1) * self.options.rowHeight) - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0);
			}

			// Determine which direction we need to scroll
			var pgdwn, pgup;
			if (!variableRowHeight) {
				pgdwn = (row + 1) * self.options.rowHeight > scrollTop + viewportH + offset;
				pgup = row * self.options.rowHeight < scrollTop + offset;
			} else {
				pgdwn = pos.bottom > scrollTop + viewportH + offset;
				pgup = pos.top < scrollTop + offset;
			}

			// Need to page down?
			if (pgdwn) {
				scrollTo(doPaging ? rowAtTop : rowAtBottom);
				render();
			}
			// or page up?
			else if (pgup) {
				scrollTo(doPaging ? rowAtBottom : rowAtTop);
				render();
			}
		};


		// scrollTo()
		// Scrolls the viewport to the given position
		//
		// @param	y	integer		Position to scroll to
		//
		scrollTo = function (y) {
			y = Math.max(y, 0);
			y = Math.min(y, th - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0));

			var oldOffset = offset;

			page = Math.min(n - 1, Math.floor(y / ph));
			offset = Math.round(page * cj);

			var newScrollTop = y - offset;

			// If we're in variable height mode, reset the number of visible rows here because when
			// rows are varied this number will change on every scroll
			if (variableRowHeight) calculateVisibleRows();

			if (offset != oldOffset) {
				var range = getVisibleRange(newScrollTop);
				cleanupRows(range);
			}

			if (prevScrollTop != newScrollTop) {
				vScrollDir = (prevScrollTop + oldOffset < newScrollTop + offset) ? 1 : -1;
				$viewport[0].scrollTop = (lastRenderedScrollTop = scrollTop = prevScrollTop = newScrollTop);

				self.trigger('viewportchanged', {});
			}
		};


		// scrollToRow()
		// Scroll the viewport so the given row is at the top.
		//
		// @param	row		integer		Row index
		//
		this.scrollToRow = function (row) {
			if (!variableRowHeight) {
				// The extra +1 here is to compensate for the spacing between rows
				scrollTo(row * (this.options.rowHeight + 1));
			} else {
				var pos = cache.rowPositions[row];
				scrollTo(pos.top);
			}
			render();
			return this;
		};


		// selectCells()
		// Select a range of cells
		//
		// @param	startRow	integer		Row on which to start selection
		// @param	startCell	integer		Cell on which to start selection
		// @param	endRow		integer		Row on which to end selection
		// @param	endCell		integer		Cell on which to end selection
		// @param	add			boolean		If true, will add selection as a new range
		//
		// @return array
		this.selectCells = function (startRow, startCell, endRow, endCell, add) {
			if (!this.options.selectable) return;

			// Validate params
			if (startRow === undefined && startCell === undefined && endRow === undefined && endCell === undefined) {
				// If no params given - deselect
				deselectCells();

				return;
			} else {
				var args = ['startRow', 'startCell', 'endRow', 'endCell'];
				_.each([startRow, startCell, endRow, endCell], function (param, i) {
					if (param === undefined) {
						throw new Error('Unable to select cell range because "' + args[i] + '" param is missing.');
					}
				});
			}

			// Define a range
			var range = new Range(startRow, startCell, endRow, endCell),
				ranges, i, l, j, k;

			// Remove unselectable rows from the range
			range.excludeUnselectable();

			// If range is fully excluded already -- don't bother continuing.
			if (range.fullyExcluded()) return;

			// Is this is a single cell range that falls within an existing selection range?
			if (range.isSingleCell() && this.selection) {
				for (i = 0, l = this.selection.length; i < l; i++) {
					// Part of a selected range -- we're done. Leave.
					if (this.selection[i].contains(startRow, startCell)) return;

					// Part of an excluded item -- remove from exclusion.
					if (this.selection[i].isExcludedCell(startRow, startCell)) {
						// Remove from exclusion
						var excl_index = this.selection[i].exclusions.indexOf([startRow, startCell]);
						this.selection[i].exclusions.splice(excl_index, 1);

						// Select cell
						var styls = {};
						styls[startRow] = {};
						styls[startRow][cache.activeColumns[startCell].id] = this.options.selectedClass;
						updateCellCssStylesOnRenderedRows(styls);
						return;
					}
				}
			}

			if (add) {
				if (!this.selection) this.selection = [];
				ranges = this.selection;
				ranges.push(range);
			} else {
				ranges = [range];
			}

			// Set new selection
			this.selection = ranges;

			// Select the new range
			var cellStyles = {};
			for (i = 0, l = this.selection.length; i < l; i++) {
				for (j = this.selection[i].fromRow; j <= this.selection[i].toRow; j++) {
					// Prevent duplicates
					if (!cellStyles[j]) cellStyles[j] = {};

					// Creates cellStyles object
					for (k = self.selection[i].fromCell; k <= this.selection[i].toCell; k++) {
						// Skip exclusions and non-selectable cells
						if (canCellBeSelected(j, k) && !this.selection[i].isExcludedCell(j, k)) {
							cellStyles[j][cache.activeColumns[k].id] = this.options.selectedClass;
						}
					}
				}
			}

			// Select cells
			updateCellCssStylesOnRenderedRows(cellStyles);

			this.trigger('selection', this._event);
		};


		// setActiveCellInternal()
		// Internal method for setting the active cell that bypasses any option restrictions
		//
		// @param	newCell			DOM			Cell node to set as the active cell
		// @param	setEdit			boolean		If true, will force cell to editable immediately
		//
		setActiveCellInternal = function (newCell, setEdit) {
			if (self.active && self.active.node !== null) {
				makeActiveCellNormal();
				$(self.active.node).removeClass("active");
				if (cache.nodes[self.active.row]) {
					$(cache.nodes[self.active.row].rowNode).removeClass("active");
				}
			}

			// Create new active object
			if (!self.active) {
				self.active = {
					cell: null,
					node: null,
					row: null
				};
			}

			var activeCellChanged = self.active.node !== newCell;

			if (newCell !== null) {
				self.active.node = newCell;
				self.active.row = getRowFromNode(self.active.node.parentNode);
				self.active.cell = activePosX = getCellFromNode(self.active.node);

				// If 'setEdit' is not defined, determine if cell is in autoEdit
				if (setEdit === null || setEdit === undefined) {
					setEdit = (self.active.row == getDataLength()) || self.options.autoEdit;
				}

				$(self.active.node).addClass("active");
				$(cache.nodes[self.active.row].rowNode).addClass("active");

				// Make active cell editable
				if (self.options.editable && setEdit && isCellPotentiallyEditable(self.active.row, self.active.cell)) {
					clearTimeout(h_editorLoader);

					if (self.options.asyncEditorLoading) {
						h_editorLoader = setTimeout(function () {
							makeActiveCellEditable();
						}, self.options.asyncEditorLoadDelay);
					} else {
						makeActiveCellEditable();
					}
				}
			} else {
				self.active.row = self.active.cell = null;
			}

			if (activeCellChanged) {
				self.trigger('activecellchange', {}, getActiveCell());
			}
		};


		// setColumns()
		// Given a new column definitions object -- updates the grid to use it
		//
		// @param	columns		object		Column definitions object
		//
		this.setColumns = function (columns) {

			this.options.columns = columns;

			var c;
			for (var i = 0, l = this.options.columns.length; i < l; i++) {
				c = self.options.columns[i] = $.extend(JSON.parse(JSON.stringify(columnDefaults)), self.options.columns[i]);

				if (c.minWidth && c.width < c.minWidth) c.width = c.minWidth;
				if (c.maxWidth && c.width > c.maxWidth) c.width = c.maxWidth;
			}

			validateColumns();

			updateColumnCaches();

			this.trigger('columnchange', {}, {
				columns: columns
			});

			if (initialized) {
				invalidateAllRows();
				renderColumnHeaders();
				removeCssRules();
				createCssRules();
				resizeCanvas();
				applyColumnWidths();
				handleScroll();
			}
		};


		// setGrouping()
		// Sets the grouping for the grid data view.
		//
		// @param	options		array		List of grouping objects
		//
		// @return object
		this.setGrouping = function (options) {
			this.collection.setGrouping(options);
			return this;
		};


		// setItem()
		// Entry point for collection.setItem(). See collection.setItem for more info.
		//
		this.setItem = function (item_id, attributes) {
			this.collection.setItem(item_id, attributes);
			return this;
		};


		// setOptions()
		// Given a set of options, updates the grid accordingly
		//
		// @param	options		object		New options object data
		//
		this.setOptions = function (options) {
			makeActiveCellNormal();

			// If setting new data
			if (options.data) {
				this.reset(options.data);
			}

			// If toggling "addRow"
			if (options.addRow !== undefined && self.options.addRow !== options.addRow) {
				// Insert if enabling
				if (options.addRow) {
					insertAddRow();
				// Remove if disabling
				} else {
					this.remove('-add-row-');
				}
			}

			self.options = $.extend(self.options, options);
			validateOptions();

			// If setting new columns - it will auto-re-render
			if (options.columns) {
				this.setColumns(options.columns);
			} else {
				render();
			}

			// If toggling auto column width - resize
			if ('autoColumnWidth' in options) {
				// Also make sure that the right resize handles are drawn
				setupColumnResize();

				autosizeColumns();
			}
		};


		// setRowHeight()
		// Sets the height of a given row
		//
		// @param	row		integer		Row index
		// @param	height	integer		Height to set
		//
		setRowHeight = function (row, height) {
			var item = cache.rows[row];

			// Change item height in the data
			item.height = height;

			// Make sure rows below get re-evaluated
			invalidateRows(_.range(row, cache.rows.length));

			if (item instanceof Group) {
				// For groups we need to update the grouping options since the group rows
				// will get regenerated, losing their custom height params during re-draws
				item.predef.grouprows[item.id] = {height: height};

				invalidateRows(_.range(row, cache.rows.length));

				// Re-cache and re-draw
				cacheRows(row);
				render();
			} else {
				// Update the item which will cause the grid to re-render the right bits
				// TODO: This is hacky. There should be a collection.set() method to
				// extend existing data instead of replacing the whole object
				self.collection.setItem(item[idProperty], item);
			}

			// This will recalculate scroll heights to ensure scrolling is properly handled.
			updateRowCount();
		};


		// setSorting()
		// Sets the sorting for the grid data view
		//
		// @param	options		array		List of column options to use for sorting
		//
		// @return object
		this.setSorting = function (options) {
			if (!$.isArray(options)) {
				throw new Error('Doby Grid cannot set the sorting because the "options" parameter must be an array of objects.');
			}

			if (!this.options.multiColumnSort && options.length > 1) {
				throw new Error('Doby Grid cannot set the sorting given because "multiColumnSort" is disabled and the given sorting options contain multiple columns.');
			}

			// Make sure all selected columns are sortable
			// NOTE: This can be optimized
			var colDef = null;
			_.each(options, function (opt) {
				_.each(cache.activeColumns, function (col) {
					if (opt.columnId === col.id) {
						colDef = col;
						if (col.sortable === false) {
							throw new Error('Doby Grid cannot sort by "' + col.id + '" because that column is not sortable.');
						}
					}
				});
			}.bind(this));

			// Updating the sorting dictionary
			this.sorting = options;

			// Update the sorting data
			styleSortColumns();

			// Re-process column args into something the execute sorter can understand
			var args = {
				multiColumnSort: true,
				sortCols: []
			};

			_.each(options, function (col) {
				args.sortCols.push({
					sortCol: getColumnById(col.columnId),
					sortAsc: col.sortAsc !== null && col.sortAsc !== undefined ? col.sortAsc : colDef.sortAsc
				});
			});

			// Manually execute the sorter that will actually re-draw the table
			executeSorter(args);

			return this;
		};


		// setupColumnReorder()
		// Allows columns to be re-orderable.
		//
		setupColumnReorder = function () {
			if ($headers.filter(":ui-sortable").length) return;
			$headers.sortable({
				axis: "x",
				containment: "parent",
				cursor: "default",
				distance: 3,
				helper: "clone",
				placeholder: classplaceholder + " " + classheadercolumn,
				tolerance: "intersection",
				start: function (e, ui) {
					ui.placeholder.width(ui.helper.outerWidth() - headerColumnWidthDiff);
					$(ui.helper).addClass(classheadercolumnactive);
				},
				beforeStop: function (e, ui) {
					$(ui.helper).removeClass(classheadercolumnactive);
				},
				update: function (e) {
					e.stopPropagation();

					var reorderedIds = $headers.sortable("toArray"),
						reorderedColumns = [],
						cindex;

					for (var i = 0, l = reorderedIds.length; i < l; i++) {
						cindex = cache.columnsById[reorderedIds[i].replace(uid, "")];
						reorderedColumns.push(cache.activeColumns[cindex]);
					}

					// Re-run postprocessing cache - it's no longer valie
					cache.postprocess = {};
					startPostProcessing();

					self.setColumns(reorderedColumns);
					setupColumnResize();

					self.trigger('columnreorder', e);
				}
			});
		};


		// setupColumnResize()
		// Enables the resizing of columns.
		// NOTE: This can be optimized
		// NOTE: Perhaps assign the handle events on the whole header instead of on each element
		//
		setupColumnResize = function () {
			// If resizable columns are disabled -- return
			if (!self.options.resizableColumns) return;

			var j, c, l, pageX, columnElements, minPageX, maxPageX, firstResizable, lastResizable;

			columnElements = $headers.children();
			columnElements.find("." + classhandle).remove();
			columnElements.each(function (i) {
				if (!cache.activeColumns[i].resizable) return;
				if (firstResizable === undefined) firstResizable = i;
				lastResizable = i;
			});

			// No resizable columns found
			if (firstResizable === undefined) return;

			var lockColumnWidths = function () {
				columnElements.each(function (i) {
					// The extra 1 here is to compensate for the border separator
					cache.activeColumns[i].previousWidth = cache.activeColumns[i].width;
				});
			};

			var resizeColumn = function (i, d) {
				var actualMinWidth, x;
				x = d;
				if (d < 0) { // shrink column
					for (j = i; j >= 0; j--) {
						c = cache.activeColumns[j];
						if (!c.resizable) continue;
						actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
						if (x && c.previousWidth + x < actualMinWidth) {
							x += c.previousWidth - actualMinWidth;
							c.width = actualMinWidth;
						} else {
							c.width = c.previousWidth + x;
							x = 0;
						}
					}

					if (self.options.autoColumnWidth) {
						x = -d;
						for (j = i + 1; j < columnElements.length; j++) {
							c = cache.activeColumns[j];
							if (!c.resizable) continue;
							if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
								x -= c.maxWidth - c.previousWidth;
								c.width = c.maxWidth;
							} else {
								c.width = c.previousWidth + x;
								x = 0;
							}
						}
					}
				} else { // stretch column
					for (j = i; j >= 0; j--) {
						c = cache.activeColumns[j];
						if (!c.resizable) continue;
						if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
							x -= c.maxWidth - c.previousWidth;
							c.width = c.maxWidth;
						} else {
							c.width = c.previousWidth + x;
							x = 0;
						}
					}

					if (self.options.autoColumnWidth) {
						x = -d;
						for (j = i + 1, l = columnElements.length; j < l; j++) {
							c = cache.activeColumns[j];
							if (!c.resizable) continue;
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
			};

			var prepareLeeway = function (i, pageX) {
				var shrinkLeewayOnRight = null,
					stretchLeewayOnRight = null;

				if (self.options.autoColumnWidth) {
					shrinkLeewayOnRight = 0;
					stretchLeewayOnRight = 0;
					// colums on right affect maxPageX/minPageX
					for (j = i + 1; j < columnElements.length; j++) {
						c = cache.activeColumns[j];
						if (!c.resizable) continue;
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
				var shrinkLeewayOnLeft = 0,
					stretchLeewayOnLeft = 0;
				for (j = 0; j <= i; j++) {
					// columns on left only affect minPageX
					c = cache.activeColumns[j];
					if (!c.resizable) continue;
					if (stretchLeewayOnLeft !== null) {
						if (c.maxWidth) {
							stretchLeewayOnLeft += c.maxWidth - c.previousWidth;
						} else {
							stretchLeewayOnLeft = null;
						}
					}
					shrinkLeewayOnLeft += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
				}

				if (shrinkLeewayOnRight === null) shrinkLeewayOnRight = 100000;
				if (shrinkLeewayOnLeft === null) shrinkLeewayOnLeft = 100000;
				if (stretchLeewayOnRight === null) stretchLeewayOnRight = 100000;
				if (stretchLeewayOnLeft === null) stretchLeewayOnLeft = 100000;

				maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
				minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
			};

			var applyColWidths = function () {
				applyColumnHeaderWidths();
				if (self.options.resizeCells) applyColumnWidths();
			};

			var submitColResize = function () {
				var newWidth;
				for (j = 0; j < columnElements.length; j++) {
					c = cache.activeColumns[j];
					newWidth = $(columnElements[j]).outerWidth();

					if (c.previousWidth !== newWidth && c.rerenderOnResize) {
						invalidateAllRows();
					}
				}

				updateCanvasWidth(true);
				render();
				self.trigger('columnresize', {});
			};

			// Assign double-click to auto-resize event
			// This is done once for the whole header because event assignments are expensive
			$headers.on("dblclick", function (event) {
				// Make sure we're clicking on a handle
				if (!$(event.target).closest('.' + classhandle).length) return;

				var column = getColumnFromEvent(event);
				if (!column) return;
				var column_index = cache.columnsById[column.id],
					// Either use the width of the column's content or the min column width
					currentWidth = column.width,
					newWidth = Math.max(getColumnContentWidth(column_index), column.minWidth);

				// Do nothing if width isn't changed
				if (currentWidth == newWidth) return;

				var diff = newWidth - currentWidth;

				// Duplicate the drag functionality
				lockColumnWidths(column_index);
				prepareLeeway(column_index, pageX);
				resizeColumn(column_index, diff);
				applyColWidths();
				submitColResize();
			});

			// Create drag handles
			// This has to be done for each drag handle to not conflict with drag reordering
			$.each(columnElements, function (i, columnEl) {
				if (
					i < firstResizable ||
					(self.options.autoColumnWidth && i >= lastResizable) ||
					cache.activeColumns[i].resizable === false
				) return;

				$('<div class="' + classhandle + '"><span></span></div>')
					.appendTo(columnEl)
					.on('dragstart', function (event) {
						pageX = event.pageX;
						$(this).parent().addClass(classheadercolumndrag);

						// Lock each column's width option to current width
						lockColumnWidths(i);

						// Ensures the leeway has another room to move around
						prepareLeeway(i, pageX);
					})
					.on('drag', function (event) {
						var delta = Math.min(maxPageX, Math.max(minPageX, event.pageX)) - pageX;

						// Sets the new column widths
						resizeColumn(i, delta);

						// Save changes
						applyColWidths();
					})
					.on('dragend', function () {
						$(this).parent().removeClass(classheadercolumndrag);
						submitColResize();
					});
			});
		};


		// setupColumnSort()
		// Allows columns to be sortable via click
		//
		setupColumnSort = function () {
			$headers.click(function (e) {
				// If clicking on drag handle - stop
				var handle = $(e.target).closest("." + classhandle);
				if (handle.length) return;

				var column = getColumnFromEvent(e);
				if (!column || !column.sortable) return;

				var sortOpts = null;
				for (var i = 0, l = self.sorting.length; i < l; i++) {
					if (self.sorting[i].columnId == column.id) {
						sortOpts = self.sorting[i];
						sortOpts.sortAsc = !sortOpts.sortAsc;
						break;
					}
				}

				if (e.metaKey && self.options.multiColumnSort) {
					if (sortOpts) {
						self.sorting.splice(i, 1);
					}
				} else {
					if ((!e.shiftKey && !e.metaKey) || !self.options.multiColumnSort) {
						self.sorting = [];
					}

					if (!sortOpts) {
						sortOpts = {
							columnId: column.id,
							sortAsc: column.sortAsc
						};
						self.sorting.push(sortOpts);
					} else if (self.sorting.length === 0) {
						self.sorting.push(sortOpts);
					}
				}

				styleSortColumns(self.sorting);

				var args;
				if (!self.options.multiColumnSort) {
					args = {
						multiColumnSort: false,
						sortCol: column,
						sortAsc: sortOpts.sortAsc
					};
				} else {
					args = {
						multiColumnSort: true,
						sortCols: $.map(self.sorting, function (col) {
							return {
								sortCol: cache.activeColumns[cache.columnsById[col.columnId]],
								sortAsc: col.sortAsc
							};
						})
					};
				}

				// Execute sort
				executeSorter(args);

				// Fire event
				self.trigger('sort', e, args);
			});
		};


		// showQuickFilter()
		// Slide out a quick search header bar
		//
		// @param	focus		object		Column definition object for the column we want to focus.
		//									Passing in null will toggle the quick filter.
		//
		// NOTE: Many optimizations can be done here.
		showQuickFilter = function (focus) {
			// Toggle off
			if (focus === undefined && $headerFilter) {
				$headerFilter.remove();
				$headerFilter = undefined;

				// Update viewport
				viewportH = getViewportHeight();
				$viewport.height(viewportH);
				return;
			}

			// This is called when user types into any of the input boxes.
			// It's on a 150ms timeout so that fast typing doesn't search really large grid immediately
			var keyTimer;
			var onKeyUp = function () {
				if (keyTimer) clearTimeout(keyTimer);
				keyTimer = setTimeout(function () {
					self.filter(function (item) {
						// Get the values of all column fields
						var result = true, c, c_value, i_value;
						for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
							c = cache.activeColumns[i];
							if (result && c.quickFilterInput) {
								i_value = c.quickFilterInput.val();
								c_value = getDataItemValueForColumn(item, c);

								if (c_value !== undefined && c_value !== null) c_value = c_value.toString();

								result *= i_value && c_value ? c_value.toLowerCase().indexOf(i_value.toLowerCase()) >= 0 : true;
							}
						}

						return result;
					});
				}, 150);
			};

			// Draw new filter bar
			if (!$headerFilter) {
				$headerFilter = $('<div class="' + classheaderfilter + '"></div>')
					.appendTo($headerScroller);

				// Create a cell for each column
				var column, cell, html;
				for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
					column = cache.activeColumns[i];

					// Create cell
					html = ['<div class="'];
					html.push(classheaderfiltercell);
					html.push('">');
					html.push('</div>');
					cell = $(html.join(''));
					cell.appendTo($headerFilter);

					// Create input as a reference in the column definition
					column.quickFilterInput = $('<input class="editor" type="text"/>')
						.appendTo(cell)
						.data('column_id', column.id)
						.on('keyup', onKeyUp);

					// Focus input
					if (focus && focus.id == column.id) {
						column.quickFilterInput.select().focus();
					}
				}
			} else if (focus && focus.quickFilterInput) {
				// Just focus
				focus.quickFilterInput.select().focus();
			}

			// Set column widths
			applyColumnHeaderWidths();

			// Update viewport
			viewportH = getViewportHeight();
			$viewport.height(viewportH);
		};


		// showTooltip()
		// Show a tooltip on the column header
		//
		// @param	event		object		Javascript event object
		//
		showTooltip = function (event) {
			// Proceed for popup tooltips only
			if (self.options.tooltipType != 'popup') return;

			// Proceed if not on a drag handle
			if ($(event.target).closest('.' + classhandle).length) {
				// Trigger mouseleave event so existing tooltips are hidden during resizing
				$(event.target).trigger('mouseleave');
				return;
			}

			var column = getColumnFromEvent(event);

			// Proceed for valid columns only
			if (!column || !column.tooltip) return;

			var el = $(event.target).closest('.' + classheadercolumn);

			// Don't create tooltip if this element already has one open
			if (el.attr('aria-describedby')) return;

			// ID of the tooltip element
			var tooltip_id = uid + '-tooltip-column-' + column.id;

			// Add describe by
			el.attr('aria-describedby', tooltip_id);

			// Assign removal event
			el.one("mouseleave", function () {
				// Remove tooltip
				if ($(this).attr('aria-describedby') !== undefined) {
					var tltp = $('#' + tooltip_id);
					tltp.removeClass('on');

					// Animate out
					setTimeout(function () {
						tltp.remove();
					}, 200);

					$(this).removeAttr('aria-describedby');
				}
			});

			// Delay rendering by a few milliseconds to prevent rolling over tooltip
			// and for better UX
			setTimeout(function () {
				// Make sure tooltip is still needed
				if (el.attr('aria-describedby') === undefined || !el.is(':visible')) return;

				// Height of the tooltip arrow
				var arrowheight = 10;

				// Build tooltip HTML
				var html = ['<span class="' + classtooltip + '" id="' + tooltip_id + '">'];
				html.push(column.tooltip);
				html.push('<span class="' + classtooltiparrow + '"></span>');
				html.push('</span>');

				// Double check that element doesn't already exist
				if ($('#' + tooltip_id).length) return;

				// Insert into DOM temporarily so we can calculate size
				var tooltip = $(html.join(''));
				tooltip.appendTo(document.body);

				// Calculate position
				var x = el.offset().left + (el.outerWidth() / 2) - (tooltip.outerWidth() / 2),
					y = el.offset().top + el.outerHeight() + arrowheight;

				// Compensate when we get close to the edge
				var arrowoffset = 0,
					win = $(window),
					windowwidth = win.outerWidth();

				if (x < 0) {
					arrowoffset = x;
					x = 0;
				} else if ((x + tooltip.outerWidth()) > windowwidth) {
					arrowoffset = (x + tooltip.outerWidth()) - windowwidth;
					x -= arrowoffset + 1;
				}

				// Position arrow
				var arrow = tooltip.children('.' + classtooltiparrow).first();
				arrow.css('left', (tooltip.outerWidth() / 2) - (arrow.outerWidth() / 2) + arrowoffset);

				// Draw tooltip
				tooltip
					.remove()	// Need to remove it from body and re-insert to ensure Chrome animates
					.addClass('on')
					.attr('style', 'left:' + x + 'px;top:' + (y + 5) + 'px')
					.appendTo(document.body)
					.width(); // Force layout to display transitions

				// Transition in
				tooltip.css('top', y);
			}, 250);
		};


		// sortBy()
		// Sort the grid by a given column id
		//
		// @param	column_id	string		Id of the column by which to sort
		// @param	ascending	boolean		Is the sort direction ascending?
		//
		// @return object
		this.sortBy = function (column_id, ascending) {
			if (!column_id)	throw new Error('Grid cannot sort by blank value. Column Id must be specified.');
			return this.setSorting([{
				columnId: column_id,
				sortAsc: ascending
			}]);
		};


		// startPostProcessing()
		// Runs the async post render postprocessing on the grid cells
		//
		startPostProcessing = function () {
			if (!enableAsyncPostRender) return;
			clearTimeout(h_postrender);
			h_postrender = setTimeout(asyncPostProcessRows, self.options.asyncPostRenderDelay);
		};


		// styleSortColumns()
		// Styles the column headers according to the current sorting data
		//
		styleSortColumns = function () {

			var headerColumnEls = $headers.children();
			headerColumnEls
				.removeClass(classheadercolumnsorted)
				.find("." + classsortindicator)
				.removeClass(classsortindicatorasc + " " + classsortindicatordesc);

			$.each(self.sorting, function (i, col) {
				if (col.sortAsc === null) {
					col.sortAsc = true;
				}
				var columnIndex = cache.columnsById[col.columnId];
				if (columnIndex !== null) {
					headerColumnEls.eq(columnIndex)
						.addClass(classheadercolumnsorted)
						.find("." + classsortindicator)
						.addClass(col.sortAsc ? classsortindicatorasc : classsortindicatordesc);
				}
			});
		};


		// toString()
		// Returns a readable representation of a Doby Grid Object
		//
		// @return string
		this.toString = function () { return "DobyGrid"; };


		// toggleHeaderContextMenu()
		// Toggles the display of the context menu that appears when the column headers are
		// right-clicked.
		//
		// @param	event		object		Javascript event object
		// @param	args		object		Event object data
		//
		toggleHeaderContextMenu = function (event, args) {
			event.preventDefault();

			var column = args.column || false,
				dropdown;

			// When a column is chosen from the menu
			var cFn = function (column) {
				return function (event) {
					event.stopPropagation();

					// Flip column value
					var c = getColumnById(column.id);
					c.visible = !c.visible;

					// Toggle menu
					if (c.visible) $(this).addClass('on');
					else $(this).removeClass('on');

					// Update grid
					self.setColumns(self.options.columns);
				};
			};

			// Builds a list of all available columns for the user to choose from
			var columns_menu = [],
				sorted = _.sortBy(self.options.columns, function (c) { return c.name; });

			_.each(sorted, function (c) {
				// Non-removable columns do not appear in the list
				if (!c.removable) return;

				columns_menu.push({
					name: c.name !== undefined && c.name !== null ? c.name : c.id,
					fn: cFn(c),
					value: c.visible
				});
			});

			// When an aggregator is chosen from the menu
			var aFn = function (column, aggr_index) {
				return function (event) {
					// If this is the only aggregator available - clicking does nothing
					if (Object.keys(cache.aggregatorsByColumnId[column.id]).length === 1) return;

					// Update menu items
					$(event.target).parent().children('.' + classdropdownitem).removeClass('on');
					$(event.target).addClass('on');
					if (!$(event.target).children('.' + classdropdownicon).length) {
						$(event.target).append('<span class="' + classdropdownicon + '"></span>');
					}

					// Disable old aggregator and enable the new one
					for (var aggr_i in cache.aggregatorsByColumnId[column.id]) {
						cache.aggregatorsByColumnId[column.id][aggr_i].active = (aggr_i == aggr_index);
					}

					// Invalidate all Aggregate rows in the visible range
					var range = getVisibleRange();
					for (var ci = range.top, ct = range.bottom; ci < ct; ci++) {
						if (cache.rows[ci] instanceof Aggregate) {
							invalidateRow(ci);
						}
					}

					// Re-process aggregators and re-render rows
					self.collection.refresh();
				};
			};

			// Builds a list of all available aggregators for the user to choose from
			var aggregator_menu = [];
			if (column && cache.aggregatorsByColumnId[column.id]) {
				_.each(cache.aggregatorsByColumnId[column.id], function (aggr, i) {
					aggregator_menu.push({
						fn: aFn(column, i),
						name: column.aggregators[i].name,
						value: aggr.active
					});
				});
			}

			// Menu data object which will define what the menu will have
			//
			// @param	divider		boolean		If true, item will be a divider
			// @param	enabled		boolean		Will draw item only if true
			// @param	name		string		Name of menu item to display to user
			// @param	fn			function	Function to execute when item clicked
			//
			var menuData = [{
				enabled: column && self.options.quickFilter,
				name: column ? getLocale('column.filter', {name: column.name}) : '',
				fn: function () {
					showQuickFilter(column);
				}
			}, {
				enabled: $headerFilter !== undefined,
				name: getLocale('global.hide_filter'),
				fn: function () {
					showQuickFilter();
				}
			}, {
				enabled: self.options.quickFilter || $headerFilter !== undefined,
				divider: true
			}, {
				enabled: column && column.removable,
				name: column ? getLocale('column.remove', {name: column.name}) : '',
				fn: function () {
					self.removeColumn(column.id);
				}
			}, {
				enabled: column && column.removable,
				divider: true
			}, {
				enabled: column && column.sortable,
				name: getLocale('column.sorting'),
				menu: [{
					enabled: !hasSorting(column.id),
					name: column ? getLocale('column.sort_asc', {name: column.name}) : '',
					fn: function () {
						self.sortBy(column.id, true);
					}
				}, {
					enabled: !hasSorting(column.id),
					name: column ? getLocale('column.sort_desc', {name: column.name}) : '',
					fn: function () {
						self.sortBy(column.id, false);
					}
				}, {
					enabled: self.isSorted() && !hasSorting(column.id),
					name: column ? getLocale('column.add_sort_asc', {name: column.name}) : '',
					fn: function () {
						self.sorting.push({columnId: column.id, sortAsc: true});
						self.setSorting(self.sorting);
					}
				}, {
					enabled: self.isSorted() && !hasSorting(column.id),
					name: column ? getLocale('column.add_sort_desc', {name: column.name}) : '',
					fn: function () {
						self.sorting.push({columnId: column.id, sortAsc: false});
						self.setSorting(self.sorting);
					}
				}, {
					enabled: hasSorting(column.id),
					name: column ? getLocale('column.remove_sort', {name: column.name}) : '',
					fn: function () {
						self.sorting = _.filter(self.sorting, function (s) {
							return s.columnId != column.id;
						});
						self.setSorting(self.sorting);
					}
				}]
			}, {
				enabled: column && !column.sortable,
				divider: true
			}, {
				enabled: self.options.groupable && column && column.groupable,
				name: getLocale('column.grouping'),
				menu: [{
					enabled: !hasGrouping(column.id) || !self.isGrouped(),
					name: column ? getLocale('column.group', {name: column.name}) : '',
					fn: function () {
						self.setGrouping([{
							column_id: column.id
						}]);
						dropdown.hide();
					}
				}, {
					enabled: !hasGrouping(column.id) && self.isGrouped(),
					name: column ? getLocale('column.add_group', {name: column.name}) : '',
					fn: function () {
						self.addGrouping(column.id);
						dropdown.hide();
					}
				}, {
					enabled: hasGrouping(column.id),
					name: column ? getLocale('column.remove_group', {name: column.name}) : '',
					fn: function () {
						self.removeGrouping(column.id);
						dropdown.hide();
					}
				}, {
					enabled: self.isGrouped(),
					name: getLocale("column.groups_clear"),
					fn: function () {
						self.setGrouping();
						dropdown.hide();
					}
				}, {
					enabled: self.isGrouped(),
					divider: true
				}, {
					enabled: self.isGrouped(),
					name: getLocale('column.groups_expand'),
					fn: function () {
						self.collection.expandAllGroups();
					}
				}, {
					enabled: self.isGrouped(),
					name: getLocale('column.groups_collapse'),
					fn: function () {
						self.collection.collapseAllGroups();
					}
				}]
			}, {
				enabled: column && column.aggregators !== undefined,
				name: getLocale('column.aggregators'),
				menu: aggregator_menu
			}, {
				enabled: column && !(column.sortable || column.removable || column.groupable || column.aggregators),
				divider: true
			}, {
				enabled: column && !isColumnSelected(cache.columnsById[column.id]),
				name: getLocale('column.select'),
				fn: function () {
					var column_idx = cache.columnsById[column.id];
					self.selectCells(0, column_idx, (cache.rows.length - 1), column_idx);
				}
			}, {
				enabled: column && isColumnSelected(cache.columnsById[column.id]),
				name: getLocale('column.deselect'),
				fn: function () {
					var column_idx = cache.columnsById[column.id];
					for (var i = 0; i < cache.rows.length - 1; i++) {
						deselectCells(i, column_idx);
					}
				}
			}, {
				enabled: column,
				divider: true
			}, {
				enabled: columns_menu.length > 0,
				name: getLocale('global.columns'),
				menu: columns_menu
			}, {
				enabled: columns_menu.length > 0,
				divider: true
			}, {
				enabled: isFileSaverSupported,
				name: getLocale('global.export'),
				menu: [{
					name: getLocale('global.export_csv'),
					fn: function () {
						var csv = self.export('csv');

						// Save to file
						var blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
						saveAs(blob, [self.options.exportFileName, ".csv"].join(''));
					}
				}, {
					name: getLocale('global.export_html'),
					fn: function () {
						var html = self.export('html');

						// Save to file
						var blob = new Blob([html], {type: "text/html;charset=utf-8"});
						saveAs(blob, [self.options.exportFileName, ".html"].join(''));
					}
				}]
			}, {
				divider: true
			}, {
				name: getLocale('global.auto_width'),
				value: self.options.autoColumnWidth,
				fn: function () {
					self.setOptions({
						autoColumnWidth: !self.options.autoColumnWidth
					});
				}
			}];

			// Render Menu
			var $menu = $('<div class="' + classcontextmenu + '"></div>');
			renderMenu(menuData, $menu);

			// Hovering on an item that has a submenu should show the submenu
			$menu.on('mouseover', function (event) {
				var $item = $(event.target).hasClass(classdropdownitem) ? $(event.target) : $(event.target).parent().hasClass(classdropdownitem) ? $(event.target).parent() : null;

				if ($item && $item.children('.' + classdropdownmenu).length) {
					// Find any other open menus on this level and close them
					$item.parent().children('.open').removeClass('open');

					$item.addClass('open');
				}
			});

			// Create dropdown
			dropdown = new Dropdown(event, {
				id: column.id,
				menu: $menu,
				parent: self.$el
			});
		};


		// updateCanvasWidth()
		// Resizes the canvas width
		//
		// @param	forceColumnWidthsUpdate		boolean		Force the width of columns to also update?
		//
		updateCanvasWidth = function (forceColumnWidthsUpdate) {
			var oldCanvasWidth = canvasWidth;
			canvasWidth = getCanvasWidth();

			if (canvasWidth != oldCanvasWidth) {
				$canvas.width(canvasWidth);
				$headers.width(getHeadersWidth());
				viewportHasHScroll = (canvasWidth > viewportW - window.scrollbarDimensions.width);
			}

			if (canvasWidth != oldCanvasWidth || forceColumnWidthsUpdate) {
				applyColumnWidths();
			}
		};


		// updateCellCssStylesOnRenderedRows()
		// Given an add and remove hash object, adds or removes CSS classes on the given nodes
		//
		// @param	addedHash		object		Which classes should be added to which cells
		// @param	removedHash		object		Which classes should be removed from which cells
		//
		// Example hash object: {
		//		4: {
		//			columnId: {
		//				"myclassname"
		//			}
		//		}
		// }
		// Where "4" is the id of the affected row
		//
		updateCellCssStylesOnRenderedRows = function (addedHash, removedHash) {
			var node, columnId, addedRowHash, removedRowHash;

			for (var row in cache.nodes) {
				removedRowHash = removedHash && removedHash[row];
				addedRowHash = addedHash && addedHash[row];

				if (removedRowHash) {
					for (columnId in removedRowHash) {
						if (!addedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
							node = getCellNode(row, cache.columnsById[columnId]);
							if (node) {
								$(node).removeClass(removedRowHash[columnId]);
							}
						}
					}
				}

				if (addedRowHash) {
					for (columnId in addedRowHash) {
						if (!removedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
							node = getCellNode(row, cache.columnsById[columnId]);
							if (node) {
								$(node).addClass(addedRowHash[columnId]);
							}
						}
					}
				}
			}
		};


		// updateColumnCaches()
		// Recalculates the widths of columns.
		//
		updateColumnCaches = function () {
			// Pre-calculate cell boundaries.
			cache.columnPosLeft = [];
			cache.columnPosRight = [];
			cache.aggregatorsByColumnId = {};

			var x = 0, column;
			for (var i = 0, l = cache.activeColumns.length; i < l; i++) {
				column = cache.activeColumns[i];

				cache.columnPosLeft[i] = x;
				cache.columnPosRight[i] = x + column.width;
				x += column.width;

				// Cache aggregators
				if (column.aggregators) {
					for (var j = 0, m = column.aggregators.length; j < m; j++) {
						if (!cache.aggregatorsByColumnId[column.id]) {
							cache.aggregatorsByColumnId[column.id] = {};
						}

						// Create new aggregator instance
						cache.aggregatorsByColumnId[column.id][j] = new column.aggregators[j].fn(column);
					}
				}
			}
		};


		// updateRow()
		// Re-cache and re-render a single row
		//
		// @param	row		integer		Index of the row to re-render
		//
		updateRow = function (row) {
			var cacheEntry = cache.nodes[row];
			if (!cacheEntry) return;

			ensureCellNodesInRowsCache(row);

			var d = getDataItem(row);

			for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
				if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
					continue;
				}

				columnIdx = columnIdx | 0;
				var m = cache.activeColumns[columnIdx],
					node = cacheEntry.cellNodesByColumnIdx[columnIdx];

				if (self.active && row === self.active.row && columnIdx === self.active.cell && currentEditor) {
					currentEditor.loadValue(d);
				} else if (d) {
					node.innerHTML = getFormatter(row, m)(row, columnIdx, getDataItemValueForColumn(d, m), m, d);
				} else {
					node.innerHTML = "";
				}
			}

			invalidatePostProcessingResults(row);
		};


		// updateRowCount()
		// Updates the cache of row data
		//
		updateRowCount = function () {
			if (!initialized) return;

			var dataLength = cache.rows.length,
				oldViewportHasVScroll = viewportHasVScroll;

			if (dataLength === 0) {
				viewportHasVScroll = false;
			} else {
				if (variableRowHeight) {
					var rpc = cache.rowPositions[dataLength - 1];
					viewportHasVScroll = rpc && (rpc.bottom > viewportH);
				} else {
					viewportHasVScroll = dataLength * self.options.rowHeight > viewportH;
				}
			}

			makeActiveCellNormal();

			// remove the rows that are now outside of the data range
			// this helps avoid redundant calls to .remove() when the size of the data
			// decreased by thousands of rows
			for (var i in cache.nodes) {
				if (i >= dataLength) {
					removeRowFromCache(i);
				}
			}

			if (self.active && self.active.node && self.active.row > dataLength) {
				resetActiveCell();
			}

			var oldH = h;
			if (dataLength === 0) {
				th = viewportH - window.scrollbarDimensions.height;
			} else {
				var rowMax;
				if (!variableRowHeight) {
					rowMax = self.options.rowHeight * dataLength + dataLength;
				} else {
					var pos = dataLength - 1,
						rps = cache.rowPositions[pos];
					rowMax = rps.bottom;
				}

				th = Math.max(rowMax, viewportH - window.scrollbarDimensions.height);
			}

			if (th < window.maxSupportedCssHeight) {
				// just one page
				h = ph = th;
				n = 1;
				cj = 0;
			} else {
				// break into pages
				h = window.maxSupportedCssHeight;
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

			// If autoColumnWidth is enabled and the scrollbar has disappeared - we need to resize
			if (self.options.autoColumnWidth && oldViewportHasVScroll !== undefined && oldViewportHasVScroll != viewportHasVScroll) {
				autosizeColumns();
			}

			updateCanvasWidth(false);
		};


		// validateColumns()
		// Parses the options.columns list to ensure column data is correctly configured.
		//
		validateColumns = function () {
			if (!self.options.columns) return;

			cache.activeColumns = [];
			cache.columnsById = {};

			var c;
			for (var i = 0, l = self.options.columns.length; i < l; i++) {
				// Set defaults
				c = self.options.columns[i] = $.extend(JSON.parse(JSON.stringify(columnDefaults)), self.options.columns[i]);

				// An "id" is required. If it's missing, auto-generate one
				if (c.id === undefined || c.id === null) {
					c.id = c.field ? c.field + '_' + i : c.name ? c.name + '_' + i : null;
				}

				// Convert "tooltip" param to a Cumul8-friendly tooltip
				if (c.tooltip) {
					var cssClass = c.headerClass ? c.headerClass + " tooltip" : "tooltip";
					c.headerClass = cssClass;
					c.toolTip = c.tooltip;
				}

				// If any columns require asyncPostRender, enable it on the grid
				if (c.postprocess) enableAsyncPostRender = true;

				// If no width is set, use global default
				if (c.width === undefined || c.width === null) c.width = self.options.columnWidth;

				// If min/max width is set -- use it to reset given width
				if (c.minWidth !== undefined && c.minWidth !== null && c.width < c.minWidth) c.width = c.minWidth;
				if (c.maxWidth !== undefined && c.maxWidth !== null && c.width > c.maxWidth) c.width = c.maxWidth;

				// These params must be functions
				var fn_attrs = ['editor', 'exporter', 'formatter'], attr;
				for (var j = 0, k = fn_attrs.length; j < k; j++) {
					attr = fn_attrs[j];
					if (c[attr] !== undefined && c[attr] !== null && typeof c[attr] !== 'function') {
						throw new Error([
							"Column ", attr, "s must be functions. ",
							"Invalid ", attr, " given for column \"",
							(c.name || c.id), '"'
						].join(""));
					}
				}

				// Aggregators must be arrays
				if (c.aggregators !== undefined && c.aggregators !== null) {
					if (!$.isArray(c.aggregators)) {
						throw new Error([
							"A column's \"aggregators\" value must be array. ",
							"Invalid value given for column \"", (c.name || c.id), "\""
						].join(""));
					}
				}

				// Build active column cache
				if (c.visible !== false) {
					cache.activeColumns.push(c);

					// Build column id cache
					cache.columnsById[c.id] = cache.activeColumns.length - 1;
				}
			}
		},


		// validateOptions()
		// Ensures that the given options are valid and complete
		//
		validateOptions = function () {
			// Validate loaded JavaScript modules against requested options
			if (self.options.resizableColumns && !$.fn.drag) {
				throw new Error('In order to use "resizable", you must ensure the jquery-ui.draggable module is loaded.');
			}
			if (self.options.reorderable && !$.fn.sortable) {
				throw new Error('In order to use "reorderable", you must ensure the jquery-ui.sortable module is loaded.');
			}

			// Ensure "columns" option is an array
			if (!_.isArray(self.options.columns)) {
				throw new TypeError('The "columns" option must be an array.');
			}

			// Ensure "data" option is an array or a function
			if (
				!_.isArray(self.options.data) &&
				typeof self.options.data !== 'function' &&
				!(self.options.data instanceof Backbone.Collection)
			) {
				throw new TypeError('The "data" option must be an array, a function or a Backbone.Collection.');
			} else {
				// If array is a function - enable remote fetching by instantiating the remote class
				if (typeof self.options.data === 'function') {
					remote = new self.options.data();
					remote.grid = self;
				}
			}

			// Ensure "tooltipType" is one of the allowed values
			if (['title', 'popup'].indexOf(self.options.tooltipType) < 0) {
				throw 'The "tooltipType" option be either "title" or "popup", not "' + self.options.tooltipType + '".';
			}

			// Warn if "addRow" is used without "editable"
			if (self.options.addRow && !self.options.editable) {
				if (console.warn) console.warn('In order to use "addRow", you must enable the "editable" parameter. The "addRow" option has been disabled.');
				self.options.addRow = false;
			}

			// If 'resizableRows' are enabled, turn on variableRowHeight mode
			if (self.options.resizableRows && !variableRowHeight) {
				variableRowHeight = true;
			}

			// Validate and pre-process
			validateColumns();

			// If the given dataset is a Backbone.Collection - hook up the grid to collection events
			if (self.options.data instanceof Backbone.Collection) bindToCollection();
		};


		// Initialize the class
		return initialize();
	};

	return DobyGrid;
}));