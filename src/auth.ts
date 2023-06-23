/// <reference lib="dom" />
// ^ temp until fetch types are supported better
import { BaseWallet, Wallet } from 'ethers';

const { BACKEND_URL = 'https://dev.odyssey.ninja' } = process.env;

const _getAuthToken = async (wallet: BaseWallet) => {
  const address = await wallet.getAddress();

  console.log('Get Auth token for address', address);

  const respChallenge = await fetch(
    `${BACKEND_URL}/api/v4/auth/challenge?${new URLSearchParams({
      wallet: address,
    })}`
  ).then((resp) => {
    if (resp.status !== 200) throw new Error('Failed to get challenge');
    return resp.json();
  });
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
  }).then((resp) => {
    if (resp.status !== 200) throw new Error('Failed to get token');
    return resp.json();
  });

  console.log('Token received', respToken);

  return respToken.token;
};

export const getAuthTokenWithPrivateKey = async (key: string) => {
  if (!key) throw new Error('phrase is required');

  const wallet = new Wallet(key);

  return _getAuthToken(wallet);
};
export const getAuthTokenWithMnemonicPhrase = async (phrase: string) => {
  if (!phrase) throw new Error('phrase is required');

  const wallet = Wallet.fromPhrase(phrase);

  return _getAuthToken(wallet);
};
