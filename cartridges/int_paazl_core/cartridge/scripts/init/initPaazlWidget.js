var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var Locale = require('dw/util/Locale');

var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');

/**
 * Plain JS object that represents a Paazl widget ShipmentParameters object
 * @param {dw.order.Basket} basket - the current basket
 * @returns {Object} shipmentParameters - a paazl widget shipmentParameters JSON object
 */
function getShipmentParameters(basket) {
    var productLineItems = basket.productLineItems;
    var products = [];
    var totalWeight = 0;
    var totalPrice = 0;
    var totalVolume = 0;
    if (productLineItems && productLineItems.length > 0) {
        productLineItems.toArray().forEach(function (productLineItem) {
            var product = paazlHelper.setProductShipmentParameters(productLineItem);
            products.push(product);
            totalPrice += productLineItem.adjustedPrice.value;
            totalWeight += product.weight;
        });
    }

    var shipmentParameters = {
        totalWeight: totalWeight,
        totalPrice: totalPrice,
        numberOfGoods: basket.productQuantityTotal,
        goods: products
    };

    var paazlSartMatrix = basket.custom.paazlStartMatrix;
    if (paazlSartMatrix) {
        shipmentParameters.startMatrix = paazlSartMatrix;
    }

    return shipmentParameters;
}

/**
 * Plain JS object that represents a Paazl Widget Initialisation Object
 * @returns {Object} paazlWidget - a paazl widget  JSON object
 */
function initPaazlWidget() {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shippingAddress = currentBasket.defaultShipment.shippingAddress;
    var billingAddress = currentBasket.billingAddress;
    var token = (currentBasket && currentBasket.custom.paazlAPIToken) || '';
    var countryCode;
    var postalCode;
    var currentLocale = Locale.getLocale(request.locale); // eslint-disable-line
    if (shippingAddress && shippingAddress.postalCode) {
        postalCode = shippingAddress.postalCode;
    } else if (request.geolocation && request.geolocation.postalCode) { // eslint-disable-line no-undef
        postalCode = request.geolocation.postalCode;// eslint-disable-line no-undef
    }

    if (shippingAddress && shippingAddress.countryCode && shippingAddress.countryCode.value) {
        countryCode = shippingAddress.countryCode.value;
    } else if (request.geolocation && request.geolocation.countryCode) { // eslint-disable-line no-undef
        countryCode = request.geolocation.countryCode;// eslint-disable-line no-undef
    } else if (billingAddress && billingAddress.countryCode && billingAddress.countryCode.value) {
        countryCode = billingAddress.countryCode.value;
    } else if (currentLocale && currentLocale.country) {
        countryCode = currentLocale.country;
    } else {
        throw new Error('initPaazlWidget: No country code present');
    }

    var language = currentLocale.ISO3Language || 'eng';

    var currency;
    var sessionCurrency = session.getCurrency(); // eslint-disable-line
    if (sessionCurrency && sessionCurrency.currencyCode) {
        currency = sessionCurrency.currencyCode;
    } else {
        currency = 'EUR';
    }

    var availableTabs = [];
    var paazlWidgetAvailableTabs = Site.current.getCustomPreferenceValue('paazlWidgetAvailableTabs');
    paazlWidgetAvailableTabs.forEach(function (availableTab) {
        availableTabs.push(availableTab.value);
    });
    if (availableTabs.length === 0) {
        availableTabs = ['DELIVERY', 'PICKUP'];
    }

    var paazlWidgetDefaultTabs = Site.current.getCustomPreferenceValue('paazlWidgetDefaultTabs');

    var paazlWidgetShippingOptionsLimit = Site.current.getCustomPreferenceValue('paazlWidgetShippingOptionsLimit');

    var paazlWidgetPickupLocationsLimit = Site.current.getCustomPreferenceValue('paazlWidgetPickupLocationsLimit');

    var paazlWidgetPickupLocationsPageLimit = Site.current.getCustomPreferenceValue('paazlWidgetPickupLocationsPageLimit');

    var paazlWidgetInitialPickupLocationsLimit = Site.current.getCustomPreferenceValue('paazlWidgetInitialPickupLocationsLimit');

    var nominatedDateEnabled = Site.current.getCustomPreferenceValue('paazlWidgetNominatedDateEnabled') || false;

    var style;
    var selectedStyle = Site.current.getCustomPreferenceValue('paazlWidgetPredefinedStyle');
    if (selectedStyle && selectedStyle.displayValue && selectedStyle.displayValue !== 'CUSTOMIZED') {
        style = selectedStyle.displayValue;
    }

    var logLevel = Site.current.getCustomPreferenceValue('paazlWidgetLogLevel');
    var sortingModelOrderBy = Site.current.getCustomPreferenceValue('paazlWidgetSortingModelOrderBy');
    var paazlWidgetSortingModelSortOrder = Site.current.getCustomPreferenceValue('paazlWidgetSortingModelSortOrder');
    var paazlWidgetSortingModelDistributor = Site.current.getCustomPreferenceValue('paazlWidgetSortingModelDistributor');

    // This is a example of a possible initialization of the Widget
    // In this example few of the info are set dynamically or configurable using Site preferences and some are hard coded
    // But more options and settings are available if needed for you business.
    // for more info regarding Paazl Widget configuration, please check https://support.paazl.com/hc/en-us/articles/360008858394-Initializing-the-Paazl-checkout-widget#uniqueID0
    var paazlWidget = {

        mountElementId: 'paazl-checkout',
        apiKey: Site.current.getCustomPreferenceValue('paazlAPIKey') || '',
        token: token,
        loadPaazlBasedData: true,
        loadCarrierBasedData: true,
        availableTabs: availableTabs,
        defaultTab: paazlWidgetDefaultTabs.value,
        style: style,
        nominatedDateEnabled: nominatedDateEnabled,
        consigneeCountryCode: countryCode,
        consigneePostalCode: postalCode,
        language: language,
        currency: currency,
        isShowAsExtraCost: false,

        deliveryOptionDateFormat: 'ddd DD MMM',
        deliveryEstimateDateFormat: 'dddd DD MMMM',
        pickupOptionDateFormat: 'ddd DD MMM',
        pickupEstimateDateFormat: 'dddd DD MMMM',

        sortingModel: {
            orderBy: sortingModelOrderBy.value,
            sortOrder: paazlWidgetSortingModelSortOrder.value
        },

        shipmentParameters: currentBasket ? getShipmentParameters(currentBasket) : {},

        shippingOptionsLimit: paazlWidgetShippingOptionsLimit,
        pickupLocationsPageLimit: paazlWidgetPickupLocationsPageLimit,
        pickupLocationsLimit: paazlWidgetPickupLocationsLimit,
        initialPickupLocations: paazlWidgetInitialPickupLocationsLimit,

        logLevel: logLevel ? logLevel.value : 'NONE'
    };

    if (paazlWidgetSortingModelDistributor) {
        paazlWidget.sortingModel.distributor = paazlWidgetSortingModelDistributor;
    }

    return paazlWidget;
}

module.exports = {
    initPaazlWidget: initPaazlWidget
};
