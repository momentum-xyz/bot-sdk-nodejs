// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, getAuthTokenWithPrivateKey, posbus } from '../';
import type { BotConfig } from '../dist/types';

let myUserId: string | null = null;
let myUserTransform: posbus.TransformNoScale | null = null;
let objectToMoveId: string | null = null;

const config: BotConfig = {
  worldId: '00000000-0000-8000-8000-000000000005',
  onConnected: (userId) => {
    console.log('Connected!');
    myUserId = userId;
  },
  onUserAdded: (user) => {
    console.log('User added!', user);
    if (user.id === myUserId) {
      myUserTransform = user.transform;
    } else {
      setTimeout(() => {
        bot.sendHighFive(user.id, `~~ High5 Bot ~~`);
      }, 3000);
    }
  },
  onUserMove: (user) => {
    console.log('User move!', user);
    if (user.id === myUserId) {
      myUserTransform = user.transform;
    }
  },

  onObjectAdded: (object) => {
    console.log('Object added!', object);
    if (object.name === 'nic car') {
      objectToMoveId = object.id;
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
  console.log('No private key passed. Connect as guest...');
  bot.connect();
}

setInterval(() => {
  if (!bot.IsReady || !myUserTransform) return;

  bot.moveUser({
    position: {
      x: myUserTransform.position.x + 0.2,
      y: myUserTransform.position.y,
      z: myUserTransform.position.z,
    },
    rotation: {
      x: myUserTransform.rotation.x,
      y: myUserTransform.rotation.y,
      z: myUserTransform.rotation.z,
    },
  });

  if (objectToMoveId) {
    bot.transformObject(objectToMoveId, {
      position: {
        x: myUserTransform.position.x,
        y: myUserTransform.position.y - 0.5,
        z: myUserTransform.position.z + 0.2,
      },
      rotation: {
        x: myUserTransform.rotation.x,
        y: myUserTransform.rotation.y + 1.7,
        z: myUserTransform.rotation.z,
      },
      scale: {
        x: 1,
        y: 1,
        z: 1,
      },
    });
  }
}, 1000);
