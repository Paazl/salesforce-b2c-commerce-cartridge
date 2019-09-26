var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var baseUrl = 'https://' + config.baseUrl + '/on/demandware.store/Sites-RefArch-Site/en_US';
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Get address comletion', function () {
    this.timeout(500000);

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
        myRequest.url = baseUrl + '/Cart-AddProduct';
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

    var action = 'Paazl-AddressNL';
    var addProd = '/Paazl-AddressNL';

    var myRequest = {
        method: 'GET',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var queryParams = {
        postalCode: '1087GC',
        houseNbr: '149',
        country: 'NL'
    };

    var urlEndPoint = baseUrl + addProd;

    it('should return address completion', function () {
        // The myRequest object will be reused through out this file. The 'jar' property will be set once.
        // The 'url' property will be updated on every request to set the product ID (pid) and quantity.
        // All other properties remained unchanged.
        myRequest.url = urlEndPoint + '?postalCode=' + queryParams.postalCode + '&houseNbr=' + queryParams.houseNbr + '&country=' + queryParams.country;

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200);

            var expectedResBody = {
                action: action,
                queryString: '',
                success: true,
                address: {
                    addition: null,
                    city: 'Amsterdam',
                    houseNbr: '149',
                    street: 'Mattenbiesstraat',
                    zipcode: '1087GC'
                }
            };

            var bodyAsJson = JSON.parse(response.body);
            assert.equal(bodyAsJson.address.addition, expectedResBody.address.addition);
            assert.equal(bodyAsJson.address.city, expectedResBody.address.city);
            assert.equal(bodyAsJson.address.street, expectedResBody.address.street);
            assert.equal(bodyAsJson.address.postalCode, expectedResBody.address.postalCode);
            assert.equal(bodyAsJson.success, true);
        });
    });

    it('should return an error because of unvalid zipcode/housenumber combination', function () {
        myRequest.url = urlEndPoint + '?postalCode=1234RC&houseNbr=' + queryParams.houseNbr + '&country=' + queryParams.country;

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200);

            var expectedResBody = {
                action: action,
                queryString: '',
                success: false,
                errorMessage: 'No correct zipcode/housenumber combination'
            };

            var bodyAsJson = JSON.parse(response.body);
            assert.equal(bodyAsJson.errorMessage, expectedResBody.errorMessage);
            assert.equal(bodyAsJson.success, false);
        });
    });

    it('should return an error because Coutry is not supported', function () {
        myRequest.url = urlEndPoint + '?postalCode=' + queryParams.postalCode + '&houseNbr=' + queryParams.houseNbr + '&country=FR';

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200);

            var expectedResBody = {
                action: action,
                queryString: '',
                success: false,
                errorMessage: 'Current country not supported'
            };

            var bodyAsJson = JSON.parse(response.body);
            assert.equal(bodyAsJson.errorMessage, expectedResBody.errorMessage);
            assert.equal(bodyAsJson.success, false);
        });
    });

    it('should return an error because House number is missing', function () {
        myRequest.url = urlEndPoint + '?postalCode=' + queryParams.houseNbr + '&country=' + queryParams.country;

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200);

            var expectedResBody = {
                action: action,
                queryString: '',
                success: false,
                errorMessage: 'House number is missing'
            };

            var bodyAsJson = JSON.parse(response.body);
            assert.equal(bodyAsJson.errorMessage, expectedResBody.errorMessage);
            assert.equal(bodyAsJson.success, false);
        });
    });
});
