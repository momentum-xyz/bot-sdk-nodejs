// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, getAuthTokenWithPrivateKey, posbus } from '../';
import type { BotConfig } from '../dist/types';

let myUserId: string | null = null;
let objectToMoveId: string | null = null;
let objectTransform: posbus.Transform | null = null;

const {
  OBJECT_NAME = 'CubeX3',
  WORLD_ID = '00000000-0000-8000-8000-000000000005',
} = process.env;

const config: BotConfig = {
  worldId: WORLD_ID,
  onConnected: (userId) => {
    console.log('Connected!');
    myUserId = userId;
  },
  onUserAdded: (user) => {
    console.log('User added!', user);

    const { position, rotation } = user.transform;
    bot.moveUser({
      position: {
        x: position.x + rotation.x * 0.5,
        y: position.y + rotation.y * 0.5,
        z: position.z + rotation.z * 0.5,
      },
      rotation,
    });
    setTimeout(() => {
      bot.sendHighFive(user.id, `~~ High5 Bot ~~`);
    }, 1000);
  },

  onObjectAdded: (object) => {
    console.log('Object added!', object);
    if (object.name === OBJECT_NAME) {
      objectToMoveId = object.id;
      objectTransform = object.transform;
    }
  },

  onHighFive: (userId, message) => {
    console.log('High five!', userId, message);
    if (objectToMoveId) {
      const color = Math.floor(Math.random() * 16777215).toString(16);
      console.log('New color', color);

      bot
        .setObjectAttribute({
          name: 'object_color',
          value: {
            value: '#' + color,
          },
          objectId: objectToMoveId,
        })
        .catch((err) => {
          console.error('Failed to set object attribute', err);
        });
    }
  },

  onDisconnected: () => {
    console.log('Disconnected!');
  },
  onJoinedWorld: (data) => {
    console.log('Joined world!', data);
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
  console.log('No private key passed. Connect as guest...');
  bot.connect();
}

type Vector2 = { x: number; y: number };

const generatePosition: (
  center: Vector2,
  radius: number,
  progress: number
) => Vector2 = (center, radius, progress) => {
  const angle = progress * Math.PI * 2;
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
};

const radius = 5;
let progress = 0;

setInterval(() => {
  if (!bot.IsReady) return;

  if (objectToMoveId && objectTransform) {
    progress += 0.01;
    bot.transformObject(objectToMoveId, {
      ...objectTransform,
      position: {
        ...objectTransform.position,
        ...generatePosition(objectTransform?.position, radius, progress),
      },
    });
  }
}, 3000);
