#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000)
#import <AuthenticationServices/AuthenticationServices.h>
#endif
#import <WebKit/WebKit.h>
#import <SafariServices/SafariServices.h>
#import <CommonCrypto/CommonDigest.h>
#import <React/RCTUtils.h>
#import "AGAuthgearReactNative.h"

static NSString *currentWeChatRedirectURI = nil;
static void postOpenWeChatRedirectURINotification(NSURL *URL, id sender)
{
  NSDictionary<NSString *, id> *payload = @{@"url": URL.absoluteString};
  [[NSNotificationCenter defaultCenter] postNotificationName:kOpenWeChatRedirectURINotification
                                                      object:sender
                                                    userInfo:payload];
}

@interface AGAuthgearReactNative() <WKNavigationDelegate>
@property (nonatomic, strong) RCTPromiseResolveBlock openURLResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock openURLReject;
@property (nonatomic, strong) UIViewController *webViewViewController;
@end

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 11000)
@interface AGAuthgearReactNative()
// We must have strong reference to the session otherwise it is closed immediately when
// it goes out of scope.
@property (nonatomic, strong) SFAuthenticationSession *sfSession API_AVAILABLE(ios(11));
@end
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000)
@interface AGAuthgearReactNative() <ASWebAuthenticationPresentationContextProviding>
// We must have strong reference to the session otherwise it is closed immediately when
// it goes out of scope.
@property (nonatomic, strong) ASWebAuthenticationSession *asSession API_AVAILABLE(ios(12));
@end
#endif

@implementation AGAuthgearReactNative

RCT_EXPORT_MODULE(AuthgearReactNative)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
    self = [super init];
    return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)URL
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  [self handleWeChatRedirectURI:URL];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  [self handleWeChatRedirectURI:URL];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:
    #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000)
        (nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))restorationHandler {
    #else
        (nonnull void (^)(NSArray *_Nullable))restorationHandler {
    #endif
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    return [self handleWeChatRedirectURI:userActivity.webpageURL];
  }
  return YES;
}

RCT_EXPORT_METHOD(dismiss:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    [self cleanup];
    resolve(nil);
}

RCT_EXPORT_METHOD(openURL:(NSURL *)url
        weChatRedirectURI:(NSString *)weChatRedirectURI
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
{
    // For opening setting page, sdk will not know when user end
    // the setting page.
    // So we cannot unregister the wechat uri in this case
    // It is fine to not unresgister it, as everytime we open a
    // new authorize section (authorize or setting page)
    // registerCurrentWeChatRedirectURI will be called and overwrite
    // previous registered wechatRedirectURI
    [AGAuthgearReactNative registerCurrentWeChatRedirectURI:weChatRedirectURI];
    UIViewController *vc = [[UIViewController alloc] init];
    WKWebView *wv = [[WKWebView alloc] initWithFrame:vc.view.bounds];
    wv.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    wv.navigationDelegate = self;
    [wv loadRequest:[NSURLRequest requestWithURL:url]];
    [vc.view addSubview:wv];
    vc.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone target:self action:@selector(dismissWebView)];
    self.webViewViewController = vc;

    UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:vc];
    nav.modalPresentationStyle = UIModalPresentationPageSheet;

    UIViewController *rootViewController = RCTPresentedViewController();
    [rootViewController presentViewController:nav animated:YES completion:nil];
    resolve(nil);
}

RCT_EXPORT_METHOD(openAuthorizeURL:(NSURL *)url
                       callbackURL:(NSString *)callbackURL
                 weChatRedirectURI:(NSString *)weChatRedirectURI
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject)
{
    self.openURLResolve = resolve;
    self.openURLReject = reject;

    NSString *scheme = [self getCallbackURLScheme:callbackURL];
    [AGAuthgearReactNative registerCurrentWeChatRedirectURI:weChatRedirectURI];
    if (@available(iOS 12.0, *)) {
        self.asSession = [[ASWebAuthenticationSession alloc] initWithURL:url
                                                                            callbackURLScheme:scheme
                                                                            completionHandler:^(NSURL *url, NSError *error) {
            [AGAuthgearReactNative unregisterCurrentWeChatRedirectURI];
            if (error) {
                BOOL isUserCancelled = ([[error domain] isEqualToString:ASWebAuthenticationSessionErrorDomain] &&
                [error code] == ASWebAuthenticationSessionErrorCodeCanceledLogin);
                if (self.openURLReject) {
                    if (isUserCancelled) {
                        self.openURLReject(@"CANCEL", @"CANCEL", error);
                    } else {
                        self.openURLReject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", url], error);
                    }
                }
            } else {
                if (self.openURLResolve) {
                    self.openURLResolve([url absoluteString]);
                }
            }
            [self cleanup];
        }];
        if (@available(iOS 13.0, *)) {
            self.asSession.presentationContextProvider = self;
        }
        [self.asSession start];
    } else if (@available(iOS 11.0, *)) {
        self.sfSession = [[SFAuthenticationSession alloc] initWithURL:url
                                                                      callbackURLScheme:scheme
                                                                      completionHandler:^(NSURL *url, NSError *error) {
            [AGAuthgearReactNative unregisterCurrentWeChatRedirectURI];
            if (error) {
                BOOL isUserCancelled = ([[error domain] isEqualToString:SFAuthenticationErrorDomain] &&
                [error code] == SFAuthenticationErrorCanceledLogin);
                if (self.openURLReject) {
                    if (isUserCancelled) {
                        self.openURLReject(@"CANCEL", @"CANCEL", error);
                    } else {
                        self.openURLReject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", url], error);
                    }
                }
            } else {
                if (self.openURLResolve) {
                    self.openURLResolve([url absoluteString]);
                }
            }
            [self cleanup];
        }];
        [self.sfSession start];
    }
}

