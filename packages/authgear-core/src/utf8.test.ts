import { _encodeUTF8, _decodeUTF8 } from "./utf8";

describe("_encodeUTF8 and _decodeUTF8", () => {
  it("is reversible", () => {
    const str = "💩";
    // const actual = _encodeUTF8(str);
    // expect(actual.length).toEqual(4);
    // expect(actual[0]).toEqual(240);
    // expect(actual[1]).toEqual(159);
    // expect(actual[2]).toEqual(146);
    // expect(actual[3]).toEqual(169);
    expect(_decodeUTF8(_encodeUTF8(str))).toEqual(str);
  });
});
