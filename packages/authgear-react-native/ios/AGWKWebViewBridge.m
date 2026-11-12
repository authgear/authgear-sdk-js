#import "AGWKWebViewBridge.h"

NSString *const AGWKWebViewBridgeName = @"authgearBridge";

@implementation AGWKWebViewBridgePublicKeyRequest
@end

@implementation AGWKWebViewBridgeMessages

+ (NSArray<NSString *> *)capabilities
{
    return @[
        @"credentials.get",
        @"credentials.get:publicKey",
        @"credentials.get:immediate",
    ];
}

+ (NSDictionary *)replyForBody:(id)body
                     requestID:(NSString **)requestID
              publicKeyRequest:(AGWKWebViewBridgePublicKeyRequest **)publicKeyRequest
{
    *requestID = nil;
    *publicKeyRequest = nil;

    NSDictionary *json = nil;
    if ([body isKindOfClass:[NSString class]]) {
        NSData *data = [(NSString *)body dataUsingEncoding:NSUTF8StringEncoding];
        id object = data == nil ? nil : [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        if ([object isKindOfClass:[NSDictionary class]]) {
            json = object;
        }
    }
    NSString *id_ = json[@"id"];
    if (![id_ isKindOfClass:[NSString class]]) {
        return @{@"status": @"error", @"message": @"invalid message"};
    }

    NSString *type = json[@"type"];
    if ([type isKindOfClass:[NSString class]]) {
        if ([type isEqualToString:@"bridge.capabilities"]) {
            return @{@"id": id_, @"status": @"ok", @"capabilities": [self capabilities]};
        }
        if ([type isEqualToString:@"credentials.get"]) {
            AGWKWebViewBridgePublicKeyRequest *request = nil;
            NSDictionary *reply = [self credentialsGetReplyForID:id_ json:json publicKeyRequest:&request];
            if (reply == nil) {
                *requestID = id_;
                *publicKeyRequest = request;
            }
            return reply;
        }
    }
    return @{@"id": id_, @"status": @"unsupported"};
}

+ (NSDictionary *)credentialsGetReplyForID:(NSString *)id_
                                      json:(NSDictionary *)json
                          publicKeyRequest:(AGWKWebViewBridgePublicKeyRequest **)publicKeyRequest
{
    // publicKey is the only member this version supports. Other members, such as password, are ignored.
    NSString *mediation = json[@"mediation"];
    NSDictionary *publicKey = json[@"publicKey"];
    if (![mediation isKindOfClass:[NSString class]] || ![mediation isEqualToString:@"immediate"] ||
        ![publicKey isKindOfClass:[NSDictionary class]]) {
        return @{@"id": id_, @"status": @"unsupported"};
    }

    NSString *rpId = publicKey[@"rpId"];
    NSString *challengeText = publicKey[@"challenge"];
    NSData *challenge = [challengeText isKindOfClass:[NSString class]] ? [self dataFromBase64URLString:challengeText] : nil;
    if (![rpId isKindOfClass:[NSString class]] || challenge == nil) {
        return @{@"id": id_, @"status": @"error", @"message": @"publicKey needs rpId and challenge"};
    }

    NSString *userVerification = nil;
    id userVerificationValue = publicKey[@"userVerification"];
    if (userVerificationValue != nil) {
        if (![userVerificationValue isKindOfClass:[NSString class]]) {
            return @{@"id": id_, @"status": @"error", @"message": @"invalid publicKey.userVerification"};
        }
        // As in WebAuthn, an unknown value is ignored, so iOS uses its default.
        if ([@[@"required", @"preferred", @"discouraged"] containsObject:userVerificationValue]) {
            userVerification = userVerificationValue;
        }
    }

    NSMutableArray<NSData *> *allowCredentialIDs = [NSMutableArray array];
    id allowCredentialsValue = publicKey[@"allowCredentials"];
    if (allowCredentialsValue != nil) {
        if (![allowCredentialsValue isKindOfClass:[NSArray class]]) {
            return @{@"id": id_, @"status": @"error", @"message": @"invalid publicKey.allowCredentials"};
        }
        for (id descriptor in (NSArray *)allowCredentialsValue) {
            NSString *idText = [descriptor isKindOfClass:[NSDictionary class]] ? descriptor[@"id"] : nil;
            NSData *credentialID = [idText isKindOfClass:[NSString class]] ? [self dataFromBase64URLString:idText] : nil;
            if (credentialID == nil) {
                return @{@"id": id_, @"status": @"error", @"message": @"invalid publicKey.allowCredentials"};
            }
            [allowCredentialIDs addObject:credentialID];
        }
    }

    AGWKWebViewBridgePublicKeyRequest *request = [[AGWKWebViewBridgePublicKeyRequest alloc] init];
    request.rpId = rpId;
    request.challenge = challenge;
    request.userVerification = userVerification;
    request.allowCredentialIDs = allowCredentialIDs;
    *publicKeyRequest = request;
    return nil;
}

+ (NSDictionary *)publicKeyCredentialWithCredentialID:(NSData *)credentialID
                                       clientDataJSON:(NSData *)clientDataJSON
                                    authenticatorData:(NSData *)authenticatorData
                                            signature:(NSData *)signature
                                           userHandle:(NSData *)userHandle
{
    NSString *id_ = [self base64URLStringFromData:credentialID];
    NSMutableDictionary *response = [@{
        @"clientDataJSON": [self base64URLStringFromData:clientDataJSON],
        @"authenticatorData": [self base64URLStringFromData:authenticatorData],
        @"signature": [self base64URLStringFromData:signature],
    } mutableCopy];
    if (userHandle != nil) {
        response[@"userHandle"] = [self base64URLStringFromData:userHandle];
    }
    return @{
        @"id": id_,
        @"rawId": id_,
        @"type": @"public-key",
        @"authenticatorAttachment": @"platform",
        @"response": response,
        @"clientExtensionResults": @{},
    };
}

+ (NSString *)encodeReply:(NSDictionary *)reply
{
    NSString *fallback = @"{\"message\":\"cannot encode reply\",\"status\":\"error\"}";
    if (![NSJSONSerialization isValidJSONObject:reply]) {
        return fallback;
    }
    NSData *data = [NSJSONSerialization dataWithJSONObject:reply options:NSJSONWritingSortedKeys error:nil];
    NSString *text = data == nil ? nil : [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    return text ?: fallback;
}

+ (BOOL)isAllowedOriginWithScheme:(NSString *)scheme
                             host:(NSString *)host
                             port:(NSInteger)port
                   allowedOrigins:(NSArray<NSURL *> *)allowedOrigins
{
    NSString *lowercaseScheme = scheme.lowercaseString;
    NSString *lowercaseHost = host.lowercaseString;
    NSInteger effectivePort = [self effectivePortWithScheme:lowercaseScheme port:port];
    for (NSURL *allowed in allowedOrigins) {
        NSString *allowedScheme = allowed.scheme.lowercaseString;
        NSString *allowedHost = allowed.host.lowercaseString;
        if (allowedScheme == nil || allowedHost == nil) {
            continue;
        }
        NSInteger allowedPort = [self effectivePortWithScheme:allowedScheme port:allowed.port.integerValue];
        if ([allowedScheme isEqualToString:lowercaseScheme] &&
            [allowedHost isEqualToString:lowercaseHost] &&
            allowedPort == effectivePort) {
            return YES;
        }
    }
    return NO;
}

// 0 means the default port of the scheme. -1 means no port, for a scheme without a default port.
+ (NSInteger)effectivePortWithScheme:(NSString *)scheme port:(NSInteger)port
{
    if (port != 0) {
        return port;
    }
    if ([scheme isEqualToString:@"https"]) {
        return 443;
    }
    if ([scheme isEqualToString:@"http"]) {
        return 80;
    }
    return -1;
}

+ (NSData *)dataFromBase64URLString:(NSString *)text
{
    NSMutableString *base64 = [[[text stringByReplacingOccurrencesOfString:@"-" withString:@"+"]
        stringByReplacingOccurrencesOfString:@"_" withString:@"/"] mutableCopy];
    while (base64.length % 4 != 0) {
        [base64 appendString:@"="];
    }
    return [[NSData alloc] initWithBase64EncodedString:base64 options:0];
}

+ (NSString *)base64URLStringFromData:(NSData *)data
{
    NSString *output = [data base64EncodedStringWithOptions:0];
    output = [output stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
    output = [output stringByReplacingOccurrencesOfString:@"/" withString:@"_"];
    output = [output stringByReplacingOccurrencesOfString:@"=" withString:@""];
    return output;
}

@end

@implementation AGWKWebViewBridgePendingRequest {
    AGWKWebViewBridgeReplyHandler _replyHandler;
}

- (instancetype)initWithRequestID:(NSString *)requestID
                     replyHandler:(AGWKWebViewBridgeReplyHandler)replyHandler
                       controller:(ASAuthorizationController *)controller
{
    self = [super init];
    if (self) {
        _requestID = [requestID copy];
        _replyHandler = [replyHandler copy];
        _controller = controller;
    }
    return self;
}

- (void)finishWithReply:(NSDictionary *)reply
{
    AGWKWebViewBridgeReplyHandler replyHandler = _replyHandler;
    if (replyHandler == nil) {
        return;
    }
    _replyHandler = nil;
    NSMutableDictionary *replyWithID = [reply mutableCopy];
    replyWithID[@"id"] = self.requestID;
    replyHandler([AGWKWebViewBridgeMessages encodeReply:replyWithID], nil);
}

- (void)cancel
{
    if (_replyHandler == nil) {
        return;
    }
    [self finishWithReply:@{@"status": @"error", @"message": @"cancelled"}];
    [self.controller cancel];
}

@end

@interface AGWKWebViewBridge ()

@property (nonatomic, copy) NSArray<NSURL *> *allowedOrigins;
@property (nonatomic, strong, nullable) AGWKWebViewBridgePendingRequest *pendingRequest;

@end

@implementation AGWKWebViewBridge

- (instancetype)initWithAllowedOrigins:(NSArray<NSURL *> *)allowedOrigins
{
    self = [super init];
    if (self) {
        _allowedOrigins = [allowedOrigins copy];
    }
    return self;
}

- (void)invalidate
{
    AGWKWebViewBridgePendingRequest *pendingRequest = self.pendingRequest;
    self.pendingRequest = nil;
    [pendingRequest cancel];
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message
                 replyHandler:(void (^)(id _Nullable, NSString *_Nullable))replyHandler
{
    WKSecurityOrigin *origin = message.frameInfo.securityOrigin;
    if (!message.frameInfo.isMainFrame ||
        ![AGWKWebViewBridgeMessages isAllowedOriginWithScheme:origin.protocol
                                                         host:origin.host
                                                         port:origin.port
                                               allowedOrigins:self.allowedOrigins]) {
        replyHandler(nil, @"authgearBridge is not available to this page");
        return;
    }

    NSString *requestID = nil;
    AGWKWebViewBridgePublicKeyRequest *request = nil;
    NSDictionary *reply = [AGWKWebViewBridgeMessages replyForBody:message.body
                                                        requestID:&requestID
                                                 publicKeyRequest:&request];
    if (reply != nil) {
        replyHandler([AGWKWebViewBridgeMessages encodeReply:reply], nil);
        return;
    }
    [self getPublicKeyCredentialWithRequestID:requestID request:request replyHandler:replyHandler];
}

- (void)getPublicKeyCredentialWithRequestID:(NSString *)requestID
                                    request:(AGWKWebViewBridgePublicKeyRequest *)request
                               replyHandler:(AGWKWebViewBridgeReplyHandler)replyHandler
{
    void (^reply)(NSDictionary *) = ^(NSDictionary *reply) {
        NSMutableDictionary *replyWithID = [reply mutableCopy];
        replyWithID[@"id"] = requestID;
        replyHandler([AGWKWebViewBridgeMessages encodeReply:replyWithID], nil);
    };

    if (self.pendingRequest != nil) {
        reply(@{@"status": @"error", @"message": @"a passkey request is in progress"});
        return;
    }

    ASAuthorizationPlatformPublicKeyCredentialProvider *provider =
        [[ASAuthorizationPlatformPublicKeyCredentialProvider alloc] initWithRelyingPartyIdentifier:request.rpId];
    ASAuthorizationPlatformPublicKeyCredentialAssertionRequest *assertionRequest =
        [provider createCredentialAssertionRequestWithChallenge:request.challenge];
    if (request.userVerification != nil) {
        assertionRequest.userVerificationPreference = request.userVerification;
    }
    if (request.allowCredentialIDs.count > 0) {
        NSMutableArray<ASAuthorizationPlatformPublicKeyCredentialDescriptor *> *allowedCredentials = [NSMutableArray array];
        for (NSData *credentialID in request.allowCredentialIDs) {
            [allowedCredentials addObject:[[ASAuthorizationPlatformPublicKeyCredentialDescriptor alloc] initWithCredentialID:credentialID]];
        }
        assertionRequest.allowedCredentials = allowedCredentials;
    }

    if (self.presentationAnchorProvider == nil || self.presentationAnchorProvider() == nil) {
        reply(@{@"status": @"error", @"message": @"no window"});
        return;
    }

    ASAuthorizationController *controller = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[assertionRequest]];
    controller.delegate = self;
    controller.presentationContextProvider = self;
    self.pendingRequest = [[AGWKWebViewBridgePendingRequest alloc] initWithRequestID:requestID
                                                                        replyHandler:replyHandler
                                                                          controller:controller];
    [controller performRequestsWithOptions:ASAuthorizationControllerRequestOptionPreferImmediatelyAvailableCredentials];
}

/// Replies to the pending request of controller. A callback of a cancelled request finds nothing.
- (void)finishController:(ASAuthorizationController *)controller reply:(NSDictionary *)reply
{
    AGWKWebViewBridgePendingRequest *pendingRequest = self.pendingRequest;
    if (pendingRequest == nil || pendingRequest.controller != controller) {
        return;
    }
    self.pendingRequest = nil;
    [pendingRequest finishWithReply:reply];
}

- (void)authorizationController:(ASAuthorizationController *)controller
    didCompleteWithAuthorization:(ASAuthorization *)authorization
{
    if (![authorization.credential isKindOfClass:[ASAuthorizationPlatformPublicKeyCredentialAssertion class]]) {
        [self finishController:controller reply:@{@"status": @"error", @"message": @"unexpected credential"}];
        return;
    }
    ASAuthorizationPlatformPublicKeyCredentialAssertion *assertion =
        (ASAuthorizationPlatformPublicKeyCredentialAssertion *)authorization.credential;
    NSDictionary *credential = [AGWKWebViewBridgeMessages publicKeyCredentialWithCredentialID:assertion.credentialID
                                                                               clientDataJSON:assertion.rawClientDataJSON
                                                                            authenticatorData:assertion.rawAuthenticatorData
                                                                                    signature:assertion.signature
                                                                                   userHandle:assertion.userID];
    [self finishController:controller reply:@{@"status": @"ok", @"credential": credential}];
}

- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithError:(NSError *)error
{
    // With ASAuthorizationControllerRequestOptionPreferImmediatelyAvailableCredentials,
    // "no passkey on this device" and "the user closed the sheet" both end with canceled.
    if ([error.domain isEqualToString:ASAuthorizationErrorDomain] && error.code == ASAuthorizationErrorCanceled) {
        [self finishController:controller reply:@{@"status": @"no_credential"}];
    } else {
        NSString *message = [NSString stringWithFormat:@"%@ %ld: %@", error.domain, (long)error.code, error.localizedDescription];
        [self finishController:controller reply:@{@"status": @"error", @"message": message}];
    }
}

- (ASPresentationAnchor)presentationAnchorForAuthorizationController:(ASAuthorizationController *)controller
{
    ASPresentationAnchor anchor = self.presentationAnchorProvider == nil ? nil : self.presentationAnchorProvider();
    return anchor ?: [[UIWindow alloc] init];
}

@end
