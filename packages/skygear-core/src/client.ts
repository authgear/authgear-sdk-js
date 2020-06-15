import URLSearchParams from "core-js-pure/features/url-search-params";

import {
  _AuthResponse,
  _OIDCConfiguration,
  _OIDCTokenResponse,
  _OIDCTokenRequest,
  OAuthError,
  ChallengeResponse,
} from "./types";
import { decodeError, SkygearError } from "./error";
import { _decodeAuthResponseFromOIDCUserinfo } from "./encoding";

const refreshTokenWindow = 0.7;

/**
 * @internal
 */
export function _removeTrailingSlash(s: string): string {
  return s.replace(/\/+$/g, "");
}

/**
 * @public
 */
export abstract class BaseAPIClient {
  userAgent?: string;

  /**
   * @internal
   */
  _endpoint?: string;
  get endpoint(): string | undefined {
    return this._endpoint;
  }
  set endpoint(newEndpoint: string | undefined) {
    if (newEndpoint != null) {
      this._endpoint = _removeTrailingSlash(newEndpoint);
    } else {
      this._endpoint = undefined;
    }
  }

  /**
   * @internal
   */
  // eslint-disable-next-line no-undef
  abstract _fetchFunction?: typeof fetch;

  /**
   * @internal
   */
  // eslint-disable-next-line no-undef
  abstract _requestClass?: typeof Request;

  /**
   * @internal
   */
  _accessToken?: string;

  /**
   * @internal
   *
   * _shouldRefreshTokenAt is the timestamp that the sdk should refresh token.
   * falsy value means does not need to refresh.
   */
  _shouldRefreshTokenAt?: number;

  /**
   * @internal
   */
  _refreshTokenFunction?: () => Promise<boolean>;

  /**
   * @internal
   */
  _config?: _OIDCConfiguration;

  /**
   * @internal
   */
  _setShouldNotRefreshToken(): void {
    this._shouldRefreshTokenAt = 0;
  }

  /**
   * @internal
   */
  _setShouldRefreshTokenNow(): void {
    this._shouldRefreshTokenAt = new Date().getTime();
  }

  /**
   * @internal
   */
  _setAccessTokenAndExpiresIn(accessToken: string, expires_in?: number): void {
    this._accessToken = accessToken;
    if (expires_in) {
      this._shouldRefreshTokenAt =
        new Date().getTime() + expires_in * 1000 * refreshTokenWindow;
    } else {
      this._shouldRefreshTokenAt = 0;
    }
  }

  /**
   * @internal
   */
  protected async _prepareHeaders(): Promise<{ [name: string]: string }> {
    const headers: { [name: string]: string } = {};
    if (this._accessToken) {
      headers["authorization"] = `bearer ${this._accessToken}`;
    }
    if (this.userAgent != null) {
      headers["user-agent"] = this.userAgent;
    }
    return headers;
  }

  /**
   * @internal
   */
  async _fetch(url: string, init?: RequestInit): Promise<Response> {
    if (!this._fetchFunction) {
      throw new Error("missing fetchFunction in api client");
    }

    if (!this._requestClass) {
      throw new Error("missing requestClass in api client");
    }
    const request = new this._requestClass(url, init);
    return this._fetchFunction(request);
  }

