import type { posbus } from '@momentum-xyz/posbus-client';

export interface BotConfig {
  worldId: string;

  onConnected?: (userId: string) => void;
  onDisconnected?: () => void;

  onJoinedWorld?: (worldInfo: posbus.SetWorld) => void;
  onMyPosition?: (transform: posbus.MyTransform) => void;

  onUserAdded?: (user: posbus.UserData) => void;
  onUserMove?: (user: posbus.UserTransform) => void;
  onUserRemoved?: (userId: string) => void;

  onObjectAdded?(object: posbus.ObjectDefinition): void;
  onObjectMove?: (objectId: string, transform: posbus.Transform) => void;
  onObjectRemoved?: (objectId: string) => void;

  onHighFive?(userId: string, message?: string): void;

  // Not recommended to use unless you know what you're doing, subject to change
  unsafe_onRawMessage?: (message: posbus.Message) => void;
}
