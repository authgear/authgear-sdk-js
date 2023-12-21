package com.authgear.capacitor;

import android.content.ContentResolver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.Nullable;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import org.json.JSONObject;

import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.SecureRandom;

class Authgear {
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
        rootMap.put("android", rootMap);

        return rootMap;
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
