Doby Grid
=========

Doby Grid is stand-alone module (part of the Doby JS framework) for rendering a dynamic, data-driven grid. It's basically a `<table>` element on steroids.

---

### !!! Warning !!!!

Doby Grid is currently in **alpha** and not yet intended for production use. The library changes very rapidly, often with breaking changes. API methods and functions get renamed and parameters are reconfigured frequently. Documentation is only partially complete.

At this time we're looking for early testers who are interested in [contributing](https://github.com/globexdesigns/doby-grid/blob/master/CONTRIBUTING.md) to the development and testing of the library.

---

### Features

- Extremely fast rendering speed
- Adaptive virtual scrolling (handle millions of rows with extreme responsiveness)
- Data driven and fully MVC oriented
- Table header that sticks to the top when you scroll
- Ability to edit and create new rows and columns on the fly just like a spreadsheet
- Ability to resize/reorder/show/hide/auto-resize columns
- Ability to sort by more than 1 column at a time (multi-sort)
- Ability to group rows by a column value (including nested groups)
- Ability to double-click on column separator to maximize the column based its contents
- Ability to resize rows and insert rows of any height
- Ability to click+drag to select cells
- Ability to define multiple rows for a single data item
- Easily integrates with i18n libraries
- (TODO) Full keyboard navigation
- (TODO) Support for Backbone.Collection objects as data sets (including remote data fetching)
- (TODO) Ability to select rows, including common keyboard conventions such as shift+click to multi-select
- (TODO) Ability to export/import CSV/JSON data
- (TODO) Support for column footers with data aggregators
- (TODO) Support for on-the-fly filtering of column data (and searching)
- (TODO) Support for undo
- (TODO) Clipboard modes (CSV, HTML, etc...)

### Dependencies

- jQuery 2.0.3 <http://jquery.com/>
- Underscore 1.5.2 <http://underscorejs.org/>
- Backbone 1.0.0 <http://backbonejs.org/>

### Optional Dependencies

- jQuery.ui.sortable <http://jqueryui.com/> (for column re-ordering)
- jquery.event.drag <http://threedubmedia.com/code/event/drag> (for column and row re-sizing and cell range selection)

### Other Dependencies

Default icon set used is copyright of <http://p.yusukekamiyamane.com/>.

### Limitations

- If your grid is rendered inside an invisible element, or an element that is resized - you will need to manually call the `resize()` method to correct the rendering. Window resizing is auto-detected however.

---

### How To Use

Grab the latest version from <https://github.com/globexdesigns/doby-grid/tree/master/build>.

Doby Grid is made up of two files (doby-grid.js and doby-grid.css) and well as a theme package. You can choose which theme to download and use. You may also want to grab <https://github.com/globexdesigns/doby-grid/tree/master/assets> for images.

Then include it into your app either via Require JS, or by adding `<script>` and `<link>` tags to load in the Javascript and CSS files after the required dependencies.

Then simply call:

	new DobyGrid({...}).appendTo($(document.body))

### Documentation

Doby Grid has a lot of configurable options. Full documentation is provided on the wiki here: <https://github.com/globexdesigns/doby-grid/wiki>.

### Examples

See Doby Grid in action at: <http://www.dobyjs.com/grid/examples/>

### Submitting Bugs and Feature Requests

Please use GitHub issues: <https://github.com/globexdesigns/doby-grid/issues>

---

### FAQ

#### Why is Backbone a required module? Can't I use Angular, Knockout, or another MVC?

The Backbone is used for in Doby Grid for two reasons:

1) To make use of Backbone's great event objects for generating custom events
2) To easily integrate Doby Grid into the Doby framework

You can easily use another MVC module in your application, but Doby Grid needs Backbone to do its internal processing. If you're not a fan of Backbone -- don't worry -- it shouldn't affect anything you may be doing in your app with other frameworks, and its overhead is quite small.

#### This looks exactly like SlickGrid. What's the difference?

Doby Grid was indeed started as a fork of SlickGrid <https://github.com/mleibman/SlickGrid> but quickly evolved far beyond that. SlickGrid gives you module pieces and a raw foundation for building a grid, and expects you to fill in a lot of the blanks. This is simply too much work for what we wanted to do, so we created Doby Grid that packages the great work SlickGrid started into a nice single package requiring minimal out-of-the-box configuration.

Additionally, there are several other key differences. Doby Grid:

- supports variable (and re-sizable) row heights
- has more useful and consistent event triggers
- provides a way to interact with cell and row DOM elements without compromising on performance
- provide easy access to common functionality such as cell range selection, grouping or editing without the need to write "plugins"
- integrates with Backbone Models and Collections
- does *not* support jQuery UI Themes
- comes in a single AMD-supported library, instead of various pieces that need to be compiled together

Doby Grid tries to find a balance between performance and usability while offering developers ways to control which features they want to enable at a potential performance cost.

#### So it's like BackGrid then...

Nope. BackGrid <https://github.com/wyuenho/backgrid> has Backbone at its core for everything. Although it offers great flexibility because of the simplicity of having a Backbone API -- putting Backbone into the heart of the grid processing has made it much slower in processing your data sets. Doby Grid tries its best to keep up to the speed standards of SlickGrid.

#### So it's like SlickBack then...

Not really. SlickBack <https://github.com/teleological/slickback> is a bridge between Backbone and SlickGrid. It tries to make the two work together nicely. Doby Grid doesn't require you to use Backbone or SlickGrid in your web application.

#### I have a button inside a grid cell and I want to add a click event that picks up the id of the row data? How do I attach this event?

You have to attach the event to the whole grid and then isolate the cell you want. Attaching events is expensive so all events are attached to the container and then filtered down to the cell you want to focus on.

```
grid.on('click', function (event, args) {
	if ($(event.target).hasClass("my-button")) {
		var item = args.item;
	}
});
```

#### Why can't I assign events directly to my button?

This would require the grid to be rendered with DOM references - making it much, MUCH slower. If you want to use Doby Grid you must assign events as shown in the question above.

#### Ok, well what about if I absolutely cannot draw my cell until Doby Grid has finished rendering? Maybe it's a cell that's rendered after an ajax event is fired, or has some other external conditions...

If delegating events isn't enough, then you can use post-processing as demonstrated in the post-processing example. See the <a href="https://github.com/globexdesigns/doby-grid/wiki/Column-Options#wiki-doby-grid-postprocess">`postprocess`</a> Column Option for documentation. Keep in mind that this is going to have a very significant rendering performance hit and is not recommended on large grids.

And just to be clear -- do not use this for trying to assign events to your cell. It won't work and will only make your grid slow. All those references will be wiped when the grid is re-rendered or scrolled. Don't bother.

#### There's a bug in Internet Explorer...

Doby Grid does not support Internet Explorer. Don't bother posting bug reports. If it's something that affects all browsers - definitely let us know, but if it's an issue specific to IE6 or IE7 or IE8 or even IE9 -- sorry, Doby Grid is not for you.