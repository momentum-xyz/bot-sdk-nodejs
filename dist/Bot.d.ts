/// <reference lib="dom" />
import 'websocket-polyfill';
import { posbus } from '@momentum-xyz/posbus-client';
import type { BotConfig } from './types';
type TransformNoScale = posbus.TransformNoScale;
export declare class Bot {
    constructor(config: BotConfig);
    connect(): Promise<void>;
    get isConnected(): boolean;
    get IsReady(): boolean;
    moveUser(transform: TransformNoScale): void;
    transformObject(objectId: string, object_transform: posbus.Transform): void;
    sendHighFive(userId: string, message?: string): void;
    private handleMessage;
    private config;
    private client;
    private userId;
    private _isConnected;
    private _isReady;
}
export {};
//# sourceMappingURL=Bot.d.ts.map