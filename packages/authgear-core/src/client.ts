import URLSearchParams from "core-js-pure/features/url-search-params";
import URL from "core-js-pure/features/url";

import {
  UserInfo,
  _OIDCConfiguration,
  _OIDCTokenResponse,
  _OIDCTokenRequest,
  _SetupBiometricRequest,
  _ChallengeResponse,
  _APIClientDelegate,
  _decodeUserInfo,
  _AppSessionTokenResponse,
  _AnonymousUserPromotionCodeResponse,
} from "./types";
import { _decodeError, AuthgearError, ServerError, OAuthError } from "./error";

/**
 * @internal
 */
export function _removeTrailingSlash(s: string): string {
  return s.replace(/\/+$/g, "");
}

/**
 * @internal
 */
export abstract class _BaseAPIClient {
  userAgent?: string;

  _delegate?: _APIClientDelegate;

  _endpoint?: string;
  get endpoint(): string | undefined {
    return this._endpoint;
  }
  set endpoint(newEndpoint: string | undefined) {
    if (newEndpoint != null) {
      this._endpoint = _removeTrailingSlash(newEndpoint);
      // When endpoint changes, remove the cached openid configuration.
      this._config = undefined;
    } else {
      this._endpoint = undefined;
    }
  }

  // eslint-disable-next-line no-undef
  abstract _fetchFunction?: typeof fetch;

  // eslint-disable-next-line no-undef
  abstract _requestClass?: typeof Request;

  _config?: _OIDCConfiguration;

