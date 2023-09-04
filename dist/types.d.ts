import type { PosbusEvent, posbus } from '@momentum-xyz/posbus-client';

export interface BotConfig {
  worldId: string;

  backendUrl?: string;

  onConnected?: (userId: string) => void;
  onDisconnected?: () => void;

  onJoinedWorld?: (worldInfo: posbus.SetWorld) => void;
  onMyPosition?: (transform: posbus.MyTransform) => void;

  onUserAdded?: (user: posbus.UserData) => void;
  onUserMove?: (user: posbus.UserTransform) => void;
  onUserRemoved?: (userId: string) => void;

  onObjectAdded?(object: posbus.ObjectDefinition): void;
  onObjectMove?: (objectId: string, transform: posbus.Transform) => void;
  onObjectData?: (objectId: string, data: posbus.ObjectData) => void;
  onObjectRemoved?: (objectId: string) => void;

  onHighFive?(userId: string, message?: string): void;

  // Not recommended to use unless you know what you're doing, subject to change
  unsafe_onRawMessage?: (message: PosbusEvent) => void;
}

export class BotInterface {
  /**
   * This asynchronous function establishes a connection.
   * If an auth token is present, it authenticates the user.
   * If no auth token is present, it treats the connection as a guest.
   * The function then connects to the provided URL and teleports the client to the specified world.
   *
   * @param {string} [authToken] - Optional. The authentication token for user authentication.
   */
  connect(authToken?: string): Promise<void>;

  /**
   * Getter function to return the connection status.
   *
   * @return {boolean} - Returns true if the client is connected, false otherwise.
   */
  get isConnected(): boolean;

  /**
   * Getter function to return the ready status. Ready means the client is connected and has received the initial world state.
   *
   * @return {boolean} - Returns true if the client is ready, false otherwise.
   */
  get IsReady(): boolean;

  /**
   * Moves the user to a new position and orientation defined by the provided transform.
   *
   * @param {TransformNoScale} transform - The transformation parameters to move the user. This includes position, rotation, but not scale.
   */
  moveUser(transform: posbus.TransformNoScale): void;

  /**
   * Requests a lock on an object required for tranform operation - otherwise it will be ignored.
   * If the lock is not aquired, the function will throw an error.
   *
   * @param {string} objectId - The ID of the object that is being locked.
   */
  async requestObjectLock(objectId: string): Promise<void>;

  /**
   * Releases a lock on an object.
   *
   * @param {string} objectId - The ID of the object that is being unlocked.
   */
  requestObjectUnlock(objectId: string): void;

  /**
   * Transforms an object by changing its position, rotation, and/or scale.
   *
   * @param {string} objectId - The ID of the object that is being transformed.
   * @param {posbus.Transform} object_transform - An object containing the parameters for the transformation. This includes new position, rotation, and scale.
   */
  transformObject(objectId: string, object_transform: posbus.Transform): void;

  /**
   * Sends a high-five action to another user, along with an optional message.
   *
   * @param {string} userId - The ID of the user who will receive the high-five.
   * @param {string} [message] - Optional. A message to send along with the high-five.
   */
  sendHighFive(userId: string, message?: string): void;

  /**
   * Sets an attribute of a specified object with a given value.
   *
   * @param {Object} params - An object that contains parameters for setting the attribute.
   * @param {string} params.name - The name of the attribute.
   * @param {any} params.value - The value to set the attribute to.
   * @param {string} params.objectId - The ID of the object to which the attribute will be set.
   * @param {string} params.pluginId - Optional. The ID of the plugin to which the attribute is related. Defaults to the core plugin ID.
   */
  setObjectAttribute({
    name,
    value,
    objectId,
    pluginId,
  }: {
    name: string;
    value: any;
    objectId: string;
    pluginId?: string;
  }): Promise<any>;

  /**
   * Removes an attribute of a specified object.
   *
   * @param {Object} params - An object that contains parameters for removing the attribute.
   * @param {string} params.name - The name of the attribute.
   * @param {string} params.objectId - The ID of the object from which the attribute will be removed.
   * @param {string} params.pluginId - Optional. The ID of the plugin from which the attribute will be removed. Defaults to the core plugin ID.
   */
  removeObjectAttribute({
    name,
    objectId,
    pluginId = CORE_PLUGIN_ID,
  }: {
    name: string;
    objectId: string;
    pluginId?: string;
  }): Promise<null>;

