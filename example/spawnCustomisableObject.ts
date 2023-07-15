// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, getAuthTokenWithPrivateKey } from '../dist';
import type { BotConfig } from '../dist/types';

let objectId: string | null = null;

const objectName = 'ClaimableCube';

const config: BotConfig = {
  worldId: '00000000-0000-8000-8000-000000000004',

  onObjectAdded: (object) => {
    if (object.name === objectName) {
      objectId = object.id;
      console.log('Object found:', object);
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

const CUSTOMIZABLE_TYPE_ID = '4ed3a5bb-53f8-4511-941b-079029111111';
const CUBE_ASSET_3D_ID = '5b5bd872-0328-e38c-1b54-bf2bfa70fc85';

setTimeout(async () => {
  if (!bot.IsReady) return;

  if (!objectId) {
    try {
      console.log('Spawn object...');
      const { object_id } = await bot.spawnObject({
        name: objectName,
        asset_3d_id: CUBE_ASSET_3D_ID,
        object_type_id: CUSTOMIZABLE_TYPE_ID,
      });
      objectId = object_id;

      if (!objectId) throw new Error('Failed to spawn object');

      const res = await bot.setObjectAttribute({
        objectId,
        name: 'object_effect',
        value: {
          value: 'transparent',
        },
      });
      console.log('setObjectAttribute', res);

      console.log('Customisable object spawned!');
    } catch (err) {
      console.error('Failed to spawn object', err);
    }
  }
}, 3000);
