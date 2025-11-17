package com.authgear.reactnative;

import static java.lang.Math.ceil;

import java.io.File;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.Charset;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.interfaces.RSAPublicKey;
import java.util.Objects;
import java.util.UUID;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.crypto.tink.shaded.protobuf.InvalidProtocolBufferException;

import org.json.JSONObject;

class AuthgearReactNativeModuleImpl implements ActivityEventListener {
    static final String NAME = "AuthgearReactNative";

    private static final String LOGTAG = "AuthgearReactNative";
    private static final Charset UTF8 = Charset.forName("UTF-8");
    private static final String ENCRYPTED_SHARED_PREFERENCES_NAME = "authgear_encrypted_shared_preferences";
    private static final int ACTIVITY_PROMISE_TAG_CODE_AUTHORIZATION = 1;

    private final StartActivityHandles<Handle> mHandles;
    private final Module mModule;

    interface Module {
        ReactApplicationContext impl_getReactApplicationContext();
        void impl_sendEvent(ReadableMap body);
    }

    private static class Handle {
        Promise mPromise;
        BroadcastReceiver mBroadcastReceiver;

        Handle(Promise promise) {
            this.mPromise = promise;
        }
    }

    public AuthgearReactNativeModuleImpl(Module module) {
        this.mModule = module;
        this.mHandles = new StartActivityHandles<>();
        this.getReactApplicationContext().addActivityEventListener(this);
    }

    private ReactApplicationContext getReactApplicationContext() {
        return this.mModule.impl_getReactApplicationContext();
    }

