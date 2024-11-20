'use strict';

var transport = require('@chargerwallet/hd-transport');
var hdShared = require('@chargerwallet/hd-shared');
var axios = require('axios');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var transport__default = /*#__PURE__*/_interopDefaultLegacy(transport);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function contentType(body) {
    if (typeof body === 'string') {
        return 'text/plain';
    }
    return 'application/json';
}
function wrapBody(body) {
    if (typeof body === 'string') {
        return body;
    }
    return JSON.stringify(body);
}
function parseResult(text) {
    try {
        const result = JSON.parse(text);
        if (typeof result !== 'object') {
            throw new Error('Invalid response');
        }
        return result;
    }
    catch (e) {
        return text;
    }
}
function request(options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const fetchOptions = {
            url: options.url,
            method: options.method,
            data: wrapBody(options.body),
            withCredentials: false,
            headers: {
                'Content-Type': contentType(options.body == null ? '' : options.body),
            },
            timeout: (_a = options.timeout) !== null && _a !== void 0 ? _a : undefined,
            transformResponse: data => data,
        };
        const res = yield axios__default["default"].request(fetchOptions);
        if (+res.status === 200) {
            return parseResult(res.data);
        }
        const resJson = parseResult(res.data);
        if (typeof resJson === 'object' && resJson != null && resJson.error != null) {
            throw new hdShared.HardwareError({
                errorCode: hdShared.HardwareErrorCode.NetworkError,
                message: resJson.error,
            });
        }
        else {
            throw new hdShared.HardwareError({ errorCode: hdShared.HardwareErrorCode.NetworkError, message: res.data });
        }
    });
}
axios__default["default"].interceptors.request.use(config => {
    var _a, _b;
    if (typeof window !== 'undefined') {
        return config;
    }
    if ((_a = config.url) === null || _a === void 0 ? void 0 : _a.startsWith('http://localhost:21320')) {
        if (!((_b = config === null || config === void 0 ? void 0 : config.headers) === null || _b === void 0 ? void 0 : _b.Origin)) {
            console.log('set node request origin');
            config.headers = Object.assign(Object.assign({}, config.headers), { Origin: 'https://jssdk.chargerwallet.com' });
        }
    }
    return config;
});

const DEFAULT_URL = 'http://localhost:21320';

const { check, buildOne, receiveOne, parseConfigure } = transport__default["default"];
class HttpTransport {
    constructor(url) {
        this.configured = false;
        this.stopped = false;
        this.url = url == null ? DEFAULT_URL : url;
    }
    _post(options) {
        if (this.stopped) {
            return Promise.reject(hdShared.ERRORS.TypedError('Transport stopped.'));
        }
        return request(Object.assign(Object.assign({}, options), { method: 'POST', url: this.url + options.url }));
    }
    init(logger) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Log = logger;
            const bridgeVersion = yield this._silentInit();
            return bridgeVersion;
        });
    }
    _silentInit() {
        return __awaiter(this, void 0, void 0, function* () {
            const infoS = yield request({
                url: this.url,
                method: 'POST',
                timeout: 3000,
            });
            const info = check.info(infoS);
            return info.version;
        });
    }
    configure(signedData) {
        const messages = parseConfigure(signedData);
        this.configured = true;
        this._messages = messages;
    }
    listen(old) {
        return __awaiter(this, void 0, void 0, function* () {
            if (old === null) {
                throw hdShared.ERRORS.TypedError('Http-Transport does not support listen without previous.');
            }
            const devicesS = yield this._post({
                url: '/listen',
                body: old,
            });
            const devices = check.devices(devicesS);
            return devices;
        });
    }
    enumerate() {
        return __awaiter(this, void 0, void 0, function* () {
            const devicesS = yield this._post({ url: '/enumerate' });
            const devices = check.devices(devicesS);
            return devices;
        });
    }
    _acquireMixed(input) {
        const previousStr = input.previous == null ? 'null' : input.previous;
        const url = `/acquire/${input.path}/${previousStr}`;
        return this._post({ url });
    }
    acquire(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const acquireS = yield this._acquireMixed(input);
            return check.acquire(acquireS);
        });
    }
    release(session, onclose) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = this._post({
                url: `/release/${session}`,
            });
            if (onclose) {
                return;
            }
            yield res;
        });
    }
    call(session, name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._messages == null) {
                throw hdShared.ERRORS.TypedError(hdShared.HardwareErrorCode.TransportNotConfigured);
            }
            const messages = this._messages;
            if (transport.LogBlockCommand.has(name)) {
                this.Log.debug('call-', ' name: ', name);
            }
            else {
                this.Log.debug('call-', ' name: ', name, ' data: ', data);
            }
            const o = buildOne(messages, name, data);
            const outData = o.toString('hex');
            const resData = yield this._post({
                url: `/call/${session}`,
                body: outData,
                timeout: name === 'Initialize' ? 10000 : undefined,
            });
            if (typeof resData !== 'string') {
                throw hdShared.ERRORS.TypedError(hdShared.HardwareErrorCode.NetworkError, 'Returning data is not string.');
            }
            const jsonData = receiveOne(messages, resData);
            return check.call(jsonData);
        });
    }
    post(session, name, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._messages == null) {
                throw hdShared.ERRORS.TypedError(hdShared.HardwareErrorCode.TransportNotConfigured);
            }
            const messages = this._messages;
            const outData = buildOne(messages, name, data).toString('hex');
            yield this._post({
                url: `/post/${session}`,
                body: outData,
            });
        });
    }
    read(session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._messages == null) {
                throw hdShared.ERRORS.TypedError(hdShared.HardwareErrorCode.TransportNotConfigured);
            }
            const messages = this._messages;
            const resData = yield this._post({
                url: `/read/${session}`,
            });
            if (typeof resData !== 'string') {
                throw hdShared.ERRORS.TypedError(hdShared.HardwareErrorCode.NetworkError, 'Returning data is not string.');
            }
            const jsonData = receiveOne(messages, resData);
            return check.call(jsonData);
        });
    }
    requestDevice() {
        return Promise.reject();
    }
    stop() {
        this.stopped = true;
    }
    cancel() {
        this.Log.debug('canceled');
    }
}

module.exports = HttpTransport;
