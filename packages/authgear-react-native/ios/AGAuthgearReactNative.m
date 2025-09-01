#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000)
#import <AuthenticationServices/AuthenticationServices.h>
#endif
#import <CommonCrypto/CommonDigest.h>
#import <React/RCTUtils.h>
#import <LocalAuthentication/LocalAuthentication.h>
#import <sys/utsname.h>
#import "AGAuthgearReactNative.h"
#import "AGWKWebViewController.h"
#import <CommonCrypto/CommonDigest.h>

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000)
@interface AGAuthgearReactNative() <ASWebAuthenticationPresentationContextProviding, AGWKWebViewControllerPresentationContextProviding>
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

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"authgear-react-native"];
}

+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)URL
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return NO;
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  return NO;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:
    #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000)
        (nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))restorationHandler {
    #else
        (nonnull void (^)(NSArray *_Nullable))restorationHandler {
    #endif
  return NO;
}

RCT_EXPORT_METHOD(storageGetItem:(NSString *)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    NSDictionary *query = @{
        (id)kSecClass: (id)kSecClassGenericPassword,
        (id)kSecAttrAccount: key,
        (id)kSecMatchLimit: (id)kSecMatchLimitOne,
        (id)kSecReturnData: @YES,
    };
    CFTypeRef item = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &item);
    if (status == errSecSuccess) {
        NSData *data = CFBridgingRelease((CFDataRef)item);
        NSString *value = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        resolve(value);
    } else if (status == errSecItemNotFound) {
        resolve([NSNull null]);
    } else {
        NSError *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        reject([@(error.code) stringValue], error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(storageSetItem:(NSString *)key value:(NSString *)value resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    // We first attempt an update, followed by an addition.
    NSData *data = [value dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *updateQuery = @{
        (id)kSecClass: (id)kSecClassGenericPassword,
        (id)kSecAttrAccount: key,
    };
    NSDictionary *update = @{
        (id)kSecValueData: data,
    };
    OSStatus status = SecItemUpdate((__bridge CFDictionaryRef)updateQuery, (__bridge CFDictionaryRef)update);
    if (status == errSecSuccess) {
        resolve(nil);
    } else if (status == errSecItemNotFound) {
        // The item is stored on this device only.
        CFErrorRef cfError = NULL;
        SecAccessControlRef accessControl = SecAccessControlCreateWithFlags(
            NULL,
            kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            0,
            &cfError
        );
        if (cfError) {
            NSError *error = CFBridgingRelease(cfError);
            reject([@(error.code) stringValue], error.localizedDescription, error);
        } else {
            NSDictionary *addQuery = @{
                (id)kSecClass: (id)kSecClassGenericPassword,
                (id)kSecAttrAccount: key,
                (id)kSecValueData: data,
                (id)kSecAttrAccessControl: (__bridge id)accessControl,
            };
            status = SecItemAdd((__bridge CFDictionaryRef)addQuery, NULL);
            CFRelease(accessControl);
            if (status == errSecSuccess) {
                resolve(nil);
            } else {
                NSError *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
                reject([@(error.code) stringValue], error.localizedDescription, error);
            }
        }
    } else {
        NSError *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        reject([@(error.code) stringValue], error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(storageDeleteItem:(NSString *)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    NSDictionary *query = @{
        (id)kSecClass: (id)kSecClassGenericPassword,
        (id)kSecAttrAccount: key,
    };
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);
    if (status == errSecSuccess || status == errSecItemNotFound) {
        resolve(nil);
    } else {
        NSError *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        reject([@(error.code) stringValue], error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(getDeviceInfo:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    struct utsname systemInfo;
    uname(&systemInfo);

    NSString *machine = [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
    NSString *nodename = [NSString stringWithCString:systemInfo.nodename encoding:NSUTF8StringEncoding];
    NSString *release = [NSString stringWithCString:systemInfo.release encoding:NSUTF8StringEncoding];
    NSString *sysname = [NSString stringWithCString:systemInfo.sysname encoding:NSUTF8StringEncoding];
    NSString *version = [NSString stringWithCString:systemInfo.version encoding:NSUTF8StringEncoding];

    NSDictionary *unameInfo = @{
        @"machine": machine,
        @"nodename": nodename,
        @"release": release,
        @"sysname": sysname,
        @"version": version,
    };

    UIDevice *uiDevice = [UIDevice currentDevice];
    NSDictionary *uiDeviceInfo = @{
        @"name": uiDevice.name,
        @"systemName": uiDevice.systemName,
        @"systemVersion": uiDevice.systemVersion,
        @"model": uiDevice.model,
        @"userInterfaceIdiom": [self idiomToString:uiDevice.userInterfaceIdiom],
    };

    NSMutableDictionary *processInfo = [[NSMutableDictionary alloc] init];
    processInfo[@"isMacCatalystApp"] = @NO;
    processInfo[@"isiOSAppOnMac"] = @NO;

    if (@available(iOS 13.0, *)) {
        NSProcessInfo *info = [NSProcessInfo processInfo];
        processInfo[@"isMacCatalystApp"] = @(info.isMacCatalystApp);
        if (@available(iOS 14.0, *)) {
            processInfo[@"isiOSAppOnMac"] = @(info.isiOSAppOnMac);
        }
    }

    NSDictionary *mainInfoDict = [NSBundle mainBundle].infoDictionary;
    NSDictionary *bundleInfo = @{
      @"CFBundleIdentifier": mainInfoDict[@"CFBundleIdentifier"],
      @"CFBundleName": mainInfoDict[@"CFBundleName"],
      @"CFBundleDisplayName": mainInfoDict[@"CFBundleDisplayName"],
      @"CFBundleExecutable": mainInfoDict[@"CFBundleExecutable"],
      @"CFBundleShortVersionString": mainInfoDict[@"CFBundleShortVersionString"],
      @"CFBundleVersion": mainInfoDict[@"CFBundleVersion"],
    };

    resolve(@{
        @"ios": @{
                @"uname": unameInfo,
                @"UIDevice": uiDeviceInfo,
                @"NSProcessInfo": processInfo,
                @"NSBundle": bundleInfo,
        },
    });
}

RCT_EXPORT_METHOD(dismiss:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    [self cleanup];
    resolve(nil);
}

RCT_EXPORT_METHOD(openAuthorizeURLWithWebView:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSString *invocationID = options[@"invocationID"];
    NSString *url = options[@"url"];
    NSString *redirectURI = options[@"redirectURI"];
    UIModalPresentationStyle modalPresentationStyle = [self modalPresentationStyleFromString:options[@"modalPresentationStyle"]];
    UIColor *navigationBarBackgroundColor = [self uiColorFromNSString:options[@"navigationBarBackgroundColor"]];
    UIColor *navigationBarButtonTintColor = [self uiColorFromNSString:options[@"navigationBarButtonTintColor"]];
    BOOL isInspectable = [self boolFromNSString:options[@"iosIsInspectable"]];
    NSString *wechatRedirectURIString = options[@"iosWechatRedirectURI"];

    AGWKWebViewController *controller = [[AGWKWebViewController alloc] initWithURL:[[NSURL alloc] initWithString:url]
                                                                       redirectURI:[[NSURL alloc] initWithString:redirectURI]
                                                                       isInspectable:isInspectable completionHandler:^(NSURL *url, NSError *error) {
        if (error) {
            BOOL isUserCancelled = [error.domain isEqualToString:AGWKWebViewControllerErrorDomain] && error.code == AGWKWebViewControllerErrorCodeCanceledLogin;
            if (isUserCancelled) {
                reject(@"CANCEL", @"CANCEL", error);
            } else {
                reject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", url], error);
            }
        } else {
            resolve([url absoluteString]);
        }
    }];
    controller.navigationBarBackgroundColor = navigationBarBackgroundColor;
    controller.navigationBarButtonTintColor = navigationBarButtonTintColor;
    if (wechatRedirectURIString != nil) {
        controller.wechatRedirectURI = [[NSURL alloc] initWithString:wechatRedirectURIString];
        controller.onWechatRedirectURINavigate = ^(NSURL *url) {
            [self sendEventWithName:@"authgear-react-native" body:@{
                @"invocationID": invocationID,
                @"url": [url absoluteString]
            }];
        };
    }
    controller.modalPresentationStyle = modalPresentationStyle;
    controller.presentationContextProvider = self;
    [controller start];
}

RCT_EXPORT_METHOD(openAuthorizeURL:(NSURL *)url
                       callbackURL:(NSString *)callbackURL
 prefersEphemeralWebBrowserSession:(BOOL)prefersEphemeralWebBrowserSession
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject)
{
    NSString *scheme = [self getCallbackURLScheme:callbackURL];

    if (@available(iOS 12.0, *)) {
        self.asSession = [[ASWebAuthenticationSession alloc] initWithURL:url
                                                                            callbackURLScheme:scheme
                                                                            completionHandler:^(NSURL *url, NSError *error) {
            if (error) {
                BOOL isUserCancelled = ([[error domain] isEqualToString:ASWebAuthenticationSessionErrorDomain] &&
                [error code] == ASWebAuthenticationSessionErrorCodeCanceledLogin);
                if (isUserCancelled) {
                    reject(@"CANCEL", @"CANCEL", error);
                } else {
                    reject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", url], error);
                }
            } else {
                resolve([url absoluteString]);
            }
            [self cleanup];
        }];
        if (@available(iOS 13.0, *)) {
            self.asSession.presentationContextProvider = self;
            self.asSession.prefersEphemeralWebBrowserSession = prefersEphemeralWebBrowserSession;
        }
        [self.asSession start];
    } else {
        reject(RCTErrorUnspecified, @"SDK supports only iOS 12.0 or newer", nil);
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
    resolve([self base64URLEncode:sig]);
  } else {
    reject(RCTErrorUnspecified, @"signData requires iOS 10. Please check the device OS version before calling this function.", nil);
  }
}

RCT_EXPORT_METHOD(generateUUID:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *uuid = [[NSUUID UUID] UUIDString];
  resolve(uuid);
}

RCT_EXPORT_METHOD(checkBiometricSupported:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 11.3, *)) {
        NSDictionary *iosDict = options[@"ios"];
        NSString *policyString = iosDict[@"policy"];
        LAPolicy policy = [self laPolicyFromString:policyString];
        LAContext *context = [self laContextFromPolicy:policy];
        NSError *error = NULL;
        [context canEvaluatePolicy:policy error:&error];
        if (error) {
            reject([@(error.code) stringValue], error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    } else {
        reject(RCTErrorUnspecified, @"Biometric authentication requires at least iOS 11.3", nil);
    }
}

RCT_EXPORT_METHOD(removeBiometricPrivateKey:(NSString *)kid resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.biometric.%@", kid];
    NSDictionary *query = @{
        (id)kSecClass: (id)kSecClassKey,
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
        (id)kSecAttrApplicationTag: tag,
    };
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);
    if (status == errSecSuccess || status == errSecItemNotFound) {
        resolve(nil);
    } else {
        NSError *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        reject([@(error.code) stringValue], error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(createBiometricPrivateKey:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *kid = options[@"kid"];
    NSDictionary *payload = options[@"payload"];
    NSDictionary *iosDict = options[@"ios"];
    NSString *constraint = iosDict[@"constraint"];
    NSString *localizedReason = iosDict[@"localizedReason"];
    NSString *policyString = iosDict[@"policy"];
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.biometric.%@", kid];
    LAPolicy policy = [self laPolicyFromString:policyString];
    LAContext *context = [self laContextFromPolicy:policy];

    [context evaluatePolicy:policy localizedReason:localizedReason reply:^(BOOL success, NSError * _Nullable laError) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (laError) {
                reject([@(laError.code) stringValue], laError.localizedDescription, laError);
                return;
            }

            NSError *error = NULL;
            SecKeyRef privateKey = [self generateBiometricPrivateKey:&error];
            if (error) {
                reject([@(error.code) stringValue], error.localizedDescription, error);
                return;
            }

            [self addBiometricPrivateKey:privateKey tag:tag constraint:constraint laContext:context error:&error];
            if (error) {
                CFRelease(privateKey);
                reject([@(error.code) stringValue], error.localizedDescription, error);
                return;
            }

            NSString *jwt = [self signBiometricJWT:privateKey kid:kid payload:payload error:&error];
            CFRelease(privateKey);
            if (error) {
                reject([@(error.code) stringValue], error.localizedDescription, error);
                return;
            }

            resolve(jwt);
        });
    }];
}

RCT_EXPORT_METHOD(signWithBiometricPrivateKey:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject)
{

    NSString *kid = options[@"kid"];
    NSDictionary *payload = options[@"payload"];
    NSDictionary *iosDict = options[@"ios"];
    NSString *localizedReason = iosDict[@"localizedReason"];
    NSString *policyString = iosDict[@"policy"];
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.biometric.%@", kid];
    LAPolicy policy = [self laPolicyFromString:policyString];
    LAContext *context = [self laContextFromPolicy:policy];

    [context evaluatePolicy:policy localizedReason:localizedReason reply:^(BOOL success, NSError * _Nullable laError) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (laError) {
                reject([@(laError.code) stringValue], laError.localizedDescription, laError);
                return;
            }

            NSError *error = NULL;

            SecKeyRef privateKey = [self getBiometricPrivateKey:tag laContext:context error:&error];
            if (error) {
                reject([@(error.code) stringValue], error.localizedDescription, error);
                return;
            }

            NSString *jwt = [self signBiometricJWT:privateKey kid:kid payload:payload error:&error];
            CFRelease(privateKey);
            if (error) {
                reject([@(error.code) stringValue], error.localizedDescription, error);
                return;
            }

            resolve(jwt);
        });
    }];
}
    
RCT_EXPORT_METHOD(checkDPoPSupported:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 11.3, *)) {
        resolve(@"true");
        return;
    }
    resolve(@"false");
}
    
RCT_EXPORT_METHOD(createDPoPPrivateKey:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *kid = options[@"kid"];
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.dpop.%@", kid];
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error = NULL;
        SecKeyRef privateKey = [self generateDPoPPrivateKey:&error];
        if (error) {
            reject([@(error.code) stringValue], error.localizedDescription, error);
            return;
        }

        [self addDPoPPrivateKey:privateKey tag:tag error:&error];
        if (error) {
            CFRelease(privateKey);
            reject([@(error.code) stringValue], error.localizedDescription, error);
            return;
        }

        resolve(nil);
    });
}
    
RCT_EXPORT_METHOD(signWithDPoPPrivateKey:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *kid = options[@"kid"];
    NSDictionary *payload = options[@"payload"];
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.dpop.%@", kid];
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error = NULL;
        SecKeyRef privateKey = [self getDPoPPrivateKey:tag error:&error];
        if (error) {
            reject([@(error.code) stringValue], error.localizedDescription, error);
            return;
        }

        NSString *jwt = [self signDPoPJWT:privateKey kid:kid payload:payload error:&error];
        CFRelease(privateKey);
        if (error) {
            reject([@(error.code) stringValue], error.localizedDescription, error);
            return;
        }

        resolve(jwt);
    });
}
    
