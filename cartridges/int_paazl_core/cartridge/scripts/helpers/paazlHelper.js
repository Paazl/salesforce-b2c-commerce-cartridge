var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

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
        if (paazlDeliveryInfo && 'cost' in paazlDeliveryInfo) {
            standardShippingLineItem.setPriceValue(paazlDeliveryInfo.cost);
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
 * @param {dw.order.Shipment} shipment - shipment
 * @param {dw.order.OrderAddress} shippingAddress - Order address
 */
function persistOriginalShippingAddress(shipment, shippingAddress) {
    var originalShippingAddress = {
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        companyName: shippingAddress.companyName,
        countryCode: {
            value: shippingAddress.countryCode ? shippingAddress.countryCode.value : ''
        },
        firstName: shippingAddress.firstName,
        fullName: shippingAddress.fullName,
        jobTitle: shippingAddress.jobTitle,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        postalCode: shippingAddress.postalCode,
        postBox: shippingAddress.postBox,
        salutation: shippingAddress.salutation,
        secondName: shippingAddress.secondName,
        stateCode: shippingAddress.stateCode,
        suffix: shippingAddress.suffix,
        suite: shippingAddress.suite,
        title: shippingAddress.title
    };
    shipment.custom.paazlOriginalShippingAddress = JSON.stringify(originalShippingAddress); // eslint-disable-line no-param-reassign
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
    Transaction.wrap(function () {
        order.setCustomerName(shippingAddress.fullName);
        if (paazlShippingModel.shippingMethodType === 'PICKUP_LOCATION' && paazlShippingModel.shippingAddress != null) {
            persistOriginalShippingAddress(shipment, shippingAddress);

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
        }
    });
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

/**
 * Iterates over the price adjustments looking for the start matrix.
 * @param {dw.util.Collection} priceAdjustments List of price adjustment
 * @returns {string} Paazl start matrix
 */
function getPromotionWithStartMatrix(priceAdjustments) {
    if (priceAdjustments.empty) {
        return null;
    }

    var priceAdjustmentsIt = priceAdjustments.iterator();
    var priceAdjustment;
    var promotion;
    while (priceAdjustmentsIt.hasNext()) {
        priceAdjustment = priceAdjustmentsIt.next();
        promotion = priceAdjustment.promotion;
        if (promotion && promotion.custom.paazlStartMatrix) {
            return promotion;
        }
    }
    return null;
}

/**
 * Get the Paazl start matrix associated with the promotion applied to the product.
 * If multiple promotions are applied, the first one with a present value for paazlStartMatrix is taken.
 * @param {dw.util.Collection} productLineItems Product line items from basket
 * @returns {string} Paazl start matrix
 */
function getProductPromotionWithPaazlStartMatrix(productLineItems) {
    var productLineItemsIt = productLineItems.iterator();
    while (productLineItemsIt.hasNext()) {
        var productLineItem = productLineItemsIt.next();
        var promotion = getPromotionWithStartMatrix(productLineItem.priceAdjustments);
        if (promotion) {
            return promotion;
        }
    }
    return null;
}

/**
 * Get the Paazl start matrix associated with the promotion applied to the shipping method.
 * If multiple promotions are applied, the first one with a present value for paazlStartMatrix is taken.
 * @param {dw.util.Collection} shipments Shipments from basket
 * @returns {string} Paazl start matrix
 */
function getShippingPromotionPaazlStartMatrix(shipments) {
    var shipmentsIt = shipments.iterator();
    while (shipmentsIt.hasNext()) {
        var shipment = shipmentsIt.next();
        var promotion = getPromotionWithStartMatrix(shipment.shippingPriceAdjustments);
        if (promotion) {
            return promotion;
        }
    }
    return null;
}

/**
 * Get the Paazl start matrix associated with the promotion applied to the basket.
 * If multiple promotions are applied, the first one with a present value for paazlStartMatrix is taken.
 * @param {dw.util.Collection} priceAdjustments Price adjustments from basket
 * @returns {string} Paazl start matrix
 */
function getOrderPromotionWithPaazlStartMatrix(priceAdjustments) {
    return getPromotionWithStartMatrix(priceAdjustments);
}

/**
 * Return the promotion with start matrix available.
 * @param {dw.order.Basket} basket Current basket.
 * @returns {dw.campaign.Promotion} Promotion that triggers the matrix
 */
function getPaazlStartMatrixPromotion(basket) {
    return getOrderPromotionWithPaazlStartMatrix(basket.priceAdjustments)
        || getShippingPromotionPaazlStartMatrix(basket.shipments)
        || getProductPromotionWithPaazlStartMatrix(basket.productLineItems)
        || null;
}

/**
 * Ensure the volume has 3 decimals rouding up.
 * Eg: If volume is 0.00036 it becomes 0.001, 0.003046 becomes 0.004.
 * @param {number} width The product width
 * @param {number} height The product height
 * @param {number} length The product length
 * @returns {number} The product volume formated
 */
function formatProductVolume(width, height, length) {
    var volumeCBM = (width * height * length) / 1000000; // Convert to cubic meter.
    return Math.ceil(volumeCBM * 1000) / 1000; // Round up and using 3 decimals after floating point.
}

/**
 * Fill the product dimensions.
 * @param {dw.catalog.Product} productApi Product instance
 * @param {Object} productObj Object representing the product
 * @returns {Object} Object representing the product filled with its dimensions
 */
function setProductDimensions(productApi, productObj) {
    // Getting the custom attributes IDs used in the product.
    var paazlProductWidthAttribute = Site.current.getCustomPreferenceValue('paazlProductWidthAttribute');
    var paazlProductHeightAttribute = Site.current.getCustomPreferenceValue('paazlProductHeightAttribute');
    var paazlProductLengthAttribute = Site.current.getCustomPreferenceValue('paazlProductLengthAttribute');
    var paazlProductWeightAttribute = Site.current.getCustomPreferenceValue('paazlProductWeightAttribute');
    var paazlProductVolumeAttribute = Site.current.getCustomPreferenceValue('paazlProductVolumeAttribute');

    var width = (paazlProductWidthAttribute && productApi.custom[paazlProductWidthAttribute]) || 0;
    var height = (paazlProductHeightAttribute && productApi.custom[paazlProductHeightAttribute]) || 0;
    var length = (paazlProductLengthAttribute && productApi.custom[paazlProductLengthAttribute]) || 0;
    var weight = (paazlProductWeightAttribute && productApi.custom[paazlProductWeightAttribute]) || 0;
    var volume = (paazlProductVolumeAttribute && productApi.custom[paazlProductVolumeAttribute]) || 0;

    if (width > 0) {
        productObj.width = width; // eslint-disable-line no-param-reassign
    }
    if (height > 0) {
        productObj.height = height; // eslint-disable-line no-param-reassign
    }
    if (length > 0) {
        productObj.length = length; // eslint-disable-line no-param-reassign
    }
    if (weight > 0) {
        productObj.weight = weight; // eslint-disable-line no-param-reassign
    } else {
        // Use 1 as default for retro compatibility.
        productObj.weight = 1; // eslint-disable-line no-param-reassign
    }
    if (volume > 0) {
        productObj.volume = volume; // eslint-disable-line no-param-reassign
    } else if (width > 0 && height > 0 && length > 0) {
        productObj.volume = formatProductVolume(width, height, length); // eslint-disable-line no-param-reassign
    }

    return productObj;
}

/**
 * Build the product shipment parameters for the service call.
 * @param {dw.order.ProductLineItem} productLineItem - The line item for the product.
 * @returns {Object} Object containing the product shipment parameters for the service call.
 */
function setProductShipmentParameters(productLineItem) {
    var product = {
        quantity: productLineItem.quantityValue,
        price: productLineItem.adjustedPrice.value
    };

    product = setProductDimensions(productLineItem.product, product);

    return product;
}

/**
 * Converts the specified metadata to an object.
 * @param {Srray} metadata The Paazl metadata
 * @returns {Object} The metadata converted to an object, or null ir no metadata was specified
 */
function convertPaazlMetadataToObject(metadata) {
    if (!metadata || !metadata.length) return null;
    var result = {};
    for (var i = 0; i < metadata.length; i++) {
        var nameValue = metadata[i];
        result[nameValue.name] = nameValue.value;
    }
    return result;
}

/**
 * Get search object used during the widget initialisation.
 * @param {dw.order.OrderAddress} shippingAddress Curent shipping address.
 * @param {string} countryCode Consignee country code.
 * @return {Object} Object containing address and geolocation.
 */
function getSearchInformation(address, countryCode) {
    var search = {
        address: null,
        circle: null
    }

    if (address) {
        search.address = {
            street: address.address1,
            postalCode: address.postalCode,
            houseNumberExtension: address.address2,
            city: address.city,
            country: address.countryCode.value
        };
    } else {
        search.address = {
            country: countryCode
        }
    }

    var isGeolocEnabled = Site.current.getCustomPreferenceValue('paazlIsGeolocationEnabled') || false;
    if (isGeolocEnabled && request.geolocation && request.geolocation.available) {
        search.circle = {
            radius: Site.current.getCustomPreferenceValue('paazlSearchRadiusValue'),
            center: {
                latitude: request.geolocation.latitude,
                longitude: request.geolocation.longitude
            }
        };
    }

    return search;
}

module.exports = {
    getShippingMethodID: getShippingMethodID,
    updateTokenInBasket: updateTokenInBasket,
    getSelectedShippingOption: getSelectedShippingOption,
    getSavedPaazlShippingOption: getSavedPaazlShippingOption,
    calculateShipping: calculateShipping,
    getPaazlShippingModel: getPaazlShippingModel,
    updateShipment: updateShipment,
    getPaazlStatus: getPaazlStatus,
    resetSelectedShippingOption: resetSelectedShippingOption,
    setProductDimensions: setProductDimensions,
    setProductShipmentParameters: setProductShipmentParameters,
    getPaazlStartMatrixPromotion: getPaazlStartMatrixPromotion,
    convertPaazlMetadataToObject: convertPaazlMetadataToObject,
    getSearchInformation: getSearchInformation
};
