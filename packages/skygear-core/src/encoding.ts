import { User, _AuthResponse } from "./types";

/**
 * @internal
 */
export function _decodeUser(u: any): User {
  const id = u.id;
  const createdAt = new Date(u.created_at);
  const lastLoginAt = new Date(u.last_login_at);
  const isAnonymous = u.is_anonymous;
  const metadata = u.metadata;
  return {
    id,
    createdAt,
    lastLoginAt,
    isAnonymous,
    metadata,
  };
}

/**
 * @internal
 */
export function _encodeUser(u: User): unknown {
  const created_at = u.createdAt.toISOString();
  const last_login_at = u.lastLoginAt.toISOString();
  return {
    id: u.id,
    created_at,
    last_login_at,
    is_anonymous: u.isAnonymous,
    metadata: u.metadata,
  };
}

/**
 * @internal
 */
export function _decodeAuthResponseFromOIDCUserinfo(u: any): _AuthResponse {
  const { sub, skygear_user, skygear_session_id } = u;

  if (!skygear_user) {
    throw new Error("missing skygear_user in userinfo");
  }

  const user = _decodeUser(skygear_user);
  user.id = sub;

  const response: _AuthResponse = {
    user: user,
  };

  if (skygear_session_id) {
    response.sessionID = skygear_session_id;
  }

  return response;
}
