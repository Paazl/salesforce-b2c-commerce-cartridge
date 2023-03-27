'use strict';


var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var paazlHelper = require('./paazlHelper');

var transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () {},
    commit: function () {}
};


function proxyModel() {
    return proxyquire('../../../cartridges/int_paazl_sfra/cartridge/scripts/checkout/checkoutHelpers', {
        '*/cartridge/scripts/helpers/paazlHelper': paazlHelper,
        'dw/system/Transaction': transaction
    });
}

module.exports = proxyModel();
