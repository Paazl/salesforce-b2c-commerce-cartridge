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

/**
 * Address completion
 * For Dutch addresses, Get the Street name and City based on postcode and street number
 */
function addressNL () {
    var addressService = require('*/cartridge/scripts/services/SOAP/paazlAddressValidation');
    var addressValidationObj = {};

    // Fetch the basket UUID
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        addressValidationObj = {
            success: false,
            errorMessage: 'No existing basket'
        };
    }
    var paazlReferenceID = currentBasket.UUID;

    // The house number and postal code values must be passed to this call
    var zipCode = request.httpParameterMap.postalCode.value; // eslint-disable-line no-undef
    var houseNbr = request.httpParameterMap.houseNbr.value; // eslint-disable-line no-undef
    var country = request.httpParameterMap.country.value; // eslint-disable-line no-undef
    if (!country || country !== 'NL') {
        addressValidationObj = {
            success: false,
            errorMessage: 'Current country not supported'
        };
    }
    if (!zipCode) {
        addressValidationObj = {
            success: false,
            errorMessage: 'ZipCode is missing'
        };
    }

    if (!houseNbr) {
        addressValidationObj = {
            success: false,
            errorMessage: 'House number is missing'
        };
    }

    var result = addressService.address({ zipCode: zipCode, paazlReferenceID: paazlReferenceID, houseNbr: houseNbr });
    if (result.success) {
        addressValidationObj = {
            success: true,
            address: {
                addition: result.address.addition,
                city: result.address.city,
                housenumber: result.address.housenumber,
                street: result.address.street,
                zipcode: result.address.zipcode
            }
        };
    } else {
        addressValidationResponse = { // eslint-disable-line no-use-before-define
            success: false,
            errorMessage: result.message
        };
    }

    response.setContentType('application/json');

    var addressValidationResponse = JSON.stringify(addressValidationObj);
    response.writer.print(addressValidationResponse);
}


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
/** For Dutch addresses, Get the Street name and City based on postcode and street number
 * @see {@link module:controllers/Paazl~AddressNL} */
exports.AddressNL = guard.ensure(['get'], addressNL);
exports.FetchSummary = guard.ensure(['get'], fetchSummary);

