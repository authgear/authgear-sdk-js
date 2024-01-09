import Foundation
import CommonCrypto
import UIKit
import AuthenticationServices
import Capacitor

@objc class AuthgearPluginImpl: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var asWebAuthenticationSessionHandles: [ASWebAuthenticationSession: UIWindow] = [:]

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
                        completion(nil, NSError.makeError(message: "openAuthorizeURL failed", code: nil, error: error))
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
            completion(nil, NSError.makeError(message: "SDK supports only iOS 12.0 or newer", code: nil, error: nil))
        }
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
                        completion(NSError.makeError(message: "openURL failed", code: nil, error: error))
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
            completion(NSError.makeError(message: "SDK supports only iOS 12.0 or newer", code: nil, error: nil))
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let window = self.asWebAuthenticationSessionHandles[session]!
        return window
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

    static func makeError(message: String, code: String?, error: Error?) -> NSError {
        var userInfo: [String: Any] = [
            NSLocalizedDescriptionKey: message
        ]
        if let code = code {
            userInfo["code"] = code
        }
        if let error = error {
            userInfo[NSUnderlyingErrorKey] = error
        }
        return NSError(domain: AuthgearDomain, code: 0, userInfo: userInfo)
    }

    static func makeCancel(error: Error?) -> NSError {
        return makeError(message: "CANCEL", code: "CANCEL", error: error)
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

    var capacitorMessage: String {
        get {
            return self.localizedDescription
        }
    }

    var capacitorData: [String: Any]? {
        get {
            let underlying = self.capacitorUnderlyingError
            if let underlying = underlying {
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
            }
            return nil
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
