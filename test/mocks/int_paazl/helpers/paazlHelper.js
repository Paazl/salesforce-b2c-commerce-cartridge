'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Site = require('../../dw/system/Site');
var Logger = require('../../dw/system/Logger');
var ShippingMgr = require('../../dw/order/ShippingMgr');
var Resource = require('../../dw/web/Resource');
var Session = require('../../dw/system/Session');

var transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () {},
    commit: function () {}
};

var tokenService = {
    getToken: function () {
        var token = '1234567890';
        return { token: token };
    }
};

var checkoutService = {
    getSelectedOption: function () {
        var selectedOption = {
            ID: 'paazl_USD',
            deliveryType: 'PICKUP_LOCATION',
            carrierName: 'UPS',
            carrierDescription: '',
            cost: 10,
            identifier: '',
            name: '',
            pickupLocation: {
                name: 'test',
                address: {
                    firstName: '', // Needs to be added with an empty string for the FE
                    lastName: 'TEST',
                    address1: 'street name test',
                    address2: 'street number test',
                    city: 'city test',
                    postalCode: 'postcode test',
                    countryCode: 'nl',
                    stateCode: ''
                }
            }
        };
        return selectedOption;
    }
};

global.session = Session;

function proxyModel() {
    return proxyquire('../../../../cartridges/int_paazl_core/cartridge/scripts/helpers/paazlHelper', {
        'dw/crypto/MessageDigest': {},
        'dw/system/Site': Site,
        'dw/system/Logger': Logger,
        'dw/order/ShippingMgr': ShippingMgr,
        'dw/system/Transaction': transaction,
        'dw/web/Resource': Resource,
        '*/cartridge/scripts/services/REST/getToken': tokenService,
        '*/cartridge/scripts/services/REST/getCheckout': checkoutService
    });
}

module.exports = proxyModel();
