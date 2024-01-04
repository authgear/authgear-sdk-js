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

export function writeClientID(clientID: string) {
  window.localStorage.setItem("authgear.clientID", clientID);
}

export function writeEndpoint(endpoint: string) {
  window.localStorage.setItem("authgear.endpoint", endpoint);
}

export function writeIsSSOEnabled(isSSOEnabled: boolean) {
  window.localStorage.setItem("authgear.isSSOEnabled", String(isSSOEnabled));
}
