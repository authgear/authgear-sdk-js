package com.authgear.reactnative;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;

public class AuthgearReactNativeModule extends NativeAuthgearReactNativeSpec implements AuthgearReactNativeModuleImpl.Module {

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
    public void impl_sendEvent(ReadableMap body) {
        this.emitOnAuthgearReactNative(body);
    }

    @Override
    public void storageGetItem(String key, Promise promise) {
        this.mImpl.storageGetItem(key, promise);
    }

    @Override
    public void storageSetItem(String key, String value, Promise promise) {
        this.mImpl.storageSetItem(key, value, promise);
    }

    @Override
    public void storageDeleteItem(String key, Promise promise) {
        this.mImpl.storageDeleteItem(key, promise);
    }

    @Override
    public void getDeviceInfo(Promise promise) {
        this.mImpl.getDeviceInfo(promise);
    }

    @Override
    public void randomBytes(double length, Promise promise) {
        this.mImpl.randomBytes(length, promise);
    }

    @Override
    public void sha256String(String input, Promise promise) {
        this.mImpl.sha256String(input, promise);
    }

    @Override
    public void generateUUID(Promise promise) {
        this.mImpl.generateUUID(promise);
    }

    @Override
    public void openAuthorizeURL(String url, String callbackURL, boolean prefersEphemeralWebBrowserSession, Promise promise) {
        this.mImpl.openAuthorizeURL(url, callbackURL, prefersEphemeralWebBrowserSession, promise);
    }

    @Override
    public void openAuthorizeURLWithWebView(ReadableMap options, Promise promise) {
        this.mImpl.openAuthorizeURLWithWebView(options, promise);
    }

    @Override
    public void dismiss(Promise promise) {
        this.mImpl.dismiss(promise);
    }

    @Override
    public void getAnonymousKey(@Nullable String kid, Promise promise) {
        this.mImpl.getAnonymousKey(kid, promise);
    }

    @Override
    public void signAnonymousToken(String kid, String tokenData, Promise promise) {
        this.mImpl.signAnonymousToken(kid, tokenData, promise);
    }

    @Override
    public void createBiometricPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.createBiometricPrivateKey(options, promise);
    }

    @Override
    public void signWithBiometricPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.signWithBiometricPrivateKey(options, promise);
    }

    @Override
    public void removeBiometricPrivateKey(String kid, Promise promise) {
        this.mImpl.removeBiometricPrivateKey(kid, promise);
    }

    @Override
    public void checkBiometricSupported(ReadableMap options, Promise promise) {
        this.mImpl.checkBiometricSupported(options, promise);
    }

    @Override
    public void checkDPoPSupported(ReadableMap stub, Promise promise) {
        this.mImpl.checkDPoPSupported(stub, promise);
    }

    @Override
    public void createDPoPPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.createDPoPPrivateKey(options, promise);
    }

    @Override
    public void signWithDPoPPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.signWithDPoPPrivateKey(options, promise);
    }

    @Override
    public void checkDPoPPrivateKey(ReadableMap options, Promise promise) {
        this.mImpl.checkDPoPPrivateKey(options, promise);
    }

    @Override
    public void computeDPoPJKT(ReadableMap options, Promise promise) {
        this.mImpl.computeDPoPJKT(options, promise);
    }
}
