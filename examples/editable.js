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

			// initialize()
			// The editor is actived when an active cell in the grid is focused.
			// This should generate any DOM elements you want to use for your editor.
			//
			this.initialize = function () {
				// Will hold the current value of the item being edited
				this.loadValue(options.item);

				var value = this.currentValue;
				if (value === null || value === undefined) value = "";

				this.$input = $('<input type="text" class="doby-grid-editor" value="' + value + '"/>')
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
				$(options.cell).html(this.currentValue);
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
			// @param   item    object      Data model object that is being edited
			//
			this.loadValue = function (item) {
				this.currentValue = item.data[options.column.field] || "";
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
			// @param   val     string      Value to set
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
				if (options.column.validator) {
					var validationResults = options.column.validator(this.$input.val());
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
			editor: editor,
			editable: true,
			quickFilter: true
		};
	}];
});