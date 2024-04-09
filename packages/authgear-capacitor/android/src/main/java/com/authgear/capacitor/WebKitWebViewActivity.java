package com.authgear.capacitor;

import static android.webkit.WebView.HitTestResult.SRC_ANCHOR_TYPE;
import static android.webkit.WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.ColorInt;
import androidx.annotation.DrawableRes;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.res.ResourcesCompat;
import androidx.core.graphics.drawable.DrawableCompat;

public class WebKitWebViewActivity extends AppCompatActivity {

    private static final String KEY_OPTIONS = "KEY_OPTIONS";
    private static final String KEY_WEB_VIEW_STATE = "KEY_WEB_VIEW_STATE";
    private static final int MENU_ID_CANCEL = 1;
    private static final int TAG_FILE_CHOOSER = 1;

    private WebView mWebView;
    private Uri result;
    private StartActivityHandles<ValueCallback<Uri[]>> handles = new StartActivityHandles<>();

    public static class Options {
        public Uri url;
        public Uri redirectURI;

        public Integer actionBarBackgroundColor;
        public Integer actionBarButtonTintColor;

        public Options() {}

        private Options(Bundle bundle) {
            this.url = bundle.getParcelable("url");
            this.redirectURI = bundle.getParcelable("redirectURI");
            if (bundle.containsKey("actionBarBackgroundColor")) {
                this.actionBarBackgroundColor = bundle.getInt("actionBarBackgroundColor");
            }
            if (bundle.containsKey("actionBarButtonTintColor")) {
                this.actionBarButtonTintColor = bundle.getInt("actionBarButtonTintColor");
            }
        }

        public Bundle toBundle() {
            Bundle bundle = new Bundle();
            bundle.putParcelable("url", this.url);
            bundle.putParcelable("redirectURI", this.redirectURI);
            if (this.actionBarBackgroundColor != null) {
                bundle.putInt("actionBarBackgroundColor", this.actionBarBackgroundColor);
            }
            if (this.actionBarButtonTintColor != null) {
                bundle.putInt("actionBarButtonTintColor", this.actionBarButtonTintColor);
            }
            return bundle;
        }
    }

    private static class MyWebViewClient extends WebViewClient {

        private WebKitWebViewActivity activity;
        private final String USERSCRIPT_USER_SELECT_NONE = "document.documentElement.style.webkitUserSelect='none';document.documentElement.style.userSelect='none';";

        private MyWebViewClient(WebKitWebViewActivity activity) {
            this.activity = activity;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);

            // android.webkit.view does not have WKUserContentController that allows us to inject userscript.
            // onPageFinished will be called for each navigation.
            // So it can be used as a replacement of WKUserContentController to allow us to
            // run a script for every page.
            // The caveat is that the script is run in the main frame only.
            // But we do not actually use iframes so it does not matter.
            view.evaluateJavascript(USERSCRIPT_USER_SELECT_NONE, null);
        }

