"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthTokenWithMnemonicPhrase = exports.getAuthTokenWithPrivateKey = void 0;
/// <reference lib="dom" />
// ^ temp until fetch types are supported better
const ethers_1 = require("ethers");
const { BACKEND_URL = 'https://dev.odyssey.ninja' } = process.env;
const _getAuthToken = async (wallet) => {
    const address = await wallet.getAddress();
    console.log('Get Auth token for address', address);
    const respChallenge = await fetch(`${BACKEND_URL}/api/v4/auth/challenge?${new URLSearchParams({
        wallet: address,
    })}`).then((resp) => resp.json());
    console.log('Received challenge', respChallenge, '- sign it now');
    const signedChallenge = wallet.signMessageSync(respChallenge.challenge);
    console.log('Challenge signed. Fetch token');
    const respToken = await fetch(`${BACKEND_URL}/api/v4/auth/token`, {
        method: 'POST',
        body: JSON.stringify({
            signedChallenge,
            wallet: address,
            network: 'ethereum',
        }),
    }).then((resp) => resp.json());
    console.log('Token received', respToken);
    return respToken.token;
};
const getAuthTokenWithPrivateKey = async (key) => {
    if (!key)
        throw new Error('phrase is required');
    const wallet = new ethers_1.Wallet(key);
    return _getAuthToken(wallet);
};
exports.getAuthTokenWithPrivateKey = getAuthTokenWithPrivateKey;
const getAuthTokenWithMnemonicPhrase = async (phrase) => {
    if (!phrase)
        throw new Error('phrase is required');
    const wallet = ethers_1.Wallet.fromPhrase(phrase);
    return _getAuthToken(wallet);
};
exports.getAuthTokenWithMnemonicPhrase = getAuthTokenWithMnemonicPhrase;
