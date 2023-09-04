/// <reference lib="dom" />
// ^ temp until fetch types are supported better
import './polyfills';
import {
  posbus,
  PBClient,
  PosbusEvent,
  MsgType,
} from '@momentum-xyz/posbus-client';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { Asset3d, BotConfig, BotInterface } from './types';

const wasmURL = require.resolve('@momentum-xyz/posbus-client/pbc.wasm');
const wasmPBC = fs.readFileSync(wasmURL);

const { BACKEND_URL = 'https://demo.momentum.xyz' } = process.env;

// TODO move to core or sdk
const CORE_PLUGIN_ID = 'f0f0f0f0-0f0f-4ff0-af0f-f0f0f0f0f0f0';
const CUSTOM_OBJECT_TYPE_ID = '4ed3a5bb-53f8-4511-941b-07902982c31c';

export class Bot implements BotInterface {
  constructor(config: BotConfig) {
    this.config = config;
    if (!this.config.worldId) {
      throw new Error('worldId is required');
    }
    this.client = new PBClient(this.handleMessage);
  }

  async connect(authToken?: string) {
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
    } else {
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

  moveUser(transform: posbus.TransformNoScale) {
    console.log('moveUser', transform);
    this.client.send([MsgType.MY_TRANSFORM, transform]);
  }

  async requestObjectLock(objectId: string) {
    console.log('PosBus requestObjectLock', objectId);
    return new Promise<void>((resolve, reject) => {
      this.client.send([
        MsgType.LOCK_OBJECT,
        {
          id: objectId,
        },
      ]);

      const onResp = (data: posbus.LockObjectResponse) => {
        const { id, lock_owner } = data;
        console.log('PosBus lock-object-response', id, lock_owner);
        if (id === objectId) {
          if (
            // temp ignore result to make up for the case of object locked by us and us not knowing
            //result &&
            lock_owner === this.userId
          ) {
            resolve();
          } else {
            reject(new Error('Object is locked'));
          }
          this.emitterLockObjects.off('lock-object-response', onResp);
        }
      };
      this.emitterLockObjects.on('lock-object-response', onResp);
    });
  }
  requestObjectUnlock(objectId: string) {
    console.log('PosBus requestObjectUnlock', objectId);
    this.client.send([
      MsgType.UNLOCK_OBJECT,
      {
        id: objectId,
      },
    ]);
  }

  transformObject(objectId: string, object_transform: posbus.Transform) {
    this.client.send([
      MsgType.OBJECT_TRANSFORM,
      { id: objectId, object_transform },
    ]);
  }

  sendHighFive(userId: string, message?: string) {
    this.client.send([
      MsgType.HIGH_FIVE,
      {
        sender_id: this.userId!,
        receiver_id: userId,
        message: message || '',
      },
    ]);
  }

  async setObjectAttribute({
    name,
    value,
    objectId,
    pluginId,
  }: {
    name: string;
    value: any;
    // path?: string; // TODO for sub-attributes
    objectId: string;
    pluginId?: string;
  }) {
    const resp = await fetch(
      `${this.backendUrl}/api/v4/objects/${objectId}/attributes`,
      {
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
      }
    ).then(fetchResponseHandler);
    return resp;
  }

  async removeObjectAttribute({
    name,
    objectId,
    pluginId = CORE_PLUGIN_ID,
  }: {
    name: string;
    objectId: string;
    pluginId?: string;
  }) {
    const resp = await fetch(
      `${
        this.backendUrl
      }/api/v4/objects/${objectId}/attributes?${new URLSearchParams({
        plugin_id: pluginId,
        attribute_name: name,
      })}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      }
    ).then(fetchResponseHandler);
    return resp;
  }

  async getObjectAttribute({
    name,
    objectId,
    pluginId = CORE_PLUGIN_ID,
  }: {
    name: string;
    objectId: string;
    pluginId?: string;
  }) {
    const resp = await fetch(
      `${
        this.backendUrl
      }/api/v4/objects/${objectId}/attributes?${new URLSearchParams({
        plugin_id: pluginId || CORE_PLUGIN_ID,
        attribute_name: name,
      })}`,
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      }
    ).then(fetchResponseHandler);
    return resp;
  }

  /**
   * Read object attribute value and subscribe to changes.
   *
   * Note that changes detection doesn't work for every attribute. The attribute needs to have posbus_auto Option in attribute_type.
   *
   * @returns unsubscribe function
   */
  subscribeToObjectAttribute({
    name,
    objectId,
    pluginId = CORE_PLUGIN_ID,
    onChange,
    onError,
  }: {
    name: string;
    objectId: string;
    pluginId?: string;
    onChange?: (value: any) => void;
    onError?: (err: Error) => void;
  }): () => void {
    console.log('subscribeToObjectAttribute', name, objectId, pluginId);
    const handler = (event: posbus.AttributeValueChanged) => {
      if (
        event.target_id === objectId &&
        event.attribute_name === name &&
        event.plugin_id === pluginId
      ) {
        onChange?.(
          event.value ?? null
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

  setObjectColor(objectId: string, color: string | null) {
    return this.setObjectAttribute({
      name: 'object_color',
      value: {
        value: color,
      },
      objectId,
    });
  }

  setObjectName(objectId: string, name: string) {
    return this.setObjectAttribute({
      name: 'name',
      value: {
        name,
      },
      objectId,
    });
  }

  async getObjectInfo(objectId: string) {
    const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    }).then(fetchResponseHandler);
    return resp;
  }

  async spawnObject({
    name,
    asset_2d_id = null,
    asset_3d_id = null,
    transform,
    object_type_id = CUSTOM_OBJECT_TYPE_ID,
  }: {
    name: string;
    asset_2d_id?: string | null;
    asset_3d_id: string | null;
    object_type_id?: string;
    transform?: posbus.Transform;
  }) {
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

  async removeObject(objectId: string) {
    const resp = await fetch(`${this.backendUrl}/api/v4/objects/${objectId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    }).then(fetchResponseHandler);
    return resp;
  }

  async getSupportedAssets3d(category: 'basic' | 'custom'): Promise<Asset3d> {
    const resp = await fetch(
      `${this.backendUrl}/api/v4/assets-3d?${new URLSearchParams({
        category,
      })}`,
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      }
    ).then(fetchResponseHandler);
    return resp;
  }

