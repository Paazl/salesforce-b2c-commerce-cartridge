function error() {
    return 'an error';
}

function getLogger() {
    return {
        error: function () {
            return 'an error';
        }
    };
}

module.exports = {
    error: error,
    getLogger: getLogger
};
