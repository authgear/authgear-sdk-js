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

/// The status of a reply.
typedef NS_ENUM(NSInteger, AGWKWebViewBridgeStatus) {
    AGWKWebViewBridgeStatusOK,
    AGWKWebViewBridgeStatusUnsupported,
    AGWKWebViewBridgeStatusError,
    AGWKWebViewBridgeStatusNoCredential,
    AGWKWebViewBridgeStatusCancelled,
};

/// The string of status in the JSON of a reply.
FOUNDATION_EXPORT NSString *AGWKWebViewBridgeStatusString(AGWKWebViewBridgeStatus status);

/// The credential in the ok reply to credentials.get. Each kind of credential is a class that conforms to it.
@protocol AGWKWebViewBridgeCredential <NSObject>

/// The credential as a JSON object.
- (NSDictionary<NSString *, id> *)toJSONObject;

@end

/// The response member of AGWKWebViewBridgePublicKeyCredential.
@interface AGWKWebViewBridgePublicKeyCredentialResponse : NSObject

@property (nonatomic, copy) NSString *clientDataJSON;
@property (nonatomic, copy) NSString *authenticatorData;
@property (nonatomic, copy) NSString *signature;
/// Optional in AuthenticationResponseJSON.
@property (nonatomic, copy, nullable) NSString *userHandle;

@end

/// The AuthenticationResponseJSON of a passkey assertion, with binary values as base64url without padding.
@interface AGWKWebViewBridgePublicKeyCredential : NSObject <AGWKWebViewBridgeCredential>

/// The id member.
@property (nonatomic, copy) NSString *credentialID;
@property (nonatomic, copy) NSString *rawID;
/// "public-key".
@property (nonatomic, copy) NSString *type;
/// "platform".
@property (nonatomic, copy) NSString *authenticatorAttachment;
@property (nonatomic, strong) AGWKWebViewBridgePublicKeyCredentialResponse *response;
/// Always empty, because no extension is supported.
@property (nonatomic, copy) NSDictionary<NSString *, NSString *> *clientExtensionResults;

- (instancetype)initWithCredentialID:(NSString *)credentialID
                               rawID:(NSString *)rawID
                            response:(AGWKWebViewBridgePublicKeyCredentialResponse *)response;

@end

/// A reply, encoded as a JSON object. Fields that are nil are left out.
@interface AGWKWebViewBridgeReply : NSObject

/// The id of the message. nil only in the reply to a message without a string id.
@property (nonatomic, copy, nullable) NSString *requestID;
@property (nonatomic, assign) AGWKWebViewBridgeStatus status;
@property (nonatomic, copy, nullable) NSString *message;
/// The ok reply to bridge.capabilities.
@property (nonatomic, copy, nullable) NSArray<NSString *> *capabilities;
/// The ok reply to credentials.get.
@property (nonatomic, strong, nullable) id<AGWKWebViewBridgeCredential> credential;

/// A reply to the message with this id.
+ (instancetype)replyWithRequestID:(NSString *)requestID status:(AGWKWebViewBridgeStatus)status;
+ (instancetype)replyWithRequestID:(NSString *)requestID
                            status:(AGWKWebViewBridgeStatus)status
                           message:(nullable NSString *)message;
/// A reply without an id: the reply to a message without a string id, or a reply
/// that AGWKWebViewBridgePendingRequest sends, which sets the id of its request.
+ (instancetype)replyWithStatus:(AGWKWebViewBridgeStatus)status;
+ (instancetype)replyWithStatus:(AGWKWebViewBridgeStatus)status message:(nullable NSString *)message;

/// The reply as a JSON object.
- (NSDictionary<NSString *, id> *)toJSONObject;

@end

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
+ (nullable AGWKWebViewBridgeReply *)replyForBody:(id)body
                                         requestID:(NSString *_Nullable *_Nonnull)requestID
                                  publicKeyRequest:(AGWKWebViewBridgePublicKeyRequest *_Nullable *_Nonnull)publicKeyRequest;

/// The credential of a passkey assertion.
+ (AGWKWebViewBridgePublicKeyCredential *)publicKeyCredentialWithCredentialID:(NSData *)credentialID
                                                               clientDataJSON:(NSData *)clientDataJSON
                                                            authenticatorData:(NSData *)authenticatorData
                                                                    signature:(NSData *)signature
                                                                   userHandle:(nullable NSData *)userHandle;

+ (NSString *)encodeReply:(AGWKWebViewBridgeReply *)reply;

/// Whether a page of this origin may use the bridge.
/// Only the scheme, host and port of each allowed URL are used.
/// A port of 0 means the default port of the scheme, as in WKSecurityOrigin.
+ (BOOL)isAllowedOriginWithScheme:(NSString *)scheme
                             host:(NSString *)host
                             port:(NSInteger)port
                   allowedOrigins:(NSArray<NSURL *> *)allowedOrigins;

/// Whether rpId is host or a parent domain of host, compared without case,
/// as a browser checks the rpId of a WebAuthn request against the page's origin.
/// An empty rpId is not allowed.
+ (BOOL)isRpIDAllowed:(NSString *)rpID host:(NSString *)host;

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
- (void)finishWithReply:(AGWKWebViewBridgeReply *)reply;

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
