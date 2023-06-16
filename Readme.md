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

```bash
npm install @momentum-xyz/bot-sdk
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

bot.connect();
```
