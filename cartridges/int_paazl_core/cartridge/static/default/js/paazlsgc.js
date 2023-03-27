/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var attributes = {
    paazlID: 'paazl-id'
};

var selectors = {
    body: 'body',
    endlines: 'end-lines',
    hide: 'hide',
    paazlButtons: '#paazl-checkout button:not([type="submit"])',
    paazlCheckoutOptionPrefix: '#shippingMethod-',
    paazlCheckoutOptionPrefixSG: '#shipping-method-',
    paazlID: '[data-' + attributes.paazlID + ']',
    paazlWrapper: '#paazl-checkout',
    forms: {
        shipping: 'form[name*="_shipping"]',
        billing: 'form[name$="_billing"]',
        shippingFormPrefix: '.js-shippingform-',
        billingFormPrefix: '.js-billingform-',
        paazlWidgetForm: '.js-paazlwidget-form'
    },
    address: {
        summary: '.shipping-summary .address-summary',
        street: 'input[name$=_address1]',
        houseNumber: 'input[name$=_address2]',
        addition: false,
        postalCode: 'input[name*=_postal]',
        city: 'input[name$=_city]',
        country: 'select[name*=_country]'
    }
};

var events = {
    blur: 'blur',
    change: 'change',
    click: 'click',
    updateShippingMethods: 'shipping:updateShippingMethods'
};

module.exports = {
    attributes: attributes,
    selectors: selectors,
    events: events
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* global PaazlCheckout */

var selectors = __webpack_require__(0).selectors;
var addressSummary = __webpack_require__(2);
var widget = __webpack_require__(3);

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


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(0);
var selectors = constants.selectors;

/**
 * @private Populate the Shipping Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique summary address
 * @param {Object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        $('.' + attr, parentSelector).text(val || '');
    });
}

/**
  * @public assignListeners
  * Assigns listener on document.ajaxSuccess
*/
function assignListeners() {
    $(document).ajaxSuccess(function (event, xhr, settings) {
    // Stop if this is not an ajax call for the shipment submitting or payment submitting
        if (settings.url.indexOf('CheckoutShippingServices-SubmitShipping') === -1) {
            if (settings.url.indexOf('CheckoutServices-SubmitPayment') === -1) {
                return;
            }
        }

        var data = xhr.responseJSON;

        // Stop if the shipping method is not Paazl
        if (!(data && data.paazlStatus && data.paazlStatus.active && data.paazlShippingMethod)) {
            return;
        }

        // Stop if the pickupLocation and/or it's address is not available
        if (!(data.paazlShippingMethod.pickupLocation && data.paazlShippingMethod.pickupLocation.address)) {
            return;
        }

        // Populare the address summary on the billing page with the pickuplocation address.
        var pickupAddress = data.paazlShippingMethod.pickupLocation.address;
        populateAddressSummary(selectors.address.summary, pickupAddress);
    });
}

module.exports = {
    assignListeners: assignListeners
};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* global PaazlCheckout */

var constants = __webpack_require__(0);
var attributes = constants.attributes;
var selectors = constants.selectors;
var events = constants.events;

var observer;
var paazlID = $(selectors.paazlID).data(attributes.paazlID);

/**
 * @private widgetUpdatedCallback
 * @description
 *
 * Callback method which is called right after the PaazlWidget
 * has been updated.
 */
function widgetUpdatedCallback() {
    $.spinner().stop();
    observer.disconnect();
}

/**
  * @public updatePaazlWidget
  * @param {string} methodName - The name of the PaazlWidget method
  * @param {event} e - The event
  *
  * On country or postal code change, send the values to the PaazlWidget
  * which in turn will update the delivery and pickup methods
*/
function updatePaazlWidget(methodName, e) {
    var $el = $(e.target);

    // Stop if the jQuery element does not exist
    if (!$el[0]) {
        return;
    }

    var fieldValue = $el.val();

    // Stop if there is no value
    if (fieldValue.length === 0) {
        return;
    }

    $.spinner().start();
    observer = new MutationObserver(widgetUpdatedCallback);
    observer.observe(document.getElementById('paazl-checkout'), {
        attributes: true,
        childList: true,
        subtree: true
    });

    // Call the method with the value
    PaazlCheckout[methodName](fieldValue);
}

/**
 * @public onUpdateShippingMethods
 *
 * @param {Event} evt - an Ajax Success Event
 * @param {JSON} resp - a JSON object
 */
function onUpdateShippingMethods(evt, resp) {
    if ('paazlWidgetInit' in window && undefined !== (window.paazlWidgetInit) && window.paazlWidgetInit !== null) {
        // SFRA
        if (resp && resp.shipping && resp.shipping.selectedShippingMethod && resp.shipping.selectedShippingMethod.ID === paazlID) {
            var paazlCheckoutOption = selectors.paazlCheckoutOptionPrefix + paazlID;
            var $wrapper = $(paazlCheckoutOption).parent();

            if ($wrapper.find(selectors.paazlWrapper).length === 0) {
                var $nextEl = $wrapper.next();
                if ($nextEl.hasClass(selectors.endlines)) {
                    $nextEl.remove();
                }
                $wrapper.after('<div id="' + selectors.paazlWrapper.substr(1) + '">');
                PaazlCheckout.init(paazlWidgetInit);
            }

            $(selectors.address.country).trigger(events.change);
            $(selectors.address.postalCode).trigger(events.change);
            return;
        }

        // SG
        var paazlWrapper = $(selectors.paazlWrapper);
        if (resp && resp.shipping && resp.shipping.shippingMethodID && resp.shipping.shippingMethodID === paazlID) {
            paazlWrapper.removeClass(selectors.hide);

            if (paazlWrapper.children().length === 0) {
                PaazlCheckout.init(paazlWidgetInit);
            }

            $(selectors.address.country).trigger(events.change);
            $(selectors.address.postalCode).trigger(events.change);
        } else {
            paazlWrapper.addClass(selectors.hide);
        }
    }
}

/**
  * @public assignListeners
  * @param {string} scope - The form selector
  * Assigns listeners for the PaazlWidget
*/
function assignListeners(scope) {
    scope.on(events.change, selectors.address.country, updatePaazlWidget.bind(null, 'setConsigneeCountryCode'));
    scope.on(events.change, selectors.address.postalCode, updatePaazlWidget.bind(null, 'setConsigneePostalCode'));
    $(selectors.body).on(events.updateShippingMethods, onUpdateShippingMethods);
    $(document).on(events.click, selectors.paazlButtons, function preventSubmit(e) {
        e.preventDefault();
    });
}


module.exports = {
    assignListeners: assignListeners
};


/***/ }),
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



$(document).ready(function () {
    __webpack_require__(1);

    window.onPaazlSelect = function(selected) {
        var url = window.paazlSummaryUrl;
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                var $container = $('.checkout-order-totals .order-totals-table');
                $container.replaceWith(data);
            }
        });
    };
});


/***/ })
/******/ ]);