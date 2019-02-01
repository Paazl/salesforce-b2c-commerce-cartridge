function formatMoney(money) {
    var currencySymbol = '€';
    if (money.currencyCode === 'USD') {
        currencySymbol = '$';
    }
    if (money.currencyCode === 'EUR') {
        currencySymbol = '€';
    }
    return currencySymbol + money.value;
}

module.exports = {
    formatMoney: formatMoney
};
