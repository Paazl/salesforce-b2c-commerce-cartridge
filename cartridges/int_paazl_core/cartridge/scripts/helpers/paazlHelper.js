var MessageDigest = require('dw/crypto/MessageDigest');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

/**
 * build request for the Paazl address validation SOAP call
 *
 * @param {Object} webRef Service stub
 * @param {Object} params Required fields for service call
 * @returns{Object} OrderRequest SOAP Request with all the order details
 */
function addressRequest(webRef, params) {
    var paazlAddressRequest = new webRef.com.paazl.schemas.matrix.AddressRequest();

    var webshopID = Site.current.getCustomPreferenceValue('paazlWebshopID');
    var paazlPassword = Site.current.getCustomPreferenceValue('paazlPassword');

    var securityMsg = webshopID + paazlPassword + params.paazlReferenceID;
    var sha1 = new MessageDigest(MessageDigest.DIGEST_SHA_1);
    var encryptedSecurityMsg = sha1.digest(securityMsg);

    paazlAddressRequest.setWebshop(webshopID);
    paazlAddressRequest.setHash(encryptedSecurityMsg);
    paazlAddressRequest.setOrderReference(params.paazlReferenceID);
    paazlAddressRequest.setZipcode(params.zipCode);
    paazlAddressRequest.setHousenumber(params.houseNbr);

    return paazlAddressRequest;
}

/**
 * Get Paazl Shipping Option ID
 * @returns{string} Shipping method ID for paazl
 */
function getShippingMethodID() {
    var currency = session.currency; // eslint-disable-line no-undef
    var currencyCode;
    if (currency && currency.currencyCode) {
        currencyCode = currency.currencyCode;
    } else {
        currency = Site.current.defaultCurrency;
        currencyCode = currency.currencyCode;
    }
    return 'paazl_' + currencyCode;
}

/**
 * Get Paazl fall back shipping option
 * @param {Object} countryCode - the basket shipping countryCode
 * @param {string} currencyCode - the basket currencyCode
 * @returns{Object} fall back Shipping option or null
 */
function getPaazlFallBackOption(countryCode, currencyCode) {
    var fallbackOption = {};
    var paazlDefaultShippingOptions = Site.current.getCustomPreferenceValue('paazlDefaultShippingOption');
    if (!empty(paazlDefaultShippingOptions)) {
        var defaultShippingOptions = {};
        try {
            defaultShippingOptions = JSON.parse(paazlDefaultShippingOptions);
        } catch (error) {
            Logger.error('Error when parsing the Site custom preferences attribute `paazlDefaultShippingOption`.', error);
        }
        var countryShippingOption = defaultShippingOptions[countryCode] || defaultShippingOptions[countryCode.toLowerCase()] || defaultShippingOptions['*'];
        if (countryShippingOption) {
            fallbackOption.identifier = countryShippingOption.identifier;
            fallbackOption.carrierName = countryShippingOption.carrierName;
            fallbackOption.carrierDescription = countryShippingOption.carrierDescription;
            fallbackOption.name = countryShippingOption.name;
            fallbackOption.deliveryType = 'HOME';
            fallbackOption.cost = 0;
            if (countryShippingOption.cost && !empty(countryShippingOption.cost[currencyCode])) {
                fallbackOption.cost = countryShippingOption.cost[currencyCode];
            }
            return fallbackOption;
        }
    }
    return false;
}


/**
 * Save Paazl security tokken into the Basket custom attribute 'paazlAPIToken'.
 * @param {dw.order.Basket} basket - the current basket
 */
function updateTokenInBasket(basket) {
    if (!basket.custom.paazlAPIToken) {
        // If not already done, get REST API token from Paazl and store it into the current basket
        try {
            var getTokenService = require('*/cartridge/scripts/services/REST/getToken');
            var result = getTokenService.getToken({ basket: basket });
            if (result.token) {
                Transaction.wrap(function () {
                    basket.custom.paazlAPIToken = result.token; // eslint-disable-line no-param-reassign
                });
            }
        } catch (error) {
            Logger.error('Error requesting token from Paazl. Error: {0}.', error);
        }
    }
}


/**
 * Request Paazl selected shipping option and save it into the current dw.order.Shipment custom attribute 'paazlDeliveryInfo'.
 * @param {dw.order.Basket} basket - the current basket
 * @returns {Object} selectedShippingMethod from paazl
 */
