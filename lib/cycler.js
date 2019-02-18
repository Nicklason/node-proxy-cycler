const isObject = require('is-object');

const HTTPProxy = require('./httpproxy');

/**
 * Cycle through HTTP proxies
 */
class Cycler {
    /**
     * Creates a new instance of the Cycler class
     * @param {Array<Object>} proxies An array of http proxies
     * @throws Throws an exception if `proxies` is not an array of objects, and if the proxy is not valid
     * @example `const cycler = new Cycler([{ host: '127.0.0.1', port: 8080 }]);`
     */
    constructor (proxies) {
        this.proxies = [];

        if (proxies === undefined) {
            return;
        } else if (!Array.isArray(proxies)) {
            throw new Error('`proxies` must be an array');
        }

        for (let i = 0; i < proxies.length; i++) {
            const proxy = proxies[i];
            if (!isObject(proxy)) {
                throw new Error('`proxies` must be an array of objects');
            }

            this.add(proxy.host, proxy.port);
        }
    }

    /**
     * Returns the proxy that was used last with the target
     * @param {String} target
     * @return {HTTPProxy}
     */
    get (target) {
        // TODO: Don't require a target, but find the proxy that was last used
        const targetCopy = HTTPProxy.validateTarget(target);

        let date;
        let index;

        for (let i = 0; i < this.proxies.length; i++) {
            const proxy = this.proxies[i];
            if (Object.keys(proxy.used).indexOf(targetCopy) === -1) {
                return proxy;
            } else if (date === undefined || date.getTime() > proxy.used[targetCopy].getTime()) {
                date = proxy.used[targetCopy];
                index = i;
            }
        }

        return index === undefined ? null : this.proxies[index];
    }

    /**
     * Adds a new proxy
     * @param {String} host
     * @param {String|Number} port
     * @return {HTTPProxy}
     * @throws Throws an error if the host or port is not valid
     */
    add (host, port) {
        port = parseInt(port);

        const proxy = new HTTPProxy(host, port);
        const exists = this._exists(proxy.host, proxy.port);
        if (exists !== false) {
            // The proxy already exists, return it
            return this.proxies[exists];
        }

        // The proxy does not already exist, add it
        this.proxies.push(proxy);
        return proxy;
    }

    /**
     * Removes a proxy
     * @param {String} host
     * @param {String|Number} port
     * @return {Boolean} Returns true if the proxy was found and removed, false if not
     */
    remove (host, port) {
        port = parseInt(port);

        const exists = this._exists(host, port);
        if (exists !== false) {
            this.proxies.splice(exists, 1);
        }

        return exists !== false;
    }

    /**
     * Marks a proxy as used
     * @param {String} host The host of the proxy
     * @param {String|Number} port The port of the proxy
     * @param {String} target The target can be either an ip or a domain
     * @param {Date} [date] Time when the proxy was used (should be converted to local timezone)
     * @throws Throws an error if the host, port, target, or date is not valid
     */
    use (host, port, target, date) {
        let proxy;

        const exists = this._exists(host, port);
        if (exists !== false) {
            proxy = this.proxies[exists];
        } else {
            proxy = this.add(host, port);
        }

        proxy.use(target, date);
    }

    /**
     * Returns the index of the proxy in the proxies list, otherwise false
     * @param {String} host
     * @param {String|Number} port
     * @return {Number|Boolean} The index of the proxy in the proxies list, or false if it does not exist
     */
    _exists (host, port) {
        for (let i = 0; i < this.proxies.length; i++) {
            const proxy = this.proxies[i];
            if (proxy.host === host && proxy.port === port) {
                return i;
            }
        }
        return false;
    }
}

module.exports = Cycler;
