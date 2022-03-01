/* global window */
import {
  _StorageDriver,
  TokenStorage,
  _ContainerStorage,
  _KeyMaker,
  _SafeStorageDriver,
} from "@authgear/core";

const _localStorageStorageDriver: _StorageDriver = {
  async get(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async del(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

/**
 * @internal
 */
export class PersistentTokenStorage implements TokenStorage {
  private keyMaker: _KeyMaker;
  private storageDriver: _StorageDriver;

  constructor() {
    this.keyMaker = new _KeyMaker();
    this.storageDriver = new _SafeStorageDriver(_localStorageStorageDriver);
  }

  async setRefreshToken(
    namespace: string,
    refreshToken: string
  ): Promise<void> {
    await this.storageDriver.set(
      this.keyMaker.keyRefreshToken(namespace),
      refreshToken
    );
  }

  async getRefreshToken(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyRefreshToken(namespace));
  }

  async delRefreshToken(namespace: string): Promise<void> {
    await this.storageDriver.del(this.keyMaker.keyRefreshToken(namespace));
  }
}

/**
 * @internal
 */
export class PersistentContainerStorage implements _ContainerStorage {
  private keyMaker: _KeyMaker;
  private storageDriver: _StorageDriver;

  constructor() {
    this.keyMaker = new _KeyMaker();
    this.storageDriver = new _SafeStorageDriver(_localStorageStorageDriver);
  }

  async setOIDCCodeVerifier(namespace: string, code: string): Promise<void> {
    await this.storageDriver.set(
      this.keyMaker.keyOIDCCodeVerifier(namespace),
      code
    );
  }

  async setAnonymousKeyID(namespace: string, kid: string): Promise<void> {
    await this.storageDriver.set(
      this.keyMaker.keyAnonymousKeyID(namespace),
      kid
    );
  }

  async setBiometricKeyID(namespace: string, kid: string): Promise<void> {
    await this.storageDriver.set(
      this.keyMaker.keyBiometricKeyID(namespace),
      kid
    );
  }

  async getOIDCCodeVerifier(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyOIDCCodeVerifier(namespace));
  }

  async getAnonymousKeyID(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyAnonymousKeyID(namespace));
  }

  async getBiometricKeyID(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyBiometricKeyID(namespace));
  }

  async delOIDCCodeVerifier(namespace: string): Promise<void> {
    await this.storageDriver.del(this.keyMaker.keyOIDCCodeVerifier(namespace));
  }

  async delAnonymousKeyID(namespace: string): Promise<void> {
    await this.storageDriver.del(this.keyMaker.keyAnonymousKeyID(namespace));
  }

  async delBiometricKeyID(namespace: string): Promise<void> {
    await this.storageDriver.del(this.keyMaker.keyBiometricKeyID(namespace));
  }
}
