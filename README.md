Doby Grid
=========

Doby Grid is stand-alone module (and part of the Doby JS framework) for rendering a dynamic, data-driven grid. It's basically a <table> element on steroids and is loosely based on SlickGrid <https://github.com/mleibman/SlickGrid>.

**===================================================================================**
** DOBYGRID IS NOT READY FOR PUBLIC USE AND CHANGES FREQUENTLY. DOCS MAY BE MISSING  **
**===================================================================================**

---

### Features

- Extremely fast rendering speed
- Adaptive virtual scrolling (handle millions of rows with extreme responsiveness)
- Data driven and fully MVC oriented
- Table header that sticks to the top when you scroll
- Ability to resize/reorder/show/hide/auto-resize columns
- Ability to sort by more than 1 column at a time (multi-sort)
- Ability to group rows by a column value (including nested groups)
- Ability to double-click on column separator to maximize the column based its contents
- Easily integrates with i18n libraries
- (TOOD) Variable row heights and dynamic row scaling
- (TODO) Full keyboard navigation
- (TODO) Support for editing and creating new rows, cells and columns on the fly just like a spreadsheet
- (TODO) Support for Backbone.Collection objects as data sets (including remote data fetching)
- (TODO) Ability to select rows, including common keyboard conventions such as shift+click to multi-select
- (TODO) Ability to click+drag to select cells
- (TODO) Ability to export/import CSV/JSON data
- (TODO) Support for column footers with data aggregators
- (TODO) Support for on-the-fly filtering of column data (and searching)

### Dependencies

- jQuery 2.0.3 <http://jquery.com/>
- Underscore 1.4.4 <http://underscorejs.org/>
- Backbone 1.0.0 <http://backbonejs.org/>

### Optional Dependencies

- jQuery.ui.draggable (for column re-sizing)
- jQuery.ui.sortable (for column re-ordering)

### Other Dependencies

Default icon set used is copyright of <http://p.yusukekamiyamane.com/>.

### Limitations

- If the grid is rendered inside an invisible element, or an element that is resized - you will need to manually detect it and call "resize()" to correct the rendering. Window resizing is auto-detected.
- Using variable row heights will have a severe speed impact. If you can get away with predefined row heights - that will make the grid faster.

---

### How To Use

Download the *doby-grid.js* file and drop it into your web app. Then include into your app either via Require JS, or by adding a < script > tag after the required dependencies.

Then simply call:

	new DobyGrid({...}).appendTo($(document.body))

### Documentation

See <https://github.com/globexdesigns/doby-grid/wiki>.

---

### FAQ

#### Why is Backbone a required module? Can't I use Angular, Knockout, or another MVC?

The Backbone is used for in Doby Grid for two reasons:

1) To make use of Backbone's great Events objects for generating custom events
2) To easily integrate Doby Grid into the Doby framework (coming soon)

You can easily use another MVC module in your application, but Doby Grid needs Backbone to do its internal processing. If you're not a fan of Backbone -- don't worry -- it shouldn't affect anything you may be doing in your app with other frameworks.

#### So how exactly is this different from SlickGrid?

SlickGrid gives you module pieces and a raw foundation for building grid, and expects you to fill in a lot of the blanks. This is simply too much work for what we wanted to do, so we created Doby Grid that packages the great work SlickGrid started into a nice single package requiring minimal out-of-the-box configuration.

Additionally, there are several other key differences. Doby Grid will:

- supports variable row heights
- has additional events required for tight integration
- provides a way to interact with cell and row DOM elements without compromising on performance
- integrates with Backbone Models and Collections
- does *not* support jQuery UI Themes
- comes in a single AMD-supported library, instead of various pieces that need to be compiled together
- be open minded to all feature request, pull requests and suggestions

Doby Grid tries to find a balance between performance and usability while offering developers ways to control which features they want to enable at a potential performance cost.

#### So it's BackGrid then...

Nope. BackGrid has Backbone at its core for everything. Although it offers great flexibility because of the simplicity of having a Backbone API -- putting Backbone into the heart of the grid processing has made it much slower in processing your data sets. Doby Grid tries its best to keep up the speed of SlickGrid.

#### So it's like SlickBack then...

Not really. SlickBack is a bridge between Backbone and SlickGrid. It tries to make the two work together nicely. Doby Grid is pretty detached from Backbone and SlickGrid and can be a standalone module that doesn't rely on either.

#### I have a button inside a grid cell and I want to add a click event that picks up the id of the row data? How do I attach this event?

You have to attach the event to the whole grid and then isolate the cell you want. Attaching events is expensive so all events are attached to the container and then filtered down to the cell you want to focus on.

```
grid.on('on', function (event, args) {
	if ($(event.target).hasClass("my-button")) {
		var item = grid.getItem(args.row);
	}
});
```

#### Why can't I assign events directly to my button?

This would require the grid to be rendered with DOM references - making it much, MUCH slower. If you want to use DobyGrid() you must assign events as shown in the question above.

#### Ok, well what about if I absolutely cannot draw my cell until DobyGrid() has finished rendering? Maybe it's a cell that's rendered after an Ajax event is fired, or has some other external conditions...

If delegating events isn't enough, then you can use post-processing as demonstrated here: <http://INSERT_LIKE_TO_WIKI_HERE>. Keep in mind that this is going to have a very significant rendering performance hit and is not recommended on large grids.

```
columns = [{
	field: 'user',
	name: 'user',
	id: 'user',
	formatter: function() {
		return 'loading...'
	},
	asyncPostRender: function(cellNode, row, dataContext, colDef) {
		$('<div>MyData</div>').appendTo($(cellNode))
	}
}]
```

And just to be clear -- do not use this for trying to assign events to your cell. It won't work and will only make your grid slow. All those references will be wiped when the grid is re-rendered. Don't bother.

#### When using post-processing, my rows keep getting re-rendered when I scroll up and down. How do I stop that?

SlickGrid had this problem and wasn't going to fix it (<https://github.com/mleibman/SlickGrid/issues/681>). In DobyGrid you can enable post-processing caching. This is not recommended for large grid however as it will eat up a lot of memory.

#### There's a bug in Internet Explorer, where...

Doby Grid does not support Internet Explorer. Don't bother asking. If it's something that affects all browsers - definitely submit a new issue through Github, but if it's an issue specific to IE6 or IE7 or IE8 or even IE9 -- sorry, Doby Grid is not for you.