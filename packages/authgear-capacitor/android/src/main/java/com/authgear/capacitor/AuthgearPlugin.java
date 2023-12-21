package com.authgear.capacitor;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

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
    public void openAuthorizeURL(PluginCall call) {
        String urlString = call.getString("url");
        Uri uri = Uri.parse(urlString).normalizeScheme();

        Context ctx = this.getContext();
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

    private void reject(PluginCall call, Exception e) {
        call.reject(e.getMessage(), e.getClass().getName(), e);
    }

    private void rejectWithCancel(PluginCall call) {
        call.reject("CANCEL", "CANCEL");
    }
}