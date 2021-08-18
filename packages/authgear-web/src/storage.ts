/* global localStorage */

import { _StorageDriver } from "@authgear/core";

const globalLocalStorage = localStorage;

/**
 * @internal
 */
export const _localStorageStorageDriver: _StorageDriver = {
  async get(key: string): Promise<string | null> {
    return globalLocalStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    return globalLocalStorage.setItem(key, value);
  },
  async del(key: string): Promise<void> {
    return globalLocalStorage.removeItem(key);
  },
};