function getSelectedShippingOption(basket) {
    // Retrieve the selected shipping option from Paazl
    var checkoutService = require('*/cartridge/scripts/services/REST/getCheckout');
    var selectedShippingMethod = checkoutService.getSelectedOption({ basket: basket });
    // If we got the selected shipping info from Paazl, save this info in a shipment custom attributes
    if (selectedShippingMethod.success) {
        if (selectedShippingMethod.noDeliveryTypeInfo || selectedShippingMethod.noSippingOptionObj || selectedShippingMethod.noPickupLocationObj) {
            return false;
        }
    } else if (basket.defaultShipment && basket.defaultShipment.shippingAddress && basket.defaultShipment.shippingAddress.countryCode && !empty(basket.defaultShipment.shippingAddress.countryCode.value)) {
        var countryCode = basket.defaultShipment.shippingAddress.countryCode.value.toUpperCase();
        var currencyCode = basket.currencyCode || session.currency.currencyCode;
        selectedShippingMethod = getPaazlFallBackOption(countryCode, currencyCode);
        if (!selectedShippingMethod) {
            return false;
        }
    }
    try {
        Transaction.wrap(function () {
            basket.defaultShipment.custom.paazlDeliveryInfo = JSON.stringify(selectedShippingMethod);// eslint-disable-line no-param-reassign
        });
    } catch (error) {
        Logger.error('Error happened when stringifying Paazl checkout shipping information. Error: {0}', error);
    }
    return selectedShippingMethod;
}

/**
 * Retrieve Paazl selected shipping option saved into the current dw.order.Shipment custom attribute 'paazlDeliveryInfo'.
 * @param {dw.order.Basket} basket - the current basket
 * @returns {Object} paazlDeliveryInfo from paazl
 */
function getSavedPaazlShippingOption(basket) {
    // Retrieve the Paazl selected shipping option saved in Basket custom object
    var paazlDeliveryInfo;
    try {
        paazlDeliveryInfo = JSON.parse(basket.defaultShipment.custom.paazlDeliveryInfo);
    } catch (error) {
        Logger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
    }
    return paazlDeliveryInfo;
}


/**
 * Calculate shipping cost including Paazl selected option's cost.
 * @param {dw.order.Basket} basket - the current basket
 */
function calculateShipping(basket) {
    var paazlDeliveryInfo;
    try {
        paazlDeliveryInfo = JSON.parse(basket.defaultShipment.custom.paazlDeliveryInfo);
    } catch (error) {
        Logger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
    }
    var standardShippingLineItem = basket.defaultShipment.standardShippingLineItem;
    if (standardShippingLineItem) {
        if (paazlDeliveryInfo && paazlDeliveryInfo.cost) {
            standardShippingLineItem.setPriceValue(paazlDeliveryInfo.cost);
        } else {
            standardShippingLineItem.setPriceValue(0);
        }
    }
}


/**
 * create a shipment model form the data retrieved from paazl and previously stored in the current dw.order.Shipment custom attribute 'paazlDeliveryInfo'.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - the current basket or order
 * @returns {Object} params - updated view data
 */
function getPaazlShippingModel(lineItemCtnr) {
    var shipmentModel = {};
    var shipment = lineItemCtnr.defaultShipment;
    if (shipment.custom.paazlDeliveryInfo) {
        var selectedOption = {};
        try {
            selectedOption = JSON.parse(shipment.custom.paazlDeliveryInfo);
        } catch (error) {
            Logger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
        }
        var shippingMethodModel = {};
        var description;
        var address;
        if (selectedOption.deliveryType === 'PICKUP_LOCATION' && selectedOption.pickupLocation.address != null) {
            address = selectedOption.pickupLocation.address;
            description = selectedOption.carrierDescription + ' - ' + Resource.msg('pickuppoint.shipping.extention', 'paazl', null);
        } else if (selectedOption.deliveryType === 'HOME') {
            description = selectedOption.carrierDescription + ' - ' + Resource.msg('homedelivery.shipping.extention', 'paazl', null);
            address = shipment.shippingAddress;
        } else {
            description = Resource.msg('default.shipping.name', 'paazl', null);
            address = shipment.shippingAddress;
        }

        var displayName;
        if (selectedOption && selectedOption.carrierDescription) {
            displayName = selectedOption.carrierDescription;
            if (selectedOption.name) {
                displayName += ' - ' + selectedOption.name;
            }
        } else if (selectedOption && selectedOption.name) {
            displayName = selectedOption.name;
        } else if (selectedOption && selectedOption.deliveryType) {
            displayName = selectedOption.deliveryType;
        } else {
            displayName = Resource.msg('default.shipping.name', 'paazl', null);
        }

        shippingMethodModel.displayName = displayName;
        shippingMethodModel.description = description;

        shipmentModel.shippingMethodType = selectedOption.deliveryType;
        shipmentModel.shippingAddress = address;
        shipmentModel.shippingMethodModel = shippingMethodModel;
        shipmentModel.shippingCost = selectedOption.cost;
        shipmentModel.shippingPriceAdjustments = shipment.shippingPriceAdjustments;
        shipmentModel.shippingTotalPrice = shipment.shippingTotalPrice;
        shipmentModel.adjustedShippingTotalPrice = shipment.adjustedShippingTotalPrice;
    }
    return shipmentModel;
}

