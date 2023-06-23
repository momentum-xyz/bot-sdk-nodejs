# BOT SDK for Odyssey platform

## Introduction

This SDK allows connecting to the Odyssey platform as a user an interact with it.

## Installation

For now the packages are only hosted on Github npm package repository.
To use this you need to [authenticate](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).
Read the Github documentation, create PAT and:

```shell
npm login --scope=@momentum-xyz --auth-type=legacy --registry=https://npm.pkg.github.com
```

It's still in alpha so you need to specify the 'next' dist-tag:

```bash
npm install @momentum-xyz/bot-sdk@next
```

## Typescript Example

```js
import { Bot, posbus } from '@momentum-xyz/bot-sdk';


let myUserId: string | null = null;

const bot = new Bot({
  worldId: '00000000-0000-8000-8000-00000000000a',
  onConnected: (userId) => {
    console.log('Connected!');
    myUserId = userId;
  },
  onUserAdded: (user) => {
    console.log('User added!', user);
    if (user.id !== myUserId) {{
      setTimeout(() => {
        bot.sendHighFive(user.id, `~~ High5 Bot ~~`);
      }, 3000);
    }
  }
  onDisconnected: () => {
    console.log('Disconnected!');
  },
  onJoinedWorld: (data) => {
    console.log('Joined world!', data);
  },
  // ...
});

// connect as Guest
bot.connect();
```

### Connect as User with Ethereum account private key

```js
import { Bot, getAuthTokenWithPrivateKey, posbus } from '@momentum-xyz/bot-sdk';

// instantiate Bot - same as above example

const privateKey = process.env.PRIVATE_KEY;

getAuthTokenWithPrivateKey(privateKey)
  .then((token) => {
    console.log('Connect with auth token...', token);
    bot.connect(token);
  })
  .catch((err) => {
    console.error('Failed to get auth token', err);
    process.exit(1);
  });
```

## Development

Close the repo and install dependencies:

```
git clone git@github.com:momentum-xyz/bot-sdk-nodejs.git

cd bot-sdk-nodejs

npm install
```

To build once do:

```bash
npm run build
```

And to watch for changes:

```bash
npm start
```

To deploy a new version:

```bash
npm version prerelease

git push origin main --tags
```

### Configuration

This variable is taken as base URL for websocket connection and API calls:

```
export BACKEND_URL='https://dev.odyssey.ninja'
```
