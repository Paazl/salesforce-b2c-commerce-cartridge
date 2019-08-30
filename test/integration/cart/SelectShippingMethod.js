var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Cart: Selecting Shipping Methods', function () {
    this.timeout(5000);

    var variantPid1 = '740357440196M';
    var qty1 = '1';
    var variantPid2 = '013742335538M';
    var qty2 = '1';

    var cookieJar = request.jar();
    var myRequest = {
        url: '',
        method: 'POST',
        form: {},
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var cookieString;

    var expectedResponseCommon = {
        'action': 'Cart-SelectShippingMethod',
        'numOfShipments': 1,
        'shipments': [
            {
                'shippingMethods': [
                    {
                        'description': null,
                        'displayName': 'Paazl USD',
                        'ID': 'paazl_USD',
                        'shippingCost': '$0.00',
                        'estimatedArrivalTime': null
                    }
                ]
            }
        ]
    };

    before(function () {
        // ----- adding product #1:
        myRequest.url = config.baseUrl + '/Cart-AddProduct';
        myRequest.form = {
            pid: variantPid1,
            childProducts: [],
            quantity: qty1
        };

        return request(myRequest)
            .then(function () {
                cookieString = cookieJar.getCookieString(myRequest.url);
            })

            // ----- adding product #2, a different variant of same product 1:
            .then(function () {
                myRequest.form = {
                    pid: variantPid2,
                    childProducts: [],
                    quantity: qty2
                };

                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);

                return request(myRequest);
            });
    });

    it(' 8>. should default to default shipping method for non-exist method', function () {
        var expectTotals = {
            'subTotal': '$139.00',
            'grandTotal': '$145.95',
            'totalTax': '$6.95',
            'totalShippingCost': '$0.00',
            'orderLevelDiscountTotal': {
                'formatted': '$0.00',
                'value': 0
            },
            'shippingLevelDiscountTotal': {
                'formatted': '$0.00',
                'value': 0
            },
            'discounts': [],
            'discountsHtml': '\n'
        };

        var shipMethodId = 'paazl_USD';

        myRequest.method = 'POST';
        myRequest.url = config.baseUrl + '/Cart-SelectShippingMethod?methodID=' + shipMethodId;

        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');

                var bodyAsJson = JSON.parse(response.body);

                assert.containSubset(bodyAsJson.totals, expectTotals);
                assert.equal(bodyAsJson.shipments[0].selectedShippingMethod, shipMethodId);
            });
    });
});
