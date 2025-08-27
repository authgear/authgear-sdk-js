import Foundation
import CommonCrypto
import UIKit
import AuthenticationServices
import LocalAuthentication
import Capacitor

@objc class AuthgearPluginImpl: NSObject, ASWebAuthenticationPresentationContextProviding, AGWKWebViewControllerPresentationContextProviding {
    private var asWebAuthenticationSessionHandles: [ASWebAuthenticationSession: UIWindow] = [:]
    private var agWKWebViewControllerHandles: [AGWKWebViewController: UIWindow] = [:]

    @objc func storageGetItem(key: String) throws -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnData as String: true
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status), userInfo: nil)
        }
        let data = item as! CFData as Data
        let value = String(data: data, encoding: .utf8)!
        return value
    }

    @objc func storageSetItem(key: String, value: String) throws {
        // We first attempt an update, followed by an addition.
        let data = value.data(using: .utf8)!
        let updateQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        let update: [String: Any] = [
            kSecValueData as String: data
        ]

        let updateStatus = SecItemUpdate(updateQuery as CFDictionary, update as CFDictionary)
        if updateStatus == errSecSuccess {
            return
        }
        if updateStatus != errSecItemNotFound {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(updateStatus), userInfo: nil)
        }

        let accessControl = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            [],
            nil
        )!
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: accessControl
        ]
        let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
        if addStatus == errSecSuccess {
            return
        }
        throw NSError(domain: NSOSStatusErrorDomain, code: Int(addStatus), userInfo: nil)
    }

    @objc func storageDeleteItem(key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        let status = SecItemDelete(query as CFDictionary)
        if status == errSecSuccess || status == errSecItemNotFound {
            return
        }
        throw NSError(domain: NSOSStatusErrorDomain, code: Int(status), userInfo: nil)
    }

    @objc func randomBytes(length: Int) throws -> [Int] {
        var bytes = [UInt8](repeating: 0, count: length)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        if status != errSecSuccess {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status), userInfo: nil)
        }
        var ints: [Int] = []
        for b in bytes {
            ints.append(Int(b))
        }
        return ints
    }

    @objc func sha256String(input: String) throws -> [Int] {
        var data = [UInt8](input.data(using: .utf8)!)
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        CC_SHA256(&data, UInt32(data.count), &hash)
        var ints: [Int] = []
        for b in hash {
            ints.append(Int(b))
        }
        return ints
    }

    @objc func getDeviceInfo() -> [String: Any] {
        var systemInfo = utsname()
        uname(&systemInfo)

        let machine = withUnsafePointer(to: &systemInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String(validatingUTF8: ptr)
            }
        }!
        let nodename = withUnsafePointer(to: &systemInfo.nodename) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String(validatingUTF8: ptr)
            }
        }!
        let release = withUnsafePointer(to: &systemInfo.release) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String(validatingUTF8: ptr)
            }
        }!
        let sysname = withUnsafePointer(to: &systemInfo.sysname) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String(validatingUTF8: ptr)
            }
        }!
        let version = withUnsafePointer(to: &systemInfo.version) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String(validatingUTF8: ptr)
            }
        }!

        let unameInfo: [String: Any] = [
            "machine": machine,
            "nodename": nodename,
            "release": release,
            "sysname": sysname,
            "version": version
        ]

        let uiDevice = UIDevice.current
        let uiDeviceInfo: [String: Any] = [
            "name": uiDevice.name,
            "systemName": uiDevice.systemName,
            "systemVersion": uiDevice.systemVersion,
            "model": uiDevice.model,
            "userInterfaceIdiom": uiDevice.userInterfaceIdiom.toString()
        ]

        var processInfoDict = [
            "isMacCatalystApp": false,
            "isiOSAppOnMac": false
        ]
        if #available(iOS 13.0, *) {
            let processInfo = ProcessInfo.processInfo
            processInfoDict["isMacCatalystApp"] = processInfo.isMacCatalystApp
            if #available(iOS 14.0, *) {
                processInfoDict["isiOSAppOnMac"] = processInfo.isiOSAppOnMac
            }
        }

        let mainBundleInfoDict = Bundle.main.infoDictionary!
        let bundleInfo: [String: Any] = [
            "CFBundleIdentifier": mainBundleInfoDict["CFBundleIdentifier"]!,
            "CFBundleName": mainBundleInfoDict["CFBundleName"]!,
            "CFBundleDisplayName": mainBundleInfoDict["CFBundleDisplayName"]!,
            "CFBundleExecutable": mainBundleInfoDict["CFBundleExecutable"]!,
            "CFBundleShortVersionString": mainBundleInfoDict["CFBundleShortVersionString"]!,
            "CFBundleVersion": mainBundleInfoDict["CFBundleVersion"]!
        ]

        return [
            "ios": [
                "uname": unameInfo,
                "UIDevice": uiDeviceInfo,
                "NSProcessInfo": processInfoDict,
                "NSBundle": bundleInfo
            ]
        ]
    }

    @objc func generateUUID() -> String {
        let uuid = NSUUID()
        return uuid.uuidString
    }

    @objc func openAuthorizeURL(window: UIWindow, url: URL, callbackURL: URL, prefersEphemeralWebBrowserSession: Bool, completion: @escaping (String?, Error?) -> Void) {
        if #available(iOS 12.0, *) {
            let scheme = callbackURL.scheme
            var asWebSession: ASWebAuthenticationSession?
            asWebSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: scheme
            ) { redirectURI, error in
                self.asWebAuthenticationSessionHandles.removeValue(forKey: asWebSession!)
                if let error = error {
                    let nsError = error as NSError
                    let isCancel = nsError.domain == ASWebAuthenticationSessionErrorDomain && nsError.code == ASWebAuthenticationSessionError.Code.canceledLogin.rawValue
                    if isCancel {
                        completion(nil, NSError.makeCancel(error: error))
                    } else {
                        completion(nil, NSError.makeUnrecoverableAuthgearError(message: "openAuthorizeURL failed", error: error))
                    }
                }
                if let redirectURI = redirectURI {
                    completion(redirectURI.absoluteString, nil)
                }
            }
            self.asWebAuthenticationSessionHandles[asWebSession!] = window
            if #available(iOS 13.0, *) {
                asWebSession!.presentationContextProvider = self
                asWebSession!.prefersEphemeralWebBrowserSession = prefersEphemeralWebBrowserSession
            }
            asWebSession!.start()
        } else {
            completion(nil, NSError.makeUnrecoverableAuthgearError(message: "SDK supports only iOS 12.0 or newer", error: nil))
        }
    }

    func openAuthorizeURLWithWebView(
        window: UIWindow,
        url: URL,
        redirectURI: URL,
        modalPresentationStyleString: String?,
        navigationBarBackgroundColorString: String?,
        navigationBarButtonTintColorString: String?,
        isInspectable: Bool?,
        completion: @escaping (String?, Error?) -> Void
    ) {
        var controller: AGWKWebViewController?
        controller = AGWKWebViewController(url: url, redirectURI: redirectURI, isInspectable: isInspectable ?? false) { result, error in
            self.agWKWebViewControllerHandles.removeValue(forKey: controller!)
            if let error = error {
                let nsError = error as NSError
                if (nsError.domain == AGWKWebViewControllerErrorDomain && nsError.code == AGWKWebViewControllerErrorCodeCanceledLogin) {
                    completion(nil, NSError.makeCancel(error: error))
                } else {
                    completion(nil, error)
                }
            }
            if let result = result {
                completion(result.absoluteString, nil)
            }
        }
        self.agWKWebViewControllerHandles[controller!] = window
        controller?.navigationBarBackgroundColor = UIColor(argb: navigationBarBackgroundColorString)
        controller?.navigationBarButtonTintColor = UIColor(argb: navigationBarButtonTintColorString)
        controller?.modalPresentationStyle = UIModalPresentationStyle.from(string: modalPresentationStyleString)
        controller?.presentationContextProvider = self
        controller?.start()
    }

    @objc func openURL(window: UIWindow, url: URL, completion: @escaping (Error?) -> Void) {
        if #available(iOS 12.0, *) {
            let scheme = "nocallback"
            var asWebSession: ASWebAuthenticationSession?
            asWebSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: scheme
            ) { redirectURI, error in
                self.asWebAuthenticationSessionHandles.removeValue(forKey: asWebSession!)
                if let error = error {
                    let nsError = error as NSError
                    let isCancel = nsError.domain == ASWebAuthenticationSessionErrorDomain && nsError.code == ASWebAuthenticationSessionError.Code.canceledLogin.rawValue
                    if isCancel {
                        completion(nil)
                    } else {
                        completion(NSError.makeUnrecoverableAuthgearError(message: "openURL failed", error: error))
                    }
                } else {
                    completion(nil)
                }
            }
            self.asWebAuthenticationSessionHandles[asWebSession!] = window
            if #available(iOS 13.0, *) {
                asWebSession!.presentationContextProvider = self
                asWebSession!.prefersEphemeralWebBrowserSession = true
            }
            asWebSession!.start()
        } else {
            completion(NSError.makeUnrecoverableAuthgearError(message: "SDK supports only iOS 12.0 or newer", error: nil))
        }
    }

    @objc func checkBiometricSupported(policyString: String) throws {
        if #available(iOS 11.3, *) {
            let policy = LAPolicy.from(string: policyString)!
            let laContext = self.makeLAContext(policy: policy)
            var error: NSError?
            laContext.canEvaluatePolicy(policy, error: &error)
            if let error = error {
                throw error
            }
        } else {
            throw NSError.makeUnrecoverableAuthgearError(message: "Biometric authentication requires at least iOS 11.3", error: nil)
        }
    }

    @objc func createBiometricPrivateKey(
        policyString: String,
        localizedReason: String,
        constraint: String,
        kid: String,
        tag: String,
        payload: [String: Any],
        completion: @escaping (String?, Error?) -> Void
    ) {
        let policy = LAPolicy.from(string: policyString)!
        let ctx = makeLAContext(policy: policy)
        ctx.evaluatePolicy(policy, localizedReason: localizedReason) { ok, error in
            if let error = error {
                completion(nil, error)
                return
            }

            do {
                let privateKey = try self.generateAndAddBiometricPrivateKey(constraint: constraint, tag: tag, laContext: ctx)
                let jwt = try self.signBiometricJWT(privateKey: privateKey, kid: kid, payload: payload)
                completion(jwt, nil)
                return
            } catch {
                completion(nil, error)
                return
            }
        }
    }

    @objc func signWithBiometricPrivateKey(
        policyString: String,
        localizedReason: String,
        kid: String,
        tag: String,
        payload: [String: Any],
        completion: @escaping (String?, Error?) -> Void
    ) {
        let policy = LAPolicy.from(string: policyString)!
        let ctx = makeLAContext(policy: policy)
        ctx.evaluatePolicy(policy, localizedReason: localizedReason) { ok, error in
            if let error = error {
                completion(nil, error)
                return
            }

            do {
                let privateKey = try self.getBiometricPrivateKey(tag: tag, laContext: ctx)
                let jwt = try self.signBiometricJWT(privateKey: privateKey, kid: kid, payload: payload)
                completion(jwt, nil)
                return
            } catch {
                completion(nil, error)
                return
            }
        }
    }

    @objc func removeBiometricPrivateKey(tag: String) throws {
        let query: NSDictionary = [
            kSecClass: kSecClassKey,
            // Do not specify the key type because it can be either RSA or EC.
            kSecAttrApplicationTag: tag
        ]
        let status = SecItemDelete(query)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }

    @objc func checkDPoPSupported() -> Bool {
        if #available(iOS 11.3, *) {
            return true
        }
        return false
    }

    @objc func createDPoPPrivateKey(kid: String) throws {
        var cfError: Unmanaged<CFError>?
        let attributes: NSDictionary = [
            kSecAttrKeyType: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits: 256,
            kSecAttrTokenID: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs: [
                kSecAttrIsPermanent: true,
                kSecAttrApplicationTag: formatDPoPKeyTag(kid: kid)
            ]
        ]
        guard let privateKey = SecKeyCreateRandomKey(attributes, &cfError) else {
            throw cfError!.takeRetainedValue() as Error
        }
    }

    @objc func signWithDPoPPrivateKey(kid: String, payload: [String: Any]) throws -> String {
        guard let privatekey = try getDPoPPrivateKey(kid: kid) else {
            throw AuthgearError.runtimeError(AuthgearRuntimeError(message: "dpop key does not exist"))
        }
        let jwt = try signDPoPJWT(privateKey: privatekey, kid: kid, payload: payload)
        return jwt
    }

    @objc func checkDPoPPrivateKey(kid: String) -> Bool {
        do {
            if let privatekey = try getDPoPPrivateKey(kid: kid) {
                return true
            }
            return false
        } catch {
            return false
        }
    }

    @objc func computeDPoPJKT(kid: String) throws -> String {
        guard let privatekey = try getDPoPPrivateKey(kid: kid) else {
            throw AuthgearError.runtimeError(AuthgearRuntimeError(message: "dpop key does not exist"))
        }
        let jwk = try self.getJWKFromPrivateKey(privateKey: privatekey, kid: kid)
        return try jwk.computeThumbprint(algorithm: .SHA256)
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let window = self.asWebAuthenticationSessionHandles[session]!
        return window
    }

    func presentationAnchor(for controller: AGWKWebViewController) -> UIWindow {
        let window = self.agWKWebViewControllerHandles[controller]!
        return window
    }

    private func makeLAContext(policy: LAPolicy) -> LAContext {
        let ctx = LAContext()
        if policy == LAPolicy.deviceOwnerAuthenticationWithBiometrics {
            ctx.localizedFallbackTitle = "";
        }
        return ctx
    }

    private func generateAndAddBiometricPrivateKey(constraint: String, tag: String, laContext: LAContext) throws -> SecKey {
        var cfError: Unmanaged<CFError>?

        var flags: SecAccessControlCreateFlags = []
        // https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/protecting_keys_with_the_secure_enclave
        flags.insert(.privateKeyUsage)

        #if targetEnvironment(simulator)
        // On Xcode 15.2, iPhone 15 iOS 17.2, using any of these flags will result in
        // NSOSStatusErrorDomain code=-25293 message="Key generation failed"
        #else
        switch constraint {
        case "biometryAny":
            flags.insert(.biometryAny)
        case "biometryCurrentSet":
            flags.insert(.biometryCurrentSet)
        case "userPresence":
            flags.insert(.userPresence)
        default:
            break
        }
        #endif

        guard let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            flags,
            &cfError
        ) else {
            throw cfError!.takeRetainedValue() as Error
        }

        let attributes: NSDictionary = [
            kSecAttrKeyType: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits: 256,
            kSecAttrTokenID: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs: [
                kSecClass: kSecClassKey,
                kSecAttrIsPermanent: true,
                kSecAttrApplicationTag: tag,
                kSecAttrAccessControl: accessControl,
                kSecUseAuthenticationContext: laContext
            ]
        ]

        guard let privateKey = SecKeyCreateRandomKey(attributes, &cfError) else {
            throw cfError!.takeRetainedValue() as Error
        }

        return privateKey
    }

    private func getBiometricPrivateKey(tag: String, laContext: LAContext) throws -> SecKey {
        let query: NSDictionary = [
            kSecClass: kSecClassKey,
            kSecMatchLimit: kSecMatchLimitOne,
            // Do not specify the key type because it can be either RSA or EC.
            kSecAttrApplicationTag: tag,
            kSecUseAuthenticationContext: laContext,
            kSecReturnRef: true
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query, &item)

        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }

        let privateKey = item as! SecKey
        return privateKey
    }

    private func getDPoPPrivateKey(kid: String) throws -> SecKey? {
        let tag = formatDPoPKeyTag(kid: kid)
        let query: NSDictionary = [
            kSecClass: kSecClassKey,
            kSecMatchLimit: kSecMatchLimitOne,
            kSecAttrApplicationTag: tag,
            kSecReturnRef: true
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query, &item)

        guard status != errSecItemNotFound else {
            return nil
        }

        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }

        let privateKey = item as! SecKey
        return privateKey
    }

    private func signBiometricJWT(privateKey: SecKey, kid: String, payload: [String: Any]) throws -> String {
        let jwk = try self.getJWKFromPrivateKey(privateKey: privateKey, kid: kid)
        let header = [
            "typ": "vnd.authgear.biometric-request",
            "kid": jwk["kid"],
            "alg": jwk["alg"],
            "jwk": jwk
        ]
        let jwt = try self.signJWT(privateKey: privateKey, header: header as [String: Any], payload: payload)
        return jwt
    }

    private func signDPoPJWT(privateKey: SecKey, kid: String, payload: [String: Any]) throws -> String {
        let jwk = try self.getJWKFromPrivateKey(privateKey: privateKey, kid: kid)
        let header = [
            "typ": "dpop+jwt",
            "kid": jwk["kid"],
            "alg": jwk["alg"],
            "jwk": jwk
        ]
        let jwt = try self.signJWT(privateKey: privateKey, header: header as [String: Any], payload: payload)
        return jwt
    }

    private func getJWKFromPrivateKey(privateKey: SecKey, kid: String) throws -> [String: Any] {
        var cfError: Unmanaged<CFError>?

        let publicKey = SecKeyCopyPublicKey(privateKey)!
        guard let cfData = SecKeyCopyExternalRepresentation(publicKey, &cfError) else {
            throw cfError!.takeRetainedValue() as Error
        }

        let data = cfData as Data

        switch KeyType.from(privateKey)! {
        case .rsa:
            return getJWKFromRSA(kid: kid, data: data)
        case .ec:
            return try getJWKFromEC(kid: kid, data: data)
        }
    }

    private func getJWKFromRSA(kid: String, data: Data) -> [String: Any] {
        let n = data.subdata(in: Range(NSRange(location: data.count > 269 ? 9 : 8, length: 256))!)
        let e = data.subdata(in: Range(NSRange(location: data.count - 3, length: 3))!)

        return [
            "kid": kid,
            "kty": "RSA",
            "alg": "RS256",
            "n": n.base64urlEncodedString(),
            "e": e.base64urlEncodedString(),
        ]
    }

    private func getJWKFromEC(kid: String, data: Data) throws -> [String: Any] {
        var publicKeyBytes = [UInt8](data)

        guard publicKeyBytes.removeFirst() == 0x04 else {
            throw NSError.makeUnrecoverableAuthgearError(message: "unexpected ec public key format", error: nil)
        }

        let coordinateOctetLength = 32

        let xBytes = publicKeyBytes[0..<coordinateOctetLength]
        let yBytes = publicKeyBytes[coordinateOctetLength..<coordinateOctetLength * 2]
        let xData = Data(xBytes)
        let yData = Data(yBytes)

        return [
            "kid": kid,
            "kty": "EC",
            "alg": "ES256",
            "x": xData.base64urlEncodedString(),
            "y": yData.base64urlEncodedString(),
            "crv": "P-256"
        ]
    }

    private func signJWT(privateKey: SecKey, header: [String: Any], payload: [String: Any]) throws -> String {
        let headerJSON = try JSONSerialization.data(withJSONObject: header)
        let payloadJSON = try JSONSerialization.data(withJSONObject: payload)
        let headerString = headerJSON.base64urlEncodedString()
        let payloadString = payloadJSON.base64urlEncodedString()
        let stringToSign = "\(headerString).\(payloadString)"
        let dataToSign = stringToSign.data(using: .utf8)!
        let signature = try self.signData(privateKey: privateKey, data: dataToSign)
        let signatureString = signature.base64urlEncodedString()
        return "\(stringToSign).\(signatureString)"
    }

    private func signData(privateKey: SecKey, data: Data) throws -> Data {
        switch KeyType.from(privateKey)! {
        case .rsa:
            return try signRSA(privateKey: privateKey, data: data)
        case .ec:
            return try signEC(privateKey: privateKey, data: data)
        }
    }

    private func signRSA(privateKey: SecKey, data: Data) throws -> Data {
        var cfError: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(privateKey, .rsaSignatureMessagePKCS1v15SHA256, data as CFData, &cfError) else {
            throw cfError!.takeRetainedValue() as Error
        }
        return signature as Data
    }

    private func signEC(privateKey: SecKey, data: Data) throws -> Data {
        var cfError: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(privateKey, .ecdsaSignatureMessageX962SHA256, data as CFData, &cfError) else {
            throw cfError!.takeRetainedValue() as Error
        }

        // Convert the signature to correct format
        // See https://github.com/airsidemobile/JOSESwift/blob/2.4.0/JOSESwift/Sources/CryptoImplementation/EC.swift#L208
        let coordinateOctetLength = 32

        let ecSignatureTLV = [UInt8](signature as Data)
        let ecSignature = try ecSignatureTLV.read(.sequence)
        let varlenR = try Data(ecSignature.read(.integer))
        let varlenS = try Data(ecSignature.skip(.integer).read(.integer))
        let fixlenR = Asn1IntegerConversion.toRaw(varlenR, of: coordinateOctetLength)
        let fixlenS = Asn1IntegerConversion.toRaw(varlenS, of: coordinateOctetLength)

        let fixedSignature = (fixlenR + fixlenS)
        return fixedSignature
    }

    private func formatDPoPKeyTag(kid: String) -> String {
        return "com.authgear.keys.dpop.\(kid)"
    }
}