RCT_EXPORT_METHOD(checkDPoPPrivateKey:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *kid = options[@"kid"];
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.dpop.%@", kid];
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error = NULL;
        SecKeyRef privateKey = [self getDPoPPrivateKey:tag error:&error];
        if (error) {
            resolve(@"false");
            return;
        }

        resolve(@"true");
    });
}
    
RCT_EXPORT_METHOD(computeDPoPJKT:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *kid = options[@"kid"];
    NSString *tag = [NSString stringWithFormat:@"com.authgear.keys.dpop.%@", kid];
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error = NULL;
        SecKeyRef privateKey = [self getDPoPPrivateKey:tag error:&error];
        if (error) {
            reject([@(error.code) stringValue], error.localizedDescription, error);
            return;
        }
        
        NSMutableDictionary *jwk = [[NSMutableDictionary alloc] init];
        jwk[@"kid"] = kid;
        [self getJWKFromPrivateKey:privateKey jwk:jwk error:&error];
        NSDictionary *jwkParams = [self makeDPoPJWKRequiredParams:jwk];
        NSData *jwkParamsJSON = [self serializeToJSON:jwkParams];
        NSMutableData *hashBytes = [NSMutableData dataWithLength:CC_SHA256_DIGEST_LENGTH];
        CC_SHA256(jwkParamsJSON.bytes, jwkParamsJSON.length, hashBytes.mutableBytes);
        NSString *jkt = [self base64URLEncode:hashBytes];
        resolve(jkt);
    });
}

