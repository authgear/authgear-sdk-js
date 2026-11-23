import AuthenticationServices
import Foundation
import WebKit

// The AuthUI bridge of the SDK's WKWebView (AGWKWebViewController).
// See docs/specs/webview-bridge.md in authgear-server.
//
// The page posts a JSON object, encoded as a string, to
// window.webkit.messageHandlers.authgearBridge, and gets one reply, also a JSON
// object encoded as a string, as the value of the promise that postMessage returns.

/// The status of a reply.
enum AGWKWebViewBridgeStatus: String, CaseIterable, Encodable {
    case ok
    case unsupported
    case error
    case noCredential = "no_credential"
    case cancelled
}

/// A reply, encoded as a JSON object. Fields that are nil are omitted.
struct AGWKWebViewBridgeReply: Encodable, Equatable {
    /// The id of the message. nil only in the reply to a message without a string id.
    var id: String?
    var status: AGWKWebViewBridgeStatus
    var message: String?
    /// The ok reply to bridge.capabilities.
    var capabilities: [String]?
    /// The ok reply to credentials.get.
    var credential: AGWKWebViewBridgePublicKeyCredential?
}

/// The AuthenticationResponseJSON of a passkey assertion, with binary values as base64url without padding.
struct AGWKWebViewBridgePublicKeyCredential: Encodable, Equatable {
    struct Response: Encodable, Equatable {
        var clientDataJSON: String
        var authenticatorData: String
        var signature: String
        /// Optional in AuthenticationResponseJSON.
        var userHandle: String?
    }

    var id: String
    var rawId: String
    var type: String = "public-key"
    var authenticatorAttachment: String = "platform"
    var response: Response
    /// Always empty, because no extension is supported.
    var clientExtensionResults: [String: String] = [:]
}

/// What the bridge does with a message.
enum AGWKWebViewBridgeAction {
    /// Reply at once.
    case reply(AGWKWebViewBridgeReply)
    /// Ask the platform for a passkey, then reply.
    case getPublicKeyCredential(id: String, request: AGWKWebViewBridgePublicKeyRequest)
}

/// The publicKey member of credentials.get, decoded.
struct AGWKWebViewBridgePublicKeyRequest: Equatable {
    var rpId: String
    var challenge: Data
    var userVerification: String?
    var allowCredentialIDs: [Data]
}

/// The pure parts of the bridge, kept apart from WebKit so that they can be unit tested.
enum AGWKWebViewBridgeMessages {
    /// The capabilities listed in the reply to bridge.capabilities.
    static let capabilities: [String] = [
        "credentials.get",
        "credentials.get:publicKey",
        "credentials.get:immediate"
    ]

    static func action(for body: Any) -> AGWKWebViewBridgeAction {
        guard let text = body as? String,
              let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let id = json["id"] as? String
        else {
            return .reply(AGWKWebViewBridgeReply(status: .error, message: "invalid message"))
        }

        switch json["type"] as? String {
        case "bridge.capabilities":
            return .reply(AGWKWebViewBridgeReply(id: id, status: .ok, capabilities: self.capabilities))
        case "credentials.get":
            return self.credentialsGetAction(id: id, json: json)
        default:
            return .reply(AGWKWebViewBridgeReply(id: id, status: .unsupported))
        }
    }

    private static func credentialsGetAction(id: String, json: [String: Any]) -> AGWKWebViewBridgeAction {
        // publicKey is the only member this version supports. Other members, such as password, are ignored.
        guard json["mediation"] as? String == "immediate",
              let publicKey = json["publicKey"] as? [String: Any]
        else {
            return .reply(AGWKWebViewBridgeReply(id: id, status: .unsupported))
        }
        guard let rpId = publicKey["rpId"] as? String,
              let challengeText = publicKey["challenge"] as? String,
              let challenge = self.decodeBase64URL(challengeText)
        else {
            return .reply(AGWKWebViewBridgeReply(id: id, status: .error, message: "publicKey needs rpId and challenge"))
        }
        var userVerification: String?
        if let value = publicKey["userVerification"] {
            guard let value = value as? String else {
                return .reply(AGWKWebViewBridgeReply(id: id, status: .error, message: "invalid publicKey.userVerification"))
            }
            // As in WebAuthn, an unknown value is ignored, so iOS uses its default.
            if ["required", "preferred", "discouraged"].contains(value) {
                userVerification = value
            }
        }
        var allowCredentialIDs: [Data] = []
        if let value = publicKey["allowCredentials"] {
            guard let descriptors = value as? [Any] else {
                return .reply(AGWKWebViewBridgeReply(id: id, status: .error, message: "invalid publicKey.allowCredentials"))
            }
            for descriptor in descriptors {
                guard let descriptor = descriptor as? [String: Any],
                      let idText = descriptor["id"] as? String,
                      let credentialID = self.decodeBase64URL(idText)
                else {
                    return .reply(AGWKWebViewBridgeReply(id: id, status: .error, message: "invalid publicKey.allowCredentials"))
                }
                allowCredentialIDs.append(credentialID)
            }
        }
        return .getPublicKeyCredential(
            id: id,
            request: AGWKWebViewBridgePublicKeyRequest(
                rpId: rpId,
                challenge: challenge,
                userVerification: userVerification,
                allowCredentialIDs: allowCredentialIDs
            )
        )
    }

