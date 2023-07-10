import 'websocket-polyfill';
declare global {
    interface Crypto {
        getRandomValues(buffer: ArrayBufferView): ArrayBufferView;
    }
    interface GlobalThis {
        crypto: Crypto;
    }
}
//# sourceMappingURL=polyfills.d.ts.map