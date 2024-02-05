import { openAuthorizeURL } from "./plugin";

/**
 * @public
 */
export interface OpenAuthorizationURLOptions {
  /*
   * The URL the web view must open.
   */
  url: string;
  /*
   * The URL the web view must detect.
   */
  redirectURI: string;
  /*
   * A flag to some web view implementation that can share cookies with the device browser.
   * Web view implementations that are based on WKWebView or android.webkit.WebView should ignore this flag.
   */
  shareCookiesWithDeviceBrowser: boolean;
}

/**
 * WebView represents a web view that can open an URL and close itself when a redirect URI is detected.
 * DefaultWebView is a default implementation that comes with the SDK.
 *
 * @public
 */
export interface WebView {
  /**
   * openAuthorizationURL must open options.url. When redirectURI is detected,
   * the web view must close itself and return the redirectURI with query.
   * If the end-user close the web view, then openAuthorizationURL must reject the promise with
   * CancelError.
   * @public
   */
  openAuthorizationURL(options: OpenAuthorizationURLOptions): Promise<string>;
}

/**
 * DefaultWebView is ASWebAuthenticationSession on iOS, and Custom Tabs on Android.
 *
 * @public
 */
export class DefaultWebView implements WebView {
  // eslint-disable-next-line class-methods-use-this
  async openAuthorizationURL(
    options: OpenAuthorizationURLOptions
  ): Promise<string> {
    const prefersEphemeralWebBrowserSession =
      !options.shareCookiesWithDeviceBrowser;
    return openAuthorizeURL({
      url: options.url,
      callbackURL: options.redirectURI,
      prefersEphemeralWebBrowserSession,
    });
  }
}
