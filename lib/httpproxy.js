const isIp = require('is-ip');
const isDomain = require('is-valid-domain');
const validUrl = require('valid-url');

// TODO: Information about proxy: authentication, ssl certificates, etc.

class HTTPProxy {
    /**
     * Creates a new instance of the HTTPProxy class
     * @param {String} host
     * @param {String|Number} port
     * @param {String} protocol http or https
     * @throws Throws an error if the host or port is not valid
     */
    constructor (host, port, protocol) {
        const portCopy = parseInt(port);

        HTTPProxy.validateProxy(host, portCopy, protocol);

        this.host = host;
        this.port = portCopy;
        this.protocol = protocol;
        this.used = {};
    }

    /**
     * Marks a proxy as used
     * @param {String} target The target can be either an ip or a domain
     * @param {Date} [date] Time when the proxy was used (should be converted to local timezone)
     * @return {HTTPProxy} Returns self
     * @throws Throws an error if the target or date is not valid
     */
    use (target, date) {
        const targetCopy = HTTPProxy.validateTarget(target);

        if (date === undefined) {
            date = new Date();
        } else if (Object.prototype.toString.call(date) === '[object Date]') {
            throw new Error('`date` must be a date');
        }

        this.used[targetCopy] = date;

        return this;
    }

    /**
     * Used to validate a host and port
     * @param {String} host
     * @param {String|Number} port
     * @param {String} protocol http or https
     * @throws Throws an error if the host port, or protocol is not valid
     */
    static validateProxy (host, port, protocol) {
        if (!host || !port || (!isIp.v4(host) && !isDomain(host)) || (protocol !== 'http' && protocol !== 'https')) {
            throw new Error('Missing / invalid host, port, or protocol');
        }
    }

    /**
     * Validates a target and parses it
     * @param {String} target
     * @return {String} The validated (and parsed) target
     * @throws Throws an exception if the target is not a valid ip or domain
     */
    static validateTarget (target) {
        if (target === undefined) {
            throw new Error('`target` must be either an ip or a domain');
        }

        let targetCopy = target.slice();

        const url = validUrl.isUri(targetCopy);
        if (!url && !isIp(targetCopy)) {
            throw new Error('`target` must be either an ip or a domain');
        }

        if (url) {
            targetCopy = targetCopy.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
        }

        return targetCopy;
    }
}

module.exports = HTTPProxy;
