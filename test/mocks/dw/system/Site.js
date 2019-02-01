var sitePrefs = { paazlEnabled: true };
var defaultCurrency = { currencyCode: 'USD' };

var current =
    {
        defaultCurrency: defaultCurrency,
        custom: sitePrefs,
        getCustomPreferenceValue: function (attributeID) {
            return sitePrefs[attributeID];
        }
    };


// function getCustomPreferenceValue(attributeID) {
//     var value;
//     if (attributeID === 'paazlEnabled') {
//         value = true;
//     }
//     return value;
// }

module.exports = {
    current: current,
    getCurrent: current
};
