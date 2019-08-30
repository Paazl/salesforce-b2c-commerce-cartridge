'use strict';

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var getConfig = require('@tridnguyen/config');

var opts = Object.assign({}, getConfig({
    baseUrl: 'https://paazl01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-RefArch-Site/en_US/',
    suite: '*',
    reporter: 'spec',
    timeout: 60000,
    locale: 'x_default'
}, './config.json'), argv);

module.exports = opts;
