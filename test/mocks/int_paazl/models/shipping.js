'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Logger = require('../../dw/system/Logger');
var PaazlShippingMethodModel = require('./paazlShippingMethod');

var paazlHelper = require('../helpers/paazlHelper');

function proxyModel() {
    return proxyquire('../../../../cartridges/int_paazl_sfra/cartridge/models/shipping', {
        'dw/system/Logger': Logger,
        '*/cartridge/scripts/helpers/paazlHelper': paazlHelper,
        '*/cartridge/models/shipping/paazlShippingMethod': PaazlShippingMethodModel
    });
}

module.exports = proxyModel();
