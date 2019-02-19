const isIp = require('is-ip');
const isDomain = require('is-valid-domain');
const validUrl = require('valid-url');
const url = require('url');

// TODO: Information about proxy: ssl certificates?

class HTTPProxy {
    /**
     * Creates a new instance of the HTTPProxy class
     * @param {String} host
     * @param {String|Number} port
     * @param {Boolean} [ssl=false] If the proxy supports ssl encryption
     * @param {String} [auth=null] username:password
     * @throws Throws an error if the host or port is not valid
     */
    constructor (host, port, ssl = false, auth = null) {
        const portCopy = parseInt(port);

        HTTPProxy.validateProxy(host, portCopy, ssl, auth);

        this.host = host;
        this.port = portCopy;
        this.ssl = ssl;
        this.auth = auth;
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
     * Gets the url for the proxy
     * @return {String}
     */
    url () {
        return `${this.ssl ? 'https' : 'http'}://${this.auth === null ? '' : this.auth + '@'}${this.host}:${this.port}`;
    }

    /**
     * Used to validate a host and port
     * @param {String} host
     * @param {String|Number} port
     * @param {Boolean} ssl If the proxy supports ssl encryption
     * @param {String} auth username:password
     * @throws Throws an error if the host port, or protocol is not valid
     */
    static validateProxy (host, port, ssl, auth) {
        if (host === undefined || port === undefined || ssl === undefined || auth === undefined) {
            throw new Error('Missing host, port, ssl or auth');
        } else if ((!isIp.v4(host) && !isDomain(host))) {
            throw new Error('`host` must be either an ipv4 or a domain');
        } else if (typeof ssl !== 'boolean') {
            throw new Error('`ssl` must be a boolean');
        } else if (auth !== null && (typeof auth !== 'string' || auth.split(':').length !== 2)) {
            throw new Error('`auth` must be an auth string like `username:password`');
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

        const isUrl = validUrl.isUri(targetCopy);
        if (!isUrl && !isIp(targetCopy)) {
            throw new Error('`target` must be either an ip or a domain');
        }

        if (isUrl) {
            targetCopy = url.parse(target).hostname;
        }

        return targetCopy;
    }
}

module.exports = HTTPProxy;
