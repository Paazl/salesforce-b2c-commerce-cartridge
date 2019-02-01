'use strict';

var assert = require('chai').assert;

describe('PaazlShippingMethod', function () {
    var ShippingMethodModel = require('../../../../mocks/int_paazl/models/paazlShippingMethod');

    it('should receive object with default value ', function () {
        var result = new ShippingMethodModel(null);
        assert.equal(result.ID, 'paazl_USD');
        assert.equal(result.displayName, 'Paazl Delivery');
    });

    it('should set displayname with carrierDescription + name', function () {
        var result = new ShippingMethodModel({
            carrierDescription: 'carrierDescription',
            name: 'name',
            deliveryType: 'deliveryType',
            cost: 10
        });
        assert.equal(result.ID, 'paazl_USD');
        assert.equal(result.displayName, 'carrierDescription - name');
    });

    it('should set displayname with only name ', function () {
        var result = new ShippingMethodModel({

            name: 'name',
            deliveryType: 'deliveryType',
            cost: 10
        });
        assert.equal(result.ID, 'paazl_USD');
        assert.equal(result.displayName, 'name');
    });

    it('should set displayname with default property ', function () {
        var result = new ShippingMethodModel({
            deliveryType: 'deliveryType',
            cost: 10
        });
        assert.equal(result.ID, 'paazl_USD');
        assert.equal(result.displayName, 'deliveryType');
    });

    it('should set displayname with default property 2 ', function () {
        var result = new ShippingMethodModel({
        });
        assert.equal(result.ID, 'paazl_USD');
        assert.equal(result.displayName, 'Paazl Delivery');
        assert.equal(result.shippingCost, '€0');
    });

    it('should set shippingCost property', function () {
        var result = new ShippingMethodModel({
            deliveryType: 'deliveryType',
            cost: 10
        });
        assert.equal(result.ID, 'paazl_USD');
        assert.equal(result.displayName, 'deliveryType');
        assert.equal(result.shippingCost, '€10');
    });
});
