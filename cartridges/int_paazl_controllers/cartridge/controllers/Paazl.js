'use strict';

/**
 * Controller that adds and removes products and coupons in the cart.
 * Also provides functions for the continue shopping button and minicart.
 *
 * @module controllers/Cart
 */


/* Script Modules */
var guard = require('*/cartridge/scripts/guard');
var app = require('*/cartridge/scripts/app');

/**
 * Address completion
 * For Dutch addresses, Get the Street name and City based on postcode and street number
 */
function addressNL() {
    var addressService = require('*/cartridge/scripts/services/SOAP/paazlAddressValidation');
    var addressValidationResponse = {};

    // Fetch the basket UUID
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        addressValidationResponse = {
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
        addressValidationResponse = {
            success: false,
            errorMessage: 'Current country not supported'
        };
    }
    if (!zipCode) {
        addressValidationResponse = {
            success: false,
            errorMessage: 'ZipCode is missing'
        };
    }

    if (!houseNbr) {
        addressValidationResponse = {
            success: false,
            errorMessage: 'House number is missing'
        };
    }

    var result = addressService.address({ zipCode: zipCode, paazlReferenceID: paazlReferenceID, houseNbr: houseNbr });
    if (result.success) {
        addressValidationResponse = {
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
        addressValidationResponse = {
            success: false,
            errorMessage: result.message
        };
    }

    app.getView({
        addressValidationResponse: addressValidationResponse
    }).render('addressvalidationjson');
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