    static func decodeBase64URL(_ text: String) -> Data? {
        var base64 = text
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        if base64.count % 4 != 0 {
            base64.append(String(repeating: "=", count: 4 - base64.count % 4))
        }
        return Data(base64Encoded: base64)
    }

    /// The credential of a passkey assertion.
    static func publicKeyCredential(
        credentialID: Data,
        clientDataJSON: Data,
        authenticatorData: Data,
        signature: Data,
        userHandle: Data?
    ) -> AGWKWebViewBridgePublicKeyCredential {
        let id = credentialID.base64urlEncodedString()
        return AGWKWebViewBridgePublicKeyCredential(
            id: id,
            rawId: id,
            response: AGWKWebViewBridgePublicKeyCredential.Response(
                clientDataJSON: clientDataJSON.base64urlEncodedString(),
                authenticatorData: authenticatorData.base64urlEncodedString(),
                signature: signature.base64urlEncodedString(),
                userHandle: userHandle?.base64urlEncodedString()
            )
        )
    }

    static func encodeReply(_ reply: AGWKWebViewBridgeReply) -> String {
        if let text = self.encodeJSON(reply) {
            return text
        }
        // Not expected, but the page still gets an error reply with the message's id.
        let fallback = AGWKWebViewBridgeReply(id: reply.id, status: .error, message: "cannot encode reply")
        return self.encodeJSON(fallback) ?? "{\"message\":\"cannot encode reply\",\"status\":\"error\"}"
    }

    private static func encodeJSON(_ reply: AGWKWebViewBridgeReply) -> String? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(reply) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    /// Whether a page of this origin may use the bridge.
    /// Only the scheme, host and port of each allowed URL are used.
    /// A port of 0 or nil means the default port of the scheme, as in WKSecurityOrigin.
    static func isAllowedOrigin(scheme: String, host: String, port: Int?, allowedOrigins: [URL]) -> Bool {
        let scheme = scheme.lowercased()
        let host = host.lowercased()
        let port = self.effectivePort(scheme: scheme, port: port)
        return allowedOrigins.contains { allowed in
            guard let allowedScheme = allowed.scheme?.lowercased(),
                  let allowedHost = allowed.host?.lowercased()
            else {
                return false
            }
            return allowedScheme == scheme &&
                allowedHost == host &&
                self.effectivePort(scheme: allowedScheme, port: allowed.port) == port
        }
    }

    /// Whether a page of this host may ask for a passkey of this rpId.
    /// As in a browser, the rpId must be the host or a parent domain of it, compared without case.
    static func isRpIDAllowed(rpID: String, host: String) -> Bool {
        let rpID = rpID.lowercased()
        let host = host.lowercased()
        guard !rpID.isEmpty else {
            return false
        }
        return host == rpID || host.hasSuffix("." + rpID)
    }

    private static func effectivePort(scheme: String, port: Int?) -> Int? {
        if let port = port, port != 0 {
            return port
        }
        switch scheme {
        case "https":
            return 443
        case "http":
            return 80
        default:
            return nil
        }
    }
}

/// A credentials.get waiting for the platform. It replies at most once.
@available(iOS 16.0, *)
class AGWKWebViewBridgePendingRequest {
    typealias ReplyHandler = (Any?, String?) -> Void

    let id: String
    let controller: ASAuthorizationController?
    private var replyHandler: ReplyHandler?

    init(id: String, replyHandler: @escaping ReplyHandler, controller: ASAuthorizationController?) {
        self.id = id
        self.replyHandler = replyHandler
        self.controller = controller
    }

    /// Replies with `reply` and this request's id, unless it has replied already.
    func finish(_ reply: AGWKWebViewBridgeReply) {
        guard let replyHandler = self.replyHandler else {
            return
        }
        self.replyHandler = nil
        var reply = reply
        reply.id = self.id
        replyHandler(AGWKWebViewBridgeMessages.encodeReply(reply), nil)
    }

    /// Replies error, unless it has replied already, and cancels the platform request.
    func cancel() {
        guard self.replyHandler != nil else {
            return
        }
        self.finish(AGWKWebViewBridgeReply(status: .error, message: "cancelled"))
        self.controller?.cancel()
    }
}

