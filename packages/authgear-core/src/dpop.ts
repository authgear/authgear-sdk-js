import { InterAppSharedStorage } from "./types";

export interface DPoPProvider {
  generateDPoPProof(htm: string, htu: string): Promise<string>;
  computeJKT(): Promise<string>;
}

export interface InternalDPoPPlugin {
  generateUUID(): Promise<string>;
  createDPoPPrivateKey(kid: string): Promise<void>;
  signWithDPoPPrivateKey(
    kid: string,
    payload: Record<string, unknown>
  ): Promise<string>;
  checkDPoPPrivateKey(kid: string): Promise<boolean>;
  computeDPoPJKT(kid: string): Promise<string>;
}

export class DefaultDPoPProvider implements DPoPProvider {
  private getNamespace: () => string;
  private sharedStorage: InterAppSharedStorage;
  private plugin: InternalDPoPPlugin;

  constructor({
    getNamespace,
    sharedStorage,
    plugin,
  }: {
    getNamespace: () => string;
    sharedStorage: InterAppSharedStorage;
    plugin: InternalDPoPPlugin;
  }) {
    this.getNamespace = getNamespace;
    this.sharedStorage = sharedStorage;
    this.plugin = plugin;
  }

  async generateDPoPProof(htm: string, htu: string): Promise<string> {
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
    } catch (_: unknown) {
      // Generate a new key if the original key cannot be used for any reason
      kid = await this.plugin.generateUUID();
      await this.plugin.createDPoPPrivateKey(kid);
      await this.sharedStorage.setDPoPKeyID(this.getNamespace(), kid);
      const jwt = await this.plugin.signWithDPoPPrivateKey(kid, payload);
      return jwt;
    }
  }

  async computeJKT(): Promise<string> {
    const existingKeyId = await this.sharedStorage.getDPoPKeyID(
      this.getNamespace()
    );
    let kid: string | null = null;
    if (existingKeyId != null) {
      const existingKeyOK = await this.plugin.checkDPoPPrivateKey(
        existingKeyId
      );
      if (existingKeyOK) {
        kid = existingKeyId;
      }
    }
    if (kid == null) {
      kid = await this.plugin.generateUUID();
      await this.plugin.createDPoPPrivateKey(kid);
      await this.sharedStorage.setDPoPKeyID(this.getNamespace(), kid);
    }
    const jkt = await this.plugin.computeDPoPJKT(kid);
    return jkt;
  }
}
