/*global define, $*/

define(['faker'], function (Faker) {
	"use strict";

	return [function () {

		// Generate Data
		var data = [];
		for (var i = 0; i < 10000; i++) {
			data.push({
				id: i,
				data: {
					id: i,
					name: Faker.Name.findName(),
					age: "100 years",
					city: Faker.Address.city(),
					country: Faker.Address.ukCountry()
				}
			});
		}

		var editor = function (options) {
			var $input, currentValue;

			// initialize()
			// The editor is actived when an active cell in the grid is focused.
			// This should generate any DOM elements you want to use for your editor.
			//
			this.initialize = function () {
				$input = $('<input type="text" class="editor" placeholder="' + currentValue + '"/>')
					.appendTo(options.cell)
							.on("keydown", function (event) {
								// Left or right arrow keys will prevent editor from saving
								// results and will instead, move the text cursor
								if (event.keyCode === 37 || event.keyCode === 39) {
									event.stopImmediatePropagation();
								}
							})
					.focus()
					.select();
			};


			// applyValue()
			// This is the function that will update the data model in the grid.
			//
			// @param   item        object      The data model for the item being edited
			// @param   column		objet		The column object being edited
			// @param   value       string      The user-input value being entered
			//
			this.applyValue = function (item, column, value) {
				item.data[column.field] = value;
			};


			// cancel()
			// Cancel the edit and return the cell to its default state
			//
			this.cancel = function () {
				this.destroy();
				$(options.cell).html(currentValue);
			};


			// destroy()
			// Destroys any elements your editor has created.
			//
			this.destroy = function () {
				$input.remove();
			};


			// focus()
			// When the cell with an initialized editor is focused
			//
			this.focus = function () {
				$input.focus();
			};


			// getValue()
			// Gets the current value of whatever the user has inputted
			//
			// @return string
			this.getValue = function () {
				return $input.val();
			};


			// isValueChanged()
			// Determines whether or not the value has changed
			//
			// @return boolean
			this.isValueChanged = function () {
				return (!($input.val() === "" && currentValue === null)) && ($input.val() != currentValue);
			};


			// loadValue()
			// Loads the current value for the item
			//
			// @param   item    object      Data model object that is being edited
			//
			this.loadValue = function (item) {
				currentValue = item.data[options.column.field] || "";
			};


			// serializeValue()
			// Process the input value before submitting it
			//
			this.serializeValue = function () {
				return $input.val();
			};


			// setValue()
			// Sets the value inside your editor, in case some internal grid calls needs to do
			// it dynamically.
			//
			// @param   val     string      Value to set
			//
			this.setValue = function (val) {
				$input.val(val);
			};


			// validate()
			// Validation step for the value before allowing a save. Should return back
			// and object with two keys: `valid` (boolean) and `msg` (string) for the error
			// message (if any).
			//
			// @return object
			this.validate = function () {
				if (options.column.validator) {
					var validationResults = options.column.validator($input.val());
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

		return {
			autoColumnWidth: true,
			autoEdit: true,
			columns: [{
				id: "id",
				name: "ID",
				field: "id",
				sortable: true,
				removable: true
			}, {
				id: "name",
				name: "Name",
				field: "name",
				minWidth: 100,
				sortable: true,
				removable: true
			}, {
				id: "age",
				name: "Age",
				field: "age",
				sortable: true,
				removable: true
			}, {
				id: "city",
				name: "City",
				field: "city",
				sortable: true,
				visible: false,
				removable: true
			}, {
				id: "country",
				name: "Country",
				field: "country",
				sortable: true,
				removable: true
			}],
			data: data,
			//editor: editor,
			editable: true,
			quickFilter: true
		};
	}];
});