RCT_EXPORT_METHOD(randomBytes:(NSUInteger)length resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    resolve([self randomBytes:length]);
}

RCT_EXPORT_METHOD(sha256String:(NSString *)input resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    resolve([self sha256String:input]);
}

RCT_EXPORT_METHOD(getAnonymousKey:(NSString *)kid resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 10.0, *)) {
    if (!kid) {
      kid = [[NSUUID UUID] UUIDString];
    }

    NSString *tag = [@"com.authgear.keys.anonymous." stringByAppendingString:kid];

    NSMutableDictionary *jwk = [NSMutableDictionary dictionary];
    NSError *error = [self loadKey:tag keyRef:nil];
    if (error) {
      error = [self generateKey:tag jwk:jwk];
    }

    if (error) {
      reject(RCTErrorUnspecified, @"getAnonymousKey", error);
      return;
    }
    if ([jwk count] == 0) {
      resolve(@{@"kid": kid, @"alg": @"RS256"});
    } else {
      [jwk setValue:kid forKey:@"kid"];
      resolve(@{@"kid": kid, @"alg": @"RS256", @"jwk": jwk});
    }
  } else {
    reject(RCTErrorUnspecified, @"getAnonymousKey requires iOS 10. Please check the device OS version before calling this function.", nil);
  }
}

RCT_EXPORT_METHOD(signAnonymousToken:(NSString *)kid data:(NSString *)s resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 10.0, *)) {
    NSData *data = [s dataUsingEncoding:NSUTF8StringEncoding];
    NSString *tag = [@"com.authgear.keys.anonymous." stringByAppendingString:kid];
    NSData *sig = nil;
    NSError *error = [self signData:tag data:data psig:&sig];
    if (error) {
      reject(RCTErrorUnspecified, @"signAnonymousToken", error);
      return;
    }
    resolve([sig base64EncodedStringWithOptions: 0]);
  } else {
    reject(RCTErrorUnspecified, @"signData requires iOS 10. Please check the device OS version before calling this function.", nil);
  }
}

- (void)cleanup
{
    if (@available(iOS 12.0, *)) {
        self.asSession = nil;
    }
    if (@available(iOS 11.0, *)) {
        self.sfSession = nil;
    }
    if (self.webViewViewController != nil) {
      [self.webViewViewController.presentingViewController dismissViewControllerAnimated:true completion:^ {
        self.webViewViewController = nil;
      }];
    }
    self.openURLResolve = nil;
    self.openURLReject = nil;
}

- (void)dismissWebView
{
    if (self.openURLReject) {
        self.openURLReject(@"CANCEL", @"CANCEL", nil);
    }
    [self cleanup];
}

- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session API_AVAILABLE(ios(12))
{
  for (__kindof UIWindow *w in [RCTSharedApplication() windows]) {
    if ([w isKeyWindow]) {
      return w;
    }
  }
  return nil;
}

-(NSArray *)randomBytes:(NSUInteger)length
{
    NSMutableData *data = [NSMutableData dataWithLength:length];
    SecRandomCopyBytes(kSecRandomDefault, length, [data mutableBytes]);
    NSMutableArray *arr = [NSMutableArray arrayWithCapacity:length];
    const char *bytes = [data bytes];
    for (int i = 0; i < [data length]; i++) {
        [arr addObject:[NSNumber numberWithInt:(bytes[i] & 0xff)]];
    }
    return arr;
}

-(NSArray *)sha256String:(NSString *)input
{
    NSData *utf8 = [input dataUsingEncoding:NSUTF8StringEncoding];
    unsigned char result[CC_SHA256_DIGEST_LENGTH];
    CC_SHA256([utf8 bytes], [utf8 length], result);
    NSMutableArray *arr = [NSMutableArray arrayWithCapacity:CC_SHA256_DIGEST_LENGTH];
    for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++) {
        [arr addObject:[NSNumber numberWithInt:(result[i] & 0xff)]];
    }
    return arr;
}

