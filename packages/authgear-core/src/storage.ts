import { TokenStorage, _StorageDriver } from "./types";

/**
 * @internal
 */
export class _KeyMaker {
  // eslint-disable-next-line class-methods-use-this
  private scopedKey(key: string): string {
    return `authgear_${key}`;
  }

  keyRefreshToken(name: string): string {
    return `${this.scopedKey(name)}_refreshToken`;
  }

  keyIDToken(name: string): string {
    return `${this.scopedKey(name)}_idToken`;
  }

  keyDeviceSecret(name: string): string {
    return `${this.scopedKey(name)}_deviceSecret`;
  }

  keyOIDCCodeVerifier(name: string): string {
    return `${this.scopedKey(name)}_oidcCodeVerifier`;
  }

  keyAnonymousKeyID(name: string): string {
    return `${this.scopedKey(name)}_anonymousKeyID`;
  }

  keyBiometricKeyID(name: string): string {
    return `${this.scopedKey(name)}_biometricKeyID`;
  }

  keyDPoPKeyID(name: string): string {
    return `${this.scopedKey(name)}_dpopKeyID`;
  }
}

/**
 * @internal
 */
export class _SafeStorageDriver implements _StorageDriver {
  driver: _StorageDriver;

  constructor(driver: _StorageDriver) {
    this.driver = driver;
  }

  async del(key: string): Promise<void> {
    try {
      await this.driver.del(key);
    } catch {}
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.driver.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.driver.set(key, value);
    } catch {}
  }
}

/**
 * @internal
 */
export class _MemoryStorageDriver implements _StorageDriver {
  backingStore: Record<string, string | undefined>;

  constructor() {
    this.backingStore = {};
  }

  async get(key: string): Promise<string | null> {
    const value = this.backingStore[key];
    if (value != null) {
      return value;
    }
    return null;
  }
  async set(key: string, value: string): Promise<void> {
    this.backingStore[key] = value;
  }
  async del(key: string): Promise<void> {
    delete this.backingStore[key];
  }
}

/**
 * TransientTokenStorage stores the refresh token in memory.
 * The refresh token is forgotten as soon as the user quits the app, or
 * the app was killed by the system.
 * When the app launches again next time, no refresh token is found.
 * The user is considered unauthenticated.
 * This implies the user needs to authenticate over again on every app launch.
 *
 * @public
 */
export class TransientTokenStorage implements TokenStorage {
  private keyMaker: _KeyMaker;
  private storageDriver: _StorageDriver;

  constructor() {
    this.keyMaker = new _KeyMaker();
    this.storageDriver = new _SafeStorageDriver(new _MemoryStorageDriver());
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