private extension UIUserInterfaceIdiom {
    func toString() -> String {
        switch self {
        case .unspecified:
                return "unspecified"
        case .phone:
                return "phone"
        case .pad:
                return "pad"
        case .tv:
                return "tv"
        case .carPlay:
                return "carPlay"
        case .mac:
                return "mac"
        default:
                return "unknown"
        }
    }
}

extension NSError {
    static let AuthgearDomain = "Authgear"

    static func makeUnrecoverableAuthgearError(message: String, error: Error?) -> NSError {
        var userInfo: [String: Any] = [
            NSLocalizedDescriptionKey: message
        ]
        if let error = error {
            userInfo[NSUnderlyingErrorKey] = error
        }
        return NSError(domain: AuthgearDomain, code: 0, userInfo: userInfo)
    }

    static func makeCancel(error: Error?) -> NSError {
        var userInfo: [String: Any] = [
            NSLocalizedDescriptionKey: "CANCEL"
        ]
        userInfo["code"] = "CANCEL"
        if let error = error {
            userInfo[NSUnderlyingErrorKey] = error
        }
        return NSError(domain: AuthgearDomain, code: 0, userInfo: userInfo)
    }

    var capacitorMessage: String {
        get {
            return self.localizedDescription
        }
    }

    var capacitorCode: String? {
        get {
            return self.userInfo["code"] as? String
        }
    }

