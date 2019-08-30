'use strict';


var base = module.superModule;

// expose same methods as base
Object.keys(base).forEach(function (key) {
    module.exports[key] = base[key];
});

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {Object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @returns {Object} an error object
 */
function placeOrder (order, fraudDetectionStatus) {
    var result = base.placeOrder(order, fraudDetectionStatus);
    try {
        if (result.error === false) {
            var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
            var paazlStatus = paazlHelper.getPaazlStatus(order.defaultShipment);
            // Check if Paazl is enable or not
            if (paazlStatus.active) {
                // If Paazl is active update the order shipping address with paazl shiiping address - only in case of pickup point delivery
                paazlHelper.updateShipment(order);
            }
        }
    } catch (e) {
        result.error = true;
    }
    return result;
}

module.exports.placeOrder = placeOrder;
