"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
/// <reference lib="dom" />
// ^ temp until fetch types are supported better
require("./polyfills");
const posbus_client_1 = require("@momentum-xyz/posbus-client");
const fs_1 = __importDefault(require("fs"));
const events_1 = require("events");
const wasmURL = require.resolve('@momentum-xyz/posbus-client/pbc.wasm');
const wasmPBC = fs_1.default.readFileSync(wasmURL);
const { BACKEND_URL = 'https://demo.momentum.xyz' } = process.env;
// TODO move to core or sdk
const CORE_PLUGIN_ID = 'f0f0f0f0-0f0f-4ff0-af0f-f0f0f0f0f0f0';
const CUSTOM_OBJECT_TYPE_ID = '4ed3a5bb-53f8-4511-941b-07902982c31c';
class Bot {
    constructor(config) {
        this.config = config;
        if (!this.config.worldId) {
            throw new Error('worldId is required');
        }
        this.client = new posbus_client_1.PBClient(this.handleMessage);
    }
    async connect(authToken) {
        console.log('Loading wasm (', wasmPBC.byteLength, ') bytes');
        await this.client.loadAndStartMainLoop(wasmPBC);
        console.log('Wasm loaded');
        if (authToken) {
            this.authToken = authToken;
            const user = await fetch(`${this.backendUrl}/api/v4/users/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((resp) => {
                if (resp.status >= 300) {
                    throw new Error('Failed to get user');
                }
                return resp.json();
            });
            console.log('Users/me:', user);
            this.userId = user.id;
        }
        else {
            const resp = await fetch(`${this.backendUrl}/api/v4/auth/guest-token`, {
                method: 'POST',
            }).then((resp) => {
                if (resp.status >= 300) {
                    throw new Error('Failed to get guest token');
                }
                return resp.json();
            });
            const { token, id: userId } = resp;
            console.log('GUEST token', token, 'userId', userId);
            this.authToken = token;
            this.userId = userId;
        }
        if (!this.authToken || !this.userId) {
            throw new Error('authToken or userId is not set');
        }
        console.log('About to start connecting to', this.posbusUrl);
        await this.client.connect(this.posbusUrl, this.authToken, this.userId);
        console.log('Teleport to world', this.config.worldId);
        this.client.teleport(this.config.worldId);
    }
    get isConnected() {
        return this._isConnected;
    }
    get IsReady() {
        return this._isReady;
    }
    moveUser(transform) {
        console.log('moveUser', transform);
        this.client.send([posbus_client_1.MsgType.MY_TRANSFORM, transform]);
    }
    async requestObjectLock(objectId) {
        console.log('PosBus requestObjectLock', objectId);
        return new Promise((resolve, reject) => {
            this.client.send([
                posbus_client_1.MsgType.LOCK_OBJECT,
                {
                    id: objectId,
                },
            ]);
            const onResp = (data) => {
                const { id, lock_owner } = data;
                console.log('PosBus lock-object-response', id, lock_owner);
                if (id === objectId) {
                    if (
                    // temp ignore result to make up for the case of object locked by us and us not knowing
                    //result &&
                    lock_owner === this.userId) {
                        resolve();
                    }
                    else {
                        reject(new Error('Object is locked'));
                    }
                    this.emitterLockObjects.off('lock-object-response', onResp);
                }
            };
            this.emitterLockObjects.on('lock-object-response', onResp);
        });
    }
    requestObjectUnlock(objectId) {
        console.log('PosBus requestObjectUnlock', objectId);
        this.client.send([
            posbus_client_1.MsgType.UNLOCK_OBJECT,
            {
                id: objectId,
            },
        ]);
    }
    transformObject(objectId, object_transform) {
        this.client.send([
            posbus_client_1.MsgType.OBJECT_TRANSFORM,
            { id: objectId, object_transform },
        ]);
    }
    sendHighFive(userId, message) {
        this.client.send([
            posbus_client_1.MsgType.HIGH_FIVE,
            {
                sender_id: this.userId,
                receiver_id: userId,
                message: message || '',
            },
        ]);
    }
    async setObjectAttribute({ name, value, objectId, pluginId, }) {
        const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}/attributes`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                object_id: objectId,
                plugin_id: pluginId || CORE_PLUGIN_ID,
                attribute_name: name,
                attribute_value: value,
            }),
        }).then(fetchResponseHandler);
        return resp;
    }
    async removeObjectAttribute({ name, objectId, pluginId = CORE_PLUGIN_ID, }) {
        const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}/attributes?${new URLSearchParams({
            plugin_id: pluginId,
            attribute_name: name,
        })}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.authToken}`,
            },
        }).then(fetchResponseHandler);
        return resp;
    }
    async getObjectAttribute({ name, objectId, pluginId = CORE_PLUGIN_ID, }) {
        const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}/attributes?${new URLSearchParams({
            plugin_id: pluginId || CORE_PLUGIN_ID,
            attribute_name: name,
        })}`, {
            headers: {
                Authorization: `Bearer ${this.authToken}`,
            },
        }).then(fetchResponseHandler);
        return resp;
    }
    /**
     * Read object attribute value and subscribe to changes.
     *
     * Note that changes detection doesn't work for every attribute. The attribute needs to have posbus_auto Option in attribute_type.
     *
     * @returns unsubscribe function
     */
    subscribeToObjectAttribute({ name, objectId, pluginId = CORE_PLUGIN_ID, onChange, onError, }) {
        console.log('subscribeToObjectAttribute', name, objectId, pluginId);
        const handler = (event) => {
            if (event.target_id === objectId &&
                event.attribute_name === name &&
                event.plugin_id === pluginId) {
                onChange?.(event.value ?? null
                // event.change_type === 'attribute_changed' ? event.value : null
                );
            }
        };
        this.getObjectAttribute({ name, objectId, pluginId })
            .then((resp) => {
            onChange?.(resp.value);
            this.attributeSubscriptions.add(handler);
        })
            .catch(onError);
        return () => {
            this.attributeSubscriptions.delete(handler);
        };
    }
    setObjectColor(objectId, color) {
        return this.setObjectAttribute({
            name: 'object_color',
            value: {
                value: color,
            },
            objectId,
        });
    }
    setObjectName(objectId, name) {
        return this.setObjectAttribute({
            name: 'name',
            value: {
                name,
            },
            objectId,
        });
    }
    async getObjectInfo(objectId) {
        const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}`, {
            headers: {
                Authorization: `Bearer ${this.authToken}`,
            },
        }).then(fetchResponseHandler);
        return resp;
    }
    async spawnObject({ name, asset_2d_id = null, asset_3d_id = null, transform, object_type_id = CUSTOM_OBJECT_TYPE_ID, }) {
        const resp = await fetch(`${this.backendUrl}/api/v4/objects`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parent_id: this.config.worldId,
                object_type_id,
                object_name: name,
                asset_2d_id,
                asset_3d_id,
                transform,
            }),
        }).then(fetchResponseHandler);
        return resp;
    }
    async removeObject(objectId) {
        const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.authToken}`,
            },
        }).then(fetchResponseHandler);
        return resp;
    }
    async getSupportedAssets3d(category) {
        const resp = await fetch(`${this.backendUrl}/api/v4/assets-3d?${new URLSearchParams({
            category,
        })}`, {
            headers: {
                Authorization: `Bearer ${this.authToken}`,
            },
        }).then(fetchResponseHandler);
        return resp;
    }
    // ----- PRIVATE -----
    handleMessage = (event) => {
        // console.log(`PosBus message [${this.userId}]:`, event.data);
        if (!Array.isArray(event.data)) {
            console.error('WTF: PosBus message data is not an array', event);
            return;
        }
        const [type, data] = event.data;
        const { onConnected, onDisconnected, onJoinedWorld, onMyPosition, onUserAdded, onUserMove, onUserRemoved, onObjectAdded, onObjectMove, onObjectData, onObjectRemoved, onHighFive, unsafe_onRawMessage, } = this.config;
        switch (type) {
            case posbus_client_1.MsgType.SIGNAL: {
                const { value } = data;
                if (value === 7) {
                    this._isConnected = true;
                    onConnected?.(this.userId);
                }
                else {
                    // Disconnected, dual-connect, world doesn't exist, etc
                    this._isConnected = false;
                    if (value === 1) {
                        console.log('PosBus SIGNAL 1, dual-connect with same account!');
                    }
                    onDisconnected?.();
                }
                break;
            }
            case posbus_client_1.MsgType.ADD_USERS: {
                const { users } = data;
                for (const user of users) {
                    if (user.id === this.userId)
                        continue;
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
                    if (user.id === this.userId)
                        continue;
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
                console.log('PosBus set_object_data', data);
                const { id } = data;
                onObjectData?.(id, data);
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
                this._isReady = true;
                onJoinedWorld?.(data);
                break;
            }
            case posbus_client_1.MsgType.MY_TRANSFORM: {
                onMyPosition?.(data);
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
            case posbus_client_1.MsgType.LOCK_OBJECT_RESPONSE: {
                console.log('Handle posbus message lock_object_response', data);
                this.emitterLockObjects.emit('lock-object-response', data);
                break;
            }
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
            case posbus_client_1.MsgType.ATTRIBUTE_VALUE_CHANGED: {
                // console.log('Handle posbus message attribute_value_changed', data);
                for (const handler of this.attributeSubscriptions) {
                    handler(data);
                }
                break;
            }
            default:
                console.log('Unhandled posbus message, type:', type, 'data:', data);
        }
        unsafe_onRawMessage?.(event);
    };
    get backendUrl() {
        return this.config.backendUrl || BACKEND_URL;
    }
    get posbusUrl() {
        return `${this.backendUrl}/posbus`;
    }
    config;
    client;
    userId;
    authToken;
    _isConnected = false;
    _isReady = false;
    attributeSubscriptions = new Set();
    emitterLockObjects = new events_1.EventEmitter();
}
exports.Bot = Bot;
async function fetchResponseHandler(resp) {
    if (resp.status >= 300) {
        const data = await resp.json().catch(() => { });
        throw new Error(data?.error?.message || data?.error?.reasons || resp.statusText);
    }
    return resp.json();
}
