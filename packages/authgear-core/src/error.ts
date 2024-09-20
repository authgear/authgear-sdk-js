/**
 * AuthgearError is the root class of error produced by the SDK.
 *
 * @public
 */
export class AuthgearError extends Error {
  /**
   * underlyingError is the underlying error.
   * The type is unknown because it is possible to throw anything in JavaScript.
   * Use ordinary approaches, such as instanceof operator, to identify what it is.
   *
   * @public
   */
  underlyingError?: unknown;
}

/**
 * ErrorName contains all possible name in {@link ServerError}
 *
 * @public
 */
export enum ErrorName {
  /**
   * Indicates that the server does not understand the request (i.e. syntactic error).
   * Status code: 400
   */
  BadRequest = "BadRequest",
  /**
   * Indicates that the server understands the request, but refuse to process it (i.e. semantic error).
   * Status code: 400
   */
  Invalid = "Invalid",
  /**
   * Indicates that the client does not have valid credentials (i.e. authentication error).
   * Status code: 401
   */
  Unauthorized = "Unauthorized",
  /**
   * Indicates that the client's credentials are not allowed for the request (i.e. authorization error).
   * Status code: 403
   */
  Forbidden = "Forbidden",
  /**
   * Indicates that the server cannot find the requested resource.
   * Status code: 404
   */
  NotFound = "NotFound",
  /**
   * Indicates that the resource is already exists on the server.
   * Status code: 409
   */
  AlreadyExists = "AlreadyExists",
  /**
   * Indicates that the client has sent too many requests in a given amount of time.
   * Status code: 429
   */
  TooManyRequest = "TooManyRequest",
  /**
   * Indicates that the server encountered an unexpected condition and unable to process the request.
   * Status code: 500
   */
  InternalError = "InternalError",
  /**
   * Indicates that the server is not ready to handle the request.
   * Status code: 503
   */
  ServiceUnavailable = "ServiceUnavailable",
}

/**
 * CancelError means cancel.
 * If you catch an error and it is instanceof CancelError,
 * then the operation was cancelled.
 *
 * @public
 */
export class CancelError extends AuthgearError {}

/**
 * ServerError represents error received from the server.
 *
 * @public
 */
export class ServerError extends AuthgearError {
  /**
   * Error name.
   *
   * @remarks
   * See {@link ErrorName} for possible values.
   * New error names may be added in future.
   */
  name: string;
  /**
   * Error message.
   *
   * @remarks
   * Error messages are provided for convenience, and not stable APIs;
   * Consumers should use {@link ServerError.name} or
   * {@link ServerError.reason} to distinguish between different errors.
   */
  message!: string;
  /**
   * Error reason.
   */
  reason: string;
  /**
   * Additional error information.
   */
  info?: unknown;

  constructor(message: string, name: string, reason: string, info?: unknown) {
    super(message);
    this.name = name;
    this.reason = reason;
    this.info = info;
  }
}

/**
 * OAuthError represents the oauth error response.
 * https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 *
 * @public
 */
export class OAuthError extends AuthgearError {
  state?: string;
  error: string;
  error_description?: string;
  error_uri?: string;

  constructor({
    state,
    error,
    error_description,
    error_uri,
  }: {
    state?: string;
    error: string;
    error_description?: string;
    error_uri?: string;
  }) {
    super(error + (error_description != null ? ": " + error_description : ""));
    this.state = state;
    this.error = error;
    this.error_description = error_description;
    this.error_uri = error_uri;
  }
}

/**
 * @internal
 */
// eslint-disable-next-line complexity
export function _decodeError(err: any): Error {
  // Construct ServerError if it looks like one.
  if (
    err != null &&
    !(err instanceof Error) &&
    typeof err.name === "string" &&
    typeof err.reason === "string" &&
    typeof err.message === "string"
  ) {
    return new ServerError(err.message, err.name, err.reason, err.info);
  }
  // If it is an Error, just return it.
  if (err instanceof Error) {
    return err;
  }
  // If it has message, construct an Error from the message.
  if (err != null && typeof err.message === "string") {
    return new Error(err.message);
  }
  // If it can be turned into string, use it as message.
  if (err != null && typeof err.toString === "function") {
    return new Error(err.toString());
  }
  // Otherwise cast it to string and use it as message.
  return new Error(String(err));
}

/**
 * PreAuthenticatedURLNotAllowedError is the root class of errors related to pre-authenticated URL.
 *
 * @public
 */
export class PreAuthenticatedURLNotAllowedError extends AuthgearError {}

/**
 * This may happen if the "Pre-authenticated URL" feature was not enabled when the user logged in during this session.
 * Ask the user to log in again to enable this feature.
 *
 * @public
 */
export class PreAuthenticatedURLInsufficientScopeError extends PreAuthenticatedURLNotAllowedError {}

/**
 * The user logged in from an older SDK version that does not support the pre-authenticated URL.
 * Ask the user to log in again to resolve the problem.
 *
 * @public
 */
export class PreAuthenticatedURLIDTokenNotFoundError extends PreAuthenticatedURLNotAllowedError {}

/**
 * The device secret is not found. This may happen if the "Pre-authenticated URL" feature was not enabled when the user logged in during this session.
 * Ask the user to log in again to enable this feature.
 *
 * @public
 */
export class PreAuthenticatedURLDeviceSecretNotFoundError extends PreAuthenticatedURLNotAllowedError {}
