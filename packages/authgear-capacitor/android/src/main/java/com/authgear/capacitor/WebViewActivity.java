package com.authgear.capacitor;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

public class WebViewActivity extends AppCompatActivity {
    private static final int MENU_ID_CANCEL = 1;
    private static final String KEY_URL = "KEY_URL";
    private static final int TAG_FILE_CHOOSER = 1;

    private WebView webView;
    private StartActivityHandles<ValueCallback<Uri[]>> handles = new StartActivityHandles();

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
                return super.shouldOverrideUrlLoading(view, request);
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return super.shouldOverrideUrlLoading(view, url);
            }
        });
        this.webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                StartActivityHandle<ValueCallback<Uri[]>> handle = new StartActivityHandle(TAG_FILE_CHOOSER, filePathCallback);
                int requestCode = handles.push(handle);
                Intent intent = fileChooserParams.createIntent();
                WebViewActivity.this.startActivityForResult(intent, requestCode);
                return true;
            }
        });
        WebSettings webSettings = this.webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        this.webView.loadUrl(url);
    }

    @Override
    public void onBackPressed() {
        if (this.webView.canGoBack()) {
            this.webView.goBack();
        } else {
            this.setResult(Activity.RESULT_CANCELED);
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(Menu.NONE, MENU_ID_CANCEL, Menu.NONE, android.R.string.cancel)
                .setIcon(android.R.drawable.ic_menu_close_clear_cancel)
                .setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS);
        return super.onCreateOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == MENU_ID_CANCEL) {
            this.setResult(Activity.RESULT_CANCELED);
            this.finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        StartActivityHandle<ValueCallback<Uri[]>> handle = handles.pop(requestCode);
        if (handle == null) {
            return;
        }

        switch (handle.tag) {
            case TAG_FILE_CHOOSER: {
                switch (resultCode) {
                    case Activity.RESULT_CANCELED:
                        handle.value.onReceiveValue(null);
                        break;
                    case Activity.RESULT_OK:
                        if (data != null && data.getData() != null) {
                            handle.value.onReceiveValue(new Uri[]{data.getData()});
                        } else {
                            handle.value.onReceiveValue(null);
                        }
                        break;
                }
            }
        }
    }

    public static Intent createIntent(Context context, String url) {
        Intent intent = new Intent(context, WebViewActivity.class);
        intent.putExtra(KEY_URL, url);
        return intent;
    }
}
