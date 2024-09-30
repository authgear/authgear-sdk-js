import { openAuthorizeURL, openAuthorizeURLWithWebView } from "./nativemodule";

/**
 * OpenAuthorizationURLOptions is options for {@link UIImplementation.openAuthorizationURL}.
 *
 * @public
 */
export interface OpenAuthorizationURLOptions {
  /**
   * The URL to be opened by the UIImplementation.
   */
  url: string;
  /**
   * The URL to be detected by the UIImplementation.
   * When this URL is detected, the UIImplementation MUST return this URL, and close itself.
   */
  redirectURI: string;
  /**
   * A flag to tell the UIImplementation that cookies should be shared with the device browser.
   * This flag is only useful to UIImplementation that can share cookies with the device browser,
   * such as those underlying implementations are based on ASWebAuthenticationSession, or CustomTabs.
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
 * DeviceBrowserUIImplementation is the default {@link UIImplementation}.
 *
 * For iOS, it is using ASWebAuthenticationSession (see https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession).
 * For Android, it is using Custom Tabs (see https://developer.chrome.com/docs/android/custom-tabs).
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
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding.
 * Yes, it is still from Android such that the color encoding method in iOS is the same that used in Android.
 *
 * @public
 */
export interface WebKitWebViewUIImplementationOptionsIOS {
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  navigationBarBackgroundColor?: number;
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  navigationBarButtonTintColor?: number;
  /**
   * Styles for the modal.
   * See https://developer.apple.com/documentation/uikit/uimodalpresentationstyle.
   */
  modalPresentationStyle?: "automatic" | "fullScreen" | "pageSheet";
  /**
   * Indicates whether you can inspect the view with Safari Web Inspector.
   * See https://developer.apple.com/documentation/webkit/wkwebview/4111163-isinspectable.
   */
  isInspectable?: boolean;
}

/**
 * Color is an integer according to this encoding https://developer.android.com/reference/android/graphics/Color#encoding.
 *
 * @public
 */
export interface WebKitWebViewUIImplementationOptionsAndroid {
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  actionBarBackgroundColor?: number;
  /**
   * The color is in hexadecimal format representing the argb, for example, blue is 0xff0000ff.
   */
  actionBarButtonTintColor?: number;
}

/**
 * WebKitWebViewUIImplementationOptions specifies options for configuring the user interface of a WebKit WebView.
 * It allows platform-specific customization for iOS and Android.
 *
 * @public
 */
export interface WebKitWebViewUIImplementationOptions {
  ios?: WebKitWebViewUIImplementationOptionsIOS;
  android?: WebKitWebViewUIImplementationOptionsAndroid;
}

/**
 * WebKitWebViewUIImplementation provides more customization options other than {@link DeviceBrowserUIImplementation}.
 *
 * For iOS, it is using WKWebView (see https://developer.apple.com/documentation/webkit/wkwebview).
 * For Android, it is using android.webkit.WebView (see https://developer.android.com/reference/android/webkit/WebView).
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
