import Foundation
import LocalAuthentication
import Capacitor

@objc(AuthgearPlugin)
public class AuthgearPlugin: CAPPlugin {
    private let impl = AuthgearPluginImpl()

    @objc func storageGetItem(_ call: CAPPluginCall) {
        let key = call.getString("key")!
        do {
            let value = try self.impl.storageGetItem(key: key)
            call.resolve([
                "value": value,
            ])
        } catch {
            let nsError = error as NSError
            if nsError.domain == NSOSStatusErrorDomain && nsError.code == errSecItemNotFound {
                call.resolve([
                    "value": nil
                ])
            } else {
                error.reject(call)
            }
        }
    }

    @objc func storageSetItem(_ call: CAPPluginCall) {
        let key = call.getString("key")!
        let value = call.getString("value")!
        do {
            try self.impl.storageSetItem(key: key, value: value)
            call.resolve()
        } catch {
            error.reject(call)
        }
    }

    @objc func storageDeleteItem(_ call: CAPPluginCall) {
        let key = call.getString("key")!
        do {
            try self.impl.storageDeleteItem(key: key)
            call.resolve()
        } catch {
            error.reject(call)
        }
    }

    @objc func randomBytes(_ call: CAPPluginCall) {
        let length = call.getInt("length")!
        do {
            let bytes = try self.impl.randomBytes(length: length)
            call.resolve([
                "bytes": bytes,
            ])
        } catch {
            error.reject(call)
        }
    }

    @objc func sha256String(_ call: CAPPluginCall) {
        let input = call.getString("input")!
        do {
            let bytes = try self.impl.sha256String(input: input)
            call.resolve([
                "bytes": bytes,
            ])
        } catch {
            error.reject(call)
        }
    }

    @objc func getDeviceInfo(_ call: CAPPluginCall) {
        let deviceInfo = self.impl.getDeviceInfo()
        call.resolve([
            "deviceInfo": deviceInfo
        ])
    }

    @objc func generateUUID(_ call: CAPPluginCall) {
        let uuid = self.impl.generateUUID()
        call.resolve([
            "uuid": uuid
        ])
    }

    @objc func openAuthorizeURL(_ call: CAPPluginCall) {
        let url = URL(string: call.getString("url")!)!
        let callbackURL = URL(string: call.getString("callbackURL")!)!
        let prefersEphemeralWebBrowserSession = call.getBool("prefersEphemeralWebBrowserSession")!

        DispatchQueue.main.async {
            self.impl.openAuthorizeURL(window: (self.bridge?.webView?.window)!, url: url, callbackURL: callbackURL, prefersEphemeralWebBrowserSession:                prefersEphemeralWebBrowserSession) { (redirectURI, error) in
                if let error = error {
                    error.reject(call)
                }
                if let redirectURI = redirectURI {
                    call.resolve([
                        "redirectURI": redirectURI
                    ])
                }
            }
        }
    }

    @objc func openAuthorizeURLWithWebView(_ call: CAPPluginCall) {
        let url = URL(string: call.getString("url")!)!
        let redirectURI = URL(string: call.getString("redirectURI")!)!
        let modalPresentationStyle = call.getString("modalPresentationStyle")
        let navigationBarBackgroundColor = call.getString("navigationBarBackgroundColor")
        let navigationBarButtonTintColor = call.getString("navigationBarButtonTintColor")
        let isInspectable = call.getBool("iosIsInspectable")

        DispatchQueue.main.async {
            self.impl.openAuthorizeURLWithWebView(
                window: (self.bridge?.webView?.window)!,
                url: url,
                redirectURI: redirectURI,
                modalPresentationStyleString: modalPresentationStyle,
                navigationBarBackgroundColorString: navigationBarBackgroundColor,
                navigationBarButtonTintColorString: navigationBarButtonTintColor,
                isInspectable: isInspectable
            ) { (redirectURI, error) in
                if let error = error {
                    error.reject(call)
                }
                if let redirectURI = redirectURI {
                    call.resolve([
                        "redirectURI": redirectURI
                    ])
                }
            }
        }
    }

    @objc func openURL(_ call: CAPPluginCall) {
        let url = URL(string: call.getString("url")!)!

        DispatchQueue.main.async {
            self.impl.openURL(window: (self.bridge?.webView?.window)!, url: url) { (error) in
                if let error = error {
                    error.reject(call)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func checkBiometricSupported(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                try self.impl.checkBiometricSupported()
                call.resolve()
            } catch {
                error.reject(call)
            }
        }
    }

    @objc func createBiometricPrivateKey(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!
        let payload = call.getObject("payload")!
        let ios = call.getObject("ios")!
        let constraint = ios["constraint"] as! String
        let localizedReason = ios["localizedReason"] as! String
        let tag = "com.authgear.keys.biometric.\(kid)"
        let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics

        DispatchQueue.main.async {
            self.impl.createBiometricPrivateKey(
                policy: policy,
                localizedReason: localizedReason,
                constraint: constraint,
                kid: kid,
                tag: tag,
                payload: payload
            ) { (jwt, error) in
                if let error = error {
                    error.reject(call)
                }
                if let jwt = jwt {
                    call.resolve([
                        "jwt": jwt
                    ])
                }
            }
        }
    }

    @objc func signWithBiometricPrivateKey(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!
        let payload = call.getObject("payload")!
        let ios = call.getObject("ios")!
        let policyString = ios["policy"] as! String
        let localizedReason = ios["localizedReason"] as! String
        let tag = "com.authgear.keys.biometric.\(kid)"

        DispatchQueue.main.async {
            self.impl.signWithBiometricPrivateKey(
                policyString: policyString,
                localizedReason: localizedReason,
                kid: kid,
                tag: tag,
                payload: payload
            ) { (jwt, error) in
                if let error = error {
                    error.reject(call)
                }
                if let jwt = jwt {
                    call.resolve([
                        "jwt": jwt
                    ])
                }
            }
        }
    }

    @objc func removeBiometricPrivateKey(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!
        let tag = "com.authgear.keys.biometric.\(kid)"

        DispatchQueue.main.async {
            do {
                try self.impl.removeBiometricPrivateKey(tag: tag)
                call.resolve()
            } catch {
                error.reject(call)
            }
        }
    }

    @objc func createDPoPPrivateKey(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!

        DispatchQueue.main.async {
            do {
                try self.impl.createDPoPPrivateKey(kid: kid)
                call.resolve()
            } catch {
                error.reject(call)
            }
        }
    }

    @objc func signWithDPoPPrivateKey(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!
        let payload = call.getObject("payload")!

        DispatchQueue.main.async {
            do {
                let jwt = try self.impl.signWithDPoPPrivateKey(kid: kid, payload: payload)
                call.resolve(["jwt": jwt])
            } catch {
                error.reject(call)
            }
        }
    }

    @objc func checkDPoPPrivateKey(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!

        DispatchQueue.main.async {
            let ok = self.impl.checkDPoPPrivateKey(kid: kid)
            call.resolve(["ok": ok])
        }
    }

    @objc func computeDPoPJKT(_ call: CAPPluginCall) {
        let kid = call.getString("kid")!

        DispatchQueue.main.async {
            do {
                let jkt = try self.impl.computeDPoPJKT(kid: kid)
                call.resolve(["jkt": jkt])
            } catch {
                error.reject(call)
            }
        }
    }
}
