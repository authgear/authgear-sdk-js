package com.authgear.capacitor;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSValue;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "Authgear")
public class AuthgearPlugin extends Plugin {

    private Authgear implementation = new Authgear();

    @PluginMethod
    public void storageGetItem(PluginCall call) {
        String key = call.getString("key");
        try {
            Context ctx = this.getContext();
            String value = this.implementation.storageGetItem(ctx, key);
            JSObject ret = new JSObject();
            if (value == null) {
                ret.put("value", JSONObject.NULL);
            } else {
                ret.put("value", value);
            }
            call.resolve(ret);
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void storageSetItem(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        try {
            Context ctx = this.getContext();
            this.implementation.storageSetItem(ctx, key, value);
            call.resolve();
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void storageDeleteItem(PluginCall call) {
        String key = call.getString("key");
        try {
            Context ctx = this.getContext();
            this.implementation.storageDeleteItem(ctx, key);
            call.resolve();
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void randomBytes(PluginCall call) {
        Integer length = call.getInt("length");
        try {
            byte[] bytes = this.implementation.randomBytes(length.intValue());
            JSArray array = new JSArray();
            for (byte b : bytes) {
                array.put(b);
            }
            JSObject ret = new JSObject();
            ret.put("bytes", array);
            call.resolve(ret);
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void sha256String(PluginCall call) {
        String input = call.getString("input");
        try {
            byte[] bytes = this.implementation.sha256String(input);
            JSArray array = new JSArray();
            for (byte b : bytes) {
                array.put(b);
            }
            JSObject ret = new JSObject();
            ret.put("bytes", array);
            call.resolve(ret);
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        try {
            Context ctx = this.getContext();
            JSONObject deviceInfo = this.implementation.getDeviceInfo(ctx);
            JSObject ret = new JSObject();
            ret.put("deviceInfo", deviceInfo);
            call.resolve(ret);
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void generateUUID(PluginCall call) {
        String uuid = this.implementation.generateUUID();
        JSObject ret = new JSObject();
        ret.put("uuid", uuid);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAuthorizeURL(PluginCall call) {
        String urlString = call.getString("url");
        Uri uri = Uri.parse(urlString).normalizeScheme();
        String callbackURLString = call.getString("callbackURL");
        Uri callbackURL = Uri.parse(callbackURLString).normalizeScheme();

        Context ctx = this.getContext();
        OAuthRedirectActivity.registerCallbackURL(callbackURL.toString());
        Intent intent = OAuthCoordinatorActivity.createAuthorizationIntent(ctx, uri);
        this.startActivityForResult(call, intent, "handleOpenAuthorizeURL");
    }

    @ActivityCallback
    private void handleOpenAuthorizeURL(PluginCall call, ActivityResult activityResult) {
        int resultCode = activityResult.getResultCode();
        if (resultCode == Activity.RESULT_CANCELED) {
            this.rejectWithCancel(call);
        }
        if (resultCode == Activity.RESULT_OK) {
            String redirectURI = activityResult.getData().getData().toString();
            JSObject ret = new JSObject();
            ret.put("redirectURI", redirectURI);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openURL(PluginCall call) {
        String urlString = call.getString("url");
        Uri uri = Uri.parse(urlString).normalizeScheme();

        Context ctx = this.getContext();
        Intent intent = WebViewActivity.createIntent(ctx, uri.toString());
        this.startActivityForResult(call, intent, "handleOpenURL");
    }

    @ActivityCallback
    private void handleOpenURL(PluginCall call, ActivityResult activityResult) {
        int resultCode = activityResult.getResultCode();
        if (resultCode == Activity.RESULT_CANCELED) {
            call.resolve();
        }
        if (resultCode == Activity.RESULT_OK) {
            call.resolve();
        }
    }

    @PluginMethod
    public void checkBiometricSupported(PluginCall call) {
        JSObject android = call.getObject("android");
        JSONArray constraint = this.jsObjectGetArray(android, "constraint");
        int flags = this.constraintToFlag(constraint);

        Context ctx = this.getContext();
        try {
            int result = this.implementation.checkBiometricSupported(ctx, flags);
            if (result == BiometricManager.BIOMETRIC_SUCCESS) {
                call.resolve();
            } else {
                String resultString = this.resultToString(result);
                call.reject(resultString, resultString);
            }
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void createBiometricPrivateKey(PluginCall call) {
        AppCompatActivity activity = this.getActivity();

        JSObject payload = call.getObject("payload");
        String kid = call.getString("kid");
        String alias = "com.authgear.keys.biometric." + kid;
        JSObject android = call.getObject("android");
        JSONArray constraint = this.jsObjectGetArray(android, "constraint");
        boolean invalidatedByBiometricEnrollment = android.getBool("invalidatedByBiometricEnrollment");
        int flags = this.constraintToFlag(constraint);
        String title = android.getString("title");
        String subtitle = android.getString("subtitle");
        String description = android.getString("description");
        String negativeButtonText = android.getString("negativeButtonText");

        BiometricOptions options = new BiometricOptions();
        options.payload = payload;
        options.kid = kid;
        options.alias = alias;
        options.flags = flags;
        options.invalidatedByBiometricEnrollment = invalidatedByBiometricEnrollment;
        options.title = title;
        options.subtitle = subtitle;
        options.description = description;
        options.negativeButtonText = negativeButtonText;

        try {
            this.implementation.createBiometricPrivateKey(
                    activity,
                    options,
                    new BiometricCallback() {
                        @Override
                        public void onSuccess(String jwt) {
                            JSObject obj = new JSObject();
                            obj.put("jwt", jwt);
                            call.resolve(obj);
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            call.reject(errString.toString(), AuthgearPlugin.this.errorCodeToString(errorCode));
                        }

                        @Override
                        public void onException(Exception e) {
                            AuthgearPlugin.this.reject(call, e);
                        }
                    }
            );
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void signWithBiometricPrivateKey(PluginCall call) {
        AppCompatActivity activity = this.getActivity();

        JSObject payload = call.getObject("payload");
        String kid = call.getString("kid");
        String alias = "com.authgear.keys.biometric." + kid;
        JSObject android = call.getObject("android");
        JSONArray constraint = this.jsObjectGetArray(android, "constraint");
        boolean invalidatedByBiometricEnrollment = android.getBool("invalidatedByBiometricEnrollment");
        int flags = this.constraintToFlag(constraint);
        String title = android.getString("title");
        String subtitle = android.getString("subtitle");
        String description = android.getString("description");
        String negativeButtonText = android.getString("negativeButtonText");

        BiometricOptions options = new BiometricOptions();
        options.payload = payload;
        options.kid = kid;
        options.alias = alias;
        options.flags = flags;
        options.invalidatedByBiometricEnrollment = invalidatedByBiometricEnrollment;
        options.title = title;
        options.subtitle = subtitle;
        options.description = description;
        options.negativeButtonText = negativeButtonText;

        try {
            this.implementation.signWithBiometricPrivateKey(
                    activity,
                    options,
                    new BiometricCallback() {
                        @Override
                        public void onSuccess(String jwt) {
                            JSObject obj = new JSObject();
                            obj.put("jwt", jwt);
                            call.resolve(obj);
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            call.reject(errString.toString(), AuthgearPlugin.this.errorCodeToString(errorCode));
                        }

                        @Override
                        public void onException(Exception e) {
                            AuthgearPlugin.this.reject(call, e);
                        }
                    }
            );
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    @PluginMethod
    public void removeBiometricPrivateKey(PluginCall call) {
        String kid = call.getString("kid");
        String alias = "com.authgear.keys.biometric." + kid;

        try {
            this.implementation.removeBiometricPrivateKey(alias);
            call.resolve();
        } catch (Exception e) {
            this.reject(call, e);
        }
    }

    private JSONArray jsObjectGetArray(JSObject obj, String key) {
        try {
            return obj.getJSONArray(key);
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private int constraintToFlag(JSONArray constraint) {
        try {
            int flag = 0;
            for (int i = 0; i < constraint.length(); i++) {
                String c = constraint.getString(i);
                if (c.equals("BIOMETRIC_STRONG")) {
                    flag |= BiometricManager.Authenticators.BIOMETRIC_STRONG;
                }
                if (c.equals("DEVICE_CREDENTIAL")) {
                    flag |= BiometricManager.Authenticators.DEVICE_CREDENTIAL;
                }
            }
            return flag;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
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

    private void reject(PluginCall call, Exception e) {
        call.reject(e.getMessage(), e.getClass().getName(), e);
    }

    private void rejectWithCancel(PluginCall call) {
        call.reject("CANCEL", "CANCEL");
    }
}