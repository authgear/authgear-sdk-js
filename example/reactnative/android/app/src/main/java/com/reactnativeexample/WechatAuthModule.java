package com.reactnativeexample;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.reactnativeexample.wxapi.WXEntryActivity;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

public class WechatAuthModule extends ReactContextBaseJavaModule {
    private static final String TAG = WechatAuthModule.class.getSimpleName();


    private IWXAPI wechatAPI;

    WechatAuthModule(ReactApplicationContext context) {
        super(context);

        wechatAPI = WXAPIFactory.createWXAPI(context, WXEntryActivity.WECHAT_APP_ID, true);
        wechatAPI.registerApp(WXEntryActivity.WECHAT_APP_ID);
    }

    @Override
    public String getName() {
        return "WechatAuth";
    }

    @ReactMethod
    public void sendWechatAuthRequest(String state, Promise promise) {
        Log.d(TAG, "Open wechat sdk state=" + state);

        if (!wechatAPI.isWXAppInstalled()) {
            promise.reject(new Exception("You have not installed the WeChat client app"));
            return;
        }
        if (wechatAPI == null) {
            promise.reject(new Exception("Failed to configure WeChat api"));
            return;
        }

        WXEntryActivity.setOnWechatSendAuthResultListener(new WXEntryActivity.OnWechatSendAuthResultListener() {
            @Override
            public void OnResult(String c, String s) {
                WXEntryActivity.setOnWechatSendAuthResultListener(null);
                WritableMap result = new WritableNativeMap();
                result.putString("code", c);
                result.putString("state", s);
                promise.resolve(result);
            }

            @Override
            public void OnError(Throwable err) {
                WXEntryActivity.setOnWechatSendAuthResultListener(null);
                promise.reject(err);
            }
        });

        SendAuth.Req req = new SendAuth.Req();
        req.scope = "snsapi_userinfo";
        req.state = state;
        wechatAPI.sendReq(req);
    }
}
