#import "AGWKWebViewBridge.h"

NSString *const AGWKWebViewBridgeName = @"authgearBridge";

NSString *AGWKWebViewBridgeStatusString(AGWKWebViewBridgeStatus status)
{
    switch (status) {
    case AGWKWebViewBridgeStatusOK:
        return @"ok";
    case AGWKWebViewBridgeStatusUnsupported:
        return @"unsupported";
    case AGWKWebViewBridgeStatusError:
        return @"error";
    case AGWKWebViewBridgeStatusNoCredential:
        return @"no_credential";
    case AGWKWebViewBridgeStatusCancelled:
        return @"cancelled";
    }
    // Not reached: the switch handles every status.
    return @"error";
}

@implementation AGWKWebViewBridgePublicKeyCredentialResponse

- (NSDictionary<NSString *, id> *)toJSONObject
{
    NSMutableDictionary<NSString *, id> *json = [@{
        @"clientDataJSON": self.clientDataJSON,
        @"authenticatorData": self.authenticatorData,
        @"signature": self.signature,
    } mutableCopy];
    if (self.userHandle != nil) {
        json[@"userHandle"] = self.userHandle;
    }
    return json;
}

@end

@implementation AGWKWebViewBridgePublicKeyCredential

- (instancetype)initWithCredentialID:(NSString *)credentialID
                               rawID:(NSString *)rawID
                            response:(AGWKWebViewBridgePublicKeyCredentialResponse *)response
{
    self = [super init];
    if (self) {
        _credentialID = [credentialID copy];
        _rawID = [rawID copy];
        _type = @"public-key";
        _authenticatorAttachment = @"platform";
        _response = response;
        _clientExtensionResults = @{};
    }
    return self;
}

- (NSDictionary<NSString *, id> *)toJSONObject
{
    return @{
        @"id": self.credentialID,
        @"rawId": self.rawID,
        @"type": self.type,
        @"authenticatorAttachment": self.authenticatorAttachment,
        @"response": [self.response toJSONObject],
        @"clientExtensionResults": self.clientExtensionResults,
    };
}

@end

@implementation AGWKWebViewBridgeReply

+ (instancetype)replyWithRequestID:(NSString *)requestID status:(AGWKWebViewBridgeStatus)status
{
    return [self replyWithRequestID:requestID status:status message:nil];
}

+ (instancetype)replyWithRequestID:(NSString *)requestID
                            status:(AGWKWebViewBridgeStatus)status
                           message:(NSString *)message
{
    AGWKWebViewBridgeReply *reply = [self replyWithStatus:status message:message];
    reply.requestID = requestID;
    return reply;
}

+ (instancetype)replyWithStatus:(AGWKWebViewBridgeStatus)status
{
    return [self replyWithStatus:status message:nil];
}

+ (instancetype)replyWithStatus:(AGWKWebViewBridgeStatus)status message:(NSString *)message
{
    AGWKWebViewBridgeReply *reply = [[self alloc] init];
    reply.status = status;
    reply.message = message;
    return reply;
}

- (NSDictionary<NSString *, id> *)toJSONObject
{
    NSMutableDictionary<NSString *, id> *json = [NSMutableDictionary dictionary];
    if (self.requestID != nil) {
        json[@"id"] = self.requestID;
    }
    json[@"status"] = AGWKWebViewBridgeStatusString(self.status);
    if (self.message != nil) {
        json[@"message"] = self.message;
    }
    if (self.capabilities != nil) {
        json[@"capabilities"] = self.capabilities;
    }
    if (self.credential != nil) {
        json[@"credential"] = [self.credential toJSONObject];
    }
    return json;
}

@end

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

+ (AGWKWebViewBridgeReply *)replyForBody:(id)body
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
        return [AGWKWebViewBridgeReply replyWithStatus:AGWKWebViewBridgeStatusError message:@"invalid message"];
    }

    NSString *type = json[@"type"];
    if ([type isKindOfClass:[NSString class]]) {
        if ([type isEqualToString:@"bridge.capabilities"]) {
            AGWKWebViewBridgeReply *reply = [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusOK];
            reply.capabilities = [self capabilities];
            return reply;
        }
        if ([type isEqualToString:@"credentials.get"]) {
            AGWKWebViewBridgePublicKeyRequest *request = nil;
            AGWKWebViewBridgeReply *reply = [self credentialsGetReplyForID:id_ json:json publicKeyRequest:&request];
            if (reply == nil) {
                *requestID = id_;
                *publicKeyRequest = request;
            }
            return reply;
        }
    }
    return [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusUnsupported];
}

