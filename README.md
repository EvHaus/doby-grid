Doby Grid
=========

Doby Grid is stand-alone module (and part of the Doby JS framework) for rendering a data-driven grid. It's based loosely on SlickGrid <https://github.com/mleibman/SlickGrid>.

**====================================================================================**
**DOBY GRID IS NOT READY FOR USE. WE WILL MAKE A FORMAL ANNOUNCEMENT WHEN IT IS READY.**
**====================================================================================**

---

### Features

- Adaptive virtual scrolling (handle millions of rows with extreme responsiveness)
- Table header that sticks to the top
- Extremely fast rendering speed
- Full keyboard navigation
- Column resize/reorder/show/hide/auto-resize
- Data driven and fully MVC oriented
- Support for editing and creating new rows, cells and columns on the fly just like a spreadsheet
- Column grouping, data filtering, and footer aggregators
- Integrates with your existing Backbone Collections and Models
- Easily integrates with i18n libraries

### Dependencies

- jQuery 2.0.3 <http://jquery.com/>
- Backbone 1.0.0 <http://backbonejs.org/>
- Underscore 1.4.4 <http://underscorejs.org/>

- jQuery.ui && jQuery.event.drag (Temporary... need to be removed)

Default icon set used is copyright of <http://p.yusukekamiyamane.com/>.

### How To Use

Download the *doby-grid.js* file and drop it into your web app. Then include into your app either via Require JS, or by adding a < script > tag after the required dependencies.

Then simply call:

	new DobyGrid({...}).appendTo($(document.body))

### Documentation

_Coming Soon_

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

#### There's a bug in Internet Explorer, where...

Doby Grid does not support Internet Explorer. Don't bother asking. If it's something that affects all browsers - definitely submit a new issue through Github, but if it's an issue specific to IE6 or IE7 or IE8 or even IE9 -- sorry, Doby Grid is not for you.