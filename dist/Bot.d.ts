/// <reference lib="dom" />
import 'websocket-polyfill';
import { posbus } from '@momentum-xyz/posbus-client';
import type { BotConfig } from './types';
type TransformNoScale = posbus.TransformNoScale;
export declare class Bot {
    constructor(config: BotConfig);
    connect(): Promise<void>;
    moveUser(transform: TransformNoScale): void;
    sendHighFive(userId: string, message?: string): void;
    private handleMessage;
    private config;
    private client;
    private port;
    private userId;
    private _getPort;
}
export {};
//# sourceMappingURL=Bot.d.ts.map