-(NSString *)signBiometricJWT:(SecKeyRef)privateKey kid:(NSString *)kid payload:(NSDictionary *)payload error:(out NSError **)error
{
    NSMutableDictionary *jwk = [[NSMutableDictionary alloc] init];
    jwk[@"kid"] = kid;
    [self getJWKFromPrivateKey:privateKey jwk:jwk error:error];
    if (*error) {
        return nil;
    }
    NSDictionary *header = [self makeBiometricJWTHeader:jwk];
    NSString *jwt = [self signJWT:privateKey header:header payload:payload error:error];
    if (*error) {
        return nil;
    }
    return jwt;
}
    
-(NSString *)signDPoPJWT:(SecKeyRef)privateKey kid:(NSString *)kid payload:(NSDictionary *)payload error:(out NSError **)error
{
    NSMutableDictionary *jwk = [[NSMutableDictionary alloc] init];
    jwk[@"kid"] = kid;
    [self getJWKFromPrivateKey:privateKey jwk:jwk error:error];
    if (*error) {
        return nil;
    }
    NSDictionary *header = [self makeDPoPJWTHeader:jwk];
    NSString *jwt = [self signJWT:privateKey header:header payload:payload error:error];
    if (*error) {
        return nil;
    }
    return jwt;
}

- (SecKeyRef)getBiometricPrivateKey:(NSString *)tag laContext:(LAContext *)laContext error:(out NSError **)error
{
    NSDictionary *query = @{
        (id)kSecClass: (id)kSecClassKey,
        (id)kSecMatchLimit: (id)kSecMatchLimitOne,
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
        (id)kSecAttrApplicationTag: tag,
        (id)kSecReturnRef: @YES,
        (id)kSecUseAuthenticationContext: laContext,
    };
    CFTypeRef item = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &item);
    if (status != errSecSuccess) {
        *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        return NULL;
    }
    return (SecKeyRef)item;
}
    
