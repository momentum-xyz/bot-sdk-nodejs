// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, getAuthTokenWithPrivateKey } from '../dist';
import type { BotConfig } from '../dist/types';

// let objectId: string | null = null;
// let objectTransform: posbus.Transform | null = null;

const worldId = '00000000-0000-8000-8000-000000000005';

const config: BotConfig = {
  worldId,

  // onObjectAdded: (object) => {
  //   console.log('Object added!', object);
  //   if (object.name === 'AttrX') {
  //     objectId = object.id;
  //     objectTransform = object.transform;
  //   }
  // },

  onJoinedWorld: (world) => {
    console.log('Joined world!', world);
    bot.subscribeToObjectAttribute({
      name: 'auto_test',
      objectId: worldId,
      onChange: (value) => {
        console.log('Subs: Attribute changed!', value);
      },
      onError: (err) => {
        console.error('Subs: Failed to subscribe to attribute', err);
      },
    });
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

  const color = Math.floor(Math.random() * 16777215).toString(16);
  bot
    .setObjectAttribute({
      name: 'auto_test',
      value: {
        value: '#' + color,
        status: 'ok',
        num: 42,
        obj: {
          a: 1,
          b: 2,
          arr: [1, 2, 3],
        },
      },
      objectId: worldId,
    })
    .catch((err) => {
      console.error('Failed to set object attribute', err);
    });

  // if (objectId && objectTransform) {
  // objectTransform.rotation.y += 0.1;
  // bot.transformObject(objectId, objectTransform);
  //
  // bot.removeObjectAttribute({
  //   name: 'auto_test',
  //   objectId: worldId,
  // });
  // } else {
  //   console.log('Spawn object...');
  //   bot
  //     .spawnObject({
  //       name: 'AttrX',
  //       asset_3d_id: 'a1f144de-b21a-d1e9-0635-6eb250927326',
  //     })
  //     .then(({ object_id }) => {
  //       objectId = object_id;
  //     })
  //     .catch((err) => {
  //       console.error('Failed to spawn object', err);
  //     });
  // }
}, 5000);
