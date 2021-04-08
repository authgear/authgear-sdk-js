/* global localStorage, sessionStorage */

import { StorageDriver } from "@authgear/core";

const globalLocalStorage = localStorage;
const globalSessionStorage = sessionStorage;

/**
 * @public
 */
export const localStorageStorageDriver: StorageDriver = {
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

/**
 * @public
 */
export const sessionStorageStorageDriver: StorageDriver = {
  async get(key: string): Promise<string | null> {
    return globalSessionStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    return globalSessionStorage.setItem(key, value);
  },
  async del(key: string): Promise<void> {
    return globalSessionStorage.removeItem(key);
  },
};
