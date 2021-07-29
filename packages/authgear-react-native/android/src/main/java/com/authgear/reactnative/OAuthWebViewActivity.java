package com.authgear.reactnative;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class OAuthWebViewActivity extends Activity {
    private static final String KEY_AUTHORIZATION_URL = "AUTHORIZATION_URL";
    private static final String KEY_REDIRECT_URI = "REDIRECT_URI";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String url = this.getIntent().getStringExtra(KEY_AUTHORIZATION_URL);
        String redirectURI = this.getIntent().getStringExtra(KEY_REDIRECT_URI);
        this.webView = new WebView(this);
        this.setContentView(this.webView);
        this.webView.setWebViewClient(new WebViewClient() {
            @TargetApi(Build.VERSION_CODES.N)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (AuthgearReactNativeModule.handleWechatRedirectDeepLink(uri)) {
                    return true;
                }
                String uriWithoutQuery = getURLWithoutQuery(uri);
                if (redirectURI.equals(uriWithoutQuery)) {
                    handleRedirect(uri);
                    finish();
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri uri = Uri.parse(url);
                if (AuthgearReactNativeModule.handleWechatRedirectDeepLink(uri)) {
                    return true;
                }
                String uriWithoutQuery = getURLWithoutQuery(uri);
                if (redirectURI.equals(uriWithoutQuery)) {
                    handleRedirect(uri);
                    finish();
                    return true;
                }
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
            handleCancel();
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        AuthgearReactNativeModule.unregisterWechatRedirectURI();
    }

    private void handleRedirect(Uri uri) {
        Intent intent = new Intent();
        intent.setData(uri);
        this.setResult(Activity.RESULT_OK, intent);
    }

    private void handleCancel() {
        Intent intent = new Intent();
        this.setResult(Activity.RESULT_CANCELED, intent);
    }

    private static String getURLWithoutQuery(Uri uri) {
        Uri.Builder builder = uri.buildUpon().clearQuery();
        builder = builder.fragment("");
        return builder.build().toString();
    }

    public static Intent createIntent(Context context, String authorizationURL, String redirectURI) {
        Intent intent = new Intent(context, OAuthWebViewActivity.class);
        intent.putExtra(KEY_AUTHORIZATION_URL, authorizationURL);
        intent.putExtra(KEY_REDIRECT_URI, redirectURI);
        return intent;
    }
}
