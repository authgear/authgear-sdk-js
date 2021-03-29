import { ContainerStorage, StorageDriver } from "./types";

function scopedKey(key: string): string {
  return `authgear_${key}`;
}

function keyRefreshToken(name: string): string {
  return `${name}_refreshToken`;
}

function keyOIDCCodeVerifier(name: string): string {
  return `${name}_oidcCodeVerifier`;
}

function keyAnonymousKeyID(name: string): string {
  return `${name}_anonymousKeyID`;
}

function keyBiometricKeyID(name: string): string {
  return `${name}_biometricKeyID`;
}

/**
 * @internal
 */
export class _GlobalJSONStorage {
  driver: StorageDriver;

  constructor(driver: StorageDriver) {
    this.driver = driver;
  }

  async safeDel(key: string): Promise<void> {
    key = scopedKey(key);
    try {
      await this.driver.del(key);
    } catch {}
  }

  async safeGet(key: string): Promise<string | null> {
    key = scopedKey(key);
    try {
      return await this.driver.get(key);
    } catch {
      return null;
    }
  }

  async safeGetJSON(key: string): Promise<unknown | undefined> {
    // No need to scope the key because safeGet does that.
    const jsonString = await this.safeGet(key);
    if (jsonString == null) {
      return undefined;
    }
    try {
      return JSON.parse(jsonString);
    } catch {
      return undefined;
    }
  }

  async safeSet(key: string, value: string): Promise<void> {
    key = scopedKey(key);
    try {
      await this.driver.set(key, value);
    } catch {}
  }

  async safeSetJSON(key: string, value: unknown): Promise<void> {
    // No need to scope the key because safeSet does that.
    try {
      const jsonString = JSON.stringify(value);
      await this.safeSet(key, jsonString);
    } catch {}
  }
}

/**
 * @public
 */
export class GlobalJSONContainerStorage implements ContainerStorage {
  private storage: _GlobalJSONStorage;

  constructor(driver: StorageDriver) {
    this.storage = new _GlobalJSONStorage(driver);
  }

  async setRefreshToken(
    namespace: string,
    refreshToken: string
  ): Promise<void> {
    await this.storage.safeSet(keyRefreshToken(namespace), refreshToken);
  }

  async setOIDCCodeVerifier(namespace: string, code: string): Promise<void> {
    await this.storage.safeSet(keyOIDCCodeVerifier(namespace), code);
  }

  async setAnonymousKeyID(namespace: string, kid: string): Promise<void> {
    await this.storage.safeSet(keyAnonymousKeyID(namespace), kid);
  }

  async setBiometricKeyID(namespace: string, kid: string): Promise<void> {
    await this.storage.safeSet(keyBiometricKeyID(namespace), kid);
  }

  async getRefreshToken(namespace: string): Promise<string | null> {
    return this.storage.safeGet(keyRefreshToken(namespace));
  }

  async getOIDCCodeVerifier(namespace: string): Promise<string | null> {
    return this.storage.safeGet(keyOIDCCodeVerifier(namespace));
  }

  async getAnonymousKeyID(namespace: string): Promise<string | null> {
    return this.storage.safeGet(keyAnonymousKeyID(namespace));
  }

  async getBiometricKeyID(namespace: string): Promise<string | null> {
    return this.storage.safeGet(keyBiometricKeyID(namespace));
  }

  async delRefreshToken(namespace: string): Promise<void> {
    await this.storage.safeDel(keyRefreshToken(namespace));
  }

  async delOIDCCodeVerifier(namespace: string): Promise<void> {
    await this.storage.safeDel(keyOIDCCodeVerifier(namespace));
  }

  async delAnonymousKeyID(namespace: string): Promise<void> {
    await this.storage.safeDel(keyAnonymousKeyID(namespace));
  }

  async delBiometricKeyID(namespace: string): Promise<void> {
    await this.storage.safeDel(keyBiometricKeyID(namespace));
  }
}
