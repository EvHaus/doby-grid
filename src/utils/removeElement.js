"use strict";

var CLS	= require('./../utils/classes');

/**
 * This seems to be the only reliable way to remove nodes from the DOM without creating a
 * DOM memory leak. See this post:
 * http://stackoverflow.com/questions/768621/how-to-dispose-of-dom-elements-in-javascript-to-avoid-memory-leaks?rq=1
 *
 * @method removeElement
 *
 * @param	{DOMObject}	element			- DOM node to remove
 *
 */
module.exports = function (element) {
	var garbageBin = document.getElementById(CLS.garbage);
	if (!garbageBin) {
		garbageBin = document.createElement('DIV');
		garbageBin.id = CLS.garbage;
		garbageBin.style.display = 'none';
		document.body.appendChild(garbageBin);
	}

	// Move the element to the garbage bin
	garbageBin.appendChild(element);
	garbageBin.innerHTML = '';
};