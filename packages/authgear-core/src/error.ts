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
  BadRequest = "BadRequest",
  Invalid = "Invalid",
  Unauthorized = "Unauthorized",
  Forbidden = "Forbidden",
  NotFound = "NotFound",
  AlreadyExists = "AlreadyExists",
  TooManyRequest = "TooManyRequest",
  InternalError = "InternalError",
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
