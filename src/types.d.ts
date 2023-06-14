import type { posbus } from '@momentum-xyz/posbus-client';

export interface BotConfig {
  worldId: string;

  // TODO Auth

  onConnected?: (userId: string) => void;
  onDisconnected?: () => void;

  onJoinedWorld?: (worldInfo: posbus.SetWorld) => void; // TODO

  // onUserAdded?: (userId: string, transform: posbus.TransformNoScale) => void;
  onUserAdded?: (user: posbus.UserData) => void;
  onUserMove?: (user: posbus.UserTransform) => void;
  onUserRemoved?: (userId: string) => void;

  onObjectAdded(object: posbus.ObjectDefinition): void;
  onObjectMove?: (objectId: string, transform: posbus.Transform) => void;
  onObjectRemoved?: (objectId: string) => void;

  onHighFive(userId: string, message?: string): void;

  // TODO Attr
}
