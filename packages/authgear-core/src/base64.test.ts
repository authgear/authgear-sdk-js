import { TextEncoder, TextDecoder } from "util";
import { _base64URLEncode, _base64URLDecode } from "./base64";

describe("_base64URLEncode and _base64URLDecode", () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const fixtureStr = "test";

  it("encode ASCII strings without padding", () => {
    expect(_base64URLEncode(encoder.encode(fixtureStr))).toEqual("dGVzdA");
    expect(decoder.decode(_base64URLDecode("dGVzdA"))).toEqual(fixtureStr);
  });
});
