package com.authgear.capacitor;

import android.content.ContentResolver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.Charset;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.SignatureException;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

class Authgear {

    private static final Charset UTF8 = Charset.forName("UTF-8");

    @Nullable
    String storageGetItem(Context ctx, String key) throws Exception {
        SharedPreferences sharedPreferences = this.getSharedPreferences(ctx);
        String value = sharedPreferences.getString(key, null);
        return value;
    }

    void storageSetItem(Context ctx, String key, String value) throws Exception {
        SharedPreferences sharedPreferences = this.getSharedPreferences(ctx);
        sharedPreferences.edit().putString(key, value).commit();
    }

    void storageDeleteItem(Context ctx, String key) throws Exception {
        SharedPreferences sharedPreferences = this.getSharedPreferences(ctx);
        sharedPreferences.edit().remove(key).commit();
    }

    byte[] randomBytes(int length) {
        SecureRandom rng = new SecureRandom();
        byte[] output = new byte[length];
        rng.nextBytes(output);
        return output;
    }

    byte[] sha256String(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(input.getBytes(Charset.forName("UTF-8")));
        return md.digest();
    }

    String generateUUID() {
        return UUID.randomUUID().toString();
    }

    JSONObject getDeviceInfo(Context ctx) throws Exception {
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

        JSONObject buildVersionMap = new JSONObject();
        buildVersionMap.put("BASE_OS", baseOS);
        buildVersionMap.put("CODENAME", Build.VERSION.CODENAME);
        buildVersionMap.put("INCREMENTAL", Build.VERSION.INCREMENTAL);
        buildVersionMap.put("PREVIEW_SDK_INT", previewSDKInt);
        buildVersionMap.put("RELEASE", Build.VERSION.RELEASE);
        buildVersionMap.put("RELEASE_OR_CODENAME", releaseOrCodename);
        buildVersionMap.put("SDK", Build.VERSION.SDK);
        buildVersionMap.put("SDK_INT", String.valueOf(Build.VERSION.SDK_INT));
        buildVersionMap.put("SECURITY_PATCH", securityPatch);

        JSONObject buildMap = new JSONObject();
        buildMap.put("BOARD", Build.BOARD);
        buildMap.put("BRAND", Build.BRAND);
        buildMap.put("MODEL", Build.MODEL);
        buildMap.put("DEVICE", Build.DEVICE);
        buildMap.put("DISPLAY", Build.DISPLAY);
        buildMap.put("HARDWARE", Build.HARDWARE);
        buildMap.put("MANUFACTURER", Build.MANUFACTURER);
        buildMap.put("PRODUCT", Build.PRODUCT);
        buildMap.put("VERSION", buildVersionMap);

        String packageName = ctx.getPackageName();
        PackageInfo packageInfo = ctx.getPackageManager().getPackageInfo(packageName, 0);
        String versionCode = String.valueOf(packageInfo.versionCode);
        String versionName = packageInfo.versionName;
        String longVersionCode = "";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            longVersionCode = String.valueOf(packageInfo.getLongVersionCode());
        }

        JSONObject packageInfoMap = new JSONObject();
        packageInfoMap.put("packageName", packageName);
        packageInfoMap.put("versionName", versionName);
        packageInfoMap.put("versionCode", versionCode);
        packageInfoMap.put("longVersionCode", longVersionCode);

        ContentResolver contentResolver = ctx.getContentResolver();

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

        JSONObject settingsGlobalMap = new JSONObject();
        settingsGlobalMap.put("DEVICE_NAME", deviceName);

        JSONObject settingsSecureMap = new JSONObject();
        settingsSecureMap.put("bluetooth_name", bluetoothName);
        settingsSecureMap.put("ANDROID_ID", androidID);

        JSONObject settingsMap = new JSONObject();
        settingsMap.put("Global", settingsGlobalMap);
        settingsMap.put("Secure", settingsSecureMap);

        CharSequence applicationInfoLabel = ctx.getApplicationInfo().loadLabel(ctx.getPackageManager());
        if (applicationInfoLabel == null) {
            applicationInfoLabel = "";
        }

        JSONObject androidMap = new JSONObject();
        androidMap.put("Build", buildMap);
        androidMap.put("PackageInfo", packageInfoMap);
        androidMap.put("Settings", settingsMap);
        androidMap.put("ApplicationInfoLabel", applicationInfoLabel.toString());

        JSONObject rootMap = new JSONObject();
        rootMap.put("android", androidMap);

