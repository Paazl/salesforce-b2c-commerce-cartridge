'use strict';

var assert = require('chai').assert;

var mockSuperModule = require('../../../mocks/mockModuleSuperModule');
var baseShipping = require('../../../../../storefront-reference-architecture/test/mocks/models/shipping');


var otherAddress = {
    'city': 'Boston',
    'postalCode': '12345'
};

var shipment = {
    UUID: '1234-1234-1234-1234',
    setShippingMethod: function (shippingMethod) {
        return shippingMethod;
    },
    shippingMethodID: 'paazl_USD',
    shippingMethod: {
        ID: 'paazl_USD',
        displayName: 'Paazl Pickup Point Delivery',
        description: 'Order received within 7-10 business days',
        custom: {
            estimatedArrivalTime: '7-10 Business Days'
        }
    },
    ID: 'an ID',
    custom: {
        paazlDeliveryInfo: '{ "carrierDescription": "carrierDescription", "name": "name", "deliveryType": "PICKUP_LOCATION", "cost": 10.00, "pickupLocation": { "address": {"address1":"Mattenbiestraat 149","address2":null,"countryCode":"NL","firstName":"John","lastName":"Smith","city":"Amsterdam","phone":"0633333333","postalCode":"1087GC" }}}'
    }
};

describe('Shipping', function () {
    var ShippingModel;

    before(function () {
        mockSuperModule.create(baseShipping);
        ShippingModel = require('../../../mocks/models/shipping');
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should receive object with null properties ', function () {
        var result = new ShippingModel(null, null);
        assert.equal(result.selectedShippingMethod, null);
    });

    it('should get the selected shipping method information', function () {
        var result = new ShippingModel(shipment, null);

        assert.equal(result.selectedShippingMethod.ID, 'paazl_USD');
        assert.equal(result.selectedShippingMethod.shippingCost, '€10');
    });

    it('should get pickup point address from shipment', function () {
        var result = new ShippingModel(shipment, null);
        assert.equal(result.pickupPointAddress.address1, 'Mattenbiestraat 149');
    });

    it('should still get pickup point address from shipment', function () {
        var result = new ShippingModel(shipment, otherAddress);
        assert.equal(result.pickupPointAddress.city, 'Amsterdam');
    });
});
