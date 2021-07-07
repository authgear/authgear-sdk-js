import { _decodeIDToken, _canReauthenticate, _getAuthTime } from "./container";

const ID_TOKEN =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhmY2UyYzMyLTBhOTYtNDQzMS1iYTQwLWE3ZjA2OGVlZDI3NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsicG9ydGFsIl0sImF1dGhfdGltZSI6MTYyNDUxOTgwOCwiZXhwIjoxNjI0NTIwMTA4LCJodHRwczovL2F1dGhnZWFyLmNvbS9jbGFpbXMvdXNlci9jYW5fcmVhdXRoZW50aWNhdGUiOnRydWUsImh0dHBzOi8vYXV0aGdlYXIuY29tL2NsYWltcy91c2VyL2lzX2Fub255bW91cyI6ZmFsc2UsImh0dHBzOi8vYXV0aGdlYXIuY29tL2NsYWltcy91c2VyL2lzX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE2MjQ1MTk4MDgsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsInNpZCI6ImIyWm1iR2x1WlY5bmNtRnVkRG80TTJReFpXVmlaQzB6TmpVekxUUmlNbVl0WW1VMU55MHpZamd5Wm1aa05qTTJOVEkiLCJzdWIiOiI3MTMyYjQwNi0yNTY3LTRhNDUtYWFkZS1hOTU3NmE2MDMxODcifQ.rQg2bkDsZGap8cm6WR5lfh4Kr_Go2EQQZ0bxvk_GexAy8Vxa0gWakMjsgXkn4hiA3oGL2YCEwz4Qd3EiH8BYeLoyQC3vJC4mXqvSQTS2jAXVFwFPBQNVTkAo4PWBc4snTDgB_4D7vcbcvGlnfXhJyw86CoBQvsrEgUPOb9p_bWSuuGNU7pQ3wKbn0uqqN82blwHdu0H5_tYfSleJ_BSXPWiTWiA0hKiPvtEVkkjjdO7IE5jFZfQCNO37N0jTdE6H_HFH6BDrXX-TfcanmKCcZcH6IQRS_1T5AxBFQw44raCYRPhA8R79umd025eSSirDA-tMJIdWRgnSyLyNkl3rbQ";

const PAYLOAD = {
  aud: ["portal"],
  auth_time: 1624519808,
  exp: 1624520108,
  "https://authgear.com/claims/user/can_reauthenticate": true,
  "https://authgear.com/claims/user/is_anonymous": false,
  "https://authgear.com/claims/user/is_verified": true,
  iat: 1624519808,
  iss: "http://localhost:3000",
  sid: "b2ZmbGluZV9ncmFudDo4M2QxZWViZC0zNjUzLTRiMmYtYmU1Ny0zYjgyZmZkNjM2NTI",
  sub: "7132b406-2567-4a45-aade-a9576a603187",
};

describe("_decodeIDToken", () => {
  it("returns undefined for undefined", () => {
    expect(_decodeIDToken(undefined)).toEqual(undefined);
  });
  it("returns undefined for invalid ID token", () => {
    expect(_decodeIDToken("")).toEqual(undefined);
  });
  it("returns payload for valid ID token", () => {
    expect(_decodeIDToken(ID_TOKEN)).toEqual(PAYLOAD);
  });
});

describe("_canReauthenticate", () => {
  it("returns true", () => {
    expect(_canReauthenticate(PAYLOAD)).toEqual(true);
  });
});

describe("_getAuthTime", () => {
  it("returns JavaScript Date", () => {
    expect(_getAuthTime(PAYLOAD)).toEqual(new Date("2021-06-24T07:30:08.000Z"));
  });
});
