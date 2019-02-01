'use strict';


var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var paazlHelper = require('./paazlHelper');


function proxyModel() {
    return proxyquire('../../../../cartridges/int_paazl_sfra/cartridge/scripts/checkout/checkoutHelpers', {
        '*/cartridge/scripts/helpers/paazlHelper': paazlHelper
    });
}

module.exports = proxyModel();
