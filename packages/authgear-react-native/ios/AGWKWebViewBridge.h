#import <AuthenticationServices/AuthenticationServices.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

// The AuthUI bridge of AGWKWebViewController.
// See docs/specs/webview-bridge.md in authgear-server.
//
// The page posts a JSON object, encoded as a string, to
// window.webkit.messageHandlers.authgearBridge, and gets one reply, also a JSON
// object encoded as a string, as the value of the promise that postMessage returns.

extern NSString *const AGWKWebViewBridgeName;

/// The publicKey member of credentials.get, decoded.
@interface AGWKWebViewBridgePublicKeyRequest : NSObject

@property (nonatomic, copy) NSString *rpId;
@property (nonatomic, copy) NSData *challenge;
@property (nonatomic, copy, nullable) NSString *userVerification;
@property (nonatomic, copy) NSArray<NSData *> *allowCredentialIDs;

@end

/// The pure parts of the bridge, kept apart from WebKit so that they can be unit tested.
@interface AGWKWebViewBridgeMessages : NSObject

/// The capabilities listed in the reply to bridge.capabilities.
+ (NSArray<NSString *> *)capabilities;

/// What the bridge does with a message body.
/// Returns the reply to send at once, or nil when the platform must be asked for a passkey.
/// In that case, *requestID and *publicKeyRequest are set.
+ (nullable NSDictionary *)replyForBody:(id)body
                              requestID:(NSString *_Nullable *_Nonnull)requestID
                       publicKeyRequest:(AGWKWebViewBridgePublicKeyRequest *_Nullable *_Nonnull)publicKeyRequest;

/// The AuthenticationResponseJSON of a passkey assertion, with binary values as base64url without padding.
+ (NSDictionary *)publicKeyCredentialWithCredentialID:(NSData *)credentialID
                                       clientDataJSON:(NSData *)clientDataJSON
                                    authenticatorData:(NSData *)authenticatorData
                                            signature:(NSData *)signature
                                           userHandle:(nullable NSData *)userHandle;

+ (NSString *)encodeReply:(NSDictionary *)reply;

/// Whether a page of this origin may use the bridge.
/// Only the scheme, host and port of each allowed URL are used.
/// A port of 0 means the default port of the scheme, as in WKSecurityOrigin.
+ (BOOL)isAllowedOriginWithScheme:(NSString *)scheme
                             host:(NSString *)host
                             port:(NSInteger)port
                   allowedOrigins:(NSArray<NSURL *> *)allowedOrigins;

+ (nullable NSData *)dataFromBase64URLString:(NSString *)text;
+ (NSString *)base64URLStringFromData:(NSData *)data;

@end

/// The reply handler of WKScriptMessageHandlerWithReply.
typedef void (^AGWKWebViewBridgeReplyHandler)(id _Nullable reply, NSString *_Nullable errorMessage);

/// A credentials.get waiting for the platform. It replies at most once.
API_AVAILABLE(ios(16.0))
@interface AGWKWebViewBridgePendingRequest : NSObject

@property (nonatomic, copy, readonly) NSString *requestID;
@property (nonatomic, strong, readonly, nullable) ASAuthorizationController *controller;

- (instancetype)initWithRequestID:(NSString *)requestID
                     replyHandler:(AGWKWebViewBridgeReplyHandler)replyHandler
                       controller:(nullable ASAuthorizationController *)controller;

/// Replies with reply and this request's id, unless it has replied already.
- (void)finishWithReply:(NSDictionary *)reply;

/// Replies error, unless it has replied already, and cancels the platform request.
- (void)cancel;

@end

API_AVAILABLE(ios(16.0))
@interface AGWKWebViewBridge : NSObject <WKScriptMessageHandlerWithReply, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>

@property (nonatomic, copy, nullable) ASPresentationAnchor _Nullable (^presentationAnchorProvider)(void);

- (instancetype)initWithAllowedOrigins:(NSArray<NSURL *> *)allowedOrigins;

/// Cancels the pending request, if any. Its reply is error.
/// Called when the top-level page starts loading another page, and when the web view is gone,
/// because iOS allows one passkey request per app at a time.
- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