        @TargetApi(Build.VERSION_CODES.N)
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (this.shouldOverrideUrlLoading(uri)) {
                return true;
            }
            return super.shouldOverrideUrlLoading(view, request);
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            Uri uri = Uri.parse(url);
            if (this.shouldOverrideUrlLoading(uri)) {
                return true;
            }
            return super.shouldOverrideUrlLoading(view, url);
        }

        private boolean shouldOverrideUrlLoading(Uri uri) {
            if (this.checkRedirectURI(uri)) {
                return true;
            }
            return false;
        }

        private boolean checkRedirectURI(Uri uri) {
            Uri redirectURI = this.activity.getOptions().redirectURI;
            Uri withoutQuery = this.removeQueryAndFragment(uri);
            if (withoutQuery.toString().equals(redirectURI.toString())) {
                this.activity.result = uri;
                this.activity.callSetResult();
                this.activity.finish();
                return true;
            }
            return false;
        }

        private Uri removeQueryAndFragment(Uri uri) {
            return uri.buildUpon().query(null).fragment(null).build();
        }
    }

    private static class MyWebChromeClient extends WebChromeClient {

        private WebKitWebViewActivity activity;

        private MyWebChromeClient(WebKitWebViewActivity activity) {
            this.activity = activity;
        }
        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            StartActivityHandle<ValueCallback<Uri[]>> handle = new StartActivityHandle<>(TAG_FILE_CHOOSER, filePathCallback);
            int requestCode = this.activity.handles.push(handle);
            Intent intent = fileChooserParams.createIntent();
            this.activity.startActivityForResult(intent, requestCode);
            return true;
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            if (view == null) {
                return false;
            }
            WebView.HitTestResult result = view.getHitTestResult();
            switch (result.getType()) {
                case SRC_IMAGE_ANCHOR_TYPE: {
                    // ref: https://pacheco.dev/posts/android/webview-image-anchor/
                    Message message = view.getHandler().obtainMessage();
                    view.requestFocusNodeHref(message);
                    String url = message.getData().getString("url");
                    if (url == null) {
                        return false;
                    }
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(browserIntent);
                    return false;
                }
                case SRC_ANCHOR_TYPE: {
                    String url = result.getExtra();
                    if (url == null) {
                        return false;
                    }
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(browserIntent);
                    return false;
                }
                default: {
                    return false;
                }
            }
        }
    }

    public static Intent createIntent(Context ctx, Options options) {
        Intent intent = new Intent(ctx, WebKitWebViewActivity.class);
        intent.putExtra(KEY_OPTIONS, options.toBundle());
        return intent;
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Options options = this.getOptions();

        // Do not show title.
        getSupportActionBar().setDisplayShowTitleEnabled(false);

        // Configure navigation bar background color.
        if (options.actionBarBackgroundColor != null) {
            getSupportActionBar().setBackgroundDrawable(new ColorDrawable(options.actionBarBackgroundColor));
        }

        // Show back button.
        getSupportActionBar().setDisplayOptions(ActionBar.DISPLAY_SHOW_HOME | ActionBar.DISPLAY_HOME_AS_UP);

        // Configure the back button.
        Drawable backButtonDrawable = this.getDrawableCompat(R.drawable.ic_arrow_back);
        if (options.actionBarButtonTintColor != null) {
            backButtonDrawable = this.tintDrawable(backButtonDrawable, options.actionBarButtonTintColor);
        }
        getSupportActionBar().setHomeAsUpIndicator(backButtonDrawable);

        // Configure web view.
        this.mWebView = new WebView(this);
        this.mWebView.getSettings().setSupportMultipleWindows(true);
        this.mWebView.getSettings().setDomStorageEnabled(true);
        this.setContentView(this.mWebView);
        this.mWebView.setWebViewClient(new MyWebViewClient(this));
        this.mWebView.setWebChromeClient(new MyWebChromeClient(this));
        WebSettings webSettings = this.mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);

        if (savedInstanceState == null) {
            this.mWebView.loadUrl(options.url.toString());
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        Bundle webViewBundle = new Bundle();
        this.mWebView.saveState(webViewBundle);
        outState.putBundle(KEY_WEB_VIEW_STATE, webViewBundle);
    }

    @Override
    protected void onRestoreInstanceState(@NonNull Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        Bundle webViewBundle = savedInstanceState.getBundle(KEY_WEB_VIEW_STATE);
        if (webViewBundle != null) {
            this.mWebView.restoreState(webViewBundle);
        }
    }

    @Override
    public void onBackPressed() {
        if (this.mWebView.canGoBack()) {
            this.mWebView.goBack();
        } else {
            this.callSetResult();
            super.onBackPressed();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        Options options = this.getOptions();

        // Configure the close button.
        Drawable drawable = this.getDrawableCompat(R.drawable.ic_close);
        if (options.actionBarButtonTintColor != null) {
            drawable = this.tintDrawable(drawable, options.actionBarButtonTintColor);
        }

        menu.add(Menu.NONE, MENU_ID_CANCEL, Menu.NONE, android.R.string.cancel)
                .setIcon(drawable)
                .setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS);
        return super.onCreateOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            this.onBackPressed();
            return true;
        }
        if (item.getItemId() == MENU_ID_CANCEL) {
            this.callSetResult();
            this.finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        StartActivityHandle<ValueCallback<Uri[]>> handle = this.handles.pop(requestCode);
        if (handle == null) {
            return;
        }

        switch (handle.tag) {
            case TAG_FILE_CHOOSER:
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
                break;
        }
    }

    private Options getOptions() {
        Bundle bundle = this.getIntent().getParcelableExtra(KEY_OPTIONS);
        Options options = new Options(bundle);
        return options;
    }

    private void callSetResult() {
        if (this.result == null) {
            this.setResult(Activity.RESULT_CANCELED);
        } else {
            Intent intent = new Intent();
            intent.setData(this.result);
            this.setResult(Activity.RESULT_OK, intent);
        }
    }

    private Drawable getDrawableCompat(@DrawableRes int id) {
        Drawable drawable = ResourcesCompat.getDrawable(this.getResources(), id, null);
        return drawable;
    }

    private Drawable tintDrawable(Drawable drawable, @ColorInt int color) {
        Drawable newDrawable = DrawableCompat.wrap(drawable).getConstantState().newDrawable().mutate();
        DrawableCompat.setTint(newDrawable, color);
        return newDrawable;
    }
}
