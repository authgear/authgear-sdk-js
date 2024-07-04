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

export function readAppInitiatedSSOToWebClientID(): string {
  const str = window.localStorage.getItem(
    "authgear.appInitiatedSSOToWebClientID"
  );
  return str ?? "";
}

export function readIsAppInitiatedSSOToWebEnabled(): boolean {
  const str = window.localStorage.getItem(
    "authgear.isAppInitiatedSSOToWebEnabled"
  );
  if (str === "true") {
    return true;
  }
  return false;
}

export function readAppInitiatedSSOToWebRedirectURI(): string {
  const str = window.localStorage.getItem(
    "authgear.appInitiatedSSOToWebRedirectURI"
  );
  return str ?? "";
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

export function writeAppInitiatedSSOToWebClientID(clientID: string) {
  window.localStorage.setItem(
    "authgear.appInitiatedSSOToWebClientID",
    clientID
  );
}

export function writeIsAppInitiatedSSOToWebEnabled(isEnabled: boolean) {
  window.localStorage.setItem(
    "authgear.isAppInitiatedSSOToWebEnabled",
    String(isEnabled)
  );
}

export function writeAppInitiatedSSOToWebRedirectURI(uri: string) {
  window.localStorage.setItem("authgear.appInitiatedSSOToWebRedirectURI", uri);
}

export function writeUseWebKitWebView(useWebKitWebView: boolean) {
  window.localStorage.setItem(
    "authgear.useWebKitWebView",
    String(useWebKitWebView)
  );
}
