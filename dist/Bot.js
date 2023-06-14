"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
/// <reference lib="dom" />
// ^ temp until fetch types are supported better
require("websocket-polyfill");
const posbus_client_1 = require("@momentum-xyz/posbus-client");
const fs_1 = __importDefault(require("fs"));
// import wasm from '@momentum-xyz/posbus-client/pbc.wasm';
const wasmPBC = fs_1.default.readFileSync('./node_modules/@momentum-xyz/posbus-client/dist/pbc.wasm');
// type Transform = posbus.Transform;
const { BACKEND_URL = 'https://dev.odyssey.ninja' } = process.env;
const POSBUS_URL = `${BACKEND_URL}/posbus`;
class Bot {
    constructor(config) {
        this.config = config;
        if (!this.config.worldId) {
            throw new Error('worldId is required');
        }
        this.client = new posbus_client_1.PBClient(this.handleMessage);
    }
    async connect() {
        this.client.load(wasmPBC);
        const resp = await fetch(`${BACKEND_URL}/api/v4/auth/guest-token`, {
            method: 'POST',
        }).then((resp) => resp.json());
        const { token, id: userId } = resp;
        console.log('guest-token resp', resp);
        console.log('GUEST token', token, 'userId', userId);
        this.userId = userId;
        this.port = await this.client.connect(POSBUS_URL, token, userId);
        this.client.teleport(this.config.worldId);
    }
    moveUser(transform) {
        console.log('moveUser', transform);
        this._getPort().postMessage([posbus_client_1.MsgType.MY_TRANSFORM, transform]);
    }
    sendHighFive(userId, message) {
        // this._getPort().postMessage([
        //   MsgType.HIGH_FIVE,
        //   {
        //     sender_id: this.userId!,
        //     receiver_id: userId,
        //     message: message || '',
        //   },
        // ]);
        this.client.send(posbus_client_1.MsgType.HIGH_FIVE, {
            sender_id: this.userId,
            receiver_id: userId,
            message: message || '',
        });
    }
    // ----- PRIVATE -----
    handleMessage = (event) => {
        // console.log(`PosBus message [${this.userId}]:`, event.data);
        if (!Array.isArray(event.data)) {
            console.error('WTF: PosBus message data is not an array', event);
            return;
        }
        const [type, data] = event.data;
        const { onConnected, onDisconnected, onJoinedWorld, onUserAdded, onUserMove, onUserRemoved, onObjectAdded, onObjectMove, onObjectRemoved, onHighFive, } = this.config;
        switch (type) {
            case posbus_client_1.MsgType.SIGNAL: {
                const { value } = data;
                if (value === 7) {
                    onConnected?.(this.userId);
                }
                else if (value === 8) {
                    onDisconnected?.();
                }
                break;
            }
            case posbus_client_1.MsgType.ADD_USERS: {
                const { users } = data;
                for (const user of users) {
                    onUserAdded?.(user);
                }
                break;
            }
            case posbus_client_1.MsgType.REMOVE_USERS: {
                const { users } = data;
                for (const userId of users) {
                    onUserRemoved?.(userId);
                }
                break;
            }
            case posbus_client_1.MsgType.USERS_TRANSFORM_LIST: {
                const { value: users } = data;
                for (const user of users) {
                    onUserMove?.(user);
                }
                break;
            }
            case posbus_client_1.MsgType.OBJECT_TRANSFORM: {
                const { id, object_transform } = data;
                onObjectMove?.(id, object_transform);
                break;
            }
            case posbus_client_1.MsgType.OBJECT_DATA: {
                // TEMP ignore
                // console.log('PosBus set_object_data', data);
                // const { id, entries } = data as any;
                // if (entries?.texture) {
                //   Object.entries(entries.texture).forEach(([label, hash]: any) => {
                //     Event3dEmitter.emit('ObjectTextureChanged', {
                //       objectId: id,
                //       label,
                //       hash,
                //     });
                //   });
                // }
                // if (entries?.string?.object_color) {
                //   Event3dEmitter.emit('ObjectTextureChanged', {
                //     objectId: id,
                //     label: 'object_color',
                //     hash: entries.string.object_color,
                //   });
                // }
                break;
            }
            case posbus_client_1.MsgType.SET_WORLD: {
                onJoinedWorld?.(data);
                break;
            }
            case posbus_client_1.MsgType.ADD_OBJECTS: {
                const { objects } = data;
                for (const object of objects) {
                    onObjectAdded?.(object);
                }
                break;
            }
            case posbus_client_1.MsgType.REMOVE_OBJECTS: {
                const { objects } = data;
                for (const objectId of objects) {
                    onObjectRemoved?.(objectId);
                }
                break;
            }
            // case MsgType.LOCK_OBJECT: {
            //   console.log('Temp ignore posbus message lock_object', data);
            //   break;
            // }
            // case MsgType.LOCK_OBJECT_RESPONSE: {
            //   console.log('Temp ignore posbus message lock_object_response', data);
            //   break;
            // }
            // case MsgType.ATTRIBUTE_VALUE_CHANGED: {
            //   console.log('[PosBus Msg] ATTRIBUTE_VALUE_CHANGED: ', data);
            //   switch (data.topic) {
            //     case 'voice-chat-user': {
            //       const { attribute_name, value } = data.data;
            //       if (attribute_name === AttributeNameEnum.VOICE_CHAT_USER) {
            //         if (value && value.joined) {
            //           Event3dEmitter.emit('UserJoinedVoiceChat', value.userId);
            //         } else if (value) {
            //           Event3dEmitter.emit('UserLeftVoiceChat', value.userId);
            //         }
            //       }
            //       break;
            //     }
            //   }
            //   break;
            // }
            case posbus_client_1.MsgType.HIGH_FIVE: {
                // console.log('Handle posbus message high_five', data);
                const { sender_id, receiver_id, message } = data;
                if (receiver_id !== this.userId) {
                    console.log('High five not for me', receiver_id);
                    return;
                }
                onHighFive?.(sender_id, message);
                break;
            }
            default:
                console.log('Unhandled posbus message, type:', type, 'data:', data);
        }
    };
    config;
    client;
    port;
    userId;
    _getPort() {
        if (!this.port) {
            throw new Error('not connected');
        }
        return this.port;
    }
}
exports.Bot = Bot;
