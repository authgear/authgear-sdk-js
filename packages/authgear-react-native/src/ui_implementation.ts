import { openAuthorizeURL, openAuthorizeURLWithWebView } from "./nativemodule";

/**
 * @public
 */
export interface OpenAuthorizationURLOptions {
  /*
   * The URL to open.
   */
  url: string;
  /*
   * The URL to detect.
   */
  redirectURI: string;
  /*
   * A flag to some implementations that can share cookies with the device browser.
   */
  shareCookiesWithDeviceBrowser: boolean;
}

/**
 * UIImplementation can open an URL and close itself when a redirect URI is detected.
 *
 * @public
 */
export interface UIImplementation {
  /**
   * openAuthorizationURL must open options.url. When redirectURI is detected,
   * the implementation must close itself and return the redirectURI with query.
   * If the end-user closes it, then openAuthorizationURL must reject the promise with
   * CancelError.
   *
   * @public
   */
  openAuthorizationURL(options: OpenAuthorizationURLOptions): Promise<string>;
}

/**
 * DeviceBrowserUIImplementation is ASWebAuthenticationSession on iOS, and Custom Tabs on Android.
 *
 * @public
 */
export class DeviceBrowserUIImplementation implements UIImplementation {
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
export interface WebKitWebViewUIImplementationOptionsIOS {
  navigationBarBackgroundColor?: number;
  navigationBarButtonTintColor?: number;
  modalPresentationStyle?: "automatic" | "fullScreen" | "pageSheet";
  isInspectable?: boolean;
}

/**
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding
 *
 * @public
 */
export interface WebKitWebViewUIImplementationOptionsAndroid {
  actionBarBackgroundColor?: number;
  actionBarButtonTintColor?: number;
}

/**
 * @public
 */
export interface WebKitWebViewUIImplementationOptions {
  ios?: WebKitWebViewUIImplementationOptionsIOS;
  android?: WebKitWebViewUIImplementationOptionsAndroid;
}

/**
 * WebKitWebViewUIImplementation is WKWebView on iOS, android.webkit.WebView on Android.
 *
 * @public
 */
export class WebKitWebViewUIImplementation implements UIImplementation {
  private options?: WebKitWebViewUIImplementationOptions;

  constructor(options?: WebKitWebViewUIImplementationOptions) {
    this.options = options;
  }

  // eslint-disable-next-line class-methods-use-this
  async openAuthorizationURL(
    options: OpenAuthorizationURLOptions
  ): Promise<string> {
    return openAuthorizeURLWithWebView({
      url: options.url,
      redirectURI: options.redirectURI,
      navigationBarBackgroundColor:
        this.options?.ios?.navigationBarBackgroundColor?.toString(16),
      navigationBarButtonTintColor:
        this.options?.ios?.navigationBarButtonTintColor?.toString(16),
      modalPresentationStyle: this.options?.ios?.modalPresentationStyle,
      iosIsInspectable: this.options?.ios?.isInspectable ? "true" : "false",
      actionBarBackgroundColor:
        this.options?.android?.actionBarBackgroundColor?.toString(16),
      actionBarButtonTintColor:
        this.options?.android?.actionBarButtonTintColor?.toString(16),
    });
  }
}
