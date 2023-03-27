'use strict';

var assert = require('chai').assert;

var paazlHelper = require('../../../../mocks/helpers/paazlHelper');
var ArrayList = require('../../../../mocks/dw.util.Collection');

var lineItemCtnr = {
    custom: {
    },
    setCustomerName: function (fullName) {
        this.customerName = fullName;
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

    },
    priceAdjustments: null,
    shipments: null,
    productLineItems: null
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

var productLineItem = {
    quantityValue: 2,
    basePrice: {
        value: 49
    },
    adjustedPrice: {
        value: 49
    },
    product: {
        custom: {
            productWidthAttribute: 10,
            productHeightAttribute: 10,
            productLengthAttribute: 10,
            productWeightAttribute: 0.3,
            productVolumeAttribute: 0.001
        }
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

describe('paazlHelper', function () {
    describe('getPaazlStartMatrixPromotion', function () {
        before(function () {
            lineItemCtnr.priceAdjustments = new ArrayList([{
                promotion: {
                    custom: {
                        paazlStartMatrix: 'AA'
                    }
                }
            }]);
        });
        it('get the Paazl start matrix from promotion applied to the basket level', function () {
            var promotion = paazlHelper.getPaazlStartMatrixPromotion(lineItemCtnr);
            assert.isNotNull(promotion.custom.paazlStartMatrix);
            assert.equal(promotion.custom.paazlStartMatrix.length, 2);
            assert.equal(promotion.custom.paazlStartMatrix, 'AA');
            assert.equal(typeof promotion.custom.paazlStartMatrix, 'string');
        });
    });
});

describe('paazlHelper', function () {
    describe('getPaazlStartMatrixPromotion', function () {
        before(function () {
            lineItemCtnr.priceAdjustments = new ArrayList([{
                promotion: null
            }]);
            lineItemCtnr.shipments = new ArrayList([{
                shippingPriceAdjustments: new ArrayList([{
                    promotion: {
                        custom: {
                            paazlStartMatrix: 'BB'
                        }
                    }
                }])
            }]);
        });
        it('get the Paazl start matrix from promotion applied to the shipping level', function () {
            var promotion = paazlHelper.getPaazlStartMatrixPromotion(lineItemCtnr);
            assert.isNotNull(promotion.custom.paazlStartMatrix);
            assert.equal(promotion.custom.paazlStartMatrix.length, 2);
            assert.equal(promotion.custom.paazlStartMatrix, 'BB');
            assert.equal(typeof promotion.custom.paazlStartMatrix, 'string');
        });
    });
});

describe('paazlHelper', function () {
    describe('getPaazlStartMatrixPromotion', function () {
        before(function () {
            lineItemCtnr.priceAdjustments = new ArrayList([{
                promotion: null
            }]);
            lineItemCtnr.shipments = new ArrayList([{
                shippingPriceAdjustments: new ArrayList([{
                    promotion: null
                }])
            }]);
            lineItemCtnr.productLineItems = new ArrayList([{
                priceAdjustments: new ArrayList([{
                    promotion: {
                        custom: {
                            paazlStartMatrix: 'CC'
                        }
                    }
                }])
            }]);
        });
        it('get the Paazl start matrix from promotion applied to the product level', function () {
            var promotion = paazlHelper.getPaazlStartMatrixPromotion(lineItemCtnr);
            assert.isNotNull(promotion.custom.paazlStartMatrix);
            assert.equal(promotion.custom.paazlStartMatrix.length, 2);
            assert.equal(promotion.custom.paazlStartMatrix, 'CC');
            assert.equal(typeof promotion.custom.paazlStartMatrix, 'string');
        });
    });
});

describe('paazlHelper', function () {
    describe('setProductShipmentParameters', function () {
        it('build the product shipment parameters for the service call', function () {
            var product = paazlHelper.setProductShipmentParameters(productLineItem);
            assert.isObject(product, 'this is an object');
            assert.isAbove(product.quantity, 0, 'quantity is greater than 0');
            assert.isAbove(product.price, 0, 'price is greater than 0');
            assert.isAbove(product.width, 0, 'width is greater than 0');
            assert.isAbove(product.height, 0, 'height is greater than 0');
            assert.isAbove(product.length, 0, 'length is greater than 0');
            assert.isAbove(product.weight, 0, 'weight is greater than 0');
            assert.isAbove(product.volume, 0, 'volume is greater than 0');
        });
    });
});

describe('paazlHelper', function () {
    describe('convertPaazlMetadataToObject', function () {
        it('returns null if null was specified', function () {
            var metadata = null;
            var result = paazlHelper.convertPaazlMetadataToObject(metadata);
            assert.isNull(result, 'result should be null');
        });

        it('returns null if an empty array was specified', function () {
            var metadata = [];
            var result = paazlHelper.convertPaazlMetadataToObject(metadata);
            assert.isNull(result, 'result should be null');
        });

        it('returns object if an array was specified', function () {
            var arr = ['a', 'b'];
            var metadata = [
                { name: 'NAME1', value: 'VALUE1' },
                { name: 'NAME2', value: 123 },
                { name: 'NAME3', value: arr }
            ];
            var result = paazlHelper.convertPaazlMetadataToObject(metadata);
            assert.isNotNull(result, 'result should not be null');
            assert.equal(result.NAME1, 'VALUE1');
            assert.equal(result.NAME2, 123);
            assert.equal(result.NAME3, arr);
        });
    });
});
