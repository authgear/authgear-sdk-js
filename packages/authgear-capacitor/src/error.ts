import { AuthgearError, CancelError } from "@authgear/core";

type _ErrorIdentificationFunction = (e: unknown) => boolean;

const _errorMappings: [_ErrorIdentificationFunction, typeof AuthgearError][] = [
  [_isCancel, CancelError],
];

// {
//     "errorMessage": "CANCEL",
//     "message": "CANCEL",
//     "data": {
//         "cause": {
//             "code": 1,
//             "userInfo": {},
//             "domain": "com.apple.AuthenticationServices.WebAuthenticationSession"
//         }
//     },
//     "code": "CANCEL"
// }
export interface PlatformError {
  message: string;
  errorMessage: string;
  code: string;
  data?: {
    cause?: {
      // iOS
      domain: string;
      code: number;
      userInfo?: unknown;
    };
  };
}

export function isPlatformError(e: unknown): e is PlatformError {
  return (
    typeof e === "object" &&
    e != null &&
    "message" in e &&
    "errorMessage" in e &&
    "code" in e
  );
}

export function _isCancel(e: unknown): boolean {
  if (isPlatformError(e)) {
    return e.code === "CANCEL";
  }
  return false;
}

export function _wrapError(e: unknown): unknown {
  for (const [f, cls] of _errorMappings) {
    if (f(e)) {
      const err = new cls();
      err.underlyingError = e;
      return err;
    }
  }
  const err = new AuthgearError();
  err.underlyingError = e;
  return err;
}
