export function readClientID(): string {
  const clientID = window.localStorage.getItem("authgear.clientID");
  return clientID ?? "";
}

export function readEndpoint(): string {
  const endpoint = window.localStorage.getItem("authgear.endpoint");
  return endpoint ?? "";
}

export function readIsSSOEnabled(): boolean {
  const str = window.localStorage.getItem("authgear.isSSOEnabled");
  if (str === "true") {
    return true;
  }
  return false;
}

export function readPreAuthenticatedURLClientID(): string {
  const str = window.localStorage.getItem(
    "authgear.preAuthenticatedURLClientID"
  );
  return str ?? "";
}

export function readPreAuthenticatedURLRedirectURI(): string {
  const str = window.localStorage.getItem(
    "authgear.preAuthenticatedURLRedirectURI"
  );
  return str ?? "";
}

export function readIsPreAuthenticatedURLEnabled(): boolean {
  const str = window.localStorage.getItem(
    "authgear.preAuthenticatedURLEnabled"
  );
  if (str === "true") {
    return true;
  }
  return false;
}

export function readUseWebKitWebView(): boolean {
  const str = window.localStorage.getItem("authgear.useWebKitWebView");
  if (str === "true") {
    return true;
  }
  return false;
}

export function writeClientID(clientID: string) {
  window.localStorage.setItem("authgear.clientID", clientID);
}

export function writeEndpoint(endpoint: string) {
  window.localStorage.setItem("authgear.endpoint", endpoint);
}

export function writeIsSSOEnabled(isSSOEnabled: boolean) {
  window.localStorage.setItem("authgear.isSSOEnabled", String(isSSOEnabled));
}

export function writePreAuthenticatedURLClientID(clientID: string) {
  window.localStorage.setItem("authgear.preAuthenticatedURLClientID", clientID);
}

export function writePreAuthenticatedURLRedirectURI(uri: string) {
  window.localStorage.setItem("authgear.preAuthenticatedURLRedirectURI", uri);
}

export function writeIsPreAuthenticatedURLEnabled(isEnabled: boolean) {
  window.localStorage.setItem(
    "authgear.preAuthenticatedURLEnabled",
    String(isEnabled)
  );
}

export function writeUseWebKitWebView(useWebKitWebView: boolean) {
  window.localStorage.setItem(
    "authgear.useWebKitWebView",
    String(useWebKitWebView)
  );
}
