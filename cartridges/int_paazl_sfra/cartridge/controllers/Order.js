var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.querystring.ID);
    if (order) {
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        var paazlStatus = paazlHelper.getPaazlStatus(order.defaultShipment);
        if (paazlStatus.active) {
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                order.custom.notSavedInPaazl = true;
            });
        }
    }
    return next();
});

module.exports = server.exports();
