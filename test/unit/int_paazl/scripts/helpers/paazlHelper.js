'use strict';

var assert = require('chai').assert;

var paazlHelper = require('../../../../mocks/int_paazl/helpers/paazlHelper');

var lineItemCtnr = {
    custom: {
    },
    defaultShipment: {
        UUID: '1234-1234-1234-1234',
        setShippingMethod: function (shippingMethod) {
            return shippingMethod;
        },
        shippingMethodID: '001',
        shippingMethod: {
            ID: '001',
            displayName: 'Ground',
            description: 'Order received within 7-10 business days',
            custom: {
                estimatedArrivalTime: '7-10 Business Days'
            }
        },
        shippingAddress: {
            setFirstName: function (firstName) {
                this.firstName = firstName;
            },
            setLastName: function (lastName) {
                this.lastName = lastName;
            },
            setAddress1: function (address1) {
                this.address1 = address1;
            },
            setAddress2: function (address2) {
                this.address2 = address2;
            },
            setCity: function (city) {
                this.city = city;
            },
            setPostalCode: function (postalCode) {
                this.postalCode = postalCode;
            },
            setStateCode: function (stateCode) {
                this.stateCode = stateCode;
            },
            setCountryCode: function (countryCode) {
                this.countryCode = countryCode;
            },
            setPhone: function (phone) {
                this.phone = phone;
            }
        },
        getShippingAddress: function () {
            return this.shippingAddress;
        },
        standardShippingLineItem: {
            setPriceValue: function (priceValue) {
                this.priceValue = priceValue;
            }
        },
        ID: 'an ID',
        custom: {
            paazlDeliveryInfo: '{ "carrierDescription": "carrierDescription", "name": "name", "deliveryType": "PICKUP_LOCATION", "cost": 10.00, "pickupLocation": { "address": {"address1":"Mattenbiestraat 149","address2":null,"countryCode":"US","firstName":"John","lastName":"Smith","city":"Netherland","phone":"0633333333","postalCode":"1087GC" }}}'
        }

    }
};

var shipment = {
    UUID: '1234-1234-1234-1234',
    setShippingMethod: function (shippingMethod) {
        return shippingMethod;
    },
    shippingMethod: {
        ID: '001',
        displayName: 'Ground',
        description: 'Order received within 7-10 business days',
        custom: {
            estimatedArrivalTime: '7-10 Business Days'
        }
    },
    standardShippingLineItem: {
        setPriceValue: function (priceValue) {
            this.priceValue = priceValue;
        }
    },
    ID: 'an ID',
    custom: {
        paazlDeliveryInfo: '{ "carrierDescription": "carrierDescription", "name": "name", "deliveryType": "PICKUP_LOCATION", "cost": 10.00, "pickupLocation": { "address": {"address1":"Mattenbiestraat 149","address2":null,"countryCode":"US","firstName":"John","lastName":"Smith","city":"Netherland","phone":"0633333333","postalCode":"1087GC" }}}'
    }

};


describe('paazlHelper', function () {
    describe('getShippingMethodID', function () {
        it('get paazl shipping method ID for current site/currency', function () {
            var shipingMethodID = paazlHelper.getShippingMethodID();
            assert.equal(shipingMethodID, 'paazl_USD');
        });
    });
});

describe('paazlHelper', function () {
    describe('updateTokenInBasket', function () {
        it('save requested Paazl token into basket custom attribute', function () {
            paazlHelper.updateTokenInBasket(lineItemCtnr);
            assert.equal(lineItemCtnr.custom.paazlAPIToken, '1234567890');
        });
    });
});

describe('paazlHelper', function () {
    describe('getSelectedShippingOption', function () {
        it('Get the Paazl selected shipping option and save it into Shipment custom attribute', function () {
            var selectedShippingMethod = paazlHelper.getSelectedShippingOption(lineItemCtnr);
            assert.equal(JSON.stringify(selectedShippingMethod), '{"ID":"paazl_USD","deliveryType":"PICKUP_LOCATION","carrierName":"UPS","carrierDescription":"","cost":10,"identifier":"","name":"","pickupLocation":{"name":"test","address":{"firstName":"","lastName":"TEST","address1":"street name test","address2":"street number test","city":"city test","postalCode":"postcode test","countryCode":"nl","stateCode":""}}}');
            assert.equal(lineItemCtnr.defaultShipment.custom.paazlDeliveryInfo, '{"ID":"paazl_USD","deliveryType":"PICKUP_LOCATION","carrierName":"UPS","carrierDescription":"","cost":10,"identifier":"","name":"","pickupLocation":{"name":"test","address":{"firstName":"","lastName":"TEST","address1":"street name test","address2":"street number test","city":"city test","postalCode":"postcode test","countryCode":"nl","stateCode":""}}}');
        });
    });
});

describe('paazlHelper', function () {
    describe('calculateShipping', function () {
        it('Calculate basket shipping cost including Paazl selected shipping option cost ', function () {
            paazlHelper.calculateShipping(lineItemCtnr);
            assert.equal(lineItemCtnr.defaultShipment.standardShippingLineItem.priceValue, 10);
        });
    });
});

describe('paazlHelper', function () {
    describe('getPaazlShippingModel', function () {
        it('Build shipping model from the fetched Paazl selected option ', function () {
            var shipmentModel = paazlHelper.getPaazlShippingModel(lineItemCtnr);
            assert.equal(JSON.stringify(shipmentModel), '{"shippingMethodType":"PICKUP_LOCATION","shippingAddress":{"firstName":"","lastName":"TEST","address1":"street name test","address2":"street number test","city":"city test","postalCode":"postcode test","countryCode":"nl","stateCode":""},"shippingMethodModel":{"displayName":"PICKUP_LOCATION","description":" - pickupPoint"},"shippingCost":10}');
        });
    });
});

describe('paazlHelper', function () {
    describe('updateShipment', function () {
        it('Update shipping address with Paazl pickup point address. and save shipping option ID in Shipment custom attribute', function () {
            paazlHelper.updateShipment(lineItemCtnr);
            assert.equal(lineItemCtnr.defaultShipment.shippingAddress.firstName, '');
            assert.equal(lineItemCtnr.defaultShipment.shippingAddress.lastName, 'TEST');
            assert.equal(lineItemCtnr.defaultShipment.custom.paazlSelectedShippingMethod, 'PICKUP_LOCATION');
        });
    });
});

describe('paazlHelper', function () {
    describe('getPaazlStatus', function () {
        it('get current paazl status', function () {
            var paazlStatus = paazlHelper.getPaazlStatus(shipment);
            assert.equal(paazlStatus.enable, true);
            assert.equal(paazlStatus.active, false);
            assert.equal(paazlStatus.applicable, true);
        });
    });
});

