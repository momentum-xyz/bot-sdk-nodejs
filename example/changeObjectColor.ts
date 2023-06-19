// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, getAuthTokenWithPrivateKey, posbus } from '../';
import type { BotConfig } from '../dist/types';

let objectId: string | null = null;
let objectTransform: posbus.Transform | null = null;

const config: BotConfig = {
  worldId: '00000000-0000-8000-8000-000000000005',

  onObjectAdded: (object) => {
    console.log('Object added!', object);
    if (object.name === 'CubeX') {
      objectId = object.id;
      objectTransform = object.transform;
    }
  },
};

const bot = new Bot(config);

const privateKey = process.argv[2];
if (privateKey) {
  console.log('Private key passed. Get the auth token...');
  getAuthTokenWithPrivateKey(privateKey)
    .then((token) => {
      console.log('Connect with auth token...', token);
      bot.connect(token);
    })
    .catch((err) => {
      console.error('Failed to get auth token', err);
      process.exit(1);
    });
} else {
  console.error('Private key is required');
  process.exit(1);
}

setInterval(() => {
  if (!bot.IsReady) return;

  if (objectId && objectTransform) {
    // objectTransform.rotation.y += 0.1;
    // bot.transformObject(objectId, objectTransform);

    // generate random color
    const color = Math.floor(Math.random() * 16777215).toString(16);
    console.log('color', color);

    bot
      .setObjectAttribute({
        name: 'object_color',
        value: {
          value: '#' + color,
        },
        objectId,
      })
      .catch((err) => {
        console.error('Failed to set object attribute', err);
      });
  }
}, 3000);
