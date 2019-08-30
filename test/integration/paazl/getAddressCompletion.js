var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Get address comletion', function () {
    this.timeout(5000);

    it('should return address completion', function () {
        var cookieJar = request.jar();

        var action = 'Paazl-AddressNL';
        var message = 'Product added to cart';
        var addProd = '/Paazl-AddressNL';

        // The myRequest object will be reused through out this file. The 'jar' property will be set once.
        // The 'url' property will be updated on every request to set the product ID (pid) and quantity.
        // All other properties remained unchanged.
        var myRequest = {
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            form: {
                postalCode: '1087GC',
                houseNbr: '149',
                country: 'NL'
            },
            url: config.baseUrl + addProd
        };

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200);

            var expectedResBody = {
                'action': action,
                'message': message,
                address: {
                    addition: '',
                    city: 'Amsterdam',
                    housenumber: '149',
                    street: 'Mattenbiesstraat',
                    zipcode: '1087GC'
                }
            };

            var bodyAsJson = JSON.parse(response.body);
            assert.equal(bodyAsJson.quantityTotal, expectedResBody.quantityTotal);
        });
    });
});
