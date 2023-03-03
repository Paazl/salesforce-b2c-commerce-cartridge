'use strict';

/**
 * Controller that adds and removes products and coupons in the cart.
 * Also provides functions for the continue shopping button and minicart.
 *
 * @module controllers/Cart
 */

var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');

function fetchSummary () {
    var cart = app.getModel('Cart').get();
    var currentBasket = cart.object;
    var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
    var paazlShippingOption = paazlHelper.getSelectedShippingOption(currentBasket);
    Transaction.wrap(function() {
        cart.calculate();
    });
    app.getView({Basket: cart.object}).render('checkout/summaryOrderTotals');
}

/*
* Module exports
*/

/*
* Exposed methods.
*/
exports.FetchSummary = guard.ensure(['get'], fetchSummary);
