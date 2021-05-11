import { ServerError, _decodeError } from "./error";

describe("decodeError", () => {
  it("decodes server error", () => {
    const actual = _decodeError({
      name: "name",
      reason: "reason",
      message: "message",
      code: 401,
      info: {
        a: "b",
      },
    });
    const expected = new ServerError("message", "name", "reason", {
      a: "b",
    });
    expect(actual).toBeInstanceOf(ServerError);
    expect(actual.name).toEqual(expected.name);
    expect(actual.message).toEqual(expected.message);
    expect((actual as any).reason).toEqual(expected.reason);
    expect((actual as any).info).toEqual(expected.info);
  });

  it("returns Error", () => {
    const e = new Error("test");
    expect(_decodeError(e)).toBe(e);
  });

  it("decodes object with message", () => {
    const actual = _decodeError({
      message: "error message",
    });
    expect(actual).toBeInstanceOf(Error);
    expect(actual.message).toEqual("error message");
  });

  it("decodes object with toString", () => {
    const actual = _decodeError({
      toString: () => "error message",
    });
    expect(actual).toBeInstanceOf(Error);
    expect(actual.message).toEqual("error message");
  });

  it("decodes by casting to string", () => {
    const nullError = _decodeError(null);
    expect(nullError).toBeInstanceOf(Error);
    expect(nullError.message).toEqual("null");

    const undefinedError = _decodeError(undefined);
    expect(undefinedError).toBeInstanceOf(Error);
    expect(undefinedError.message).toEqual("undefined");
  });
});
