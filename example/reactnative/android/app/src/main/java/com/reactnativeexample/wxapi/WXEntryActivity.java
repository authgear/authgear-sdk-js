package com.reactnativeexample.wxapi;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.tencent.mm.opensdk.constants.ConstantsAPI;
import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler{
    public static final String WECHAT_APP_ID = "wxe64ed6a7605b5021";

    private static final String TAG = WXEntryActivity.class.getSimpleName();
    private IWXAPI api;
    private static OnWeChatSendAuthResultListener onWeChatSendAuthResultListener;

    public static void setOnWeChatSendAuthResultListener(OnWeChatSendAuthResultListener listener) {
        onWeChatSendAuthResultListener = listener;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        api = WXAPIFactory.createWXAPI(this, WECHAT_APP_ID, true);
        api.registerApp(WXEntryActivity.WECHAT_APP_ID);

        try {
            Intent intent = getIntent();
            api.handleIntent(intent, this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        setIntent(intent);
        api.handleIntent(intent, this);
    }

    @Override
    public void onReq(BaseReq req) {
        Log.d(TAG, "onReq: " + req.getType());
        finish();
    }

    @Override
    public void onResp(BaseResp resp) {
        String error = null;

        switch (resp.errCode) {
            case BaseResp.ErrCode.ERR_OK:
                break;
            case BaseResp.ErrCode.ERR_USER_CANCEL:
                error = "errcode_cancel";
                break;
            case BaseResp.ErrCode.ERR_AUTH_DENIED:
                error = "errcode_deny";
                break;
            case BaseResp.ErrCode.ERR_UNSUPPORT:
                error = "errcode_unsupported";
                break;
            default:
                error = "errcode_unknown";
                break;
        }

        if (resp.getType() == ConstantsAPI.COMMAND_SENDAUTH) {
            SendAuth.Resp authResp = (SendAuth.Resp)resp;
            if (onWeChatSendAuthResultListener != null) {
                if (error != null) {
                    onWeChatSendAuthResultListener.OnError(new Exception(error));
                } else {
                    onWeChatSendAuthResultListener.OnResult(authResp.code, authResp.state);
                }
            }
        }
        finish();
    }

    public interface OnWeChatSendAuthResultListener{
        void OnResult(String code, String state);
        void OnError(Throwable err);
    }
}
