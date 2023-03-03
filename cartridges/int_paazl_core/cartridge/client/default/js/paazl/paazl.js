'use strict';

/* global PaazlCheckout */

var selectors = require('./constants').selectors;
var addressSummary = require('./address_summary');
var widget = require('./widget');

/**
  * Global init
*/
function init() {
    // Check if the global PaazlCheckout object exists
    if (PaazlCheckout) {
    // Assign listeners for the PaazlWidget based on the form that it's in
        var $paazlWidgetForm = $(selectors.forms.paazlWidgetForm);

        if ($paazlWidgetForm[0]) {
            widget.assignListeners($paazlWidgetForm);
        }
    }

    // Assigns listener on document.ajaxSuccess for the shipping address summary
    var $addressSummary = $(selectors.address.summary);
    if ($addressSummary[0]) {
        addressSummary.assignListeners();
    }
}

init();