@available(iOS 16.0, *)
class AGWKWebViewBridge: NSObject, WKScriptMessageHandlerWithReply, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    static let name = "authgearBridge"

    private let allowedOrigins: [URL]
    var presentationAnchorProvider: (() -> ASPresentationAnchor?)?

    private var pendingRequest: AGWKWebViewBridgePendingRequest?

    init(allowedOrigins: [URL]) {
        self.allowedOrigins = allowedOrigins
        super.init()
    }

    /// Cancels the pending request, if any. Its reply is error.
    /// Called when the top-level page starts loading another page, and when the web view is gone,
    /// because iOS allows one passkey request per app at a time.
    func invalidate() {
        let pendingRequest = self.pendingRequest
        self.pendingRequest = nil
        pendingRequest?.cancel()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage,
        replyHandler: @escaping (Any?, String?) -> Void
    ) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame,
              AGWKWebViewBridgeMessages.isAllowedOrigin(
                  scheme: origin.protocol,
                  host: origin.host,
                  port: origin.port,
                  allowedOrigins: self.allowedOrigins
              )
        else {
            replyHandler(nil, "authgearBridge is not available to this page")
            return
        }

        switch AGWKWebViewBridgeMessages.action(for: message.body) {
        case let .reply(reply):
            replyHandler(AGWKWebViewBridgeMessages.encodeReply(reply), nil)
        case let .getPublicKeyCredential(id, request):
            self.getPublicKeyCredential(id: id, request: request, host: origin.host, replyHandler: replyHandler)
        }
    }

    private func getPublicKeyCredential(
        id: String,
        request: AGWKWebViewBridgePublicKeyRequest,
        host: String,
        replyHandler: @escaping (Any?, String?) -> Void
    ) {
        func reply(_ reply: AGWKWebViewBridgeReply) {
            var reply = reply
            reply.id = id
            replyHandler(AGWKWebViewBridgeMessages.encodeReply(reply), nil)
        }

        guard AGWKWebViewBridgeMessages.isRpIDAllowed(rpID: request.rpId, host: host) else {
            reply(AGWKWebViewBridgeReply(status: .error, message: "rpId is not allowed for this page"))
            return
        }

        guard self.pendingRequest == nil else {
            reply(AGWKWebViewBridgeReply(status: .error, message: "a passkey request is in progress"))
            return
        }

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: request.rpId)
        let assertionRequest = provider.createCredentialAssertionRequest(challenge: request.challenge)
        if let userVerification = request.userVerification {
            assertionRequest.userVerificationPreference = ASAuthorizationPublicKeyCredentialUserVerificationPreference(
                rawValue: userVerification
            )
        }
        if !request.allowCredentialIDs.isEmpty {
            assertionRequest.allowedCredentials = request.allowCredentialIDs.map {
                ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: $0)
            }
        }

        guard self.presentationAnchorProvider?() != nil else {
            reply(AGWKWebViewBridgeReply(status: .error, message: "no window"))
            return
        }

        let controller = ASAuthorizationController(authorizationRequests: [assertionRequest])
        controller.delegate = self
        controller.presentationContextProvider = self
        self.pendingRequest = AGWKWebViewBridgePendingRequest(
            id: id,
            replyHandler: replyHandler,
            controller: controller
        )
        controller.performRequests(options: .preferImmediatelyAvailableCredentials)
    }

    /// Replies to the pending request of `controller`. A callback of a cancelled request finds nothing.
    private func finish(controller: ASAuthorizationController, reply: AGWKWebViewBridgeReply) {
        guard let pendingRequest = self.pendingRequest, pendingRequest.controller === controller else {
            return
        }
        self.pendingRequest = nil
        pendingRequest.finish(reply)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let assertion = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion else {
            self.finish(controller: controller, reply: AGWKWebViewBridgeReply(status: .error, message: "unexpected credential"))
            return
        }
        let credential = AGWKWebViewBridgeMessages.publicKeyCredential(
            credentialID: assertion.credentialID,
            clientDataJSON: assertion.rawClientDataJSON,
            authenticatorData: assertion.rawAuthenticatorData,
            signature: assertion.signature,
            // userID is imported as Data!, so it is read as an optional to not crash on nil.
            userHandle: assertion.userID as Data?
        )
        self.finish(controller: controller, reply: AGWKWebViewBridgeReply(status: .ok, credential: credential))
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let error = error as NSError
        // With .preferImmediatelyAvailableCredentials, "no passkey on this device" and
        // "the user closed the sheet" both end with canceled.
        if error.domain == ASAuthorizationError.errorDomain, error.code == ASAuthorizationError.canceled.rawValue {
            self.finish(controller: controller, reply: AGWKWebViewBridgeReply(status: .noCredential))
        } else {
            self.finish(
                controller: controller,
                reply: AGWKWebViewBridgeReply(
                    status: .error,
                    message: "\(error.domain) \(error.code): \(error.localizedDescription)"
                )
            )
        }
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        self.presentationAnchorProvider?() ?? ASPresentationAnchor()
    }
}