+ (AGWKWebViewBridgeReply *)credentialsGetReplyForID:(NSString *)id_
                                                json:(NSDictionary *)json
                                    publicKeyRequest:(AGWKWebViewBridgePublicKeyRequest **)publicKeyRequest
{
    // publicKey is the only member this version supports. Other members, such as password, are ignored.
    NSString *mediation = json[@"mediation"];
    NSDictionary *publicKey = json[@"publicKey"];
    if (![mediation isKindOfClass:[NSString class]] || ![mediation isEqualToString:@"immediate"] ||
        ![publicKey isKindOfClass:[NSDictionary class]]) {
        return [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusUnsupported];
    }

    NSString *rpId = publicKey[@"rpId"];
    NSString *challengeText = publicKey[@"challenge"];
    NSData *challenge = [challengeText isKindOfClass:[NSString class]] ? [self dataFromBase64URLString:challengeText] : nil;
    if (![rpId isKindOfClass:[NSString class]] || challenge == nil) {
        return [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusError message:@"publicKey needs rpId and challenge"];
    }

    NSString *userVerification = nil;
    id userVerificationValue = publicKey[@"userVerification"];
    if (userVerificationValue != nil) {
        if (![userVerificationValue isKindOfClass:[NSString class]]) {
            return [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusError message:@"invalid publicKey.userVerification"];
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
            return [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusError message:@"invalid publicKey.allowCredentials"];
        }
        for (id descriptor in (NSArray *)allowCredentialsValue) {
            NSString *idText = [descriptor isKindOfClass:[NSDictionary class]] ? descriptor[@"id"] : nil;
            NSData *credentialID = [idText isKindOfClass:[NSString class]] ? [self dataFromBase64URLString:idText] : nil;
            if (credentialID == nil) {
                return [AGWKWebViewBridgeReply replyWithRequestID:id_ status:AGWKWebViewBridgeStatusError message:@"invalid publicKey.allowCredentials"];
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

+ (AGWKWebViewBridgePublicKeyCredential *)publicKeyCredentialWithCredentialID:(NSData *)credentialID
                                                               clientDataJSON:(NSData *)clientDataJSON
                                                            authenticatorData:(NSData *)authenticatorData
                                                                    signature:(NSData *)signature
                                                                   userHandle:(NSData *)userHandle
{
    NSString *id_ = [self base64URLStringFromData:credentialID];
    AGWKWebViewBridgePublicKeyCredentialResponse *response = [[AGWKWebViewBridgePublicKeyCredentialResponse alloc] init];
    response.clientDataJSON = [self base64URLStringFromData:clientDataJSON];
    response.authenticatorData = [self base64URLStringFromData:authenticatorData];
    response.signature = [self base64URLStringFromData:signature];
    response.userHandle = userHandle == nil ? nil : [self base64URLStringFromData:userHandle];
    return [[AGWKWebViewBridgePublicKeyCredential alloc] initWithCredentialID:id_ rawID:id_ response:response];
}

+ (NSString *)encodeReply:(AGWKWebViewBridgeReply *)reply
{
    NSString *fallback = @"{\"message\":\"cannot encode reply\",\"status\":\"error\"}";
    NSDictionary *json = [reply toJSONObject];
    if (![NSJSONSerialization isValidJSONObject:json]) {
        return fallback;
    }
    NSData *data = [NSJSONSerialization dataWithJSONObject:json options:NSJSONWritingSortedKeys error:nil];
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

+ (BOOL)isRpIDAllowed:(NSString *)rpID host:(NSString *)host
{
    if (rpID.length == 0) {
        return NO;
    }
    NSString *r = rpID.lowercaseString;
    NSString *h = host.lowercaseString;
    return [h isEqualToString:r] || [h hasSuffix:[@"." stringByAppendingString:r]];
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

- (void)finishWithReply:(AGWKWebViewBridgeReply *)reply
{
    AGWKWebViewBridgeReplyHandler replyHandler = _replyHandler;
    if (replyHandler == nil) {
        return;
    }
    _replyHandler = nil;
    reply.requestID = self.requestID;
    replyHandler([AGWKWebViewBridgeMessages encodeReply:reply], nil);
}

- (void)cancel
{
    if (_replyHandler == nil) {
        return;
    }
    [self finishWithReply:[AGWKWebViewBridgeReply replyWithStatus:AGWKWebViewBridgeStatusError message:@"cancelled"]];
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
    AGWKWebViewBridgeReply *reply = [AGWKWebViewBridgeMessages replyForBody:message.body
                                                                  requestID:&requestID
                                                           publicKeyRequest:&request];
    if (reply != nil) {
        replyHandler([AGWKWebViewBridgeMessages encodeReply:reply], nil);
        return;
    }
    [self getPublicKeyCredentialWithRequestID:requestID request:request host:origin.host replyHandler:replyHandler];
}

- (void)getPublicKeyCredentialWithRequestID:(NSString *)requestID
                                    request:(AGWKWebViewBridgePublicKeyRequest *)request
                                       host:(NSString *)host
                               replyHandler:(AGWKWebViewBridgeReplyHandler)replyHandler
{
    void (^replyError)(NSString *) = ^(NSString *message) {
        AGWKWebViewBridgeReply *reply = [AGWKWebViewBridgeReply replyWithRequestID:requestID
                                                                            status:AGWKWebViewBridgeStatusError
                                                                           message:message];
        replyHandler([AGWKWebViewBridgeMessages encodeReply:reply], nil);
    };

    // As in a browser, rpId must be the page's host or a parent domain of it.
    if (![AGWKWebViewBridgeMessages isRpIDAllowed:request.rpId host:host]) {
        replyError(@"rpId is not allowed for this page");
        return;
    }

    if (self.pendingRequest != nil) {
        replyError(@"a passkey request is in progress");
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
        replyError(@"no window");
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
- (void)finishController:(ASAuthorizationController *)controller reply:(AGWKWebViewBridgeReply *)reply
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
        [self finishController:controller
                         reply:[AGWKWebViewBridgeReply replyWithStatus:AGWKWebViewBridgeStatusError
                                                               message:@"unexpected credential"]];
        return;
    }
    ASAuthorizationPlatformPublicKeyCredentialAssertion *assertion =
        (ASAuthorizationPlatformPublicKeyCredentialAssertion *)authorization.credential;
    AGWKWebViewBridgeReply *reply = [AGWKWebViewBridgeReply replyWithStatus:AGWKWebViewBridgeStatusOK];
    reply.credential = [AGWKWebViewBridgeMessages publicKeyCredentialWithCredentialID:assertion.credentialID
                                                                       clientDataJSON:assertion.rawClientDataJSON
                                                                    authenticatorData:assertion.rawAuthenticatorData
                                                                            signature:assertion.signature
                                                                           userHandle:assertion.userID];
    [self finishController:controller reply:reply];
}

- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithError:(NSError *)error
{
    // With ASAuthorizationControllerRequestOptionPreferImmediatelyAvailableCredentials,
    // "no passkey on this device" and "the user closed the sheet" both end with canceled.
    if ([error.domain isEqualToString:ASAuthorizationErrorDomain] && error.code == ASAuthorizationErrorCanceled) {
        [self finishController:controller
                         reply:[AGWKWebViewBridgeReply replyWithStatus:AGWKWebViewBridgeStatusNoCredential]];
    } else {
        NSString *message = [NSString stringWithFormat:@"%@ %ld: %@", error.domain, (long)error.code, error.localizedDescription];
        [self finishController:controller
                         reply:[AGWKWebViewBridgeReply replyWithStatus:AGWKWebViewBridgeStatusError message:message]];
    }
}

- (ASPresentationAnchor)presentationAnchorForAuthorizationController:(ASAuthorizationController *)controller
{
    ASPresentationAnchor anchor = self.presentationAnchorProvider == nil ? nil : self.presentationAnchorProvider();
    return anchor ?: [[UIWindow alloc] init];
}

@end
