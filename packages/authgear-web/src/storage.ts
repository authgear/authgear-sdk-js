/* global window */
import {
  _StorageDriver,
  TokenStorage,
  _ContainerStorage,
  _KeyMaker,
  _SafeStorageDriver,
  InterAppSharedStorage,
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
 * PersistentTokenStorage stores the refresh token in a persistent storage.
 * When the app launches again next time, the refresh token is loaded from the persistent storage.
 * The user is considered authenticated as long as the refresh token is found.
 * However, the validity of the refresh token is not guaranteed.
 * You must call fetchUserInfo to ensure the refresh token is still valid.
 *
 * @public
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
export class PersistentInterAppSharedStorage implements InterAppSharedStorage {
  private keyMaker: _KeyMaker;
  private storageDriver: _StorageDriver;

  constructor() {
    this.keyMaker = new _KeyMaker();
    this.storageDriver = new _SafeStorageDriver(_localStorageStorageDriver);
  }

  async setIDToken(namespace: string, idToken: string): Promise<void> {
    return this.storageDriver.set(this.keyMaker.keyIDToken(namespace), idToken);
  }
  async getIDToken(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyIDToken(namespace));
  }
  async delIDToken(namespace: string): Promise<void> {
    return this.storageDriver.del(this.keyMaker.keyIDToken(namespace));
  }

  async setDeviceSecret(
    namespace: string,
    deviceSecret: string
  ): Promise<void> {
    return this.storageDriver.set(
      this.keyMaker.keyDeviceSecret(namespace),
      deviceSecret
    );
  }
  async getDeviceSecret(namespace: string): Promise<string | null> {
    return this.storageDriver.get(this.keyMaker.keyDeviceSecret(namespace));
  }
  async delDeviceSecret(namespace: string): Promise<void> {
    return this.storageDriver.del(this.keyMaker.keyDeviceSecret(namespace));
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
