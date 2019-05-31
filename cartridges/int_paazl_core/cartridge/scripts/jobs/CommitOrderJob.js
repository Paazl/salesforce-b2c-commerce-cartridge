var Logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var commitOrderService = require('~/cartridge/scripts/services/REST/commitOrder');
var overallSuccess = true;
/**
 * Callback to process the actual orders
 *
 * @param {dw.order.Order} order DW Order
 * @returns {void}
 * @private
 */
function orderCallback(order) {
    try {
        Logger.info('Started Order Commit for {0}', order.orderNo);
        var output = commitOrderService.commit({ order: order });
        if (!output || !output.success) {
            overallSuccess = false;
            Logger.fatal('Order {0} not committed successfully into paazl system because of error {1}', order.orderNo, output.errorMessage || '');
        }
    } catch (e) {
        overallSuccess = false;
        Logger.fatal('Order {0} not committed successfully into paazl system because of error {1}', order.orderNo, e);
    }
}

/**
 * Starts the Order Commit into paazl for all the order which are not
 * yet committed i.e have order custom attribute "notSavedInPaazl" set as TRUE
 *
 * @param {dw.List.HashMap} args job parameters
 * @returns{dw.system.Status}
 */
function process(args) {
    if (args.disabled) {
        return new Status(Status.OK, 'DISABLED');
    }
    var query = 'custom.notSavedInPaazl = true';
    OrderMgr.processOrders(orderCallback, query);
    if (!overallSuccess) {
        return new Status(Status.ERROR, 'ERROR');
    }
    return new Status(Status.OK, 'OK');
}

exports.process = process;
