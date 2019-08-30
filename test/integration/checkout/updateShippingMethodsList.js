var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var jsonHelpers = require('../helpers/jsonUtils');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test cases :
 * 1. ProductSurchargeCost : Add Jewelery to cart with MA should show surcharge cost
 * 2. When shipping to AK state, should return 2 applicableShipping methods only
 * 3. When shipping to MA state, should return 4 applicableShipping methods
 * 3. When Cart has over $100 product, shipping cost should be more for the same shipping method as #3 case
 * 4. When State 'State' = 'AA' and 'AE' and 'AP' should output UPS as a shipping method
 */

describe('Select different State in Shipping Form', function () {
    this.timeout(5000);

    describe('productSurchargeCost with over $100 order', function () {
        var cookieJar = request.jar();
        var cookie;
        before(function () {
            var qty1 = 3;
            var variantPid1 = '013742000443M';
            var cookieString;

            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            myRequest.url = config.baseUrl + '/Cart-AddProduct';
            myRequest.form = {
                pid: variantPid1,
                quantity: qty1
            };

            return request(myRequest)
                 .then(function (response) {
                     assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                     cookieString = cookieJar.getCookieString(myRequest.url);
                 })
                 .then(function () {
                     cookie = request.cookie(cookieString);
                     cookieJar.setCookie(cookie, myRequest.url);
                 });
        });

        describe('select state=AK in Shipping Form', function () {
            var cookieJar = request.jar();
            var cookie;
            before(function () {
                var qty1 = 1;
                var variantPid1 = '708141677371M';
                var cookieString;

                var myRequest = {
                    url: '',
                    method: 'POST',
                    rejectUnauthorized: false,
                    resolveWithFullResponse: true,
                    jar: cookieJar,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };
                myRequest.url = config.baseUrl + '/Cart-AddProduct';
                myRequest.form = {
                    pid: variantPid1,
                    quantity: qty1
                };

                return request(myRequest)
                 .then(function (response) {
                     assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                     cookieString = cookieJar.getCookieString(myRequest.url);
                 })
                 .then(function () {
                     cookie = request.cookie(cookieString);
                     cookieJar.setCookie(cookie, myRequest.url);
                 });
            });

            it('should return 1 applicableShippingMethods for AK state', function () {
                var ExpectedResBody = {
                    'order': {
                        'totals': {
                            'subTotal': '$49.99',
                            'grandTotal': '$52.49',
                            'totalTax': '$2.50',
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
                        },
                        'shipping': [
                            {
                                'applicableShippingMethods': [
                                    {
                                        'description': null,
                                        'displayName': 'Paazl USD',
                                        'ID': 'paazl_USD',
                                        'shippingCost': '$0.00',
                                        'estimatedArrivalTime': null
                                    }
                                ],
                                'shippingAddress': {
                                    'ID': null,
                                    'postalCode': '09876',
                                    'stateCode': 'AK',
                                    'firstName': null,
                                    'lastName': null,
                                    'address1': null,
                                    'address2': null,
                                    'city': null,
                                    'phone': null
                                },
                                'selectedShippingMethod': {
                                    'description': null,
                                    'displayName': 'Paazl USD',
                                    'ID': 'paazl_USD',
                                    'shippingCost': '$0.00',
                                    'estimatedArrivalTime': null
                                }
                            }
                        ]
                    }
                };
                var myRequest = {
                    url: '',
                    method: 'POST',
                    rejectUnauthorized: false,
                    resolveWithFullResponse: true,
                    jar: cookieJar
                };
                myRequest.url = config.baseUrl + '/CheckoutShippingServices-UpdateShippingMethodsList';
                myRequest.form = {
                    'stateCode': 'AK',
                    'postalCode': '09876'
                };
                return request(myRequest)
             // Handle response from request
                 .then(function (response) {
                     assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                     var bodyAsJson = JSON.parse(response.body);
                     var actualRespBodyStripped = jsonHelpers.deleteProperties(bodyAsJson, ['selected', 'default', 'countryCode', 'addressId', 'jobTitle', 'postBox', 'salutation', 'secondName', 'companyName', 'suffix', 'suite', 'title']);

                     assert.containSubset(bodyAsJson.order.totals, ExpectedResBody.order.totals, 'Actual response.totals not as expected.');
                     assert.containSubset(actualRespBodyStripped.order.shipping[0].applicableShippingMethods, ExpectedResBody.order.shipping[0].applicableShippingMethods, 'applicableShippingMethods not as expected.');
                     assert.containSubset(actualRespBodyStripped.order.shipping[0].shippingAddress, ExpectedResBody.order.shipping[0].shippingAddress, 'shippingAddress is not as expected');
                     assert.containSubset(actualRespBodyStripped.order.shipping[0].selectedShippingMethod, ExpectedResBody.order.shipping[0].selectedShippingMethod, 'selectedShippingMethod is not as expected');
                 });
            });
        });
    });
});
