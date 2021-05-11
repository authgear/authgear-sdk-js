import { _wrapError, BiometricPrivateKeyNotFoundError } from "./error";

describe("_wrapError", () => {
  it("should wrap error", () => {
    const input = {
      code: "android.security.keystore.KeyPermanentlyInvalidatedException",
    };
    const actual = _wrapError(input);
    expect(actual).toBeInstanceOf(BiometricPrivateKeyNotFoundError);
  });
});
