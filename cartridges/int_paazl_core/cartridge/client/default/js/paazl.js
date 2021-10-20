'use strict';

var summaryHelpers = require('./summary');

/**
 * updates the totals summary
 * @param {Array} totals - the totals data
 */
 function updateTotals(totals) {
    $('.shipping-total-cost').text(totals.totalShippingCost);
    $('.tax-total').text(totals.totalTax);
    $('.sub-total').text(totals.subTotal);
    $('.grand-total-sum').text(totals.grandTotal);

    if (totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').show();
        $('.order-discount-total').text('- ' + totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').hide();
    }

    if (totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').show();
        $('.shipping-discount-total').text('- ' +
            totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').hide();
    }
}

$(document).ready(function () {
    require('./paazl/paazl');

    window.onPaazlSelect = function (selected) {
        var url = $('#checkout-main').attr('data-checkout-get-url');
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                updateTotals(data.order.totals);
            }
        });
    };
});