        return rootMap;
    }

    int checkBiometricSupported(Context ctx, int flags) throws Exception {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            throw this.makeBiometricMinimumAPILevelException();
        }

        BiometricManager manager = BiometricManager.from(ctx);
        int result = manager.canAuthenticate(flags);

        if (result == BiometricManager.BIOMETRIC_SUCCESS) {
            // Further test if the key pair generator can be initialized.
            // https://issuetracker.google.com/issues/147374428#comment9
            try {
                this.createKeyPairGenerator(this.makeGenerateKeyPairSpec("__test__", flags, true));
            } catch (Exception e) {
                // This branch is reachable only when there is a weak face and no strong fingerprints.
                // So we treat this situation as BIOMETRIC_ERROR_NONE_ENROLLED.
                result = BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED;
                // fallthrough
            }
        }

        return result;
    }

    void createBiometricPrivateKey(AppCompatActivity activity, BiometricOptions options, BiometricCallback callback) throws Exception {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            throw this.makeBiometricMinimumAPILevelException();
        }

        BiometricPrompt.PromptInfo promptInfo = this.buildPromptInfo(options);
        KeyGenParameterSpec spec = this.makeGenerateKeyPairSpec(
                options.alias,
                this.authenticatorTypesToKeyProperties(options.flags),
                options.invalidatedByBiometricEnrollment
        );
        KeyPair keyPair = this.createKeyPair(spec);
        this.signBiometricJWT(
                activity,
                keyPair,
                options.kid,
                options.payload,
                promptInfo,
                callback
        );
    }

    void signWithBiometricPrivateKey(AppCompatActivity activity, BiometricOptions options, BiometricCallback callback) throws Exception {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            throw this.makeBiometricMinimumAPILevelException();
        }

        BiometricPrompt.PromptInfo promptInfo = this.buildPromptInfo(options);
        KeyPair keyPair = this.getPrivateKey(options.alias);
        this.signBiometricJWT(
                activity,
                keyPair,
                options.kid,
                options.payload,
                promptInfo,
                callback
        );
    }

    void removeBiometricPrivateKey(String alias) throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        keyStore.deleteEntry(alias);
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

    private BiometricPrompt.PromptInfo buildPromptInfo(
            BiometricOptions options
    ) {
        BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder();
        builder.setTitle(options.title);
        builder.setSubtitle(options.subtitle);
        builder.setDescription(options.description);
        builder.setAllowedAuthenticators(options.flags);
        if ((options.flags & BiometricManager.Authenticators.DEVICE_CREDENTIAL) == 0) {
            builder.setNegativeButtonText(options.negativeButtonText);
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

    private void signBiometricJWT(AppCompatActivity activity, KeyPair keyPair, String kid, JSONObject payload, BiometricPrompt.PromptInfo promptInfo, BiometricCallback callback) throws Exception {
        JSONObject jwk = this.makeJWK(keyPair, kid);
        JSONObject header = this.makeBiometricJWTHeader(jwk);
        Signature lockedSignature = this.makeSignature(keyPair.getPrivate());
        BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(lockedSignature);
        BiometricPrompt prompt = new BiometricPrompt(activity, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                callback.onAuthenticationError(errorCode, errString);
            }

            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                Signature signature = result.getCryptoObject().getSignature();
                try {
                    String jwt = Authgear.this.signJWT(signature, header, payload);
                    callback.onSuccess(jwt);
                } catch (SignatureException e) {
                    callback.onException(e);
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
        handler.post(() -> prompt.authenticate(promptInfo, cryptoObject));
    }

    private JSONObject makeJWK(KeyPair keyPair, String kid) throws JSONException {
        JSONObject jwk = new JSONObject();
        jwk.put("kid", kid);
        PublicKey publicKey = keyPair.getPublic();
        RSAPublicKey rsaPublicKey = (RSAPublicKey) publicKey;
        jwk.put("alg", "RS256");
        jwk.put("kty", "RSA");
        jwk.put("n", this.base64URLEncode(rsaPublicKey.getModulus().toByteArray()));
        jwk.put("e", this.base64URLEncode(rsaPublicKey.getPublicExponent().toByteArray()));
        return jwk;
    }

    private JSONObject makeBiometricJWTHeader(JSONObject jwk) throws JSONException {
        JSONObject header = new JSONObject();
        header.put("typ", "vnd.authgear.biometric-request");
        header.put("kid", jwk.getString("kid"));
        header.put("alg", jwk.getString("alg"));
        header.put("jwk", jwk);
        return header;
    }

    private Signature makeSignature(PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        return signature;
    }

    private String signJWT(Signature signature, JSONObject header, JSONObject payload) throws SignatureException {
        String headerJSON = header.toString();
        String payloadJSON = payload.toString();
        String headerString = this.base64URLEncode(headerJSON.getBytes(UTF8));
        String payloadString = this.base64URLEncode(payloadJSON.getBytes(UTF8));
        String strToSign = headerString + "." + payloadString;
        signature.update(strToSign.getBytes(UTF8));
        byte[] sig = signature.sign();
        return strToSign + "." + this.base64URLEncode(sig);
    }

    private String base64URLEncode(byte[] bytes) {
        return Base64.encodeToString(bytes, Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING);
    }

    private Exception makeBiometricMinimumAPILevelException() {
        return new Exception("Biometric authentication requires at least API Level 23");
    }

    private SharedPreferences getSharedPreferences(Context ctx) throws Exception     {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            MasterKey masterKey = new MasterKey.Builder(ctx)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            return EncryptedSharedPreferences.create(
                    ctx,
                    "authgear_encrypted_shared_preferences",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        }
        return ctx.getSharedPreferences("authgear_shared_preferences", Context.MODE_PRIVATE);
    }
}
