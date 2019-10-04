'use strict';

var assert = require('chai').assert;

var mockSuperModule = require('../../../../mocks/mockModuleSuperModule');
var baseCheckoutHelpers = require('../../../../mocks/helpers/checkoutHelpers');

var order = {
    setConfirmationStatus: function () {
    },
    setExportStatus: function () {
    },
    defaultShipment: {
        shippingMethodID: 'paazl_USD',
        shippingMethod: {
            ID: 'paazl_USD',
            displayName: 'Paazl Pickup Point Delivery',
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
        custom: {
            paazlDeliveryInfo: '{ "carrierDescription": "carrierDescription", "name": "name", "deliveryType": "PICKUP_LOCATION", "cost": 10.00, "pickupLocation": { "address": {"address1":"Mattenbiestraat 149","address2":null,"countryCode":"US","firstName":"John","lastName":"Smith","city":"Netherland","phone":"0633333333","postalCode":"1087GC" }}}'
        }

    }
};

var checkoutHelpers;

describe('checkoutHelpers', function () {
    before(function () {
        mockSuperModule.create(baseCheckoutHelpers);
        checkoutHelpers = require('../../../../mocks/int_paazl/helpers/checkoutHelpers');
    });

    after(function () {
        mockSuperModule.remove();
    });

    describe('placeOrder', function () {
        var mockFraudDetectionStatus = {
            status: 'success',
            errorCode: '',
            errorMessage: ''
        };

        it('should return result with error = false when no exception and update the shipment address', function () {
            var result = checkoutHelpers.placeOrder(order, mockFraudDetectionStatus);
            assert.isFalse(result.error);
            assert.equal(order.defaultShipment.shippingAddress.postalCode, '1087GC');
            assert.equal(order.defaultShipment.custom.paazlSelectedShippingMethod, 'carrierDescription - name');
            assert.isTrue(order.custom.notSavedInPaazl);
            assert.equal(order.custom.failedAttempts, 0);
        });

        it('should return result with error = true when exception is thrown', function () {
            var result = checkoutHelpers.placeOrder(order);
            assert.isTrue(result.error);
        });
    });
});
