package com.authgear.reactnative;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class WebViewActivity extends Activity {
    private static final String KEY_URL = "KEY_URL";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String url = this.getIntent().getStringExtra(KEY_URL);
        this.webView = new WebView(this);
        this.setContentView(this.webView);
        this.webView.setWebViewClient(new WebViewClient(){
            @TargetApi(Build.VERSION_CODES.N)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (AuthgearReactNativeModule.handleWechatRedirectDeepLink(uri)) {
                    return true;
                };
                return super.shouldOverrideUrlLoading(view, request);
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri uri = Uri.parse(url);
                if (AuthgearReactNativeModule.handleWechatRedirectDeepLink(uri)) {
                    return true;
                };
                return super.shouldOverrideUrlLoading(view, url);
            }
        });
        WebSettings webSettings = this.webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        this.webView.loadUrl(url);
    }
    
    @Override
    public void onBackPressed() {
        if (this.webView.canGoBack()) {
            this.webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        AuthgearReactNativeModule.unregisterWechatRedirectURI();
    }

    public static Intent createIntent(Context context, String url) {
        Intent intent = new Intent(context, WebViewActivity.class);
        intent.putExtra(KEY_URL, url);
        return intent;
    }
}