  async fetch(
    endpoint: string,
    input: string,
    init?: RequestInit,
    options: { autoRefreshToken?: boolean } = {}
  ): Promise<Response> {
    if (this._fetchFunction == null) {
      throw new Error("missing fetchFunction in api client");
    }

    if (this._requestClass == null) {
      throw new Error("missing requestClass in api client");
    }

    const { autoRefreshToken = !!this._refreshTokenFunction } = options;

    if (typeof input !== "string") {
      throw new Error("only string path is allowed for fetch input");
    }

    // check if need to refresh token
    const shouldRefreshToken =
      this._accessToken &&
      this._shouldRefreshTokenAt &&
      this._shouldRefreshTokenAt < new Date().getTime();
    if (shouldRefreshToken && autoRefreshToken) {
      if (!this._refreshTokenFunction) {
        throw new Error("missing refreshTokenFunction in api client");
      }
      await this._refreshTokenFunction();
    }

    const url = endpoint + "/" + input.replace(/^\//, "");
    const request = new this._requestClass(url, init);

    const headers = await this._prepareHeaders();
    for (const key of Object.keys(headers)) {
      request.headers.set(key, headers[key]);
    }

    return this._fetchFunction(request);
  }

  /**
   * @internal
   */
  // eslint-disable-next-line complexity
  protected async _request(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options: {
      json?: unknown;
      query?: [string, string][];
      autoRefreshToken?: boolean;
    } = {}
  ): Promise<any> {
    if (this.endpoint == null) {
      throw new Error("missing endpoint in api client");
    }
    const endpoint: string = this.endpoint;

    const { json, query, autoRefreshToken } = options;
    let p = path;
    if (query != null && query.length > 0) {
      const params = new URLSearchParams();
      for (let i = 0; i < query.length; ++i) {
        params.append(query[i][0], query[i][1]);
      }
      p += "?" + params.toString();
    }

    const headers: { [name: string]: string } = {};
    if (json != null) {
      headers["content-type"] = "application/json";
    }

    const response = await this.fetch(
      endpoint,
      p,
      {
        method,
        headers,
        mode: "cors",
        credentials: "include",
        body: json && JSON.stringify(json),
      },
      { autoRefreshToken }
    );

    let jsonBody;
    try {
      jsonBody = await response.json();
    } catch {
      if (response.status < 200 || response.status >= 300) {
        throw new SkygearError(
          "unexpected status code",
          "InternalError",
          "UnexpectedError",
          {
            status_code: response.status,
          }
        );
      } else {
        throw new SkygearError(
          "failed to decode response JSON",
          "InternalError",
          "UnexpectedError"
        );
      }
    }

    if (jsonBody["result"]) {
      return jsonBody["result"];
    } else if (jsonBody["error"]) {
      throw decodeError(jsonBody["error"]);
    }

    throw decodeError();
  }

  /**
   * @internal
   */
  protected async _post(
    path: string,
    options?: {
      json?: unknown;
      query?: [string, string][];
      autoRefreshToken?: boolean;
    }
  ): Promise<any> {
    return this._request("POST", path, options);
  }

  /**
   * @internal
   */
  async _fetchOIDCRequest(url: string, init?: RequestInit): Promise<Response> {
    const resp = await this._fetch(url, init);
    if (resp.status === 200) {
      return resp;
    }
    let errJSON;
    try {
      errJSON = await resp.json();
    } catch {
      throw new SkygearError(
        "failed to decode response JSON",
        "InternalError",
        "UnexpectedError",
        {
          status_code: resp.status,
        }
      );
    }
    const oauthError: OAuthError = {
      error: errJSON["error"],
      error_description: errJSON["error_description"],
    };
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw oauthError;
  }

  /**
   * @internal
   */
  async _fetchOIDCJSON(url: string, init?: RequestInit): Promise<any> {
    const resp = await this._fetchOIDCRequest(url, init);
    let jsonBody;
    try {
      jsonBody = await resp.json();
    } catch {
      throw new SkygearError(
        "failed to decode response JSON",
        "InternalError",
        "UnexpectedError"
      );
    }
    return jsonBody;
  }

  /**
   * @internal
   */
  async _fetchOIDCConfiguration(): Promise<_OIDCConfiguration> {
    if (this.endpoint == null) {
      throw new Error("missing endpoint in api client");
    }
    const endpoint: string = this.endpoint;

    if (!this._config) {
      this._config = (await this._fetchOIDCJSON(
        `${endpoint}/.well-known/openid-configuration`
      )) as _OIDCConfiguration;
    }

    return this._config;
  }

  /**
   * @internal
   */
  async _oidcTokenRequest(req: _OIDCTokenRequest): Promise<_OIDCTokenResponse> {
    const config = await this._fetchOIDCConfiguration();
    const query = new URLSearchParams();
    query.append("grant_type", req.grant_type);
    query.append("client_id", req.client_id);
    if (req.code) {
      query.append("code", req.code);
    }
    if (req.redirect_uri) {
      query.append("redirect_uri", req.redirect_uri);
    }
    if (req.code_verifier) {
      query.append("code_verifier", req.code_verifier);
    }
    if (req.refresh_token) {
      query.append("refresh_token", req.refresh_token);
    }
    if (req.jwt) {
      query.append("jwt", req.jwt);
    }
    return this._fetchOIDCJSON(config.token_endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: query.toString(),
    });
  }

  /**
   * @internal
   */
  async _oidcUserInfoRequest(accessToken?: string): Promise<_AuthResponse> {
    const headers: { [name: string]: string } = {};
    if (accessToken) {
      headers["authorization"] = `bearer ${accessToken}`;
    }
    const config = await this._fetchOIDCConfiguration();
    const userinfo = await this._fetchOIDCJSON(config.userinfo_endpoint, {
      method: "GET",
      headers: headers,
      mode: "cors",
      credentials: "include",
    });
    const result = _decodeAuthResponseFromOIDCUserinfo(userinfo);
    return result;
  }

  /**
   * @internal
   */
  async _oidcRevocationRequest(refreshToken: string): Promise<void> {
    const config = await this._fetchOIDCConfiguration();
    const query = new URLSearchParams({
      token: refreshToken,
    });
    await this._fetchOIDCRequest(config.revocation_endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: query.toString(),
    });
  }

  async oauthChallenge(purpose: string): Promise<ChallengeResponse> {
    return this._post("/oauth2/challenge", { json: { purpose } });
  }
}
