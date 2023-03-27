'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Money = require('../dw/value/Money');
var Resource = require('../dw/web/Resource');
var StringUtils = require('../dw/util/StringUtils');
var paazlHelper = require('../helpers/paazlHelper');

function proxyModel() {
    return proxyquire('../../../cartridges/int_paazl_sfra/cartridge/models/shipping/paazlShippingMethod', {
        'dw/value/Money': Money,
        'dw/web/Resource': Resource,
        '*/cartridge/scripts/helpers/paazlHelper': paazlHelper,
        'dw/util/StringUtils': StringUtils
    });
}

module.exports = proxyModel();