  /**
   * Fetches the value of a specified attribute of an object.
   *
   * @param {Object} params - An object that contains parameters for fetching the attribute.
   * @param {string} params.name - The name of the attribute.
   * @param {string} params.objectId - The ID of the object from which the attribute will be fetched.
   * @param {string} params.pluginId - Optional. The ID of the plugin from which the attribute will be fetched. Defaults to the core plugin ID.
   */
  getObjectAttribute({
    name,
    objectId,
    pluginId = CORE_PLUGIN_ID,
  }: {
    name: string;
    objectId: string;
    pluginId?: string;
  }): Promise<any>;

  /**
   * Subscribes to changes in an attribute of a specified object, and provides callbacks to handle change or error events.
   *
   * Note that changes detection doesn't work for every attribute. The attribute needs to have posbus_auto Option in attribute_type.
   *
   * @param {Object} params - An object that contains parameters for the subscription.
   * @param {string} params.name - The name of the attribute to subscribe to.
   * @param {string} params.objectId - The ID of the object whose attribute is being subscribed to.
   * @param {string} params.pluginId - Optional. The ID of the plugin for the attribute. Defaults to the core plugin ID.
   * @param {(value: any) => void} params.onChange - Optional. A callback function that is called when the attribute changes.
   * @param {(err: Error) => void} params.onError - Optional. A callback function that is called when an error occurs.
   * @returns {Function} - Returns a function that unsubscribes from the attribute when called.
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
  }): () => void;

  /**
   * Sets the color of a specified object.
   * The color is specified as a hex string, e.g. '#ff0000' for red.
   * If the color is null, the color will be cleared.
   */
  setObjectColor(objectId: string, color: string | null): Promise<null>;

  /**
   * Sets the name of a specified object.
   * The name is specified as a string.
   *
   * @param {string} objectId - The ID of the object to set the name of.
   * @param {string} name - The name to set.
   */
  setObjectName(objectId: string, name: string): Promise<null>;

  /**
   * Fetches info of a specified object.
   *
   * @param {string} objectId - The ID of the object to fetch info from.
   */
  async getObjectInfo(objectId: string): Promise<ObjectInfo>;

  /**
   * Creates a new object in the virtual world.
   *
   * @param {Object} params - An object that contains parameters for the new object.
   * @param {string} params.name - The name of the new object.
   * @param {string} params.object_type_id - Optional. The type of the new object. Defaults to the default object type.
   * @param {string} params.asset_3d_id - The 3D model that the new object will use.
   * @param {posbus.Transform} params.transform - Optional. The initial position and rotation of the new object.
   *                                              Current user position and rotation will be used if not specified.
   */
  spawnObject({
    name,
    asset_2d_id,
    asset_3d_id,
    object_type_id,
    transform,
  }: {
    name: string;
    asset_2d_id?: string | null;
    asset_3d_id: string | null;
    object_type_id?: string;
    transform?: posbus.Transform;
  }): Promise<posbus.ObjectDefinition>;

  /**
   * Removes an object from the virtual world.
   *
   * @param {string} objectId - The ID of the object to remove.
   * @returns {Promise<null>} - Returns a promise that resolves when the object is removed.
   *                            The promise will reject if the object is not found or user has no admin rights.
   *
   */
  removeObject(objectId: string): Promise<null>;

  /**
   * Fetches a list of supported 3D assets - Odyssey basic, Community ones and your account's private collection.
   *
   * @param {string} category - The category of assets to fetch. Can be 'basic' or 'custom'.
   *
   * @returns {Promise<any>} - Returns a promise that resolves to an array of supported assets.
   */
  async getSupportedAssets3d(category: 'basic' | 'custom'): Promise<Asset3d>;
}

export interface ObjectInfo {
  owner_id: string;
  parent_id: string;
  object_type_id: string;
  asset_2d_id: string | null;
  asset_3d_id: string | null;
  transform: posbus.Transform;
}

export interface Asset3d {
  id: string;
  user_id: string;
  meta: {
    category: string;
    name: string;
    preview_hash?: string;
    type: number;
  };
  is_private: boolean;
  createdAt: string;
  updatedAt: string;
}