- (SecKeyRef)getDPoPPrivateKey:(NSString *)tag error:(out NSError **)error
{
    NSDictionary *query = @{
        (id)kSecClass: (id)kSecClassKey,
        (id)kSecMatchLimit: (id)kSecMatchLimitOne,
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
        (id)kSecAttrApplicationTag: tag,
        (id)kSecReturnRef: @YES,
    };
    CFTypeRef item = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &item);
    if (status != errSecSuccess) {
        *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        return NULL;
    }
    return (SecKeyRef)item;
}

- (SecKeyRef)generateBiometricPrivateKey:(out NSError **)error
{
    CFErrorRef cfError = NULL;
    NSDictionary *query = @{
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
        (id)kSecAttrKeySizeInBits: @2048,
    };
    SecKeyRef privateKey = SecKeyCreateRandomKey((__bridge CFDictionaryRef)query, &cfError);
    if (cfError) {
        *error = CFBridgingRelease(cfError);
        return NULL;
    }
    return privateKey;
}
    
- (SecKeyRef)generateDPoPPrivateKey:(out NSError **)error
{
    CFErrorRef cfError = NULL;
    NSDictionary *query = @{
        (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
        (id)kSecAttrKeySizeInBits: @2048,
    };
    SecKeyRef privateKey = SecKeyCreateRandomKey((__bridge CFDictionaryRef)query, &cfError);
    if (cfError) {
        *error = CFBridgingRelease(cfError);
        return NULL;
    }
    return privateKey;
}
    
    
- (void)addDPoPPrivateKey:(SecKeyRef)privateKey tag:(NSString *)tag error:(out NSError **)error
{
    CFErrorRef cfError = NULL;

    NSDictionary *query = @{
        (id)kSecValueRef: (__bridge id)privateKey,
        (id)kSecClass: (id)kSecClassKey,
        (id)kSecAttrApplicationTag: tag,
    };

    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)query, NULL);

    if (status != errSecSuccess) {
        *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        return;
    }
}