/**
 * In case of pickup point delivery, update the shipping address with pickup point address.
 *
 * @param {dw.order.LineItemCtnr} order - The current order to update
 */
function updateShipment(order) {
    var shipment = order.defaultShipment;
    var paazlShippingModel = this.getPaazlShippingModel(order);

    var shippingAddress = shipment.getShippingAddress();

    if (paazlShippingModel.shippingMethodType === 'PICKUP_LOCATION' && paazlShippingModel.shippingAddress != null) {
        Transaction.wrap(function () {
            shipment.custom.paazlSelectedShippingMethod = paazlShippingModel.shippingMethodModel.displayName;
            var pickupPointAddress = paazlShippingModel.shippingAddress;
            shippingAddress.setFirstName('');
            shippingAddress.setLastName(pickupPointAddress.lastName);
            shippingAddress.setAddress1(pickupPointAddress.address1);
            shippingAddress.setAddress2(pickupPointAddress.address2);
            shippingAddress.setCity(pickupPointAddress.city);
            shippingAddress.setPostalCode(pickupPointAddress.postalCode);
            if (pickupPointAddress.state) {
                shippingAddress.setStateCode(pickupPointAddress.state);
            } else {
                shippingAddress.setStateCode('');
            }
            shippingAddress.setCountryCode(pickupPointAddress.countryCode);
            shippingAddress.setPhone('');
        });
    }
}

/**
 * Return yes if Paazl is enable and selected as shipping method
 * @param {dw.order.Shipment} shipment - the default Shipment of current basket or order
 * @returns {Object} paazlStatus - current paazl status
 */
function getPaazlStatus(shipment) {
    var paazlStatus = { enable: false, active: false, applicable: false };
    var ShippingMgr = require('dw/order/ShippingMgr');

    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
    if (isPaazlEnabled) {
        paazlStatus.enable = true;
        if (shipment) {
            var currentPaazlShippingMethodID = this.getShippingMethodID();
            var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
            var applicableShippingMethods = shipmentModel.applicableShippingMethods;
            // loop through the shipping methods to get shipping method
            var iterator = applicableShippingMethods.iterator();
            while (iterator.hasNext()) {
                var shippingMethod = iterator.next();
                if (shippingMethod.ID === currentPaazlShippingMethodID) {
                    paazlStatus.applicable = true;
                    break;
                }
            }
            if (paazlStatus.applicable && shipment.shippingMethodID === currentPaazlShippingMethodID) {
                paazlStatus.active = true;
            }
        }
    }
    return paazlStatus;
}

/**
 * If already previously saved paazl shipping option, then remove it
 * @param {dw.order.Basket} basket - the current basket
 */
function resetSelectedShippingOption(basket) {
    if (basket.defaultShipment && basket.defaultShipment.custom.paazlDeliveryInfo) {
        Transaction.wrap(function () {
            basket.defaultShipment.custom.paazlDeliveryInfo = null; // eslint-disable-line no-param-reassign
        });
    }
}

module.exports = {
    addressRequest: addressRequest,
    getShippingMethodID: getShippingMethodID,
    updateTokenInBasket: updateTokenInBasket,
    getSelectedShippingOption: getSelectedShippingOption,
    getSavedPaazlShippingOption: getSavedPaazlShippingOption,
    calculateShipping: calculateShipping,
    getPaazlShippingModel: getPaazlShippingModel,
    updateShipment: updateShipment,
    getPaazlStatus: getPaazlStatus,
    resetSelectedShippingOption: resetSelectedShippingOption
};
