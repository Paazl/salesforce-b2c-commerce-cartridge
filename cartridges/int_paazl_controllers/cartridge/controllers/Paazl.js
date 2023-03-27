'use strict';

/**
 * Controller that adds and removes products and coupons in the cart.
 * Also provides functions for the continue shopping button and minicart.
 *
 * @module controllers/Cart
 */

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');

/**
 * Fetches the order summary for a Paazl order.
 */
function fetchSummary () {
    var Transaction = require('dw/system/Transaction');
    var cart = app.getModel('Cart').get();
    var currentBasket = cart.object;
    var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
    paazlHelper.getSelectedShippingOption(currentBasket);
    Transaction.wrap(function () {
        cart.calculate();
    });
    app.getView({ Basket: cart.object }).render('checkout/summaryOrderTotals');
}

/*
* Module exports
*/

/*
* Exposed methods.
*/
exports.FetchSummary = guard.ensure(['get'], fetchSummary);