- (void)addBiometricPrivateKey:(SecKeyRef)privateKey tag:(NSString *)tag constraint:(NSString *)constraint laContext:(LAContext *)context error:(out NSError **)error
{
    CFErrorRef cfError = NULL;

    SecAccessControlCreateFlags flags;
    if ([constraint isEqualToString:@"biometryAny"]) {
        flags = kSecAccessControlBiometryAny;
    }
    if ([constraint isEqualToString:@"biometryCurrentSet"]) {
        flags = kSecAccessControlBiometryCurrentSet;
    }
    if ([constraint isEqualToString:@"userPresence"]) {
        flags = kSecAccessControlUserPresence;
    }

    SecAccessControlRef accessControl = SecAccessControlCreateWithFlags(
        NULL,
        kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
        flags,
        &cfError
    );
    if (cfError) {
        *error = CFBridgingRelease(cfError);
        return;
    }

    NSDictionary *query = @{
        (id)kSecValueRef: (__bridge id)privateKey,
        (id)kSecClass: (id)kSecClassKey,
        (id)kSecAttrApplicationTag: tag,
        (id)kSecAttrAccessControl: (__bridge id)accessControl,
        (id)kSecUseAuthenticationContext: context,
    };

    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)query, NULL);
    CFRelease(accessControl);

    if (status != errSecSuccess) {
        *error = [[NSError alloc] initWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        return;
    }
}

