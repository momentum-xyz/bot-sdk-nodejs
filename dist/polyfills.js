"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("websocket-polyfill");
console.log('polyfills.ts');
if (!globalThis.crypto) {
    console.log('polyfilling crypto');
    globalThis.crypto = {
        getRandomValues: function (array) {
            return require('crypto').randomFillSync(array);
        },
    };
}
if (!globalThis.fetch) {
    console.log('polyfilling fetch');
    globalThis.fetch = require('node-fetch');
}
