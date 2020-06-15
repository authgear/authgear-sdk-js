/* global jest */
import { BaseAPIClient } from "./client";

describe("APIClientDelegate", () => {
  it("call onAccessTokenExpired on app launches", async (): Promise<void> => {
    class TestAPIClient extends BaseAPIClient {
      _fetchFunction = {} as any;
      _requestClass = {} as any;
    }
    const mockHeadersSet = jest.fn();
    const mockRequest = {
      headers: {
        set: mockHeadersSet,
      },
    };
    const onAccessTokenExpired = jest.fn();
    const _requestClass = jest.fn(() => mockRequest);
    const _fetchFunction = jest.fn();

    const delegate = {
      onAccessTokenExpired: onAccessTokenExpired,
    } as any;

    const client = new TestAPIClient();
    client.delegate = delegate;
    client._accessToken = "access_token";
    client._accessTokenExpireAt = undefined;
    client._requestClass = _requestClass;
    client._fetchFunction = _fetchFunction;

    await client.fetch("http://localhost:3000", "/");

    expect(onAccessTokenExpired.mock.calls.length).toEqual(1);
  });

  it("call onAccessTokenExpired when time passes", async (): Promise<void> => {
    class TestAPIClient extends BaseAPIClient {
      _fetchFunction = {} as any;
      _requestClass = {} as any;
    }
    const mockHeadersSet = jest.fn();
    const mockRequest = {
      headers: {
        set: mockHeadersSet,
      },
    };
    const onAccessTokenExpired = jest.fn();
    const _requestClass = jest.fn(() => mockRequest);
    const _fetchFunction = jest.fn();

    const delegate = {
      onAccessTokenExpired: onAccessTokenExpired,
    } as any;

    const client = new TestAPIClient();
    client.delegate = delegate;
    client._accessToken = "access_token";
    client._accessTokenExpireAt = new Date("2006-01-02T00:00:00Z");
    client._requestClass = _requestClass;
    client._fetchFunction = _fetchFunction;

    const spy = jest.spyOn(Date, "now");
    spy.mockReturnValue(new Date("2006-01-02T01:00:00Z").getTime());

    await client.fetch("http://localhost:3000", "/");

    expect(onAccessTokenExpired.mock.calls.length).toEqual(1);

    spy.mockRestore();
  });
});