  // ----- PRIVATE -----

  private handleMessage = (event: PosbusEvent) => {
    // console.log(`PosBus message [${this.userId}]:`, event.data);
    if (!Array.isArray(event.data)) {
      console.error('WTF: PosBus message data is not an array', event);
      return;
    }
    const [type, data] = event.data;
    const {
      onConnected,
      onDisconnected,
      onJoinedWorld,
      onMyPosition,
      onUserAdded,
      onUserMove,
      onUserRemoved,
      onObjectAdded,
      onObjectMove,
      onObjectData,
      onObjectRemoved,
      onHighFive,
      unsafe_onRawMessage,
    } = this.config;

    switch (type) {
      case MsgType.SIGNAL: {
        const { value } = data;
        if (value === 7) {
          this._isConnected = true;
          onConnected?.(this.userId!);
        } else {
          // Disconnected, dual-connect, world doesn't exist, etc
          this._isConnected = false;
          if (value === 1) {
            console.log('PosBus SIGNAL 1, dual-connect with same account!');
          }
          onDisconnected?.();
        }
        break;
      }

      case MsgType.ADD_USERS: {
        const { users } = data;
        for (const user of users) {
          if (user.id === this.userId) continue;
          onUserAdded?.(user);
        }
        break;
      }

      case MsgType.REMOVE_USERS: {
        const { users } = data;
        for (const userId of users) {
          onUserRemoved?.(userId);
        }
        break;
      }

      case MsgType.USERS_TRANSFORM_LIST: {
        const { value: users } = data;

        for (const user of users) {
          if (user.id === this.userId) continue;
          onUserMove?.(user);
        }
        break;
      }

      case MsgType.OBJECT_TRANSFORM: {
        const { id, object_transform } = data;
        onObjectMove?.(id, object_transform);
        break;
      }

      case MsgType.OBJECT_DATA: {
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
      case MsgType.SET_WORLD: {
        this._isReady = true;
        onJoinedWorld?.(data);
        break;
      }
      case MsgType.MY_TRANSFORM: {
        onMyPosition?.(data);
        break;
      }

      case MsgType.ADD_OBJECTS: {
        const { objects } = data;
        for (const object of objects) {
          onObjectAdded?.(object);
        }
        break;
      }

      case MsgType.REMOVE_OBJECTS: {
        const { objects } = data;
        for (const objectId of objects) {
          onObjectRemoved?.(objectId);
        }
        break;
      }

      case MsgType.LOCK_OBJECT_RESPONSE: {
        console.log('Handle posbus message lock_object_response', data);
        this.emitterLockObjects.emit('lock-object-response', data);
        break;
      }

      case MsgType.HIGH_FIVE: {
        // console.log('Handle posbus message high_five', data);
        const { sender_id, receiver_id, message } = data;
        if (receiver_id !== this.userId) {
          console.log('High five not for me', receiver_id);
          return;
        }

        onHighFive?.(sender_id, message);
        break;
      }

      case MsgType.ATTRIBUTE_VALUE_CHANGED: {
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

  private get backendUrl() {
    return this.config.backendUrl || BACKEND_URL;
  }
  private get posbusUrl() {
    return `${this.backendUrl}/posbus`;
  }

  private config: BotConfig;
  private client: PBClient;
  private userId: string | undefined;
  private authToken: string | undefined;
  private _isConnected: boolean = false;
  private _isReady: boolean = false;
  private attributeSubscriptions = new Set<
    (v: posbus.AttributeValueChanged) => void
  >();
  private emitterLockObjects: EventEmitter = new EventEmitter();
}

async function fetchResponseHandler(resp: Response) {
  if (resp.status >= 300) {
    const data = await resp.json().catch(() => {});
    throw new Error(
      data?.error?.message || data?.error?.reasons || resp.statusText
    );
  }
  return resp.json();
}
