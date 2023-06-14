// import { Bot, posbus } from '@momentum-xyz/bot-sdk';
import { Bot, posbus } from '../';

console.log('BOT SDK:', Bot);

let myUserId: string | null = null;
let myUserTransform: posbus.TransformNoScale | null = null;

const bot = new Bot({
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

  onDisconnected: () => {
    console.log('Disconnected!');
  },
  onJoinedWorld: (data) => {
    console.log('Joined world!', data);

    setInterval(() => {
      // TODO move user
      bot.moveUser({
        position: {
          x: myUserTransform!.position.x + 0.1,
          y: myUserTransform!.position.y,
          z: myUserTransform!.position.z,
        },
        rotation: {
          x: myUserTransform!.rotation.x,
          y: myUserTransform!.rotation.y,
          z: myUserTransform!.rotation.z,
        },
      });
    }, 1000);
  },
});

console.log('Waiting few seconds before connect...');
setTimeout(() => {
  bot.connect();
}, 2000);
