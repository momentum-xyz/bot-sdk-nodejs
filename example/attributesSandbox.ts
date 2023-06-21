// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, getAuthTokenWithPrivateKey, posbus } from '../dist';
import type { BotConfig } from '../dist/types';

let objectId: string | null = null;
let objectTransform: posbus.Transform | null = null;

const worldId = '00000000-0000-8000-8000-000000000005';

const config: BotConfig = {
  worldId,

  onObjectAdded: (object) => {
    console.log('Object added!', object);
    if (object.name === 'AttrX') {
      objectId = object.id;
      objectTransform = object.transform;
    }
  },
};

const bot = new Bot(config);

const privateKey = process.env['BOT_SDK_PRIVATE_KEY'];
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
        name: 'auto_test',
        value: {
          value: '#' + color,
        },
        objectId: worldId,
      })
      .catch((err) => {
        console.error('Failed to set object attribute', err);
      });
  } else {
    console.log('Spawn object...');
    bot
      .spawnObject({
        name: 'AttrX',
        asset_3d_id: 'a1f144de-b21a-d1e9-0635-6eb250927326',
      })
      .then(({ object_id }) => {
        objectId = object_id;
      })
      .catch((err) => {
        console.error('Failed to spawn object', err);
      });
  }
}, 5000);
