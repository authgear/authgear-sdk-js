import { TransientTokenStorage } from "./storage";

describe("TransientTokenStorage", () => {
  it("should set, get and delete refresh token", async () => {
    const storage = new TransientTokenStorage();
    const token = "test_token";
    const ns = "test";

    await storage.setRefreshToken(ns, token);
    let restored = await storage.getRefreshToken(ns);
    expect(restored).toEqual(token);

    await storage.delRefreshToken(ns);
    restored = await storage.getRefreshToken(ns);
    expect(restored).toEqual(null);
  });
});
