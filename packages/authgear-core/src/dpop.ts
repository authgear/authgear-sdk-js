import { type InterAppSharedStorage } from "./types";

/**
 * We will get an internal error if we use InterAppSharedStorage directly:
 * InternalError: Internal Error: Unable to analyze the export "InterAppSharedStorage" in
 * /Users/tung/repo/authgear-sdk-js/packages/authgear-core/src/types.d.ts
 * So added this interface to workaround the error
 * @internal
 */
export interface DPopInterAppSharedStorage extends InterAppSharedStorage {}

/**
 * @internal
 */
export interface DPoPProvider {
  generateDPoPProof(options: {
    htm: string;
    htu: string;
  }): Promise<string | null>;
  computeJKT(): Promise<string | null>;
}

/**
 * @internal
 */
export interface InternalDPoPPlugin {
  checkDPoPSupported(): Promise<boolean>;
  generateUUID(): Promise<string>;
  createDPoPPrivateKey(kid: string): Promise<void>;
  signWithDPoPPrivateKey(
    kid: string,
    payload: Record<string, unknown>
  ): Promise<string>;
  checkDPoPPrivateKey(kid: string): Promise<boolean>;
  computeDPoPJKT(kid: string): Promise<string>;
}

/**
 * @internal
 */
export class DefaultDPoPProvider implements DPoPProvider {
  private getNamespace: () => string;
  private sharedStorage: DPopInterAppSharedStorage;
  private plugin: InternalDPoPPlugin;

  constructor({
    getNamespace,
    sharedStorage,
    plugin,
  }: {
    getNamespace: () => string;
    sharedStorage: DPopInterAppSharedStorage;
    plugin: InternalDPoPPlugin;
  }) {
    this.getNamespace = getNamespace;
    this.sharedStorage = sharedStorage;
    this.plugin = plugin;
  }

  async generateDPoPProof({
    htm,
    htu,
  }: {
    htm: string;
    htu: string;
  }): Promise<string | null> {
    if (!(await this.plugin.checkDPoPSupported())) {
      return null;
    }
    const existingKeyId = await this.sharedStorage.getDPoPKeyID(
      this.getNamespace()
    );
    let kid: string;
    if (existingKeyId != null) {
      kid = existingKeyId;
    } else {
      kid = await this.plugin.generateUUID();
      await this.plugin.createDPoPPrivateKey(kid);
      await this.sharedStorage.setDPoPKeyID(this.getNamespace(), kid);
    }
    const now = Math.floor(+new Date() / 1000);
    const payload = {
      iat: now,
      exp: now + 300,
      jti: await this.plugin.generateUUID(),
      htm: htm,
      htu: htu,
    };
    try {
      const jwt = await this.plugin.signWithDPoPPrivateKey(kid, payload);
      return jwt;
    } catch (e: unknown) {
      // Clear the existing key ID if the key cannot be used for any reason
      await this.sharedStorage.delDPoPKeyID(this.getNamespace());
      // rethrow the error so we know there is some error occurred
      throw e;
    }
  }

  async computeJKT(): Promise<string | null> {
    if (!(await this.plugin.checkDPoPSupported())) {
      return null;
    }
    const existingKeyId = await this.sharedStorage.getDPoPKeyID(
      this.getNamespace()
    );
    let kid: string | null = existingKeyId;
    if (kid == null) {
      kid = await this.plugin.generateUUID();
      await this.plugin.createDPoPPrivateKey(kid);
      await this.sharedStorage.setDPoPKeyID(this.getNamespace(), kid);
    }

    try {
      const jkt = await this.plugin.computeDPoPJKT(kid);
      return jkt;
    } catch (e: unknown) {
      // Clear the existing key ID if the key cannot be used for any reason
      await this.sharedStorage.delDPoPKeyID(this.getNamespace());
      // rethrow the error so we know there is some error occurred
      throw e;
    }
  }
}
