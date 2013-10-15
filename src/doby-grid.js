// doby-grid.js 0.0.1
// (c) 2013 Evgueni Naverniouk, Globex Designs, Inc.
// Doby may be freely distributed under the MIT license.
// For all details and documentation:
// https://github.com/globexdesigns/doby-grid

/*jslint browser:true,vars:true,plusplus:true,devel:true,indent:4,maxerr:50*/
/*jshint expr:true,white:true*/
/*global define*/

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

		// Private
		var self = this,
			$canvas,
			$headers,
			$headerScroller,
			$style,
			$viewport,
			absoluteColumnMinWidth,
			activeCell,
			activeCellNode = null,
			activePosX,
			activeRow,
			Aggregate,
			applyColumnHeaderWidths,
			applyColumnWidths,
			asyncPostProcessRows,
			autosizeColumns,
			bindCellRangeSelect,
			bindRowResize,
			cache = {
				aggregatorsByColumnId: {},
				columnPosLeft: [],
				columnPosRight: [],
				columnsById: {},
				indexById: {},
				nodes: {},
				rowPositions: {},
				rows: []
			},
			cacheRows,
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
			classheadersortable = 'sortable',
			classinvalid = 'invalid',
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
			getColumnFromEvent,
			getColumnIndex,
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
			handleActiveCellPositionChange,
			handleClick,
			handleContextMenu,
			handleDblClick,
			handleHeaderContextMenu,
			handleHeaderClick,
			handleKeyDown,
			handleScroll,
			handleSelectedRangesChanged,
			handleWindowResize,
			hasGrouping,
			hasSorting,
			headerColumnWidthDiff = 0,
			headerColumnHeightDiff = 0, // border+padding
			idProperty = "id",	// property holding a unique row id
			initialize,
			initialized = false,
			insertAddRow,
			invalidate,
			invalidateAllRows,
			invalidatePostProcessingResults,
			invalidateRow,
			invalidateRows,
			isCellPotentiallyEditable,
			lastRenderedScrollLeft = 0,
			lastRenderedScrollTop = 0,
			makeActiveCellEditable,
			makeActiveCellNormal,
			measureCellPaddingAndBorder,
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
			postProcessedRows = {},
			postProcessFromRow = null,
			postProcessToRow = null,
			prevScrollLeft = 0,
			prevScrollTop = 0,
			Range,
			removeCssRules,
			removeInvalidRanges,
			removeRowFromCache,
			render,
			renderCell,
			renderColumnHeaders,
			renderRow,
			renderRows,
			resetActiveCell,
			resizeCanvas,
			rowsToRanges,
			scrollCellIntoView,
			scrollLeft = 0,
			scrollPage,
			scrollRowIntoView,
			scrollRowToTop,
			scrollTo,
			scrollTop = 0,
			selectedRows = [],		// Currently selected ranges of cells
			serializedEditorValue,
			setActiveCell,
			setActiveCellInternal,
			setRowHeight,
			setupColumnReorder,
			setupColumnResize,
			setupColumnSort,
			showTooltip,
			sortColumns = [],
			startPostProcessing,
			stylesheet,
			styleSortColumns,
			tabbingDirection = 1,
			th,				// virtual height
			toggleHeaderContextMenu,
			uid = this.NAME + "-" + Math.round(1000000 * Math.random()),
			updateCanvasWidth,
			updateCell,
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
			data:					[],
			dataExtractor:			null,
			columnWidth:			80,
			editable:				false,
			editor:					null,
			emptyNotice:			true,
			formatter:				null,
			fullWidthRows:			true,
			groupable:				true,
			headerMenu:				true,
			keyboardNavigation:		true,
			locale: {
				column: {
					add_group:			'Add Grouping By "{{name}}"',
					add_sort_asc:		'Add Sort By "{{name}}" (Ascending)',
					add_sort_desc:		'Add Sort By "{{name}}" (Descending)',
					auto_width:			'Automatically Resize Columns',
					group:				'Group By "{{name}}"',
					groups_clear:		'Clear All Grouping',
					groups_collapse:	'Collapse All Groups',
					groups_expand:		'Expand All Groups',
					remove:				'Remove "{{name}}" Column',
					remove_group:		'Remove Grouping By "{{name}}"',
					remove_sort:		'Remove Sort By "{{name}}"',
					sort_asc:			'Sort By "{{name}}" (Ascending)',
					sort_desc:			'Sort By "{{name}}" (Descending)'
				},
				empty: {
					"default":			'No data available',
					remote:				'No results found',
					filter:				'No items matching that filter'
				}
			},
			multiColumnSort:		true,
			remote:					false,
			resizableColumns:		true,
			resizableRows:			false,
			resizeCells:			false,
			reorderable:			true,
			rowHeight:				28,
			selectable:				true,
			selectedClass:			"selected",
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
			minWidth:			38,
			name:				"",
			postprocess:		null,
			removable:			true,
			rerenderOnResize:	false,
			resizable:			true,
			selectable:			true,
			sortable:			true,
			sortAsc:			true,
			tooltip:			null,
			width:				null
		};

		// Enable events
		$.extend(this, Backbone.Events);

		// Stores the current event object
		this._event = null;

		// Stores the currently selected cell range
		this.selection = null;


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

			if (self.options.selectable) {
				bindCellRangeSelect();
			}

			return self;
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
		//
		// @return object
		this.addGrouping = function (column_id) {
			if (column_id === null || column_id === undefined) throw new Error("Unable to add grouping to grid because the 'column_id' value is missing.");
			var column_ids = hasGrouping(column_id);
			if (!column_ids) {
				var grouping = this.collection.groups;
				column_ids = _.pluck(grouping, 'column_id');
				column_ids.push(column_id);
				this.setGrouping(column_ids);
			}
			return this;
		};


		// Aggregate()
		// Information about data totals.
		// An instance of GroupTotals will be created for each totals row and passed to the aggregators
		// so that they can store arbitrary data in it. That data can later be accessed by group totals
		// formatters during the display.
		//
		Aggregate = function (aggregators) {
			var self = this;
			this.aggregators = aggregators;
			this.class = classrowtotal;
			this.columns = {};
			this.editable = false;
			this.focusable = true;
			this.formatter = function (row, cell, value, columnDef, data) {
				if (self.aggregators[columnDef.id] && self.aggregators[columnDef.id].formatter) {
					return self.aggregators[columnDef.id].formatter();
				}
				return "";
			};
			this.selectable = false;

			this.toString = function () { return "Aggregate"; };
		};

		Aggregate.prototype = new NonDataItem();


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
				measureCellPaddingAndBorder();
				disableSelection($headers);
				renderColumnHeaders();
				setupColumnSort();
				createCssRules();
				cacheRows();
				resizeCanvas();

				// Assign events

				this.$el
					.on("resize." + this.NAME, resizeCanvas);

				if (this.options.autoDestroy) {
					this.$el.one("remove", function (event) {
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
				console.error(e);
			}

			// Register the remote fetching when the viewport changes
			/*if (this.options.remote) {
				this.grid.onViewportChanged.subscribe(function (e, args) {
					var vp = getViewport();
					self.loader.fetch(vp.top, vp.bottom);
				});
			}*/

			// Enable header menu
			if (this.options.headerMenu) {
				// Subscribe to header menu context clicks
				this.on('onHeaderContextMenu', toggleHeaderContextMenu);
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

			var i, l, w;
			for (i = 0, l = headers.length; i < l; i++) {
				w = self.options.columns[i].width - headerColumnWidthDiff;

				// Compensate for grid rendering
				if (i + 1 == l) w = w + 2;

				$(headers[i]).attr('style', 'width:' + w + 'px');
			}

			updateColumnCaches();
		};


		// applyColumnWidths()
		// Sets the widths of the columns to what they should be
		//
		applyColumnWidths = function () {
			var x = 0, c, w, rule, i, l, r;

			for (i = 0, l = self.options.columns.length; i < l; i++) {
				c = self.options.columns[i];
				w = c.width - 2;

				rule = getColumnCssRules(i);
				rule.left.style.left = (x - 1) + "px";
				r = (canvasWidth - (x + 1) - w);

				// If this is the last column, compensate for grid positioning
				if (i + 1 == l) r = r - 2;

				rule.right.style.right = r + "px";

				x += c.width;
			}
		};


		// asyncPostProcessRows()
		// Processing the post-render action on all cells that need it
		//
		asyncPostProcessRows = function () {
			var dataLength = getDataLength(),
				cb = function () {
					if (col.cache) {
						postProcessedRows[row][columnIdx] = $(node).html();
					}
				};

			while (postProcessFromRow <= postProcessToRow) {
				var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--,
					cacheEntry = cache.nodes[row],
					columnIdx;

				if (!cacheEntry || row >= dataLength) {
					continue;
				}

				if (!postProcessedRows[row]) {
					postProcessedRows[row] = {};
				}

				ensureCellNodesInRowsCache(row);
				for (columnIdx in cacheEntry.cellNodesByColumnIdx) {
					if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
						continue;
					}

					columnIdx = columnIdx || 0;

					var col = self.options.columns[columnIdx];
					if (col.postprocess && !postProcessedRows[row][columnIdx]) {
						var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
						if (node) {
							col.postprocess({
								cell: $(node),
								column: col,
								data: getDataItem(row),
								rowIndex: row
							}, cb);
						}

						if (!col.cache && postProcessedRows[row]) {
							postProcessedRows[row][columnIdx] = true;
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
				availWidth = viewportHasVScroll ? viewportW - window.scrollbarDimensions.width : viewportW;

			for (i = 0; i < self.options.columns.length; i++) {
				c = self.options.columns[i];
				widths.push(c.width);
				total += c.width;
				if (c.resizable) {
					shrinkLeeway += c.width - Math.max((c.minWidth || 0), absoluteColumnMinWidth);
				}
			}

			// shrink
			prevTotal = total;
			while (total > availWidth && shrinkLeeway) {
				var shrinkProportion = (total - availWidth) / shrinkLeeway;
				for (i = 0; i < self.options.columns.length && total > availWidth; i++) {
					c = self.options.columns[i];
					var width = widths[i];
					if (!c.resizable || width <= (c.minWidth || 0) || width <= absoluteColumnMinWidth) {
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
				for (i = 0; i < self.options.columns.length && total < availWidth; i++) {
					c = self.options.columns[i];
					if (!c.resizable || (c.maxWidth && c.maxWidth <= c.width)) {
						continue;
					}
					var max = 1000000;
					if (c.maxWidth && (c.maxWidth - c.width)) max = (c.maxWidth - c.width);
					var growSize = Math.min(Math.floor(growProportion * c.width) - c.width, max) || 1;
					total += growSize;
					widths[i] += growSize;
				}
				if (prevTotal == total) { // avoid infinite loop
					break;
				}
				prevTotal = total;
			}

			var reRender = false;
			for (i = 0; i < self.options.columns.length; i++) {
				if (self.options.columns[i].rerenderOnResize && self.options.columns[i].width != widths[i]) {
					reRender = true;
				}
				self.options.columns[i].width = widths[i];
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
					if (self.options.activateSelection) {
						setActiveCellInternal(getCellNode(end.row, end.cell), false);
					}
				})
				.on('dragend', function (event, dd) {
					if (!_dragging) return;
					_dragging = false;

					event.stopImmediatePropagation();

					decorator.hide();

					self._event = event;

					self.selectCells(
						dd._range.start.row,
						dd._range.start.cell,
						dd._range.end.row,
						dd._range.end.cell
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

					$(node).height(dd._height);

					// If cells have height set - resize them too
					$(node).children('.' + classcell).each(function () {
						if ($(this).css('height')) {
							$(this).css({
								height: dd._height + 'px',
								lineHeight: dd._height + 'px'
							});
						}
					});

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
			var items = cache.rows;

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

			var item, data, childrowheight;
			for (var i = from, l = items.length; i < l; i++) {
				item = items[i];

				// Cache by item id

				cache.indexById[item[idProperty]] = i;

				// Cache row position
				if (!indexOnly && variableRowHeight) {
					data = {
						top: (cache.rowPositions[i - 1]) ? (cache.rowPositions[i - 1].bottom - offset) : 0
					};

					if (item.height && item.height != self.options.rowHeight) {
						data.height = item.height;
					}

					data.bottom = data.top + (data.height || self.options.rowHeight);
					cache.rowPositions[i] = data;
				}
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
				row < 0 || cell >= self.options.columns.length || cell < 0) {
				return false;
			}

			var item = self.collection.getItem(row);
			if (typeof item.focusable === "boolean") return item.focusable;

			var columnMetadata = item.columns;
			if (
				columnMetadata &&
				columnMetadata[self.options.columns[cell].id] &&
				typeof columnMetadata[self.options.columns[cell].id].focusable === "boolean"
			) {
				return columnMetadata[self.options.columns[cell].id].focusable;
			}
			if (columnMetadata && columnMetadata[cell] && typeof columnMetadata[cell].focusable === "boolean") {
				return columnMetadata[cell].focusable;
			}

			return self.options.columns[cell].focusable;
		};


		// canCellBeSelected()
		// Can a given cell be selected?
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		// @return boolean
		canCellBeSelected = function (row, cell) {
			var c = self.options.columns;
			if (row >= getDataLength() || row < 0 || cell >= c.length || cell < 0) {
				return false;
			}

			var item = self.collection.getItem(row);
			if (typeof item.selectable === "boolean") {
				return item.selectable;
			}

			var columnMetadata = item.columns && (item.columns[c[cell].id] || item.columns[cell]);
			if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
				return columnMetadata.selectable;
			}

			return c[cell].selectable;
		};


		// cellExists()
		// Returns true if the requested cell exists in the data set
		//
		// @param	row		integer		Index of the row
		// @param	cell	integer		Index of the cell
		//
		// @return bolean
		cellExists = function (row, cell) {
			return !(row < 0 || row >= getDataLength() || cell < 0 || cell >= self.options.columns.length);
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

				var from = getCellNodeBox(range.fromRow, range.fromCell);
				var to = getCellNodeBox(range.toRow, range.toCell);

				if (from && to) {
					this.$el.css({
						top: from.top - 2,
						left: from.left - 2,
						height: to.bottom - from.top - 2,
						width: to.right - from.left - 3
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

				for (var i = 0, ii = self.options.columns.length; i < ii; i++) {
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
						var columnData = metadata[self.options.columns[i].id] || metadata[i];
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
					cache.columnPosRight[Math.min(self.options.columns.length - 1, i + colspan - 1)] < range.leftPx) {
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
		};


		// cleanupRows()
		// Cleans the row cache
		//
		// @param	rangeToKeep		object		A range of top/bottom values to keep
		//
		cleanupRows = function (rangeToKeep) {
			for (var i in cache.nodes) {
				if (((i = parseInt(i, 10)) !== activeRow) && (i < rangeToKeep.top || i > rangeToKeep.bottom)) {
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
			var item = getDataItem(activeRow),
				column = self.options.columns[activeCell];

			if (!currentEditor) return true;

			var showInvalid = function () {
				// Re-add the CSS class to trigger transitions, if any.
				$(activeCellNode)
					.removeClass(classinvalid)
					.width(); // force layout
				$(activeCellNode).addClass(classinvalid);

				self.trigger('onValidationError', self._event, {
					editor: currentEditor,
					cellNode: activeCellNode,
					validationResults: validationResults,
					row: activeRow,
					cell: activeCell,
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

						self.trigger('onAddNewRow', self._event, {
							item: newItem,
							column: column
						});
					} else {
						// Execute the operation
						currentEditor.applyValue(item, currentEditor.serializeValue());
						updateRow(activeRow);

						// Reset active cell
						makeActiveCellNormal();

						self.trigger('onCellChange', self._event, {
							row: activeRow,
							cell: activeCell,
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
			if (!result && activeCellNode) {
				var row = getRowFromNode(activeCellNode.parentNode),
					cell = getCellFromNode(activeCellNode),
					item = cache.rows[row],
					column = self.options.columns[cell];
				result = item.data[column.field] !== undefined ? item.data[column.field] : "";
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
					.on('keyup', function (e) {
						$(this).remove();
					});
			}
		};


		// createCssRules()
		// Generates the CSS styling that will drive the dimensions of the grid cells
		//
		createCssRules = function () {
			$style = $('<style type="text/css" rel="stylesheet"></style>').appendTo($("head"));
			var rowHeight = (self.options.rowHeight - cellHeightDiff) + 1;
			var rules = [
				"#" + uid + " ." + classrow + "{height:" + rowHeight + "px;line-height:" + (rowHeight + 1) + "px}"
			];

			for (var i = 0, l = self.options.columns.length; i < l; i++) {
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
		// Generates a SlickGrid grouping object from a column id
		//
		// @param	column_id		string		ID of a column to create grouping object for
		//
		// @return object
		createGroupingObject = function (column_id) {
			var column = getColumnById(column_id);

			return {
				collapsed: true,	// All groups start off being collapsed
				column_id: column.id,
				comparer: function (a, b) {
					return a.value - b.value;
				},
				displayTotalsRow: true,
				getter: function (item) {
					if (!item || item instanceof NonDataItem) return null;

					if (item instanceof Backbone.Model) {
						return item.get(column.field);
					} else {
						return item.data[column.field];
					}
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
				grouprows: {},
				predefinedValues: []
			};
		};


		// Collection()
		// This is a special class that looks an awful lot like Backbone.Collection and it
		// stores and manipulates the data set for this grid. Why not just use a Backbone.Collection?
		//	1) It's super slow for large data sets: https://github.com/jashkenas/backbone/issues/2760
		//	2) In order for 'remote' fetching to work nicely with scrolling, the collection has to
		//		simulate objects that haven't been fetched from the server yet. Backbone doesn't allow
		//		you to have "fake" data in their collections.
		//
		// @param	grid		object		Reference pointer to the grid instance
		//
		// @return object
		Collection = function (grid) {

			// Private Variables

			var self = this,
				filter = null,		// filter function
				filterArgs,
				filterCache = [],
				filteredItems = [],
				groupingDelimiter = ':|:',
				groups = [],
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

				calculateTotals,
				compileFilter,
				compiledFilter,
				compileFilterWithCaching,
				compiledFilterWithCaching,
				expandCollapseGroup,
				ensureRowsByIdCache,
				extractGroups,
				finalizeGroups,
				flattenGroupedRows,
				getFilteredAndPagedItems,
				getFunctionInfo,
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

			// Group definitions
			this.groups = [];

			// Size of the collection
			this.length = 0;


			// initialize()
			// Initializes the Data View
			//
			// @return object
			this.initialize = function () {

				// Process the data
				if (grid.options.data) {
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
						this.deleteItem(this.items[0][idProperty]);
					}

					// If "addRow" is enabled, make sure we don't insert below it
					if (grid.options.addRow && (
							(at && at > this.items.length) ||
							at === null || at === undefined
						) && !('__addRow' in toAdd[0])
					) {
						at = this.items.length - 1;
					}

					if (at !== null && at !== undefined) {
						Array.prototype.splice.apply(this.items, [at, 0].concat(toAdd));
						cacheRows((at > 0 ? at - 1 : 0));
					} else {
						var prevLength = this.items.length;
						Array.prototype.push.apply(this.items, toAdd);
						cacheRows(prevLength - 1);
					}
				}

				this.refresh();

				return this;
			};


			// TODO: ?
			calculateTotals = function (groups, level) {
				/*
				level = level || 0;
				var gi = self.groups[level];
				var idx = groups.length,
					g;
				while (idx--) {
					g = groups[idx];

					if (g.collapsed && !gi.aggregateCollapsed) {
						continue;
					}

					// Do a depth-first aggregation so that parent setGrouping aggregators
					// can access subgroup totals.
					if (g.groups) {
						calculateTotals(g.groups, level + 1);
					}

					if (gi.aggregators.length && (
						gi.aggregateEmpty || g.grouprows.length || (g.groups && g.groups.length))) {
					}
				}*/
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
			// @param	varArgs		Either a Group's "id" property, or a
			//						variable argument list of grouping values denoting a
			//						unique path to the row. For example, calling
			//						collapseGroup('high', '10%') will collapse the '10%' subgroup of
			//						the 'high' setGrouping.
			//
			this.collapseGroup = function (varArgs) {
				var args = Array.prototype.slice.call(arguments),
					arg0 = args[0];
				if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
					expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, true);
				} else {
					expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), true);
				}
			};


			// TODO: ?
			compileFilter = function () {
				console.error('compileFilter TODO');
				/*
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
				*/
			};


			// TODO: ?
			compileFilterWithCaching = function () {
				/*
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
				*/
			};


			// deleteItem()
			// Removes an item from the collection
			//
			// @param	id		string		ID of the row item
			//
			this.deleteItem = function (id) {
				if (id === undefined || id === null) {
					throw "Unable to delete collection item. Invalid 'id' supplied.";
				}

				var idx = cache.indexById[id];
				if (!idx) return;

				// Remove from items
				this.items.splice(idx, 1);

				// Clear cache
				delete cache.indexById[id];
				delete cache.rowPositions[idx];

				// TODO: Update length. Still needed?
				//if (grid.options.remote) this.length--;

				// Recache positions from affected row
				cacheRows(idx);

				// Re-render grid
				this.refresh();
			};


			// expandAllGroups()
			// @param	level	integer		Optional level to expand.
			//								If not specified, applies to all levels.
			//
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
			// @param	varArgs		Either a Group's "id" property, or a
			//						variable argument list of grouping values denoting a
			//						unique path to the row. For example, calling
			//						expandGroup('high', '10%') will expand the '10%' subgroup of
			//						the 'high' setGrouping.
			//
			this.expandGroup = function (varArgs) {
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


			// TODO: ?
			ensureRowsByIdCache = function () {
				if (!rowsById) {
					rowsById = {};
					for (var i = 0, l = cache.rows.length; i < l; i++) {
						if (cache.rows[i]) rowsById[cache.rows[i][idProperty]] = i;
					}
				}
			};


			// extractGroups()
			// Generates new group objects from the given rows
			//
			// @param	rows			??		TODO: ??
			// @param	parentGroup		??		TODO: ??
			//
			// @return array
			extractGroups = function (rows, parentGroup) {
				var group,
					val,
					groups = [],
					groupsByVal = {},
					r,
					level = parentGroup ? parentGroup.level + 1 : 0,
					gi = self.groups[level],
					i, l, predef;

				for (i = 0, l = gi.predefinedValues.length; i < l; i++) {
					predef = gi.predefinedValues[i];
					val = gi[predef];
					group = groupsByVal[val];
					if (!group) {
						group = new Group();
						group.value = val;
						group.level = level;
						group.predef = gi;
						group.id = '__group' + (parentGroup ? parentGroup.id + groupingDelimiter : '') + val;
						group.height = gi.grouprows[group.id] && gi.grouprows[group.id].height ? gi.grouprows[group.id].height : null;
						groups[groups.length] = group;
						groupsByVal[val] = group;
					}
				}

				for (i = 0, l = rows.length; i < l; i++) {
					r = rows[i];

					// Do not group grid aggregator
					if (r instanceof Aggregate && r.__gridAggregate) {
						groups.push(r);
						continue;
					}

					val = typeof gi.getter === "function" ? gi.getter(r) : r[gi.getter];
					group = groupsByVal[val];
					if (!group) {
						group = new Group();
						group.value = val;
						group.level = level;
						group.predef = gi;
						group.id = '__group' + (parentGroup ? parentGroup.id + groupingDelimiter : '') + val;
						group.height = gi.grouprows[group.id] && gi.grouprows[group.id].height ? gi.grouprows[group.id].height : null;
						groups[groups.length] = group;
						groupsByVal[val] = group;
					}

					group.grouprows[group.count++] = r;
				}

				if (level < self.groups.length - 1) {
					for (i = 0, l = groups.length; i < l; i++) {
						group = groups[i];
						group.groups = extractGroups(group.grouprows, group);
					}
				}

				groups.sort(self.groups[level].comparer);

				return groups;
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
					groupCollapsed = gi.collapsed,
					toggledGroups = toggledGroupsByLevel[level],
					idx = groups.length,
					g;

				while (idx--) {
					g = groups[idx];
					g.collapsed = groupCollapsed ^ toggledGroups[g.id];
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
				var gi = self.groups[level],
					groupedRows = [],
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

					if (g.totals && gi.displayTotalsRow && (!g.collapsed || gi.aggregateCollapsed)) {
						groupedRows[gl++] = g.totals;
					}
				}

				return groupedRows;
			};

			getFilteredAndPagedItems = function (items) {
				if (filter) {
					var batchFilter = self.options.inlineFilters ? compiledFilter : uncompiledFilter;
					var batchFilterWithCaching = self.options.inlineFilters ? compiledFilterWithCaching : uncompiledFilterWithCaching;

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
			};


			// TODO: ?
			getFunctionInfo = function (fn) {
				var fnRegex = new RegExp(/^function[^(]*\(([^)]*)\)\s*\{([\s\S]*)\}$/),
					matches = fn.toString().match(fnRegex);
				return {
					params: matches[1].split(","),
					body: matches[2]
				};
			};


			// TODO: ?
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


			// TODO: ?
			this.getItemByIdx = function (i) {
				return this.items[i];
			};


			// TODO: ?
			this.getPagingInfo = function () {
				var totalPages = pagesize ? Math.max(1, Math.ceil(totalRows / pagesize)) : 1;
				return {
					pageSize: pagesize,
					pageNum: pagenum,
					totalRows: totalRows,
					totalPages: totalPages
				};
			};


			// TODO: ?
			this.getRowById = function (id) {
				ensureRowsByIdCache();
				return rowsById[id];
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
									(item.__groupTotals || r.__groupTotals)
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
							formatter: function (row, cell, value, columnDef, data) {
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
			// @retrurn array
			parse = function (items) {
				var i, l = items.length, id, childrow;
				for (i = 0; i < l; i++) {
					// Validate that 'id' exists
					if (!(idProperty in items[i])) {
						throw "Each data item must have a unique 'id' key. The following item is missing an 'id': " + JSON.stringify(items[i]);
					}

					// Check for children columns
					if (items[i].rows) {
						for (var rowIdx in items[i].rows) {
							childrow = items[i].rows[rowIdx];
							if (!variableRowHeight && 'height' in childrow && childrow.height != grid.options.rowHeight) {
								variableRowHeight = true;
								break;
							}
						}
					}

					// Detect if variable row heights are used
					if (
						!variableRowHeight && 'height' in items[i] &&
						items[i].height !== grid.options.rowHeight
					) {
						variableRowHeight = true;
					}
				}

				return items;
			};


			// processAggregators()
			// Processes any aggregrators that are enabled and caches their results.
			// Then inserts new Aggregate rows that are needed.
			processAggregators = function () {
				// If nothing to aggregate -- goodbye!
				if (Object.keys(cache.aggregatorsByColumnId).length === 0) return;

				var item, i, l;
				// Loop through the data and process the aggregators
				for (i = 0, l = self.items.length; i < l; i++) {
					item = self.items[i];
					for (var column_id in cache.aggregatorsByColumnId) {
						cache.aggregatorsByColumnId[column_id].process(item);
					}
				}

				// Insert grid totals row
				var gridAggregate = new Aggregate(cache.aggregatorsByColumnId);
				// Mark this is the grid-level aggregate
				gridAggregate.__gridAggregate = true;
				self.items.push(gridAggregate);
			};


			// processGroupAggregators()
			// Processes the aggregation methods for each group.
			// Then inserts new Aggregate rows at the bottom of each.
			processGroupAggregators = function (groups) {
				// For each group we're going to generate a new aggregate row
				var i, l, group, item, column, column_id, ii, ll;
				for (i = 0, l = groups.length; i < l; i++) {
					group = groups[i];

					// Make sure this is a group row
					if (!(group instanceof Group)) continue;

					// Create a new aggregator instance for each column
					group.aggregators = {};
					for (column_id in cache.aggregatorsByColumnId) {
						// TODO: This can be optimized
						column = getColumnById(column_id);
						group.aggregators[column_id] = new column.aggregator(column);
					}

					// Loop through the group row data and process the aggregators
					for (ii = 0, ll = groups[i].grouprows.length; ii < ll; ii++) {
						item = groups[i].grouprows[ii];
						for (column_id in group.aggregators) {
							group.aggregators[column_id].process(item);
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
			//
			// @return array
			recalc = function (_items) {
				rowsById = null;

				if (refreshHints.isFilterNarrowing != prevRefreshHints.isFilterNarrowing ||
					refreshHints.isFilterExpanding != prevRefreshHints.isFilterExpanding) {
					filterCache = [];
				}

				var filteredItems = getFilteredAndPagedItems(_items);
				totalRows = filteredItems.totalRows;
				var newRows = filteredItems.rows;

				// Insert group rows
				groups = [];
				if (self.groups.length) {
					groups = extractGroups(newRows);
					if (groups.length) {
						processGroupAggregators(groups);
						finalizeGroups(groups);
						newRows = flattenGroupedRows(groups);
					}
				}

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

				return diff;
			};


			// refresh()
			// Automatically re-render the grid when rows have changed
			//
			this.refresh = function () {
				if (suspend) return;

				var countBefore = cache.rows.length,
					totalRowsBefore = totalRows,
					diff = recalc(this.items);

				// if the current page is no longer valid, go to last page and recalc
				// we suffer a performance penalty here, but the main loop (recalc)
				// remains highly optimized
				if (pagesize && totalRows < pagenum * pagesize) {
					pagenum = Math.max(0, Math.ceil(totalRows / pagesize) - 1);
					diff = recalc(this.items);
				}

				updated = null;
				prevRefreshHints = refreshHints;
				refreshHints = {};

				// Set data length
				this.length = cache.rows.length;

				if (totalRowsBefore != totalRows) {
					this.trigger('onPagingInfoChanged', {}, this.getPagingInfo());
				}

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
				processAggregators();

				if (recache) {
					cacheRows();
				}

				suspend = false;

				this.refresh();
			};


			// TODO: ?
			this.reSort = function () {
				if (sortComparer) {
					this.sort(sortComparer, sortAsc);
				}
			};


			// TODO: ?
			this.setFilter = function (filterFn) {
				filter = filterFn;
				if (self.options.inlineFilters) {
					compiledFilter = compileFilter();
					compiledFilterWithCaching = compileFilterWithCaching();
				}
				this.refresh();
			};


			// TODO: ?
			this.setFilterArgs = function (args) {
				filterArgs = args;
			};


			// setGrouping()
			// Sets the current grouping settings
			//
			// @param	options		array		List of grouping objects
			//
			this.setGrouping = function (options) {
				options = options || [];

				groups = [];
				toggledGroupsByLevel = [];
				this.groups = (options instanceof Array) ? options : [options];

				var gi, idx;
				for (var i = 0, l = this.groups.length; i < l; i++) {
					gi = this.groups[i];
					toggledGroupsByLevel[i] = {};
				}

				this.refresh();
			};


			// setItem()
			// Update and redraw an existing items
			//
			// @param	id		string		The id of the item to update
			// @param	data	object		The data to use for the item
			//
			// @return object
			this.setItem = function (id, data) {
				if (cache.indexById[id] === undefined) {
					throw "Unable to update item (id: " + id + "). Invalid or non-matching id";
				}

				// Update the row cache and the item
				var idx = cache.indexById[id];

				cache.rows[idx] = $.extend(true, cache.rows[idx], data);

				// Find the data item
				for (var i = 0, l = this.items.length; i < l; i++) {
					if (this.items[i].id == id) {
						this.items[i] = $.extend(true, this.items[i], data);
						break;
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


			// TODO: ?
			this.setPagingOptions = function (args) {
				if (args.pageSize !== undefined) {
					pagesize = args.pageSize;
					pagenum = pagesize ? Math.min(pagenum, Math.max(0, Math.ceil(totalRows / pagesize) - 1)) : 0;
				}

				if (args.pageNum !== undefined) {
					pagenum = Math.min(args.pageNum, Math.max(0, Math.ceil(totalRows / pagesize) - 1));
				}

				this.trigger('onPagingInfoChanged', {}, this.getPagingInfo());

				this.refresh();
			};


			// TODO: ?
			this.setRefreshHints = function (hints) {
				refreshHints = hints;
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
				this.items.sort(comparer);
				if (ascending === false) {
					this.items.reverse();
				}

				// TODO: This only needs to re-index ID, not recalculate positions.
				// Maybe update cacheRows to support different modes?
				cacheRows(null, true);
				this.refresh();
			};


			// TODO: ?
			uncompiledFilter = function (items, args) {
				var retval = [],
					idx = 0;

				for (var i = 0, ii = items.length; i < ii; i++) {
					if (filter(items[i], args)) {
						retval[idx++] = items[i];
					}
				}

				return retval;
			};


			// TODO: ?
			uncompiledFilterWithCaching = function (items, args, cache) {
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
			};


			// validate()
			// Ensures that the given items are valid. Returns a list of validated items.
			//
			// @param	items		array		Array of models to validate
			//
			// @return array
			validate = function (items) {
				var id;

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

			var self = this;

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
						// Escape out of here for 'Tab' and 'Enter' so that
						// the grid can capture that event
						if (event.which == 9 || event.which == 13) {
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

				// TODO: What is this? Looks interesting.
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
		// Deselects any selected cell ranges
		//
		deselectCells = function () {
			// Deselect the previous range
			var removeHash = {};
			if (selectedRows) {
				var clearAllColumns = {};
				for (var ic = 0, lc = self.options.columns.length; ic < lc; ic++) {
					clearAllColumns[self.options.columns[ic].id] = self.options.selectedClass;
				}

				for (var iw = 0, lw = selectedRows.length; iw < lw; iw++) {
					removeHash[selectedRows[iw]] = clearAllColumns;
				}
			}

			// Decelect cells
			updateCellCssStylesOnRenderedRows(null, removeHash);
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
				};

				$(document).on('click', bodyEscape);

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
				if (!this.open) return;

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
			};


			// position()
			// Positions the dropdown in the right spot
			//
			this.position = function () {
				var top = event.clientY - this.$parent.offset().top,
					left = event.clientX - this.$parent.offset().left;

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
			if (self.options.remote && !self.loader.isAllDataLoaded()) {
				// Empty the collection so that Backbone can re-fetch results in the right order
				self.collection.reset();

				// Invalidate Grid as we'll need to re-render it
				self.invalidate();

				// Ask the RemoteModel to refetch the data -- this time using the new sort settings
				// TODO: Find a better solution than touchViewport
				//self.touchViewport()
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

					value1 = dataRow1.get ? dataRow1.get(field) : dataRow1.data[field];
					value2 = dataRow2.get ? dataRow2.get(field) : dataRow2.data[field];

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


		// findFirstFocusableCell()
		// Given a row, returns the index of first focusable cell in that row
		//
		// @param	row		integer		Row index
		//
		// return integer
		findFirstFocusableCell = function (row) {
			var cell = 0;
			while (cell < self.options.columns.length) {
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
			while (cell < self.options.columns.length) {
				if (canCellBeActive(row, cell)) {
					lastFocusableCell = cell;
				}
				cell += getColspan(row, cell);
			}
			return lastFocusableCell;
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
			if (!activeCellNode) {
				return null;
			} else {
				return {
					row: activeRow,
					cell: activeCell
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
			var availableWidth = viewportHasVScroll ? viewportW - window.scrollbarDimensions.width : viewportW;
			var rowWidth = 0;
			var i = self.options.columns.length;
			while (i--) {
				rowWidth += self.options.columns[i].width;
			}

			return self.options.fullWidthRows ? Math.max(rowWidth, availableWidth) : rowWidth;
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

			for (var i = 0, l = self.options.columns.length; i < l && w < x; i++) {
				w += self.options.columns[i].width;
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
			if (!cellExists(row, cell)) {
				return null;
			}

			var y1, y2;
			if (variableRowHeight) {
				var pos = cache.rowPositions[row];
				y1 = pos.top;
				y2 = y1 + (pos.height || self.options.rowHeight) - 1;
			} else {
				y1 = self.options.rowHeight * row - offset;
				y2 = y1 + self.options.rowHeight - 1;
			}
			var x1 = 0;

			for (var i = 0; i < cell; i++) {
				x1 += self.options.columns[i].width;
			}

			var x2 = x1 + self.options.columns[cell].width;

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

			var columnData = item.columns[self.options.columns[cell].id] || item.columns[cell];
			var colspan = (columnData && columnData.colspan);
			if (colspan === "*") {
				colspan = self.options.columns.length - cell;
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
		// Gets the css rules for the given columns
		//
		// @param	idx		integer		Index of the column to get rules for
		//
		// @return object
		getColumnCssRules = function (idx) {
			if (!stylesheet) {
				var sheets = document.styleSheets,
					i, l;
				for (i = 0, l = sheets.length; i < l; i++) {
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


		// getColumnFromEvent()
		// Given an event object, attempts to figure out which column was acted upon
		//
		// @param	event	object		Javascript event object
		//
		// @return object
		getColumnFromEvent = function (event) {
			var $column = $(event.target).closest("." + classheadercolumn),
				column_id = $column && $column.length ? $column.attr('id').replace(uid, '') : null;
			return column_id ? getColumnById(column_id) : null;
		};


		// getColumnIndex()
		// Given a column's ID, returns the index of that column
		//
		// @param	id		string		ID of the column
		//
		// @return integer
		getColumnIndex = function (id) {
			return cache.columnsById[id];
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

			// Backbone Model support
			if (item instanceof Backbone.Model) {
				return item.get(columnDef.field);
			}

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
			var column = self.options.columns[cell],
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
			var columnOverrides = item.columns && (item.columns[column.id] || item.columns[getColumnIndex(column.id)]);

			// Pick formatter starting at the item formatter and working down to the default
			return item.formatter ||
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
			for (var i = 0, l = self.options.columns.length; i < l; i++) {
				headersWidth += self.options.columns[i].width;
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
		// ??
		//
		// @param	maxPosition		integer		??
		//
		// @return integer
		getRowFromPosition = function (maxPosition) {
			var row = 0,
				rowLength = getDataLength(),
				pos, lastpos, i;

			if (!variableRowHeight) {
				return Math.floor((maxPosition + offset) / self.options.rowHeight);
			} else if (rowLength) {
				// Loop through the row position cache and break when the row is found
				for (i = 0; i < rowLength; i++) {
					pos = cache.rowPositions[i];
					if (pos.top <= maxPosition && pos.bottom >= maxPosition) {
						row = i;
						continue;
					}
				}

				// Return the last row in the grid
				lastpos = cache.rowPositions[rowLength - 1];
				if (maxPosition > lastpos.bottom) {
					row = rowLength - 1;
				}
			} else {
				// TODO: This was a hack to get remote+variableRowHeight working. I'm not sure
				// why this works as. Investigate later.
				row = Math.floor((maxPosition + offset) / self.options.rowHeight);
			}

			return row;
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
			if (viewportTop === undefined || viewportTop === null) {
				viewportTop = scrollTop;
			}
			if (viewportLeft === undefined || viewportLeft === null) {
				viewportLeft = scrollLeft;
			}

			if (!variableRowHeight) {
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
		};


		// gotoCell()
		// Activates a given cell
		//
		// @param	row			integer		Index of the row
		// @param	cell		integer		Index of the cell
		// @param	forceEdit	boolean		TODO: ???
		//
		gotoCell = function (row, cell, forceEdit) {
			if (!initialized) {
				return;
			}
			if (!canCellBeActive(row, cell)) {
				return;
			}

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
				cell = posX = self.options.columns.length - 1;
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
			if (cell >= self.options.columns.length) {
				return null;
			}

			do {
				cell += getColspan(row, cell);
			}
			while (cell < self.options.columns.length && !canCellBeActive(row, cell));

			if (cell < self.options.columns.length) {
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
			this.collapsed = false;		// Whether the group is collapsed
			this.columns = {
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
		Group.prototype.toString = function () { return "Group"; };


		// handleActiveCellPositionChange()
		// Triggers the cell position change events and takes appropriate action
		//
		handleActiveCellPositionChange = function () {
			if (!activeCellNode) {
				return;
			}

			self.trigger('onActiveCellPositionChanged', {});
		};


		// handleClick()
		// Handles the click events on cells
		//
		// @param	e	object		Javascript event object
		//
		handleClick = function (e) {
			var cell = getCellFromEvent(e);
			if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
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

			if (e.isImmediatePropagationStopped()) {
				return;
			}

			// Set clicked cells to active
			if (canCellBeActive(cell.row, cell.cell)) {
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
			if ($cell.length === 0) {
				return;
			}

			// are we editing this cell?
			if (activeCellNode === $cell[0] && currentEditor !== null) {
				return;
			}

			self.trigger('onContextMenu', e);
		};


		// handleDblClick()
		// Handles the double click events on cells
		//
		// @param	e	object		Javascript event object
		//
		handleDblClick = function (e) {
			var cell = getCellFromEvent(e);
			if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
				return;
			}

			self.trigger('onDblClick', e, {
				row: cell.row,
				cell: cell.cell
			});

			if (e.isImmediatePropagationStopped()) {
				return;
			}

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
				self.trigger('onHeaderClick', event, {
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
			self.trigger('onHeaderContextMenu', event, {
				column: column
			});
		};


		// handleKeyDown()
		// Handles the key down events on cells. These are our keyboard shortcuts.
		//
		// @param	e	object		Javascript event object
		//
		handleKeyDown = function (e) {
			self.trigger('onKeyDown', e, {
				row: activeRow,
				cell: activeCell
			});

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
						} else {
							// If something is selected remove the selection range
							deselectCells();
						}
					// Page Down
					} else if (e.which == 34) {
						scrollPage(1);
						handled = true;
					// Page Up
					} else if (e.which == 33) {
						scrollPage(-1);
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


		// handleSelectedRangesChanges()
		// Handles the event for when selection range is changed
		//
		// @param	e	object		Javascript event object
		//
		handleSelectedRangesChanged = function (e, args) {
			self.selection = args.ranges;

			// Select currently selected
			deselectCells();

			// Select the new range
			selectedRows = [];
			var addHash = {};
			for (var i = 0, l = self.selection.length; i < l; i++) {
				for (var j = self.selection[i].fromRow; j <= self.selection[i].toRow; j++) {
					if (!addHash[j]) { // prevent duplicates
						selectedRows.push(j);
						addHash[j] = {};
					}
					for (var k = self.selection[i].fromCell; k <= self.selection[i].toCell; k++) {
						if (canCellBeSelected(j, k)) {
							addHash[j][self.options.columns[k].id] = self.options.selectedClass;
						}
					}
				}
			}

			// Select cells
			updateCellCssStylesOnRenderedRows(addHash);

			self.trigger('onSelectedRowsChanged', e, {
				rows: selectedRows,
				selection: self.selection
			});
		};


		// handleScroll()
		// Handles the offsets and event that need to fire when a user is scrolling
		//
		// @param	event		object		Javascript event object
		//
		handleScroll = function (event) {
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

					self.trigger('onViewportChanged', event, {});
				}
			}

			self.trigger('onScroll', event, {
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
		// Returns list of column_ids that the grid has a grouping for.
		// Otherwise returns false.
		//
		// @param	column_id	string		ID of the column to check grouping for
		//
		// @return boolean, array
		hasGrouping = function (column_id) {
			if (!column_id) return false;
			var column = getColumnById(column_id);
			if (!column) return false;
			var grouping = self.collection.groups,
				column_ids = _.pluck(grouping, 'column_id');
			return column_ids.indexOf(column_id) >= 0 ? column_ids : false;
		};


		// hasSorting()
		// Returns true if there is a sorting enabled for a given column id.
		//
		// @param	column_id	string		ID of the column to check sorting for
		//
		// @return boolean
		hasSorting = function (column_id) {
			if (!column_id) return false;
			var column_ids = _.pluck(sortColumns, 'columnId');
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
			if (self.options.columns[cell].editable === false) return false;

			// Is the data for this row loaded?
			if (row < dataLength && !getDataItem(row)) return false;

			// does this cell have an editor?
			if (!getEditor(row, cell)) return false;

			return true;
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
			delete postProcessedRows[row];
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
				if (currentEditor && activeRow === rows[i]) {
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
			return sortColumns.length ? true : false;
		};


		// makeActiveCellEditable()
		// Makes the currently active cell editable
		//
		// @param	editor		function		Editor factory to use
		//
		makeActiveCellEditable = function (editor) {
			if (!activeCellNode || self.options.editable !== true) return;

			// Cancel pending async call if there is one
			clearTimeout(h_editorLoader);

			var columnDef = self.options.columns[activeCell];
			var item = getDataItem(activeRow);

			if (self.trigger('onCellCssStylesChanged', {}, {
				row: activeRow,
				cell: activeCell,
				item: item,
				column: columnDef
			}) === false) {
				return;
			}

			$(activeCellNode).addClass("editable");

			// If no editor is given, clear the cell
			if (!editor) activeCellNode.innerHTML = "";

			var CellEditor = editor || getEditor(activeRow, activeCell);

			currentEditor = new CellEditor({
				grid: self,
				cell: activeCellNode,
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

			if (currentEditor.position) {
				handleActiveCellPositionChange();
			}
		};


		// makeActiveCellNormal()
		// Handler for cell styling when using an editor
		//
		makeActiveCellNormal = function () {
			if (!currentEditor) return;

			self.trigger('onBeforeCellEditorDestroy', {}, {
				editor: currentEditor
			});

			currentEditor.destroy();
			currentEditor = null;

			if (activeCellNode) {
				var d = getDataItem(activeRow);
				$(activeCellNode).removeClass("editable invalid");
				if (d) {
					var column = self.options.columns[activeCell];
					var formatter = getFormatter(activeRow, column);
					activeCellNode.innerHTML = formatter(activeRow, activeCell, getDataItemValueForColumn(d, column), column, d);
					invalidatePostProcessingResults(activeRow);
				}
			}
		};


		// measureCellPaddingAndBorder()
		// Header columns and cells may have different padding/border skewing width
		// calculations (box-sizing, hello?) calculate the diff so we can set consistent sizes
		//
		measureCellPaddingAndBorder = function () {
			var h = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"],
				v = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];

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
			if (!self.options.keyboardNavigation) {
				return false;
			}

			if (!activeCellNode && dir != "prev" && dir != "next") {
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
		};


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

			this.fromRow = Math.min(fromRow, toRow);
			this.fromCell = Math.min(fromCell, toCell);
			this.toRow = Math.max(fromRow, toRow);
			this.toCell = Math.max(fromCell, toCell);

			// contains()
			// Returns whether a range contains a given cell
			//
			// @param	row		integer		Row index
			// @param	cell	integer		Cell index
			//
			// @return boolean
			this.contains = function (row, cell) {
				return row >= this.fromRow && row <= this.toRow &&
					cell >= this.fromCell && cell <= this.toCell;
			};


			// isSingleCell()
			// Returns whether a range represents a single cell
			//
			// @return boolean
			this.isSingleCell = function () {
				return this.fromRow == this.toRow && this.fromCell == this.toCell;
			};


			// isSingleRow()
			// Returns whether a range represents a single row.
			//
			// @return boolean
			this.isSingleRow = function () {
				return this.fromRow == this.toRow;
			};


			// toCSV()
			// Converts the cell range values to CSV
			//
			// @return string
			this.toCSV = function () {
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
			this.toJSON = function () {
				var json = [], column, row, data;
				for (var i = this.fromRow; i <= this.toRow; i++) {
					row = cache.rows[i];
					data = [];
					for (var c = this.fromCell; c <= this.toCell; c++) {
						column = self.options.columns[c];
						data.push(row.data[column.field] !== undefined ? row.data[column.field] : "");
					}
					json.push(data);
				}
				return json;
			};


			// toString()
			// Returns a readable representation of a range
			//
			// @return string
			this.toString = function () {
				if (this.isSingleCell()) {
					return "Range (" + this.fromRow + ":" + this.fromCell + ")";
				} else {
					return "Range (" + this.fromRow + ":" + this.fromCell + " - " + this.toRow + ":" + this.toCell + ")";
				}
			};
		};


		// remove()
		// Removes a row of data from the grid
		//
		// @param	id			integer		Lookup data object via id instead
		//
		// @return object
		this.remove = function (id) {
			// TODO: Convert this to use a similar to input to Backbone.Collection.remove()
			this.collection.deleteItem(id);
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

			var newcolumns = this.options.columns.filter(function (c) {
				return c.id != column;
			});

			// If column had a grouping - remove that grouping
			if (hasGrouping(column)) {
				this.removeGrouping(column);
			}

			self.setColumns(newcolumns);
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

			var column_ids = hasGrouping(column);
			if (column_ids) {
				var idx = column_ids.indexOf(column);
				if (idx >= 0) {
					column_ids.splice(idx, 1);
				}
				this.setGrouping(column_ids);
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
			if (postProcessedRows[row]) {
				for (var i in postProcessedRows[row]) {
					col = self.options.columns[i];
					if (!col.cache) delete postProcessedRows[row][i];
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

			// Render missing rows
			renderRows(rendered);

			postProcessFromRow = visible.top;
			postProcessToRow = Math.min(getDataLength() - 1, visible.bottom);
			startPostProcessing();

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
			var m = self.options.columns[cell],
				mColumns = item.columns || {},
				rowI = Math.min(self.options.columns.length - 1, cell + colspan - 1),

				// Group rows do not inherit column class
				mClass = item instanceof Group ? "" : (m.class ? typeof m.class === "function" ? m.class() : m.class : null),

				cellCss = [classcell, "l" + cell, " r" + rowI];

			if (mClass) cellCss.push(mClass);
			if (row === activeRow && cell === activeCell) cellCss.push("active");
			if (mColumns[cell] && mColumns[cell].class) cellCss.push(mColumns[cell].class);

			result.push("<div class='" + cellCss.join(" ") + "'");

			result.push(">");

			// If this is a cached, postprocessed row -- use the cache
			if (m.cache && m.postprocess && postProcessedRows[row] && postProcessedRows[row][cell]) {
				result.push(postProcessedRows[row][cell]);
			} else if (item) {
				// if there is a corresponding row (if not, this is the Add New row or
				// this data hasn't been loaded yet)

				var value = getDataItemValueForColumn(item, m);
				try {
					result.push(getFormatter(row, m)(row, cell, value, m, item));
				} catch (e) {
					result.push('');
					console.error("Cell failed to render due to failed column formatter. Error: " + e.message, e);
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
			for (var i = 0, l = self.options.columns.length; i < l; i++) {
				column = self.options.columns[i];

				// Determine classes
				classes = [classheadercolumn, (column.headerClass || "")];
				if (column.sortable) classes.push(classheadersortable);

				// Determine width
				w = column.width - headerColumnWidthDiff;

				// Compensate for grid rendering
				if (i + 1 == l) w = w + 2;

				html.push('<div class="' + classes.join(' ') + '" style="width:' + w + 'px" ');
				html.push('id="' + (uid + column.id) + '"');

				// Tooltips
				if (column.tooltip) {
					if (self.options.tooltipType == 'title') {
						html.push(' title="' + (column.tooltip || "") + '"');
					}
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
					(row === activeRow ? " active" : "") +
					(row % 2 === 1 ? " odd" : ""),
				data = self.collection,
				top, pos = {};

			if (variableRowHeight) {
				pos = cache.rowPositions[row];
				top = (pos.top - offset);
			} else {
				top = self.options.rowHeight * row - offset;
			}

			if (d.class) rowCss += " " + (typeof d.class === 'function' ? d.class() : d.class);

			stringArray.push("<div class='" + rowCss + "' style='top:" + top + "px");

			// In variable row height mode we need some fancy ways to determine height
			if (variableRowHeight && pos.height) {
				var rowheight = pos.height - cellHeightDiff;
				stringArray.push(';height:' + rowheight + 'px;line-height:' + rowheight + 'px');
			}

			stringArray.push("'>");

			var colspan, m, i, l;
			for (i = 0, l = self.options.columns.length; i < l; i++) {
				m = self.options.columns[i];
				colspan = 1;

				// Render custom columns
				if (d.columns) {
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
			if (self.options.resizableRows) {
				stringArray.push('<div class="' + classrowhandle + '"></div>');
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
				dataLength = getDataLength(),
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
				if (activeCellNode && activeRow === i) {
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
				activeCellNode = getCellNode(activeRow, activeCell);
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

			// Clear remote data and touch viewport to re-draw it
			// TODO: Find a better solution to touchViewport
			/*if (this.options.remote) {
				this.touchViewport()
			}*/

			return this;
		};


		// resizeCanvas()
		// Resizes the canvas based on the current viewport dimensions
		//
		resizeCanvas = function () {
			if (!initialized) return;

			viewportH = getViewportHeight();

			if (!variableRowHeight) {
				numVisibleRows = Math.ceil(viewportH / self.options.rowHeight);
			} else {
				numVisibleRows = Math.ceil(getRowFromPosition(viewportH));
			}

			viewportW = parseFloat($.css(self.$el[0], "width", true));
			$viewport.height(viewportH);

			if (self.options.autoColumnWidth) {
				autosizeColumns();
			}

			updateRowCount();
			// TODO: This was in SlickGrid, but it's probably there to catch active cells being
			// out of bounds after a resize. There's got to be a better way to catch that
			// instead of calling handleScroll() which is pretty slow
			//handleScroll();

			// Since the width has changed, force the render() to reevaluate virtually rendered cells.
			lastRenderedScrollLeft = -1;
			render();
		};


		// rowsToRanges()
		// Given a list of row indexes, returns a list of ranges
		// TODO: This doesn't work... do we still need it?
		//
		// @return array
		rowsToRanges = function (rows) {
			var ranges = [],
				lastCell = self.options.columns.length - 1;

			for (var i = 0; i < rows.length; i++) {
				ranges.push(new Range(rows[i], 0, rows[i], lastCell));
			}

			return ranges;
		};


		// scrollCellIntoView()
		// Scroll the viewport until the given cell position is visible
		//
		// @param	row			integer		Row index
		// @param	cell		integer		Cell index
		// @param	doPaging	boolean		TODO: ??
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

			if (variableRowHeight) {
				if (targetRow < 0 || !cache.rowPositions[targetRow]) return;
				targetY = cache.rowPositions[targetRow].top;
			} else {
				targetY = targetRow * self.options.rowHeight;
			}
			scrollTo(targetY);

			render();

			if (self.options.keyboardNavigation && activeRow !== null) {
				var row = activeRow + deltaRows,
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
		// @param	doPaging	boolean		TODO: ??
		//
		scrollRowIntoView = function (row, doPaging) {
			var rowAtTop, rowAtBottom, pos;
			if (variableRowHeight) {
				pos = cache.rowPositions[row];
				rowAtTop = pos.top;
				rowAtBottom = pos.bottom - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0);
			} else {
				rowAtTop = row * self.options.rowHeight;
				rowAtBottom = (row + 1) * self.options.rowHeight - viewportH + (viewportHasHScroll ? window.scrollbarDimensions.height : 0);
			}

			// Need to page down?
			var pgdwn,
				pgup;
			if (!options.variableRowHeight) {
				pgdwn = (row + 1) * self.options.rowHeight > scrollTop + viewportH + offset;
				pgup = row * self.options.rowHeight < scrollTop + offset;
			} else {
				pgdwn = pos.bottom > scrollTop + viewportH + offset;
				pgup = pos.top < scrollTop + offset;
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
		};


		// scrollRowToTop()
		// Scroll the viewport so the given row is at the top
		//
		// @param	row		integer		Row index
		//
		scrollRowToTop = function (row) {

			if (!options.variableRowHeight) {
				scrollTo(row * self.options.rowHeight);
			} else {
				var pos = cache.rowPositions[row];
				scrollTo(pos.top);
			}

			render();
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

			if (offset != oldOffset) {
				var range = getVisibleRange(newScrollTop);
				cleanupRows(range);
			}

			if (prevScrollTop != newScrollTop) {
				vScrollDir = (prevScrollTop + oldOffset < newScrollTop + offset) ? 1 : -1;
				$viewport[0].scrollTop = (lastRenderedScrollTop = scrollTop = prevScrollTop = newScrollTop);

				self.trigger('onViewportChanged', {});
			}
		};


		// selectCells()
		// Select a range of cells
		//
		// @param	startRow	integer		Row on which to start selection
		// @param	startCell	integer		Cell on which to start selection
		// @param	endRow		integer		Row on which to end selection
		// @param	endCell		integer		Cell on which to end selection
		//
		// @return array
		this.selectCells = function (startRow, startCell, endRow, endCell) {
			if (!this.options.selectable) return;

			// Validate params
			if (startRow === undefined && startCell === undefined && endRow === undefined && endCell === undefined) {
				// If no params given - deselect
				deselectCells();

				// Remove selection store
				self.selection = null;

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
			var ranges = [new Range(startRow, startCell, endRow, endCell)];

			// Process the selection
			handleSelectedRangesChanged(null, {
				ranges: ranges
			});

			// Trigger range selection
			this.trigger('onCellRangeSelected', this._event, {
				ranges: ranges
			});
		};


		// setActiveCell()
		// Given a row and cell index, will set that cell as the active in the grid
		//
		// @param	row		integer		Row index
		// @param	cell	integer		Cell index
		//
		setActiveCell = function (row, cell) {
			if (!initialized) return;

			if (row > getDataLength() || row < 0 || cell >= self.options.columns.length || cell < 0) {
				return;
			}

			if (!self.options.keyboardNavigation) {
				return;
			}

			scrollCellIntoView(row, cell, false);
			setActiveCellInternal(getCellNode(row, cell), false);
		};


		// setActiveCellInternal()
		// Internal method for setting the active cell that bypasses any option restrictions
		//
		// @param	newCell			DOM			Cell node to set as the active cell
		// @param	setEdit			boolean		If true, will force cell to editable immediately
		//
		setActiveCellInternal = function (newCell, setEdit) {
			if (activeCellNode !== null) {
				makeActiveCellNormal();
				$(activeCellNode).removeClass("active");
				if (cache.nodes[activeRow]) {
					$(cache.nodes[activeRow].rowNode).removeClass("active");
				}
			}

			var activeCellChanged = (activeCellNode !== newCell);
			activeCellNode = newCell;

			if (activeCellNode !== null) {
				activeRow = getRowFromNode(activeCellNode.parentNode);
				activeCell = activePosX = getCellFromNode(activeCellNode);

				// If 'setEdit' is not defined, determine if cell is in autoEdit
				if (setEdit === null || setEdit === undefined) {
					setEdit = (activeRow == getDataLength()) || self.options.autoEdit;
				}

				$(activeCellNode).addClass("active");
				$(cache.nodes[activeRow].rowNode).addClass("active");

				if (self.options.editable && setEdit && isCellPotentiallyEditable(activeRow, activeCell)) {
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
				activeRow = activeCell = null;
			}

			if (activeCellChanged) {
				self.trigger('onActiveCellChanged', {}, getActiveCell());
			}
		};


		// setColumns()
		// Given a new column definitions object -- updates the grid to use it
		//
		// @param	columns		object		Column definitions object
		//
		this.setColumns = function (columns) {

			this.options.columns = columns;

			cache.columnsById = {};
			var m;
			for (var i = 0, l = this.options.columns.length; i < l; i++) {
				// TODO: This is ugly. Can anything be done?
				m = self.options.columns[i];
				m = self.options.columns[i] = $.extend(JSON.parse(JSON.stringify(columnDefaults)), m);

				cache.columnsById[m.id] = i;
				if (m.minWidth && m.width < m.minWidth) {
					m.width = m.minWidth;
				}
				if (m.maxWidth && m.width > m.maxWidth) {
					m.width = m.maxWidth;
				}
			}

			validateColumns();

			updateColumnCaches();

			this.trigger('onColumnsChanged', {}, {
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
		// @param	column_ids		array		List of column ids to group by
		//
		// @return object
		this.setGrouping = function (column_ids) {
			var grps = [];
			_.each(column_ids, function (cid) {
				grps.push(createGroupingObject(cid));
			});

			this.collection.setGrouping(grps);
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

			// Updating the sorting dictionary
			sortColumns = options;

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
					sortAsc: col.sortAsc
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
			$headers.filter(":ui-sortable").sortable("destroy");
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
				stop: function (e) {
					e.stopPropagation();

					var reorderedIds = $headers.sortable("toArray"),
						reorderedColumns = [],
						cindex;

					for (var i = 0, l = reorderedIds.length; i < l; i++) {
						cindex = getColumnIndex(reorderedIds[i].replace(uid, ""));
						reorderedColumns.push(self.options.columns[cindex]);
					}

					self.setColumns(reorderedColumns);
					self.trigger('onColumnsReordered', e);
					setupColumnResize();
				}
			});
		};


		// setupColumnResize()
		// Enables the resizing of columns.
		// TODO: Optimize me. I'm slow.
		// TODO: Perhaps assign the handle events on the whole header instead of on each element
		//
		setupColumnResize = function () {
			// If resizable columns are disabled -- return
			if (!self.options.resizableColumns) return;

			var $col, j, c, pageX, columnElements, minPageX, maxPageX, firstResizable, lastResizable;

			columnElements = $headers.children();
			columnElements.find("." + classhandle).remove();
			columnElements.each(function (i) {
				if (!self.options.columns[i].resizable) return;
				if (firstResizable === undefined) firstResizable = i;
				lastResizable = i;
			});

			// No resizable columns found
			if (firstResizable === undefined) return;

			var lockColumnWidths = function () {
				columnElements.each(function (i, e) {
					self.options.columns[i].previousWidth = $(e).outerWidth();
				});
			};

			var resizeColumn = function (i, d) {
				var actualMinWidth, x;
				x = d;
				if (d < 0) { // shrink column
					for (j = i; j >= 0; j--) {
						c = self.options.columns[j];
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

					if (self.options.autoColumnWidth) {
						x = -d;
						for (j = i + 1; j < columnElements.length; j++) {
							c = self.options.columns[j];
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
						c = self.options.columns[j];
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

					if (self.options.autoColumnWidth) {
						x = -d;
						for (j = i + 1; j < columnElements.length; j++) {
							c = self.options.columns[j];
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
			};

			var prepareLeeway = function (i, pageX) {
				var shrinkLeewayOnRight = null,
					stretchLeewayOnRight = null;

				if (self.options.autoColumnWidth) {
					shrinkLeewayOnRight = 0;
					stretchLeewayOnRight = 0;
					// colums on right affect maxPageX/minPageX
					for (j = i + 1; j < columnElements.length; j++) {
						c = self.options.columns[j];
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
					c = self.options.columns[j];
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
			};

			var headers = $headers.children();
			var applyColWidths = function () {
				applyColumnHeaderWidths(headers);
				if (self.options.resizeCells) {
					applyColumnWidths();
				}
			};

			var submitColResize = function () {
				var newWidth;
				for (j = 0; j < columnElements.length; j++) {
					c = self.options.columns[j];
					newWidth = $(columnElements[j]).outerWidth();

					if (c.previousWidth !== newWidth && c.rerenderOnResize) {
						invalidateAllRows();
					}
				}

				updateCanvasWidth(true);
				render();
				self.trigger('onColumnsResized', {});
			};

			// Assign double-click to auto-resize event
			// This is done once for the whole header because event assignments are expensive
			$headers.on("dblclick", function (event) {
				// Make sure we're clicking on a handle
				if (!$(event.target).closest('.' + classhandle).length) return;

				var columndef = getColumnFromEvent(event);
				if (!columndef) return;

				var column_index = cache.columnsById[columndef.id],
					$column = $(columnElements[column_index]),
					currentWidth = $column.width(),
					headerPadding = $column.outerWidth() - currentWidth;

				// Determine the width of the column name text
				var name = $column.children('.' + classcolumnname + ':first');
				name.css('overflow', 'visible');
				$column.width('auto');
				var headerWidth = $column.outerWidth();
				name.css('overflow', '');
				$column.width(currentWidth);

				// Determine the width of the widest visible value
				var cellWidths = [headerWidth];
				$canvas.find('.l' + column_index + ':visible')
					.removeClass('r' + column_index)
					.each(function () {
						var w = $(this).width() + headerPadding;
						if (cellWidths.indexOf(w) < 0) cellWidths.push(w);
					})
					.addClass('r' + column_index);

				var newWidth = Math.max.apply(null, cellWidths);

				// If new width is smaller than min width - leave
				if (typeof columndef.minWidth !== undefined && typeof columndef.minWidth !== null && newWidth < columndef.minWidth) {
					return;
				}

				if (currentWidth != newWidth) {
					var diff = newWidth - currentWidth;

					// Duplicate the drag functionality
					lockColumnWidths(column_index);
					prepareLeeway(column_index, pageX);
					resizeColumn(column_index, diff);
					applyColWidths();
					submitColResize();
				}
			});

			// Create drag handles
			// This has to be done for each drag handle to not conflict with drag reordering
			$.each(columnElements, function (i, columnEl) {
				if (i < firstResizable || (self.options.autoColumnWidth && i >= lastResizable)) {
					return;
				}

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
				if (!column.sortable) return;

				var sortOpts = null;
				for (var i = 0, l = sortColumns.length; i < l; i++) {
					if (sortColumns[i].columnId == column.id) {
						sortOpts = sortColumns[i];
						sortOpts.sortAsc = !sortOpts.sortAsc;
						break;
					}
				}

				if (e.metaKey && self.options.multiColumnSort) {
					if (sortOpts) {
						sortColumns.splice(i, 1);
					}
				} else {
					if ((!e.shiftKey && !e.metaKey) || !self.options.multiColumnSort) {
						sortColumns = [];
					}

					if (!sortOpts) {
						sortOpts = {
							columnId: column.id,
							sortAsc: column.sortAsc
						};
						sortColumns.push(sortOpts);
					} else if (sortColumns.length === 0) {
						sortColumns.push(sortOpts);
					}
				}

				styleSortColumns(sortColumns);

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
						sortCols: $.map(sortColumns, function (col) {
							return {
								sortCol: self.options.columns[getColumnIndex(col.columnId)],
								sortAsc: col.sortAsc
							};
						})
					};
				}

				// Execute sort
				executeSorter(args);

				// Fire onSort event
				self.trigger('onSort', e, args);
			});
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
			el.one("mouseleave", function (event) {
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
				if (el.attr('aria-describedby') === undefined) return;

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
					windowwidth = win.outerWidth(),
					windowheight = win.outerHeight();

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
			if (ascending === undefined) ascending = true;
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

			$.each(sortColumns, function (i, col) {
				if (col.sortAsc === null) {
					col.sortAsc = true;
				}
				var columnIndex = getColumnIndex(col.columnId);
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

			var column = args.column || false;

			// Menu data object which will define what the menu will have
			//
			// @param	divider		boolean		If true, item will be a divider
			// @param	enabled		boolean		Will draw item only if true
			// @param	name		string		Name of menu item to display to user
			// @param	fn			function	Function to execute when item clicked
			//
			var menuData = [{
				enabled: column && column.removable,
				name: column ? getLocale('column.remove', {name: column.name}) : '',
				fn: function () {
					self.removeColumn(column.id);
				}
			}, {
				enabled: column && column.sortable,
				divider: true
			}, {
				enabled: column && column.sortable && !hasSorting(column.id),
				name: column ? getLocale('column.sort_asc', {name: column.name}) : '',
				fn: function () {
					self.sortBy(column.id, true);
				}
			}, {
				enabled: column && column.sortable && !hasSorting(column.id),
				name: column ? getLocale('column.sort_desc', {name: column.name}) : '',
				fn: function () {
					self.sortBy(column.id, false);
				}
			}, {
				enabled: column && column.sortable && self.isSorted() && !hasSorting(column.id),
				name: column ? getLocale('column.add_sort_asc', {name: column.name}) : '',
				fn: function () {
					sortColumns.push({columnId: column.id, sortAsc: true});
					self.setSorting(sortColumns);
				}
			}, {
				enabled: column && column.sortable && self.isSorted() && !hasSorting(column.id),
				name: column ? getLocale('column.add_sort_desc', {name: column.name}) : '',
				fn: function () {
					sortColumns.push({columnId: column.id, sortAsc: false});
					self.setSorting(sortColumns);
				}
			}, {
				enabled: column && column.sortable && hasSorting(column.id),
				name: column ? getLocale('column.remove_sort', {name: column.name}) : '',
				fn: function () {
					sortColumns = _.filter(sortColumns, function (s) {
						return s.columnId != column.id;
					});
					self.setSorting(sortColumns);
				}
			}, {
				enabled: self.options.groupable && column && column.groupable,
				divider: true
			}, {
				enabled: self.options.groupable && column && column.groupable && (!hasGrouping(column.id) || !self.isGrouped()),
				name: column ? getLocale('column.group', {name: column.name}) : '',
				fn: function () {
					self.setGrouping([column.id]);
				}
			}, {
				enabled: self.options.groupable && column && column.groupable && !hasGrouping(column.id) && self.isGrouped(),
				name: column ? getLocale('column.add_group', {name: column.name}) : '',
				fn: function () {
					self.addGrouping(column.id);
				}
			}, {
				enabled: self.options.groupable && column && hasGrouping(column.id),
				name: column ? getLocale('column.remove_group', {name: column.name}) : '',
				fn: function () {
					self.removeGrouping(column.id);
				}
			}, {
				enabled: self.options.groupable && column && self.isGrouped(),
				name: getLocale("column.groups_clear"),
				fn: function () {
					self.setGrouping();
				}
			}, {
				enabled: self.options.groupable && column && self.isGrouped(),
				divider: true
			}, {
				enabled: self.options.groupable && column && self.isGrouped(),
				name: getLocale('column.groups_expand'),
				fn: function () {
					self.collection.expandAllGroups();
				}
			}, {
				enabled: self.options.groupable && column && self.isGrouped(),
				name: getLocale('column.groups_collapse'),
				fn: function () {
					self.collection.collapseAllGroups();
				}
			}, {
				enabled: column && (column.sortable || column.removable || column.groupable),
				divider: true
			}, {
				name: getLocale('column.auto_width'),
				value: self.options.autoColumnWidth,
				fn: function () {
					var force = !self.options.autoColumnWidth;
					self.setOptions({
						autoColumnWidth: force
					});
					if (force) autosizeColumns();

					// Re-render columns
					// Pending https://github.com/mleibman/SlickGrid/issues/686
					self.setColumns(self.options.columns);
				}
			}];

			// Render Menu
			var $menu = $('<div class="' + classcontextmenu + '"></div>');
			_.each(menuData, function (item) {
				if (item.enabled !== undefined && !item.enabled) return;
				if (item.divider) {
					$('<div class="divider"></div>').appendTo($menu);
				} else {
					var label = (item.name || ""),
						cls = "";
					if (item.value !== undefined) {
						if (item.value) cls = " on";
						label += '<span class="icon"></span>';
					}
					$('<div class="item' + cls + '">' + label + '</div>')
						.appendTo($menu)
						.click(function (event) {
							if (item.fn) item.fn(event);
						});
				}
			});

			// Create dropdown
			new Dropdown(event, {
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
				// The extra pixel here is to compensate for the grid cell layering
				$canvas.width(canvasWidth - 1);

				// And 2 pixels in the header for the same reason
				$headers.width(getHeadersWidth() + 2);
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
			for (var i = 0, l = self.options.columns.length; i < l; i++) {
				column = self.options.columns[i];
				cache.columnPosLeft[i] = x;
				cache.columnPosRight[i] = x + column.width;
				x += column.width;

				// Cache aggregators
				if (column.aggregator) {
					cache.aggregatorsByColumnId[column.id] = new column.aggregator(column);
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
				var m = self.options.columns[columnIdx],
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
		};


		// updateRowCount()
		// Updates the cache of row data
		//
		updateRowCount = function () {
			if (!initialized) return;

			var dataLength = getDataLength();

			var oldViewportHasVScroll = viewportHasVScroll;

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

			// remove the rows that are now outside of the data range
			// this helps avoid redundant calls to .remove() when the size of the data
			// decreased by thousands of rows
			for (var i in cache.nodes) {
				if (i >= dataLength) {
					removeRowFromCache(i);
				}
			}

			if (activeCellNode && activeRow > dataLength) {
				resetActiveCell();
			}

			var oldH = h;
			if (dataLength === 0) {
				th = viewportH - window.scrollbarDimensions.height;
			} else {
				var rowMax;
				if (!variableRowHeight) {
					rowMax = self.options.rowHeight * dataLength;
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

			if (self.options.autoColumnWidth && oldViewportHasVScroll != viewportHasVScroll) {
				autosizeColumns();
			}
			updateCanvasWidth(false);
		};


		// validateColumns()
		// Parses the options.columns list to ensure column data is correctly configured.
		//
		validateColumns = function () {
			if (!self.options.columns && !(self.options.data instanceof Backbone.Collection)) {
				return;
			}

			var c;
			for (var i = 0, l = self.options.columns.length; i < l; i++) {
				// Set defaults
				// TODO: This is ugly. Can anything be done?
				c = self.options.columns[i];
				c = self.options.columns[i] = $.extend(JSON.parse(JSON.stringify(columnDefaults)), c);

				// An "id" is required. If it's missing, auto-generate one
				if (!c.id) c.id = c.field + '_' + i || c.name + '_' + i;

				// TODO: This is temporarily here until grouping via remote data can be enabled
				if (self.options.remote) c.groupable = false;

				// Convert "tooltip" param to a Cumul8-friendly tooltip
				if (c.tooltip) {
					var cssClass = c.headerClass ? c.headerClass + " tooltip" : "tooltip";
					c.headeClass = cssClass;
					c.toolTip = c.tooltip;
				}

				// If any columns require asyncPostRender, enable it on the grid
				if (c.postprocess) enableAsyncPostRender = true;

				// If no width is set, use global default
				if (c.width === undefined || c.width === null) c.width = self.options.columnWidth;

				// If min/max width is set -- use it to reset given width
				if (c.minWidth && c.width < c.minWidth) c.width = c.minWidth;
				if (c.maxWidth && c.width > c.maxWidth)	c.width = c.maxWidth;

				// Build column id cache
				cache.columnsById[c.id] = i;
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

			// Ensure "data" option is an array
			if (!_.isArray(self.options.data)) {
				throw new TypeError('The "data" option must be an array.');
			}

			// Warn if "addRow" is used without "editable"
			if (self.options.addRow && !self.options.editable) {
				console.warn('In order to use "addRow", you must enable the "editable" parameter. The "addRow" option has been disabled.');
				self.options.addRow = false;
			}

			// If 'resizableRows' are enabled, turn on variableRowHeight mode
			if (self.options.resizableRows && !variableRowHeight) {
				variableRowHeight = true;
			}

			// Validate and pre-process
			validateColumns();
		};


		// Initialize the class
		return initialize();
	};

	return DobyGrid;
}));