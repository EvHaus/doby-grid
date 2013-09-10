Doby Grid
=========

Doby Grid is stand-alone module (and part of the Doby JS framework) for rendering a data-driven grid. It's based loosely on SlickGrid <https://github.com/mleibman/SlickGrid>.

### Dependencies

- jQuery 2.0.3 <http://jquery.com/>
- Underscore 1.4.4 <http://underscorejs.org/>

### FAQ

#### So how exactly is this different from SlickGrid?

There are several key differences. Doby Grid will:

- supports all SlickGrid features with easily configured options
- supports variable row heights
- has additional events required for tight integration
- provides a way to interact with cell and row DOM elements without compromising on performance
- integrates with Backbone Models and Collections
- does *not* support jQuery UI Themes
- comes in a single AMD-supported library, instead of various pieces that need to be compiled together