    var capacitorUnderlyingError: Error? {
        get {
            return self.userInfo[NSUnderlyingErrorKey] as? Error
        }
    }

    var capacitorData: [String: Any]? {
        get {
            if let underlying = self.capacitorUnderlyingError {
                let nsError = underlying as NSError
                let domain = nsError.domain
                let code = nsError.code
                let userInfo = nsError.userInfo
                return [
                    "cause": [
                        "domain": domain,
                        "code": code,
                        "userInfo": userInfo
                    ]
                ]
            } else {
                let nsError = self
                let domain = nsError.domain
                let code = nsError.code
                let userInfo = nsError.userInfo
                return [
                    "cause": [
                        "domain": domain,
                        "code": code,
                        "userInfo": userInfo
                    ]
                ]
            }
        }
    }
}

extension Error {
    func reject(_ call: CAPPluginCall) {
        let nsError = self as NSError
        let message = nsError.capacitorMessage
        let code = nsError.capacitorCode
        let underlyingError = nsError.capacitorUnderlyingError
        let data = nsError.capacitorData
        call.reject(message, code, underlyingError, data)
    }
}

private enum KeyType {
    case rsa
    case ec

    static func from(_ privateKey: SecKey) -> KeyType? {
        guard let attributes = SecKeyCopyAttributes(privateKey) as? [CFString: Any],
              let keyType = attributes[kSecAttrKeyType] as? String else {
            return nil
        }

        if (keyType == (kSecAttrKeyTypeECSECPrimeRandom as String)) {
            return .ec
        }

        if (keyType == (kSecAttrKeyTypeRSA as String)) {
            return .rsa
        }

        return nil
    }
}

internal extension Data {
    func base64urlEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

private extension LAPolicy {
    static func from(string: String) -> LAPolicy? {
        switch string {
        case "deviceOwnerAuthenticationWithBiometrics":
            return .deviceOwnerAuthenticationWithBiometrics
        case "deviceOwnerAuthentication":
            return .deviceOwnerAuthentication
        default:
            return nil
        }
    }
}

private extension UIColor {
    convenience init?(argb: String?) {
        guard let argb = argb else {
            return nil
        }
        let argbInt = UInt32(argb, radix: 16)!
        let a = CGFloat((argbInt >> 24) & 0xFF) / 255.0
        let r = CGFloat((argbInt >> 16) & 0xFF) / 255.0
        let g = CGFloat((argbInt >> 8) & 0xFF) / 255.0
        let b = CGFloat(argbInt & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}

private extension UIModalPresentationStyle {
    static func from(string: String?) -> UIModalPresentationStyle {
        if let string = string {
            switch string {
            case "fullScreen":
                return .fullScreen
            case "pageSheet":
                return .pageSheet
            default:
                break
            }
        }
        if #available(iOS 13.0, *) {
            return .automatic
        } else {
            return .fullScreen
        }
    }
}
