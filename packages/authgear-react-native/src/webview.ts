import { openAuthorizeURL, openAuthorizeURLWithWebView } from "./nativemodule";

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
    return openAuthorizeURL(
      options.url,
      options.redirectURI,
      prefersEphemeralWebBrowserSession
    );
  }
}

/**
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding
 *
 * @public
 */
export interface PlatformWebViewOptionsIOS {
  backgroundColor?: number;
  navigationBarBackgroundColor?: number;
  navigationBarButtonTintColor?: number;
  modalPresentationStyle?: "automatic" | "fullScreen" | "pageSheet";
}

/**
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding
 *
 * @public
 */
export interface PlatformWebViewOptionsAndroid {
  actionBarBackgroundColor?: number;
  actionBarButtonTintColor?: number;
}

/**
 * @public
 */
export interface PlatformWebViewOptions {
  ios?: PlatformWebViewOptionsIOS;
  android?: PlatformWebViewOptionsAndroid;
}

/**
 * PlatformWebView is WKWebView on iOS, android.webkit.WebView on Android.
 *
 * @public
 */
export class PlatformWebView implements WebView {
  private options?: PlatformWebViewOptions;

  constructor(options?: PlatformWebViewOptions) {
    this.options = options;
  }

  // eslint-disable-next-line class-methods-use-this
  async openAuthorizationURL(
    options: OpenAuthorizationURLOptions
  ): Promise<string> {
    return openAuthorizeURLWithWebView({
      url: options.url,
      redirectURI: options.redirectURI,
      backgroundColor: this.options?.ios?.backgroundColor,
      navigationBarBackgroundColor:
        this.options?.ios?.navigationBarBackgroundColor,
      navigationBarButtonTintColor:
        this.options?.ios?.navigationBarButtonTintColor,
      modalPresentationStyle: this.options?.ios?.modalPresentationStyle,
      actionBarBackgroundColor: this.options?.android?.actionBarBackgroundColor,
      actionBarButtonTintColor: this.options?.android?.actionBarButtonTintColor,
    });
  }
}
