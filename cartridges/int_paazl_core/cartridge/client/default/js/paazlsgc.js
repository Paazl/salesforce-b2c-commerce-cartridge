'use strict';

$(document).ready(function () {
    require('./paazl/paazl');

    window.onPaazlSelect = function(selected) {
        var url = window.paazlSummaryUrl;
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                var $container = $('.checkout-order-totals .order-totals-table');
                $container.replaceWith(data);
            }
        });
    };
});
