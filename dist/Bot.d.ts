/// <reference lib="dom" />
import 'websocket-polyfill';
import { posbus } from '@momentum-xyz/posbus-client';
import type { BotConfig, BotInterface } from './types';
type TransformNoScale = posbus.TransformNoScale;
export declare class Bot implements BotInterface {
    constructor(config: BotConfig);
    connect(authToken?: string): Promise<void>;
    get isConnected(): boolean;
    get IsReady(): boolean;
    moveUser(transform: TransformNoScale): void;
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
    spawnObject({ name, asset_3d_id, transform, }: {
        name: string;
        asset_3d_id: string;
        transform?: TransformNoScale;
    }): Promise<any>;
    private handleMessage;
    private config;
    private client;
    private userId;
    private authToken;
    private _isConnected;
    private _isReady;
    private attributeSubscriptions;
}
export {};
//# sourceMappingURL=Bot.d.ts.map