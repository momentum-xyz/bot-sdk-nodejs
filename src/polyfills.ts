import 'websocket-polyfill';

declare global {
  interface Crypto {
    getRandomValues(buffer: ArrayBufferView): ArrayBufferView;
  }

  interface GlobalThis {
    crypto: Crypto;
  }
}

console.log('polyfills.ts');

if (!globalThis.crypto) {
  console.log('polyfilling crypto');
  globalThis.crypto = {
    getRandomValues: function (array: ArrayBufferView): ArrayBufferView {
      return require('crypto').randomFillSync(array);
    },
  } as any;
}

if (!globalThis.fetch) {
  console.log('polyfilling fetch');
  globalThis.fetch = require('node-fetch');
}
