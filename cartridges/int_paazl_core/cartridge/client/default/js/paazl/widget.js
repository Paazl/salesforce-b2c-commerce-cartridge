'use strict';

/* global PaazlCheckout */

var constants = require('./constants');
var attributes = constants.attributes;
var selectors = constants.selectors;
var events = constants.events;
var oldValue = null;

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
    if (fieldValue.length === 0 || oldValue === fieldValue) {
        return;
    }

    oldValue = fieldValue;
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
 * @public setWidgetSearch
 *
 * Update search object.
 */
function setWidgetSearch() {
    if (typeof PaazlCheckout.setSearch !== 'function') return;

    if ('search' in paazlWidgetInit) {
        var search = paazlWidgetInit.search;

        var address = {
            street: $(selectors.address.street).val(),
            postalCode: $(selectors.address.postalCode).val(),
            houseNumberExtension: $(selectors.address.houseNumber).val(),
            city: $(selectors.address.city).val(),
            country: $(selectors.address.country).val()
        };

        search.address = address;
        PaazlCheckout.setSearch(search);
    }
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

    if (window.paazlWidgetRefreshZipStopTyping) {
        var typingTimer;
        var doneTypingInterval = 1000;

        scope.on(events.keyup, selectors.address.postalCode, function (e) {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(function() {
                updatePaazlWidget('setConsigneePostalCode', e);
                setWidgetSearch();
            }, doneTypingInterval);
        });

        scope.on(events.keydown, selectors.address.postalCode, function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode === 9) { // When tab key is pressed.
                return;
            }
            clearTimeout(typingTimer);
        });
    } else {
        scope.on(events.change, selectors.address.postalCode, function (e) {
            updatePaazlWidget('setConsigneePostalCode', e);
            setWidgetSearch();
        });
    }

    $(selectors.body).on(events.updateShippingMethods, onUpdateShippingMethods);
    $(document).on(events.click, selectors.paazlButtons, function preventSubmit(e) {
        e.preventDefault();
    });
}


module.exports = {
    assignListeners: assignListeners
};