  protected async _prepareHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    const accessToken = this._delegate?.getAccessToken();
    if (accessToken != null) {
      headers["authorization"] = `Bearer ${accessToken}`;
    }
    if (this.userAgent != null) {
      headers["user-agent"] = this.userAgent;
    }
    return headers;
  }

  async _fetchWithoutRefresh(
    url: string,
    init?: RequestInit
  ): Promise<Response> {
    if (!this._fetchFunction) {
      throw new AuthgearError("missing fetchFunction in api client");
    }

    if (!this._requestClass) {
      throw new AuthgearError("missing requestClass in api client");
    }
    const request = new this._requestClass(url, init);
    return this._fetchFunction(request);
  }

  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (this._fetchFunction == null) {
      throw new AuthgearError("missing fetchFunction in api client");
    }

    if (this._requestClass == null) {
      throw new AuthgearError("missing requestClass in api client");
    }

    if (this._delegate == null) {
      throw new AuthgearError("missing delegate in api client");
    }

    const shouldRefresh = this._delegate.shouldRefreshAccessToken();
    if (shouldRefresh) {
      await this._delegate.refreshAccessToken();
    }

    const request = new this._requestClass(input, init);

    const headers = await this._prepareHeaders();
    for (const key of Object.keys(headers)) {
      request.headers.set(key, headers[key]);
    }

    return this._fetchFunction(request);
  }

  protected async _requestJSON(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options: {
      credentials: RequestCredentials;
      json?: unknown;
      query?: [string, string][];
    }
  ): Promise<any> {
    const { json, query, credentials } = options;

    const headers: Record<string, string> = {};
    if (json != null) {
      headers["content-type"] = "application/json";
    }

    const body = json != null ? JSON.stringify(json) : undefined;

    return this._request(method, path, {
      headers,
      query,
      body: body,
      credentials,
    });
  }

  // eslint-disable-next-line complexity
  protected async _request(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options: {
      credentials: RequestCredentials;
      headers?: Record<string, string>;
      query?: [string, string][];
      body?: string;
    }
  ): Promise<any> {
    const config = await this._fetchOIDCConfiguration();
    const endpoint = new URL(config.authorization_endpoint).origin;

    const { headers, query, body, credentials } = options;
    let p = path;
    if (query != null && query.length > 0) {
      const params = new URLSearchParams();
      for (let i = 0; i < query.length; ++i) {
        params.append(query[i][0], query[i][1]);
      }
      p += "?" + params.toString();
    }

    const input = endpoint + "/" + p.replace(/^\//, "");
    const response = await this.fetch(input, {
      method,
      headers: headers ?? {},
      mode: "cors",
      credentials,
      body: body,
    });

    let jsonBody;
    try {
      jsonBody = await response.json();
    } catch {
      if (response.status < 200 || response.status >= 300) {
        throw new ServerError(
          "unexpected status code",
          "InternalError",
          "UnexpectedError",
          {
            status_code: response.status,
          }
        );
      } else {
        throw new ServerError(
          "failed to decode response JSON",
          "InternalError",
          "UnexpectedError"
        );
      }
    }

    if (jsonBody["result"]) {
      return jsonBody["result"];
    } else if (jsonBody["error"]) {
      throw _decodeError(jsonBody["error"]);
    }

    throw _decodeError(undefined);
  }

  protected async _post(
    path: string,
    options: {
      credentials: RequestCredentials;
      json?: unknown;
      query?: [string, string][];
    }
  ): Promise<any> {
    return this._requestJSON("POST", path, options);
  }

  async _fetchOIDCRequest(url: string, init?: RequestInit): Promise<Response> {
    const resp = await this._fetchWithoutRefresh(url, init);
    if (resp.status === 200) {
      return resp;
    }
    let errJSON;
    try {
      errJSON = await resp.json();
    } catch {
      throw new ServerError(
        "failed to decode response JSON",
        "InternalError",
        "UnexpectedError",
        {
          status_code: resp.status,
        }
      );
    }
    throw new OAuthError({
      error: errJSON["error"],
      error_description: errJSON["error_description"],
    });
  }

  async _fetchOIDCJSON(url: string, init?: RequestInit): Promise<any> {
    const resp = await this._fetchOIDCRequest(url, init);
    let jsonBody;
    try {
      jsonBody = await resp.json();
    } catch {
      throw new ServerError(
        "failed to decode response JSON",
        "InternalError",
        "UnexpectedError"
      );
    }
    return jsonBody;
  }

  async _fetchOIDCConfiguration(): Promise<_OIDCConfiguration> {
    if (this.endpoint == null) {
      throw new AuthgearError("missing endpoint in api client");
    }
    const endpoint: string = this.endpoint;

    if (!this._config) {
      this._config = (await this._fetchOIDCJSON(
        `${endpoint}/.well-known/openid-configuration`
      )) as _OIDCConfiguration;
    }

    return this._config;
  }

  async _oidcTokenRequest(req: _OIDCTokenRequest): Promise<_OIDCTokenResponse> {
    const config = await this._fetchOIDCConfiguration();
    const query = new URLSearchParams();
    query.append("grant_type", req.grant_type);
    query.append("client_id", req.client_id);
    const appendKeyAsString = (key: keyof _OIDCTokenRequest) => {
      const value = req[key];
      if (value) {
        if (typeof value !== "string") {
          throw new Error("value is not a string");
        }
        query.append(key, value);
      }
    };
    for (const k of [
      "code",
      "redirect_uri",
      "code_verifier",
      "refresh_token",
      "jwt",
      "x_device_info",
      "requested_token_type",
      "subject_token",
      "subject_token_type",
      "actor_token",
      "actor_token_type",
      "audience",
    ] as (keyof _OIDCTokenRequest)[]) {
      appendKeyAsString(k);
    }
    if (req.scope != null) {
      query.append("scope", req.scope.join(" "));
    }
    const headers: Record<string, string> = {
      "content-type": "application/x-www-form-urlencoded",
    };

    let credentials: RequestCredentials = "include";
    if (req.access_token != null) {
      headers.authorization = `Bearer ${req.access_token}`;
      credentials = "omit";
    }

    return this._fetchOIDCJSON(config.token_endpoint, {
      method: "POST",
      headers,
      body: query.toString(),
      mode: "cors",
      credentials,
    });
  }

  async _setupBiometricRequest(req: _SetupBiometricRequest): Promise<void> {
    const config = await this._fetchOIDCConfiguration();
    const headers: Record<string, string> = {
      authorization: `Bearer ${req.access_token}`,
      "content-type": "application/x-www-form-urlencoded",
    };
    const query = new URLSearchParams();
    query.append(
      "grant_type",
      "urn:authgear:params:oauth:grant-type:biometric-request"
    );
    query.append("client_id", req.client_id);
    query.append("jwt", req.jwt);
    await this._fetchOIDCRequest(config.token_endpoint, {
      method: "POST",
      headers,
      body: query.toString(),
    });
  }

  async _oidcUserInfoRequest(accessToken?: string): Promise<UserInfo> {
    const headers: Record<string, string> = {};
    let credentials: RequestCredentials = "include";
    if (accessToken !== undefined) {
      headers["authorization"] = `Bearer ${accessToken}`;
      credentials = "omit";
    }
    const config = await this._fetchOIDCConfiguration();
    const response = await this._fetchOIDCJSON(config.userinfo_endpoint, {
      method: "GET",
      headers: headers,
      mode: "cors",
      credentials,
    });
    return _decodeUserInfo(response);
  }

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

  async _wechatAuthCallbackRequest(
    code: string,
    state: string,
    platform: string
  ): Promise<void> {
    const query = new URLSearchParams({
      code,
      state,
      x_platform: platform,
    });
    await this._request("POST", "/sso/wechat/callback", {
      credentials: "omit",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: query.toString(),
    });
  }

  async getEndpointOrigin(): Promise<string> {
    const config = await this._fetchOIDCConfiguration();
    return new URL(config.authorization_endpoint).origin;
  }

  async appSessionToken(
    refreshToken: string
  ): Promise<_AppSessionTokenResponse> {
    return this._post("/oauth2/app_session_token", {
      credentials: "omit",
      json: { refresh_token: refreshToken },
    });
  }

  async oauthChallenge(purpose: string): Promise<_ChallengeResponse> {
    return this._post("/oauth2/challenge", {
      credentials: "omit",
      json: { purpose },
    });
  }

  async signupAnonymousUserWithoutKey(
    clientID: string,
    sessionType: string,
    refreshToken?: string
  ): Promise<_OIDCTokenResponse | undefined> {
    const payload: Record<string, string> = {
      client_id: clientID,
      session_type: sessionType,
    };
    if (refreshToken) {
      payload["refresh_token"] = refreshToken;
    }
    const result = await this._post("/api/anonymous_user/signup", {
      json: payload,
      credentials: sessionType === "cookie" ? "include" : "omit",
    });

    // api will return empty object if the session type is cookie
    if (Object.keys(result).length === 0) {
      return undefined;
    }

    return result;
  }

  async anonymousUserPromotionCode(
    sessionType: string,
    refreshToken?: string
  ): Promise<_AnonymousUserPromotionCodeResponse> {
    const payload: Record<string, string> = {
      session_type: sessionType,
    };
    if (refreshToken) {
      payload["refresh_token"] = refreshToken;
    }
    return this._post("/api/anonymous_user/promotion_code", {
      json: payload,
      credentials: sessionType === "cookie" ? "include" : "omit",
    });
  }
}
