#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(AuthgearPlugin, "Authgear",
           CAP_PLUGIN_METHOD(storageGetItem, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(storageSetItem, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(storageDeleteItem, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(randomBytes, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sha256String, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getDeviceInfo, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(generateUUID, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(openAuthorizeURL, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(openAuthorizeURLWithWebView, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(openURL, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(checkBiometricSupported, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(createBiometricPrivateKey, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(signWithBiometricPrivateKey, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(removeBiometricPrivateKey, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(createDPoPPrivateKey, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(signWithDPoPPrivateKey, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(checkDPoPPrivateKey, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(computeDPoPJKT, CAPPluginReturnPromise);
)
