package com.authgear.reactnative;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import javax.annotation.Nonnull;

public class AuthgearReactNativeModule extends ReactContextBaseJavaModule implements AuthgearReactNativeModuleImpl.Module {

    private final AuthgearReactNativeModuleImpl mImpl;

    public AuthgearReactNativeModule(ReactApplicationContext context) {
        super(context);
        this.mImpl = new AuthgearReactNativeModuleImpl(this);
    }

    @Override
    public ReactApplicationContext impl_getReactApplicationContext() {
        return this.getReactApplicationContext();
    }

    @Override
    @Nonnull
    public String getName() {
        return AuthgearReactNativeModuleImpl.NAME;
    }

    @ReactMethod
    public void storageGetItem(String key, Promise promise) {
        this.mImpl.storageGetItem(key, promise);
    }

    @ReactMethod
    public void storageSetItem(String key, String value, Promise promise) {
        this.mImpl.storageSetItem(key, value, promise);
    }

    @ReactMethod
    public void storageDeleteItem(String key, Promise promise) {
        this.mImpl.storageDeleteItem(key, promise);
    }

    @ReactMethod
    public void generateUUID(Promise promise) {
        this.mImpl.generateUUID(promise);
    }

    @ReactMethod
    public void getDeviceInfo(Promise promise) {
        this.mImpl.getDeviceInfo(promise);
    }

    @ReactMethod
    public void checkBiometricSupported(ReadableMap options, Promise promise) {
        this.mImpl.checkBiometricSupported(options, promise);
    }

    @ReactMethod
    public void removeBiometricPrivateKey(String kid, Promise promise) {
        this.mImpl.removeBiometricPrivateKey(kid, promise);
    }

    @ReactMethod
    public void createBiometricPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.createBiometricPrivateKey(options, promise);
    }

    @ReactMethod
    public void signWithBiometricPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.signWithBiometricPrivateKey(options, promise);
    }

    @ReactMethod
    public void dismiss(Promise promise) {
        this.mImpl.dismiss(promise);
    }

    @ReactMethod
    public void randomBytes(int length, Promise promise) {
        this.mImpl.randomBytes(length, promise);
    }

    @ReactMethod
    public void sha256String(String input, Promise promise) {
        this.mImpl.sha256String(input, promise);
    }

    @ReactMethod
    public void openAuthorizeURLWithWebView(ReadableMap options, Promise promise) {
        this.mImpl.openAuthorizeURLWithWebView(options, promise);
    }

    @ReactMethod
    public void openAuthorizeURL(String urlString, String callbackURL, boolean shareSessionWithSystemBrowser, Promise promise) {
        this.mImpl.openAuthorizeURL(urlString, callbackURL, shareSessionWithSystemBrowser, promise);
    }

    @ReactMethod
    public void getAnonymousKey(String kid, Promise promise) {
        this.mImpl.getAnonymousKey(kid, promise);
    }

    @ReactMethod
    public void signAnonymousToken(String kid, String data, Promise promise) {
        this.mImpl.signAnonymousToken(kid, data, promise);
    }

    @ReactMethod
    public void checkDPoPSupported(ReadableMap options, Promise promise) {
        this.mImpl.checkDPoPSupported(options, promise);
    }

    @ReactMethod
    public void createDPoPPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.createDPoPPrivateKey(options, promise);
    }

    @ReactMethod
    public void signWithDPoPPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.signWithDPoPPrivateKey(options, promise);
    }

    @ReactMethod
    public void checkDPoPPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.checkDPoPPrivateKey(options, promise);
    }

    @ReactMethod
    public void computeDPoPJKT(ReadableMap options, Promise promise) {
        this.mImpl.computeDPoPJKT(options, promise);
    }
}
