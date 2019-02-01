'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');

// Main entry point for Checkout
server.append(
    'Begin', function (req, res, next) {
        // Check if Paazl is enable and selected as shipping method

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            return next();
        }
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');

        var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
        res.setViewData({
            paazlStatus: paazlStatus
        });

        if (paazlStatus.applicable) {
            var currentPaazlShippingMethodID = paazlHelper.getShippingMethodID();
            var InitPaazlWidget = require('*/cartridge/scripts/init/initPaazlWidget');
            var paazlWidgetEndpoint = Site.current.getCustomPreferenceValue('paazlWidgetEndpoint');
            paazlHelper.updateTokenInBasket(currentBasket);
            var paazlWidgetCustomizedStyle;
            // If 'paazlWidgetPredefinedStyle' is set on CUSTOMIZED, fetch the customized style from the 'paazlWidgetCustomizedStyle' site preferences
            var paazlWidgetPredefinedStyle = Site.current.getCustomPreferenceValue('paazlWidgetPredefinedStyle');
            if (paazlWidgetPredefinedStyle.value === 'CUSTOMIZED') {
                paazlWidgetCustomizedStyle = Site.current.getCustomPreferenceValue('paazlWidgetCustomizedStyle');
                res.setViewData({
                    paazlWidgetCustomizedStyle: paazlWidgetCustomizedStyle || null
                });
            }

            var viewData = res.getViewData();
            var isPaazlUniqueShippingOption = false;
            var shippingModel = viewData.order && viewData.order.shipping[0];
            if (shippingModel && shippingModel.applicableShippingMethods && shippingModel.applicableShippingMethods.length === 1) {
                if (shippingModel.applicableShippingMethods[0].ID === currentPaazlShippingMethodID) {
                    isPaazlUniqueShippingOption = true;
                }
            }

            res.setViewData({
                paazlWidgetInit: InitPaazlWidget.initPaazlWidget(),
                paazlWidgetEndpoint: paazlWidgetEndpoint,
                currentPaazlShippingMethodID: currentPaazlShippingMethodID,
                isPaazlUniqueShippingOption: isPaazlUniqueShippingOption
            });
        }


        return next();
    }
);

module.exports = server.exports();
