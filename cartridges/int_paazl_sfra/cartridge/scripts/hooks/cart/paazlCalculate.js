'use strict';

var PromotionMgr = require('dw/campaign/PromotionMgr');
var Status = require('dw/system/Status');
var ShippingMgr = require('dw/order/ShippingMgr');

var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');

/**
 * Calculate shipping cost including Paazl selected option's cost.
 * @param {dw.order.Basket} basket - the current basket
 * @returns {dw.system.Status} Status - status
 */
function calculateShipping (basket) {
	// Check if Paazl is enable and selected as shipping method
    var paazlStatus = paazlHelper.getPaazlStatus(basket.defaultShipment);
    ShippingMgr.applyShippingCost(basket);
    if (paazlStatus.active) {
        // override default sfcc calculation of shipping cost
        paazlHelper.calculateShipping(basket);

        // Always remove start matrix information,
        // that ensure the consistency when something
        // changes in the basket.
        delete basket.custom.paazlStartMatrix;
    }
    return new Status(Status.OK);
}
exports.calculateShipping = calculateShipping;

/**
 * Determines tax rates for all line items of the basket.
 * @param {dw.order.Basket} basket - the current basket
 */
function calculateTax(basket) {
    // This snippet of code was introduced here as there was no
    // better place to remove an applied promotion to the basket,
    // as the prices from the widget should have priority over
    // the discounts applied through promotions.
    // The start matrix info is saved in a custom attribute in
    // the basket then the price adjustment related to the promotion
    // is removed from the basket. The consistency is kept when
    // the method calculateShipping is called and remove paazlStartMatrix.
    // After calling PromotionMgr.applyDiscounts(basket); in the calulate.js
    // the promotion is once again applied and treated here.

    var paazlStatus = paazlHelper.getPaazlStatus(basket.defaultShipment);
    if (paazlStatus.active) {

        // Here, it is necessary to apply price to the shipping line item
        // to make sure any possible shipping promotion is taken in
        // consideration to start the matrix. As a shipping promotion is
        // not fired when the price is 0.
        // That is safe as it is being called the calculateShipping
        // imediatelly after that, so the correct price is always the
        // final one applied.
        var standardShippingLineItem = basket.defaultShipment.standardShippingLineItem;
        standardShippingLineItem.setPriceValue(1);
        PromotionMgr.applyDiscounts(basket);
        paazlHelper.calculateShipping(basket);

        var promotion = paazlHelper.getPaazlStartMatrixPromotion(basket);

        if (promotion) {
            var allShippingPriceAdjustments = basket.allShippingPriceAdjustments;
            var allShippingPriceAdjustmentsIt = allShippingPriceAdjustments.iterator();

            while(allShippingPriceAdjustmentsIt.hasNext()) {
                var shippingPriceAdjustment = allShippingPriceAdjustmentsIt.next();
                if (shippingPriceAdjustment.promotionID === promotion.ID) {
                    basket.custom.paazlStartMatrix = promotion.custom.paazlStartMatrix;
                    basket.removeShippingPriceAdjustment(shippingPriceAdjustment);
                }
            }
        }
    }
}
exports.calculateTax = calculateTax;