-(NSError *)loadKey:(NSString *)tag keyRef:(SecKeyRef *)keyRef API_AVAILABLE(ios(10))
{
  NSData* tagData = [tag dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary* query = @{
    (id)kSecClass: (id)kSecClassKey,
    (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
    (id)kSecAttrKeyClass: (id)kSecAttrKeyClassPrivate,
    (id)kSecAttrKeySizeInBits: @2048,
    (id)kSecAttrIsPermanent: @YES,
    (id)kSecAttrApplicationTag: tagData,
    (id)kSecReturnRef: @YES,
  };
  SecKeyRef privKey;
  OSStatus status = SecItemCopyMatching(
    (__bridge CFDictionaryRef)query,
    (CFTypeRef *) &privKey
  );
  if (status != errSecSuccess) {
    return [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
  }

  if (keyRef) {
    *keyRef = privKey;
  }
  return nil;
}

-(NSError *)generateKey:(NSString *)tag jwk:(NSMutableDictionary *)jwk API_AVAILABLE(ios(10))
{
  CFErrorRef error = NULL;

  NSData* tagData = [tag dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary* attributes = @{
    (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
    (id)kSecAttrKeySizeInBits: @2048,
    (id)kSecAttrIsPermanent: @YES,
    (id)kSecAttrApplicationTag: tagData,
  };
  SecKeyRef privKey = SecKeyCreateRandomKey(
    (__bridge CFDictionaryRef)attributes,
    &error
  );
  if (error) {
    return CFBridgingRelease(error);
  }

  SecKeyRef pubKey = SecKeyCopyPublicKey(privKey);
  CFDataRef dataRef = SecKeyCopyExternalRepresentation(pubKey, &error);
  if (error) {
    return CFBridgingRelease(error);
  }

  NSData *data = (__bridge NSData*)dataRef;
  NSUInteger size = data.length;
  NSData *modulus = [data subdataWithRange:NSMakeRange(size > 269 ? 9 : 8, 256)];
  NSData *exponent = [data subdataWithRange:NSMakeRange(size - 3, 3)];
  [jwk setValue:@"RSA" forKey:@"kty"];
  [jwk setValue:[modulus base64EncodedStringWithOptions:0] forKey:@"n"];
  [jwk setValue:[exponent base64EncodedStringWithOptions:0] forKey:@"e"];
  return nil;
}

-(NSError *)signData:(NSString *)tag data:(NSData *)data psig:(NSData **)psig API_AVAILABLE(ios(10))
{
  CFErrorRef error = NULL;

  SecKeyRef privKey;
  NSError *err = [self loadKey:tag keyRef:&privKey];
  if (err) {
    return err;
  }

  NSMutableData *hash = [NSMutableData dataWithLength:CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(data.bytes, (unsigned int)data.length, hash.mutableBytes);

  NSData *sig = (__bridge NSData*)SecKeyCreateSignature(
    privKey,
    kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA256,
    (__bridge CFDataRef)hash,
    &error
  );
  CFRelease(privKey);
  if (error) {
    return CFBridgingRelease(error);
  }

  *psig = sig;
  return nil;
}

#pragma mark - Handle WeChat Redirect uri functions

+(void)registerCurrentWeChatRedirectURI:(NSString*)uri {
    currentWeChatRedirectURI = uri;
}


+(void)unregisterCurrentWeChatRedirectURI{
    currentWeChatRedirectURI = nil;
}

+(BOOL)handleWeChatRedirectURI:(NSURL*)url {
    if(currentWeChatRedirectURI == nil) return NO;
    NSString *urlWithoutQuery = [self getURLWithoutQuery:url];
    if (urlWithoutQuery != nil && [urlWithoutQuery isEqualToString:currentWeChatRedirectURI]) {
        postOpenWeChatRedirectURINotification(url, self);
        return YES;
    }
    return NO;
}

- (void)webView:(WKWebView *)webView
decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction
decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
    NSURL *url = navigationAction.request.URL;
    if (url != nil && [self.class handleWeChatRedirectURI:url]) {
        decisionHandler(WKNavigationActionPolicyCancel);
        return;
    }
    decisionHandler(WKNavigationActionPolicyAllow);
}

#pragma mark - URL functions

-(NSString *)getCallbackURLScheme:(NSString *)url
{
  NSURL *u = [NSURL URLWithString:url];
  if (u == nil) {
    return url;
  }
  return u.scheme;
}

+(NSString *)getURLWithoutQuery:(NSURL *)url
{
    NSURLComponents* uc = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
    uc.query = nil;
    uc.fragment = nil;
    return [uc string];
}

@end
