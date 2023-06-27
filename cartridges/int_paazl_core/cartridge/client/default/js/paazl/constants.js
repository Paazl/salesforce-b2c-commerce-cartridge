'use strict';

var attributes = {
    paazlID: 'paazl-id'
};

var selectors = {
    body: 'body',
    endlines: 'end-lines',
    hide: 'hide',
    paazlButtons: '#paazl-checkout button:not([type="submit"])',
    paazlCheckoutOptionPrefix: '#shippingMethod-',
    paazlCheckoutOptionPrefixSG: '#shipping-method-',
    paazlID: '[data-' + attributes.paazlID + ']',
    paazlWrapper: '#paazl-checkout',
    submitButton: 'button.submit-shipping',
    forms: {
        shipping: 'form[name*="_shipping"]',
        billing: 'form[name$="_billing"]',
        shippingFormPrefix: '.js-shippingform-',
        billingFormPrefix: '.js-billingform-',
        paazlWidgetForm: '.js-paazlwidget-form'
    },
    address: {
        summary: '.shipping-summary .address-summary',
        street: 'input[name$=_address1]',
        houseNumber: 'input[name$=_address2]',
        addition: false,
        postalCode: 'input[name*=_postal]',
        city: 'input[name$=_city]',
        country: 'select[name*=_country]'
    }
};

var events = {
    blur: 'blur',
    change: 'change',
    click: 'click',
    keyup: 'keyup',
    keydown: 'keydown',
    updateShippingMethods: 'shipping:updateShippingMethods'
};

module.exports = {
    attributes: attributes,
    selectors: selectors,
    events: events
};