    public void storageGetItem(String key, Promise promise) {
        try {
            SharedPreferences sharedPreferences = this.getSharePreferences();
            String value = sharedPreferences.getString(key, null);
            promise.resolve(value);
        } catch (Exception e) {
            // NOTE(backup): Please search NOTE(backup) to understand what is going on here.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                if (e instanceof GeneralSecurityException) {
                    Log.w(LOGTAG, "try to recover from backup problem in storageGetItem", e);
                    this.deleteSharedPreferences(getReactApplicationContext(), ENCRYPTED_SHARED_PREFERENCES_NAME);
                    this.storageGetItem(key, promise);
                    return;
                }
            }
            promise.reject(e.getClass().getName(), e.getMessage(), e);
        }
    }

    public void storageSetItem(String key, String value, Promise promise) {
        try {
            SharedPreferences sharedPreferences = this.getSharePreferences();
            sharedPreferences.edit().putString(key, value).commit();
            promise.resolve(null);
        } catch (Exception e) {
            // NOTE(backup): Please search NOTE(backup) to understand what is going on here.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                if (e instanceof GeneralSecurityException) {
                    Log.w(LOGTAG, "try to recover from backup problem in storageSetItem", e);
                    this.deleteSharedPreferences(getReactApplicationContext(), ENCRYPTED_SHARED_PREFERENCES_NAME);
                    this.storageSetItem(key, value, promise);
                    return;
                }
            }
            promise.reject(e.getClass().getName(), e.getMessage(), e);
        }
    }

    public void storageDeleteItem(String key, Promise promise) {
        try {
            SharedPreferences sharedPreferences = this.getSharePreferences();
            sharedPreferences.edit().remove(key).commit();
            promise.resolve(null);
        } catch (Exception e) {
            // NOTE(backup): Please search NOTE(backup) to understand what is going on here.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                if (e instanceof GeneralSecurityException) {
                    Log.w(LOGTAG, "try to recover from backup problem in storageDeleteItem", e);
                    this.deleteSharedPreferences(getReactApplicationContext(), ENCRYPTED_SHARED_PREFERENCES_NAME);
                    this.storageDeleteItem(key, promise);
                    return;
                }
            }
            promise.reject(e.getClass().getName(), e.getMessage(), e);
        }
    }

    private void deleteSharedPreferences(Context context, String name) {
        // NOTE(backup): Explanation on the backup problem.
        // EncryptedSharedPreferences depends on a master key stored in AndroidKeyStore.
        // The master key is not backed up.
        // However, the EncryptedSharedPreferences is backed up.
        // When the app is re-installed, and restored from a backup.
        // A new master key is created, but it cannot decrypt the restored EncryptedSharedPreferences.
        // This problem is persistence until the EncryptedSharedPreferences is deleted.
        //
        // The official documentation of EncryptedSharedPreferences tell us to
        // exclude the EncryptedSharedPreferences from a backup.
        // But defining a backup rule is not very appropriate in a SDK.
        // So we try to fix this in our code instead.
        //
        // This fix is tested against security-crypto@1.1.0-alpha06 and tink-android@1.8.0
        // Upgrading to newer versions may result in the library throwing a different exception that we fail to catch,
        // making this fix buggy.
        //
        // To reproduce the problem, you have to follow the steps here https://developer.android.com/identity/data/testingbackup#TestingBackup
        // The example app has been configured to back up the EncryptedSharedPreferences and nothing else.
        // One reason is to reproduce the problem, and another reason is that some platform, some Flutter,
        // store large files in the data directory. That will prevent the backup from working.
        //
        // The fix is to observe what exception was thrown by the underlying library
        // when the problem was re-produced.
        // When we catch the exception, we delete the EncryptedSharedPreferences and re-create it.
        //
        // Some references on how other fixed the problem.
        // https://github.com/stytchauth/stytch-android/blob/0.23.0/0.1.0/sdk/src/main/java/com/stytch/sdk/common/EncryptionManager.kt#L50
        // https://github.com/tink-crypto/tink-java/issues/23
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            context.deleteSharedPreferences(name);
        } else {
            context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().clear().apply();
            File dir = new File(context.getApplicationInfo().dataDir, "shared_prefs");
            new File(dir, name + ".xml").delete();
        }
    }

    private SharedPreferences getSharePreferences() throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            MasterKey masterKey = new MasterKey.Builder(getReactApplicationContext())
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            try {
                return EncryptedSharedPreferences.create(
                        getReactApplicationContext(),
                        ENCRYPTED_SHARED_PREFERENCES_NAME,
                        masterKey,
                        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                );
            } catch (InvalidProtocolBufferException e) {
                // NOTE(backup): Please search NOTE(backup) to understand what is going on here.
                Log.w(LOGTAG, "try to recover from backup problem in EncryptedSharedPreferences.create: ", e);
                this.deleteSharedPreferences(getReactApplicationContext(), ENCRYPTED_SHARED_PREFERENCES_NAME);
                return this.getSharePreferences();
            } catch (GeneralSecurityException e) {
                // NOTE(backup): Please search NOTE(backup) to understand what is going on here.
                Log.w(LOGTAG, "try to recover from backup problem in EncryptedSharedPreferences.create: ", e);
                this.deleteSharedPreferences(getReactApplicationContext(), ENCRYPTED_SHARED_PREFERENCES_NAME);
                return this.getSharePreferences();
            } catch (IOException e) {
                // NOTE(backup): Please search NOTE(backup) to understand what is going on here.
                Log.w(LOGTAG, "try to recover from backup problem in EncryptedSharedPreferences.create: ", e);
                this.deleteSharedPreferences(getReactApplicationContext(), ENCRYPTED_SHARED_PREFERENCES_NAME);
                return this.getSharePreferences();
            }
        }
        return getReactApplicationContext().getSharedPreferences("authgear_shared_preferences", Context.MODE_PRIVATE);
    }

    public void generateUUID(Promise promise) {
        String uuid = UUID.randomUUID().toString();
        promise.resolve(uuid);
    }

    public void getDeviceInfo(Promise promise) {
        String baseOS = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.BASE_OS != null) {
                baseOS = Build.VERSION.BASE_OS;
            }
        }
        String previewSDKInt = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            previewSDKInt = String.valueOf(Build.VERSION.PREVIEW_SDK_INT);
        }
        String releaseOrCodename = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (Build.VERSION.RELEASE_OR_CODENAME != null) {
                releaseOrCodename = Build.VERSION.RELEASE_OR_CODENAME;
            }
        }
        String securityPatch = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.SECURITY_PATCH != null) {
                securityPatch = Build.VERSION.SECURITY_PATCH;
            }
        }
        WritableMap buildVersionMap = Arguments.createMap();
        buildVersionMap.putString("BASE_OS", baseOS);
        buildVersionMap.putString("CODENAME", Build.VERSION.CODENAME);
        buildVersionMap.putString("INCREMENTAL", Build.VERSION.INCREMENTAL);
        buildVersionMap.putString("PREVIEW_SDK_INT", previewSDKInt);
        buildVersionMap.putString("RELEASE", Build.VERSION.RELEASE);
        buildVersionMap.putString("RELEASE_OR_CODENAME", releaseOrCodename);
        buildVersionMap.putString("SDK", Build.VERSION.SDK);
        buildVersionMap.putString("SDK_INT", String.valueOf(Build.VERSION.SDK_INT));
        buildVersionMap.putString("SECURITY_PATCH", securityPatch);

        WritableMap build = Arguments.createMap();
        build.putString("BOARD", Build.BOARD);
        build.putString("BRAND", Build.BRAND);
        build.putString("MODEL", Build.MODEL);
        build.putString("DEVICE", Build.DEVICE);
        build.putString("DISPLAY", Build.DISPLAY);
        build.putString("HARDWARE", Build.HARDWARE);
        build.putString("MANUFACTURER", Build.MANUFACTURER);
        build.putString("PRODUCT", Build.PRODUCT);
        build.putMap("VERSION", buildVersionMap);

        Context context = this.getReactApplicationContext();

        String packageName = context.getPackageName();
        PackageInfo packageInfo;
        try {
            packageInfo = context.getPackageManager().getPackageInfo(packageName, 0);
        } catch (Exception e) {
            promise.reject(e.getClass().getName(), e.getMessage(), e);
            return;
        }
        String versionCode = String.valueOf(packageInfo.versionCode);
        String versionName = packageInfo.versionName;
        String longVersionCode = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            longVersionCode = String.valueOf(packageInfo.getLongVersionCode());
        }
        WritableMap packageInfoMap = Arguments.createMap();
        packageInfoMap.putString("packageName", packageName);
        packageInfoMap.putString("versionName", versionName);
        packageInfoMap.putString("versionCode", versionCode);
        packageInfoMap.putString("longVersionCode", longVersionCode);

        ContentResolver contentResolver = context.getContentResolver();
        String bluetoothName = "";
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S) {
            bluetoothName = Settings.Secure.getString(contentResolver, "bluetooth_name");
            if (bluetoothName == null) {
                bluetoothName = "";
            }
        }
        String deviceName = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            deviceName = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME);
            if (deviceName == null) {
                deviceName = "";
            }
        }
        String androidID = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID);
        if (androidID == null) {
            androidID = "";
        }
        WritableMap settingsMap = Arguments.createMap();
        WritableMap settingsGlobalMap = Arguments.createMap();
        settingsGlobalMap.putString("DEVICE_NAME", deviceName);
        WritableMap settingsSecureMap = Arguments.createMap();
        settingsSecureMap.putString("bluetooth_name", bluetoothName);
        settingsSecureMap.putString("ANDROID_ID", androidID);
        settingsMap.putMap("Secure", settingsSecureMap);
        settingsMap.putMap("Global", settingsGlobalMap);

        CharSequence applicationInfoLabel = context.getApplicationInfo().loadLabel(context.getPackageManager());
        if (applicationInfoLabel == null) {
            applicationInfoLabel = "";
        }

        WritableMap android = Arguments.createMap();
        android.putMap("Build", build);
        android.putMap("PackageInfo", packageInfoMap);
        android.putMap("Settings", settingsMap);
        android.putString("ApplicationInfoLabel", applicationInfoLabel.toString());

        WritableMap root = Arguments.createMap();
        root.putMap("android", android);

        promise.resolve(root);
    }

    private String base64URLEncode(byte[] bytes) {
        return Base64.encodeToString(bytes, Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING);
    }

    private void rejectMinimumBiometricAPILevel(Promise promise) {
        promise.reject("DeviceAPILevelTooLow", "Biometric authentication requires at least API Level 23");
    }

    private int constraintToFlag(ReadableArray constraint) {
        int flag = 0;
        for (int i = 0; i < constraint.size(); i++) {
            String c = constraint.getString(i);
            if (c.equals("BIOMETRIC_STRONG")) {
                flag |= BiometricManager.Authenticators.BIOMETRIC_STRONG;
            }
            if (c.equals("DEVICE_CREDENTIAL")) {
                flag |= BiometricManager.Authenticators.DEVICE_CREDENTIAL;
            }
        }
        return flag;
    }

    private String resultToString(int result) {
        switch (result) {
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return "BIOMETRIC_ERROR_HW_UNAVAILABLE";
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return "BIOMETRIC_ERROR_NONE_ENROLLED";
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                return "BIOMETRIC_ERROR_NO_HARDWARE";
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                return "BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED";
            case BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED:
                return "BIOMETRIC_ERROR_UNSUPPORTED";
            case BiometricManager.BIOMETRIC_STATUS_UNKNOWN:
                return "BIOMETRIC_STATUS_UNKNOWN";
            default:
                return "BIOMETRIC_ERROR_UNKNOWN";
        }
    }

    public void checkBiometricSupported(ReadableMap options, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            this.rejectMinimumBiometricAPILevel(promise);
            return;
        }
        ReadableMap android = options.getMap("android");
        ReadableArray allowedAuthenticatorsOnEnable = android.getArray("allowedAuthenticatorsOnEnable");
        ReadableArray allowedAuthenticatorsOnAuthenticate = android.getArray("allowedAuthenticatorsOnAuthenticate");
        BiometricManager manager = BiometricManager.from(this.getReactApplicationContext());
        int allowedAuthenticatorsOnEnableFlags = constraintToFlag(allowedAuthenticatorsOnEnable);
        int allowedAuthenticatorsOnAuthenticateFlags = constraintToFlag(allowedAuthenticatorsOnAuthenticate);
        int result = manager.canAuthenticate(allowedAuthenticatorsOnEnableFlags);

        if (result == BiometricManager.BIOMETRIC_SUCCESS) {
            // Further test if the key pair generator can be initialized.
            // https://issuetracker.google.com/issues/147374428#comment9
            try {
                this.createKeyPairGenerator(this.makeGenerateKeyPairSpec("__test__", allowedAuthenticatorsOnAuthenticateFlags, true));
                promise.resolve(null);
                return;
            } catch (Exception e) {
                // This branch is reachable only when there is a weak face and no strong fingerprints.
                // So we treat this situation as BIOMETRIC_ERROR_NONE_ENROLLED.
                result = BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED;
                // fallthrough
            }
        }

        String resultString = resultToString(result);
        promise.reject(resultString, resultString);
    }

    public void removeBiometricPrivateKey(String kid, Promise promise) {
        String alias = "com.authgear.keys.biometric." + kid;
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            keyStore.deleteEntry(alias);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e.getClass().getName(), e.getMessage(), e);
        }
    }

    private BiometricPrompt.PromptInfo buildPromptInfo(
            ReadableMap android,
            int flags
    ) {
        String title = android.getString("title");
        String subtitle = android.getString("subtitle");
        String description = android.getString("description");
        String negativeButtonText = android.getString("negativeButtonText");

        BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder();
        builder.setTitle(title);
        builder.setSubtitle(subtitle);
        builder.setDescription(description);
        builder.setAllowedAuthenticators(flags);
        if ((flags & BiometricManager.Authenticators.DEVICE_CREDENTIAL) == 0) {
            builder.setNegativeButtonText(negativeButtonText);
        }
        return builder.build();
    }

    private int authenticatorTypesToKeyProperties(int flags) {
        int out = 0;
        if ((flags & BiometricManager.Authenticators.BIOMETRIC_STRONG) != 0) {
            out |= KeyProperties.AUTH_BIOMETRIC_STRONG;
        }
        if ((flags & BiometricManager.Authenticators.DEVICE_CREDENTIAL) != 0) {
            out |= KeyProperties.AUTH_DEVICE_CREDENTIAL;
        }
        return out;
    }

    private String errorCodeToString(int errorCode) {
        switch (errorCode) {
            case BiometricPrompt.ERROR_CANCELED:
                return "ERROR_CANCELED";
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
                return "ERROR_HW_NOT_PRESENT";
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return "ERROR_HW_UNAVAILABLE";
            case BiometricPrompt.ERROR_LOCKOUT:
                return "ERROR_LOCKOUT";
            case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
                return "ERROR_LOCKOUT_PERMANENT";
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
                return "ERROR_NEGATIVE_BUTTON";
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return "ERROR_NO_BIOMETRICS";
            case BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL:
                return "ERROR_NO_DEVICE_CREDENTIAL";
            case BiometricPrompt.ERROR_NO_SPACE:
                return "ERROR_NO_SPACE";
            case BiometricPrompt.ERROR_SECURITY_UPDATE_REQUIRED:
                return "ERROR_SECURITY_UPDATE_REQUIRED";
            case BiometricPrompt.ERROR_TIMEOUT:
                return "ERROR_TIMEOUT";
            case BiometricPrompt.ERROR_UNABLE_TO_PROCESS:
                return "ERROR_UNABLE_TO_PROCESS";
            case BiometricPrompt.ERROR_USER_CANCELED:
                return "ERROR_USER_CANCELED";
            case BiometricPrompt.ERROR_VENDOR:
                return "ERROR_VENDOR";
            default:
                return "ERROR_UNKNOWN";
        }
    }

    @RequiresApi(Build.VERSION_CODES.M)
    private KeyGenParameterSpec makeGenerateKeyPairSpec(String alias, int flags, boolean invalidatedByBiometricEnrollment) {
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
                alias, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
        );
        builder.setKeySize(2048);
        builder.setDigests(KeyProperties.DIGEST_SHA256);
        builder.setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1);
        builder.setUserAuthenticationRequired(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(
                    0,
                    flags
            );
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setInvalidatedByBiometricEnrollment(invalidatedByBiometricEnrollment);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Samsung Android 12 treats setUnlockedDeviceRequired in a different way.
            // If setUnlockedDeviceRequired is true, then the device must be unlocked
            // with the same level of security requirement.
            // Otherwise, UserNotAuthenticatedException will be thrown when a cryptographic operation is initialized.
            //
            // The steps to reproduce the bug
            //
            // - Restart the device
            // - Unlock the device with credentials
            // - Create a Signature with a PrivateKey with setUnlockedDeviceRequired(true)
            // - Call Signature.initSign, UserNotAuthenticatedException will be thrown.
            // builder.setUnlockedDeviceRequired(true);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // User confirmation is not needed because the BiometricPrompt itself is a kind of confirmation.
            // builder.setUserConfirmationRequired(true)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // User presence requires a physical button which is not our intended use case.
            // builder.setUserPresenceRequired(true)
        }

        return builder.build();
    }

    @RequiresApi(Build.VERSION_CODES.M)
    private KeyPair createKeyPair(KeyGenParameterSpec spec) throws Exception {
        return this.createKeyPairGenerator(spec).generateKeyPair();
    }

    @RequiresApi(Build.VERSION_CODES.M)
    private KeyPairGenerator createKeyPairGenerator(KeyGenParameterSpec spec) throws Exception {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore");
        keyPairGenerator.initialize(spec);
        return keyPairGenerator;
    }

    private WritableMap getJWK(KeyPair keyPair, String kid) {
        WritableMap jwk = Arguments.createMap();
        jwk.putString("kid", kid);
        PublicKey publicKey = keyPair.getPublic();
        RSAPublicKey rsaPublicKey = (RSAPublicKey) publicKey;
        jwk.putString("alg", "RS256");
        jwk.putString("kty", "RSA");
        jwk.putString("n", this.base64URLEncode(bigIntegerToUnsignedByteArray(rsaPublicKey.getModulus())));
        jwk.putString("e", this.base64URLEncode(bigIntegerToUnsignedByteArray(rsaPublicKey.getPublicExponent())));
        return jwk;
    }

    private WritableMap makeBiometricJWTHeader(WritableMap jwk) {
        WritableMap header = Arguments.createMap();
        header.putString("typ", "vnd.authgear.biometric-request");
        header.putString("kid", jwk.getString("kid"));
        header.putString("alg", jwk.getString("alg"));
        header.putMap("jwk", jwk);
        return header;
    }

    private WritableMap makeDPoPJWTHeader(WritableMap jwk) {
        WritableMap header = Arguments.createMap();
        header.putString("typ", "dpop+jwt");
        header.putString("kid", jwk.getString("kid"));
        header.putString("alg", jwk.getString("alg"));
        header.putMap("jwk", jwk);
        return header;
    }

    private Signature makeSignature(PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        return signature;
    }

    private String signJWT(Signature signature, ReadableMap header, ReadableMap payload) throws Exception {
        String headerJSON = new JSONObject(header.toHashMap()).toString();
        String payloadJSON = new JSONObject(payload.toHashMap()).toString();
        String headerString = this.base64URLEncode(headerJSON.getBytes(UTF8));
        String payloadString = this.base64URLEncode(payloadJSON.getBytes(UTF8));
        String strToSign = headerString + "." + payloadString;
        signature.update(strToSign.getBytes(UTF8));
        byte[] sig = signature.sign();
        return strToSign + "." + this.base64URLEncode(sig);
    }

    private void signBiometricJWT(FragmentActivity activity, KeyPair keyPair, String kid, final ReadableMap payload, final BiometricPrompt.PromptInfo promptInfo, final Promise promise) {
        WritableMap jwk = this.getJWK(keyPair, kid);
        final WritableMap header = this.makeBiometricJWTHeader(jwk);
        try {
            Signature lockedSigature = this.makeSignature(keyPair.getPrivate());
            final BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(lockedSigature);
            final BiometricPrompt prompt = new BiometricPrompt(activity, new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    promise.reject(AuthgearReactNativeModuleImpl.this.errorCodeToString(errorCode), errString.toString());
                }

                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                    Signature signature = result.getCryptoObject().getSignature();
                    try {
                        String jwt = AuthgearReactNativeModuleImpl.this.signJWT(signature, header, payload);
                        promise.resolve(jwt);
                    } catch (Exception e) {
                        promise.reject(e.getClass().getName(), e.getMessage(), e);
                    }
                }

                @Override
                public void onAuthenticationFailed() {
                    // This callback will be invoked EVERY time the recognition failed.
                    // So while the prompt is still opened, this callback can be called repetitively.
                    // Finally, either onAuthenticationError or onAuthenticationSucceeded will be called.
                    // So this callback is not important to the developer.
                }
            });
            Handler handler = new Handler(Looper.getMainLooper());
            handler.post(new Runnable() {
                @Override
                public void run() {
                    prompt.authenticate(promptInfo, cryptoObject);
                }
            });
        } catch (Exception e) {
            promise.reject(e.getClass().getName(), e.getMessage(), e);
        }
    }

    private FragmentActivity rejectFragmentActivity(Promise promise) {
        Activity activity = this.getReactApplicationContext().getCurrentActivity();
        if (activity instanceof FragmentActivity) {
            return (FragmentActivity) activity;
        }
        promise.reject("FragmentActivity", "getCurrentActivity must be androidx.fragment.app.FragmentActivity");
        return null;
    }

    public void createBiometricPrivateKey(ReadableMap options, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            this.rejectMinimumBiometricAPILevel(promise);
            return;
        }

        FragmentActivity fragmentActivity = this.rejectFragmentActivity(promise);
        if (fragmentActivity == null) {
            return;
        }

        String kid = options.getString("kid");
        ReadableMap payload = options.getMap("payload");
        ReadableMap android = options.getMap("android");
        ReadableArray allowedAuthenticatorsOnEnable = android.getArray("allowedAuthenticatorsOnEnable");
        ReadableArray allowedAuthenticatorsOnAuthenticate = android.getArray("allowedAuthenticatorsOnAuthenticate");
        boolean invalidatedByBiometricEnrollment = android.getBoolean("invalidatedByBiometricEnrollment");
        int allowedAuthenticatorsOnEnableFlags = constraintToFlag(allowedAuthenticatorsOnEnable);
        int allowedAuthenticatorsOnAuthenticateFlags = constraintToFlag(allowedAuthenticatorsOnAuthenticate);

        String alias = "com.authgear.keys.biometric." + kid;
        BiometricPrompt.PromptInfo promptInfo = this.buildPromptInfo(android, allowedAuthenticatorsOnEnableFlags);
        KeyGenParameterSpec spec = this.makeGenerateKeyPairSpec(alias, authenticatorTypesToKeyProperties(allowedAuthenticatorsOnAuthenticateFlags), invalidatedByBiometricEnrollment);

        try {
            KeyPair keyPair = this.createKeyPair(spec);
            this.signBiometricJWT(fragmentActivity, keyPair, kid, payload, promptInfo, promise);
        } catch (Exception e) {
            promise.reject(e.getClass().getName(), e.getMessage(), e);
            return;
        }
    }

    private KeyPair getPrivateKey(String alias) throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        KeyStore.Entry entry = keyStore.getEntry(alias, null);
        if (entry instanceof KeyStore.PrivateKeyEntry) {
            KeyStore.PrivateKeyEntry privateKeyEntry = (KeyStore.PrivateKeyEntry) entry;
            return new KeyPair(privateKeyEntry.getCertificate().getPublicKey(), privateKeyEntry.getPrivateKey());
        }
        throw new KeyNotFoundException();
    }

    public void signWithBiometricPrivateKey(ReadableMap options, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            this.rejectMinimumBiometricAPILevel(promise);
            return;
        }

        FragmentActivity fragmentActivity = this.rejectFragmentActivity(promise);
        if (fragmentActivity == null) {
            return;
        }

        String kid = options.getString("kid");
        ReadableMap payload = options.getMap("payload");
        ReadableMap android = options.getMap("android");
        ReadableArray allowedAuthenticatorsOnAuthenticate = android.getArray("allowedAuthenticatorsOnAuthenticate");
        int allowedAuthenticatorsOnAuthenticateFlags = constraintToFlag(allowedAuthenticatorsOnAuthenticate);

        String alias = "com.authgear.keys.biometric." + kid;
        BiometricPrompt.PromptInfo promptInfo = this.buildPromptInfo(android, allowedAuthenticatorsOnAuthenticateFlags);

        try {
            KeyPair keyPair = this.getPrivateKey(alias);
            this.signBiometricJWT(fragmentActivity, keyPair, kid, payload, promptInfo, promise);
        } catch (Exception e) {
            promise.reject(e.getClass().getName(), e.getMessage(), e);
            return;
        }
    }

    public void dismiss(Promise promise) {
        promise.resolve(null);
    }

    public void randomBytes(double length, Promise promise) {
        SecureRandom rng = new SecureRandom();
        byte[] output = new byte[new Double(length).intValue()];
        rng.nextBytes(output);
        promise.resolve(this.bytesToArray(output));
    }

    public void sha256String(String input, Promise promise) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(input.getBytes(Charset.forName("UTF-8")));
            promise.resolve(this.bytesToArray(md.digest()));
        } catch (NoSuchAlgorithmException e) {
            promise.reject(e);
        }
    }

    public void openAuthorizeURLWithWebView(ReadableMap options, Promise promise) {
        final Handle handle = new Handle(promise);
        final int requestCode = this.mHandles.push(new StartActivityHandle<>(ACTIVITY_PROMISE_TAG_CODE_AUTHORIZATION, handle));

        try {
            Activity currentActivity = this.getReactApplicationContext().getCurrentActivity();
            if (currentActivity == null) {
                promise.reject(new Exception("No Activity"));
                return;
            }

            Context ctx = currentActivity;

            String invocationID = options.getString("invocationID");
            Uri url = Uri.parse(options.getString("url"));
            Uri redirectURI = Uri.parse(options.getString("redirectURI"));
            Integer actionBarBackgroundColor = this.readColorInt(options, "actionBarBackgroundColor");
            Integer actionBarButtonTintColor = this.readColorInt(options, "actionBarButtonTintColor");
            String wechatRedirectURIString = options.getString("androidWechatRedirectURI");

            WebKitWebViewActivity.Options webViewOptions = new WebKitWebViewActivity.Options();
            webViewOptions.url = url;
            webViewOptions.redirectURI = redirectURI;
            webViewOptions.actionBarBackgroundColor = actionBarBackgroundColor;
            webViewOptions.actionBarButtonTintColor = actionBarButtonTintColor;
            if (wechatRedirectURIString != null) {
                String intentAction = String.format("com.authgear.reactnative.callback.%s", invocationID);
                handle.mBroadcastReceiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent) {
                        if (Objects.equals(intent.getAction(), intentAction)) {
                            String uriString = intent.getExtras().getString("uri");
                            WritableMap map = Arguments.createMap();
                            map.putString("invocationID", invocationID);
                            map.putString("url", uriString);
                            AuthgearReactNativeModuleImpl.this.sendEvent(map);
                        }
                    }
                };

                IntentFilter intentFilter = new IntentFilter(intentAction);

                webViewOptions.wechatRedirectURI = Uri.parse(wechatRedirectURIString);
                webViewOptions.wechatRedirectURIIntentAction = intentAction;

                ContextCompat.registerReceiver(ctx.getApplicationContext(), handle.mBroadcastReceiver, intentFilter, ContextCompat.RECEIVER_NOT_EXPORTED);
            }

            Intent intent = WebKitWebViewActivity.createIntent(ctx, webViewOptions);
            currentActivity.startActivityForResult(intent, requestCode);
        } catch (Exception e) {
            StartActivityHandle<Handle> startActivityHandle = this.mHandles.pop(requestCode);
            if (startActivityHandle != null) {
                startActivityHandle.value.mPromise.reject(e);
            }
        }
    }

    private Integer readColorInt(ReadableMap map, String key) {
        if (map.hasKey(key)) {
            String s = map.getString(key);
            long l = Long.parseLong(s, 16);
            int a = (int) ((l >> 24) & 0xff);
            int r = (int) ((l >> 16) & 0xff);
            int g = (int) ((l >> 8) &0xff);
            int b = (int) (l & 0xff);
            return Color.argb(a, r, g, b);
        }
        return null;
    }

    private void sendEvent(ReadableMap map) {
        this.mModule.impl_sendEvent(map);
    }

    public void openAuthorizeURL(String urlString, String callbackURL, boolean shareSessionWithSystemBrowser, Promise promise) {
        final Handle handle = new Handle(promise);
        final int requestCode = this.mHandles.push(new StartActivityHandle<>(ACTIVITY_PROMISE_TAG_CODE_AUTHORIZATION, handle));
        try {
            Activity currentActivity = this.getReactApplicationContext().getCurrentActivity();
            if (currentActivity == null) {
                promise.reject(new Exception("No Activity"));
                return;
            }

            Context context = currentActivity;
            Uri uri = Uri.parse(urlString).normalizeScheme();
            OAuthRedirectActivity.registerCallbackURL(callbackURL);

            Intent intent = OAuthCoordinatorActivity.createAuthorizationIntent(context, uri);
            currentActivity.startActivityForResult(intent, requestCode);
        } catch (Exception e) {
            StartActivityHandle<Handle> startActivityHandle = this.mHandles.pop(requestCode);
            if (startActivityHandle != null) {
                startActivityHandle.value.mPromise.reject(e);
            }
        }
    }

    public void getAnonymousKey(String kid, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.reject("EUNSPECIFIED", "Anonymous authentication is not supported on Android before version M.");
            return;
        }

        try {
            if (kid == null) {
                kid = UUID.randomUUID().toString();
            }
            WritableMap header = Arguments.createMap();
            header.putString("kid", kid);
            header.putString("alg", "RS256");

            String alias = "com.authgear.keys.anonymous." + kid;
            KeyStore.PrivateKeyEntry entry = this.loadKey(alias);
            if (entry == null) {
                KeyPair kp = this.generateKey(alias);
                WritableMap jwk = this.getJWK(kp, kid);
                header.putMap("jwk", jwk);
            }

            promise.resolve(header);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    public void signAnonymousToken(String kid, String data, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.reject("EUNSPECIFIED", "Anonymous authentication is not supported on Android before version M.");
            return;
        }

        try {
            String alias = "com.authgear.keys.anonymous." + kid;
            KeyStore.PrivateKeyEntry entry = this.loadKey(alias);
            if (entry == null) {
                promise.reject("EUNSPECIFIED", "Anonymous user key not found.");
                return;
            }

            Signature s = Signature.getInstance("SHA256withRSA");
            s.initSign(entry.getPrivateKey());
            s.update(data.getBytes("UTF-8"));
            byte[] signature = s.sign();
            promise.resolve(this.base64URLEncode(signature));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    public void checkDPoPSupported(ReadableMap options, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve("false");
            return;
        }
        promise.resolve("true");
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public void createDPoPPrivateKey(ReadableMap options, Promise promise) {
        String kid = options.getString("kid");
        String alias = this.formatDPoPKeyAlias(kid);
        try {
            this.generateKey(alias);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    public void signWithDPoPPrivateKey(ReadableMap options, Promise promise) {
        String kid = options.getString("kid");
        ReadableMap payload = options.getMap("payload");
        String alias = this.formatDPoPKeyAlias(kid);
        try {
            KeyPair keyPair = this.getPrivateKey(alias);
            WritableMap jwk = this.getJWK(keyPair, kid);
            final WritableMap header = this.makeDPoPJWTHeader(jwk);
            Signature signature = this.makeSignature(keyPair.getPrivate());
            String jwt = this.signJWT(signature, header, payload);
            promise.resolve(jwt);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    public void checkDPoPPrivateKey(ReadableMap options, Promise promise) {
        String kid = options.getString("kid");
        String alias = this.formatDPoPKeyAlias(kid);
        try {
            this.getPrivateKey(alias);
            promise.resolve("true");
        } catch (Exception e) {
            promise.resolve("false");
        }
    }

    public void computeDPoPJKT(ReadableMap options, Promise promise) {
        String kid = options.getString("kid");
        String alias = this.formatDPoPKeyAlias(kid);
        try {
            KeyPair keyPair = this.getPrivateKey(alias);
            WritableMap jwk = this.getJWK(keyPair, kid);
            JSONObject params = new JSONObject();
            params.put("e", jwk.getString("e"));
            params.put("kty", jwk.getString("kty"));
            params.put("n", jwk.getString("n"));
            byte[] jsonBytes = params.toString().getBytes();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(jsonBytes);
            String jkt = this.base64URLEncode(hashBytes);
            promise.resolve(jkt);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    private String formatDPoPKeyAlias(String kid) {
        return "com.authgear.keys.dpop." + kid;
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        final StartActivityHandle<Handle> startActivityHandle = this.mHandles.pop(requestCode);
        if (startActivityHandle != null) {
            final int tag = startActivityHandle.tag;
            final Promise promise = startActivityHandle.value.mPromise;
            if (startActivityHandle.value.mBroadcastReceiver != null) {
                activity.getApplicationContext().unregisterReceiver(startActivityHandle.value.mBroadcastReceiver);
            }
            switch (tag) {
                case ACTIVITY_PROMISE_TAG_CODE_AUTHORIZATION:
                    if (resultCode == Activity.RESULT_CANCELED) {
                        promise.reject("CANCEL", "CANCEL");
                    }
                    if (resultCode == Activity.RESULT_OK) {
                        promise.resolve(data.getData().toString());
                    }
                    break;
            }
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // no-op
    }

    private WritableArray bytesToArray(byte[] bytes) {
        WritableArray arr = Arguments.createArray();
        for (int i = 0; i < bytes.length; i++) {
            arr.pushInt(bytes[i] & 0xff);
        }
        return arr;
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private KeyStore.PrivateKeyEntry loadKey(String alias) throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        KeyStore.Entry entry = ks.getEntry(alias, null);
        if (!(entry instanceof KeyStore.PrivateKeyEntry)) {
            return null;
        }
        KeyStore.PrivateKeyEntry pke = (KeyStore.PrivateKeyEntry) entry;
        return pke;
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private KeyPair generateKey(String alias) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore");
        kpg.initialize(
                new KeyGenParameterSpec.Builder(alias,
                        KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
                )
                        .setDigests(KeyProperties.DIGEST_SHA256)
                        .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
                        .build()
        );
        KeyPair kp = kpg.generateKeyPair();
        return kp;
    }

    private byte[] bigIntegerToUnsignedByteArray(BigInteger bigint) {
        // BigInteger always include a bit to represent the sign
        // So the array length is ceil((this.bitLength() + 1)/8)
        // This sign bit causes an extra byte to be added to the ByteArray when bitLength is just divisible by 8
        // We want to exclude that extra byte in some cases, such as sending the bytes in a JWK as Base64urlUInt
        int expectedLength = (int)ceil(bigint.bitLength() / 8.0);
        byte[] bytes = bigint.toByteArray();
        int startIdx = bytes.length - expectedLength;
        int endIdx = bytes.length - 1;
        byte[] slicedBytes = new byte[endIdx - startIdx + 1];
        System.arraycopy(bytes, startIdx, slicedBytes, 0, slicedBytes.length);
        return slicedBytes;
    }

    private static String getURLWithoutQuery(Uri uri) {
        Uri.Builder builder = uri.buildUpon().clearQuery();
        builder = builder.fragment("");
        return builder.build().toString();
    }
}