- (void)cleanup
{
    if (@available(iOS 12.0, *)) {
        self.asSession = nil;
    }
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

- (UIWindow *)presentationAnchorForAGWKWebViewController:(AGWKWebViewController *)controller
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

    NSError *nsError = NULL;
    [self getJWKFromPrivateKey:privKey jwk:jwk error:&nsError];
    if (nsError) {
        return nsError;
    }

    return nil;
}

- (NSString *)base64URLEncode:(NSData *)data
{
    NSString *output = [data base64EncodedStringWithOptions:0];
    // Remove padding.
    output = [output stringByReplacingOccurrencesOfString:@"=" withString:@""];
    output = [output stringByReplacingOccurrencesOfString:@"/" withString:@"_"];
    output = [output stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
    return output;
}

- (void)getJWKFromPrivateKey:(SecKeyRef)privateKey jwk:(NSMutableDictionary *)jwk error:(out NSError **)error
{
    CFErrorRef cfError = NULL;

    SecKeyRef publicKey = SecKeyCopyPublicKey(privateKey);
    CFDataRef dataRef = SecKeyCopyExternalRepresentation(publicKey, &cfError);
    CFRelease(publicKey);

    if (cfError) {
        *error = CFBridgingRelease(cfError);
        return;
    }

    NSData *data = CFBridgingRelease(dataRef);
    NSUInteger size = data.length;
    NSData *modulus = [data subdataWithRange:NSMakeRange(size > 269 ? 9 : 8, 256)];
    NSData *exponent = [data subdataWithRange:NSMakeRange(size - 3, 3)];

    jwk[@"alg"] = @"RS256";
    jwk[@"kty"] = @"RSA";
    jwk[@"n"] = [self base64URLEncode:modulus];
    jwk[@"e"] = [self base64URLEncode:exponent];
}

-(NSDictionary *)makeBiometricJWTHeader:(NSDictionary *)jwk
{
    return @{
        @"typ": @"vnd.authgear.biometric-request",
        @"kid": jwk[@"kid"],
        @"alg": jwk[@"alg"],
        @"jwk": jwk,
    };
}
    
-(NSDictionary *)makeDPoPJWTHeader:(NSDictionary *)jwk
{
    return @{
        @"typ": @"dpop+jwt",
        @"kid": jwk[@"kid"],
        @"alg": jwk[@"alg"],
        @"jwk": jwk,
    };
}
    
-(NSDictionary *)makeDPoPJWKRequiredParams:(NSDictionary *)jwk
{
    return @{
        @"e": jwk[@"e"],
        @"kty": jwk[@"kty"],
        @"n": jwk[@"n"],
    };
}


-(NSData *)serializeToJSON:(id)anything
{
    return [NSJSONSerialization dataWithJSONObject:anything options:NSJSONWritingSortedKeys error:nil];
}

-(NSString *)signJWT:(SecKeyRef)privateKey header:(NSDictionary *)header payload:(NSDictionary *)payload error:(out NSError **)error
{
    NSData *headerJSON = [self serializeToJSON:header];
    NSData *payloadJSON = [self serializeToJSON:payload];
    NSString *headerString = [self base64URLEncode:headerJSON];
    NSString *payloadString = [self base64URLEncode:payloadJSON];
    NSString *strToSign = [NSString stringWithFormat:@"%@.%@", headerString, payloadString];
    NSData *dataToSign = [strToSign dataUsingEncoding:NSUTF8StringEncoding];
    NSData *signature = [self signData:privateKey data:dataToSign error:error];
    if (*error) {
        return nil;
    }
    NSString *signatureString = [self base64URLEncode:signature];
    return [NSString stringWithFormat:@"%@.%@", strToSign, signatureString];
}

-(NSData *)signData:(SecKeyRef)privateKey data:(NSData *)data error:(out NSError **)error
{
    NSMutableData *hash = [NSMutableData dataWithLength:CC_SHA256_DIGEST_LENGTH];
    CC_SHA256(data.bytes, (unsigned int)data.length, hash.mutableBytes);
    CFErrorRef cfError = NULL;
    CFDataRef dataRef = SecKeyCreateSignature(
        privateKey,
        kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA256,
        (__bridge CFDataRef)hash,
        &cfError
    );
    if (cfError) {
        *error = CFBridgingRelease(cfError);
        return nil;
    }
    return CFBridgingRelease(dataRef);
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

-(NSString *)idiomToString:(UIUserInterfaceIdiom)idiom
{
    switch (idiom) {
    case UIUserInterfaceIdiomUnspecified:
        return @"unspecified";
    case UIUserInterfaceIdiomPhone:
            return @"phone";
    case UIUserInterfaceIdiomPad:
        return @"pad";
    case UIUserInterfaceIdiomTV:
        return @"tv";
    case UIUserInterfaceIdiomCarPlay:
        return @"carPlay";
    case UIUserInterfaceIdiomMac:
        return @"mac";
    default:
        return @"unknown";
    }
}

-(LAPolicy)laPolicyFromString:(NSString *)str
{
    if ([str isEqualToString:@"deviceOwnerAuthenticationWithBiometrics"]) {
        return LAPolicyDeviceOwnerAuthenticationWithBiometrics;
    }
    if ([str isEqualToString:@"deviceOwnerAuthentication"]) {
        return LAPolicyDeviceOwnerAuthentication;
    }
    return LAPolicyDeviceOwnerAuthentication;
}

-(LAContext *)laContextFromPolicy:(LAPolicy)policy
{
    LAContext *context = [[LAContext alloc] init];
    if (policy == LAPolicyDeviceOwnerAuthenticationWithBiometrics) {
        context.localizedFallbackTitle = @"";
    }
    return context;
}

-(UIModalPresentationStyle)modalPresentationStyleFromString:(NSString *)str
{
    if (str != nil) {
        if ([str isEqualToString:@"fullScreen"]) {
            return UIModalPresentationFullScreen;
        }
        if ([str isEqualToString:@"pageSheet"]) {
            return UIModalPresentationPageSheet;
        }
    }
    if (@available(iOS 13.0, *)) {
        return UIModalPresentationAutomatic;
    } else {
        return UIModalPresentationFullScreen;
    }
}

-(UIColor *)uiColorFromNSString:(NSString *)inHex
{
    if (inHex == nil) {
        return nil;
    }
    NSScanner *scanner = [NSScanner scannerWithString:inHex];
    unsigned long long argb = 0;
    [scanner scanHexLongLong:&argb];
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [UIColor colorWithRed:r green:g blue:b alpha:a];
}

-(BOOL)boolFromNSString:(NSString *)str
{
    if (str != nil) {
        if ([str isEqualToString:@"true"]) {
            return true;
        }
        return false;
    }
    return false;
}

@end
