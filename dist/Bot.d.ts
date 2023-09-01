/// <reference lib="dom" />
import './polyfills';
import { posbus } from '@momentum-xyz/posbus-client';
import type { BotConfig, BotInterface } from './types';
export declare class Bot implements BotInterface {
    constructor(config: BotConfig);
    connect(authToken?: string): Promise<void>;
    get isConnected(): boolean;
    get IsReady(): boolean;
    moveUser(transform: posbus.TransformNoScale): void;
    requestObjectLock(objectId: string): Promise<void>;
    requestObjectUnlock(objectId: string): void;
    transformObject(objectId: string, object_transform: posbus.Transform): void;
    sendHighFive(userId: string, message?: string): void;
    setObjectAttribute({ name, value, objectId, pluginId, }: {
        name: string;
        value: any;
        objectId: string;
        pluginId?: string;
    }): Promise<any>;
    removeObjectAttribute({ name, objectId, pluginId, }: {
        name: string;
        objectId: string;
        pluginId?: string;
    }): Promise<any>;
    getObjectAttribute({ name, objectId, pluginId, }: {
        name: string;
        objectId: string;
        pluginId?: string;
    }): Promise<any>;
    /**
     * Read object attribute value and subscribe to changes.
     *
     * Note that changes detection doesn't work for every attribute. The attribute needs to have posbus_auto Option in attribute_type.
     *
     * @returns unsubscribe function
     */
    subscribeToObjectAttribute({ name, objectId, pluginId, onChange, onError, }: {
        name: string;
        objectId: string;
        pluginId?: string;
        onChange?: (value: any) => void;
        onError?: (err: Error) => void;
    }): () => void;
    getObjectInfo(objectId: string): Promise<any>;
    spawnObject({ name, asset_2d_id, asset_3d_id, transform, object_type_id, }: {
        name: string;
        asset_2d_id?: string | null;
        asset_3d_id: string | null;
        object_type_id?: string;
        transform?: posbus.Transform;
    }): Promise<any>;
    removeObject(objectId: string): Promise<any>;
    private handleMessage;
    private get backendUrl();
    private get posbusUrl();
    private config;
    private client;
    private userId;
    private authToken;
    private _isConnected;
    private _isReady;
    private attributeSubscriptions;
    private emitterLockObjects;
}
//# sourceMappingURL=Bot.d.ts.map