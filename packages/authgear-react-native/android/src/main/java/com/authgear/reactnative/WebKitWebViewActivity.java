package com.authgear.reactnative;

import static android.webkit.WebView.HitTestResult.SRC_ANCHOR_TYPE;
import static android.webkit.WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.ColorInt;
import androidx.annotation.DrawableRes;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.content.res.ResourcesCompat;
import androidx.core.graphics.Insets;
import androidx.core.graphics.drawable.DrawableCompat;
import androidx.core.util.TypedValueCompat;
import androidx.core.view.OnApplyWindowInsetsListener;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class WebKitWebViewActivity extends AppCompatActivity {

    private static final String KEY_OPTIONS = "KEY_OPTIONS";
    private static final String KEY_WEB_VIEW_STATE = "KEY_WEB_VIEW_STATE";
    private static final int MENU_ID_CANCEL = 1;
    private static final int TAG_FILE_CHOOSER = 1;

    private FrameLayout mRootFrameLayout;
    private Toolbar mToolbar;
    private FrameLayout mToolbarFrameLayout;
    private WebView mWebView;
    private Insets mLastSeenInsets;
    private Uri result;
    private StartActivityHandles<ValueCallback<Uri[]>> handles = new StartActivityHandles<>();

    public static class Options {
        public Uri url;
        public Uri redirectURI;

        public Integer actionBarBackgroundColor;
        public Integer actionBarButtonTintColor;

        public Uri wechatRedirectURI;
        public String wechatRedirectURIIntentAction;

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
            if (bundle.containsKey("wechatRedirectURI")) {
                this.wechatRedirectURI = bundle.getParcelable("wechatRedirectURI");
            }
            if (bundle.containsKey("wechatRedirectURIIntentAction")) {
                this.wechatRedirectURIIntentAction = bundle.getString("wechatRedirectURIIntentAction");
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

            if (this.wechatRedirectURI != null) {
                bundle.putParcelable("wechatRedirectURI", this.wechatRedirectURI);
            }
            if (this.wechatRedirectURIIntentAction != null) {
                bundle.putString("wechatRedirectURIIntentAction", this.wechatRedirectURIIntentAction);
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
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            // onPageStarted is not always called, but when it is called, it is called before
            // onPageFinished.
            // Therefore, we put the edge-to-edge handling here hoping that
            // the safe area insets can be set as soon as possible.

            view.evaluateJavascript(USERSCRIPT_USER_SELECT_NONE, null);
            this.activity.handleNonEdgeToEdge();
            this.activity.handleEdgeToEdge();
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
            this.activity.handleNonEdgeToEdge();
            this.activity.handleEdgeToEdge();
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
            if (this.checkWechatRedirectURI(uri)) {
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

        private boolean checkWechatRedirectURI(Uri uri) {
            Options options = this.activity.getOptions();
            Uri wechatRedirectURI = options.wechatRedirectURI;
            String wechatRedirectURIIntentAction = options.wechatRedirectURIIntentAction;
            if (wechatRedirectURI == null || wechatRedirectURIIntentAction == null) {
                return false;
            }

            Uri withoutQuery = this.removeQueryAndFragment(uri);
            if (withoutQuery.toString().equals(wechatRedirectURI.toString())) {
                Intent intent = new Intent(wechatRedirectURIIntentAction);
                intent.setPackage(this.activity.getApplicationContext().getPackageName());
                intent.putExtra("uri", uri.toString());
                this.activity.getApplicationContext().sendBroadcast(intent);
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
                default:
                    return false;
            }
        }
    }

    public static Intent createIntent(Context ctx, Options options) {
        Intent intent = new Intent(ctx, WebKitWebViewActivity.class);
        intent.putExtra(KEY_OPTIONS, options.toBundle());
        return intent;
    }

    private float getActionBarSizeInDp() {
        float actionBarSizeInDp = 44f;
        TypedValue tv = new TypedValue();
        if (this.getTheme().resolveAttribute(android.R.attr.actionBarSize, tv, true)) {
            int actionBarSizeInPx = TypedValue.complexToDimensionPixelSize(tv.data, this.getResources().getDisplayMetrics());
            actionBarSizeInDp = TypedValueCompat.pxToDp((float) actionBarSizeInPx, this.getResources().getDisplayMetrics());
        }
        return actionBarSizeInDp;
    }

    private void applyInsetsToWebView(Insets safeAreaInsets) {
        float actionBarSizeInDp = this.getActionBarSizeInDp();
        DisplayMetrics displayMetrics = this.getResources().getDisplayMetrics();
        float actionBarSizeInPx = TypedValueCompat.dpToPx(actionBarSizeInDp, displayMetrics);
        float top = TypedValueCompat.pxToDp((float) safeAreaInsets.top + actionBarSizeInPx, displayMetrics);
        float right = TypedValueCompat.pxToDp((float) safeAreaInsets.right, displayMetrics);
        float bottom = TypedValueCompat.pxToDp((float) safeAreaInsets.bottom, displayMetrics);
        float left = TypedValueCompat.pxToDp((float) safeAreaInsets.left, displayMetrics);

        String safeAreaJs =
            "document.documentElement.style.setProperty('--safe-area-inset-top', '" + top + "px');\n" +
            "document.documentElement.style.setProperty('--safe-area-inset-right', '" + right + "px');\n" +
            "document.documentElement.style.setProperty('--safe-area-inset-bottom', '" + bottom + "px');\n" +
            "document.documentElement.style.setProperty('--safe-area-inset-left', '" + left + "px');";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            this.mWebView.evaluateJavascript(safeAreaJs, null);
        }
    }

    private void handleNonEdgeToEdge() {
        // In non edge-to-edge, the insets listener is not called.
        // So we have to apply the insets here.
        Insets insets = this.mLastSeenInsets == null ? Insets.NONE : this.mLastSeenInsets;
        this.applyInsetsToWebView(insets);
    }

    private void handleEdgeToEdge() {
        // In edge-to-edge, we ask the system to invoke the insets listener.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            this.mRootFrameLayout.requestApplyInsets();
        }
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.mRootFrameLayout = new FrameLayout(this);
        this.mRootFrameLayout.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        this.mToolbarFrameLayout = new FrameLayout(this);
        this.mToolbarFrameLayout.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        float actionBarSizeInDp = this.getActionBarSizeInDp();

        this.mToolbar = new Toolbar(this);
        this.mToolbar.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            (int) TypedValueCompat.dpToPx(actionBarSizeInDp, this.getResources().getDisplayMetrics())
        ));
        this.setSupportActionBar(this.mToolbar);

        Options options = this.getOptions();

        // Do not show title.
        getSupportActionBar().setDisplayShowTitleEnabled(false);

        // Configure navigation bar background color.
        if (options.actionBarBackgroundColor != null) {
            ColorDrawable colorDrawable = new ColorDrawable(options.actionBarBackgroundColor);
            getSupportActionBar().setBackgroundDrawable(colorDrawable);
            this.mToolbarFrameLayout.setBackgroundDrawable(colorDrawable);
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
        this.mWebView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        this.mWebView.getSettings().setSupportMultipleWindows(true);
        this.mWebView.getSettings().setDomStorageEnabled(true);
        this.mWebView.setWebViewClient(new MyWebViewClient(this));
        this.mWebView.setWebChromeClient(new MyWebChromeClient(this));
        WebSettings webSettings = this.mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        this.mRootFrameLayout.addView(this.mWebView);
        this.mRootFrameLayout.addView(this.mToolbarFrameLayout);
        this.mToolbarFrameLayout.addView(this.mToolbar);
        this.setContentView(this.mRootFrameLayout);

        ViewCompat.setOnApplyWindowInsetsListener(this.mRootFrameLayout, new OnApplyWindowInsetsListener() {

            @Override
            public WindowInsetsCompat onApplyWindowInsets(View v, WindowInsetsCompat insets) {
                Insets safeAreaInsets = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() |
                    WindowInsetsCompat.Type.displayCutout() |
                    WindowInsetsCompat.Type.ime()
                );

                WebKitWebViewActivity.this.mLastSeenInsets = safeAreaInsets;

                ViewGroup.MarginLayoutParams toolbarParams = (ViewGroup.MarginLayoutParams) mToolbar.getLayoutParams();
                toolbarParams.setMargins(
                    safeAreaInsets.left,
                    safeAreaInsets.top,
                    safeAreaInsets.right,
                    0
                );

                WebKitWebViewActivity.this.applyInsetsToWebView(safeAreaInsets);

                return WindowInsetsCompat.CONSUMED;
            }
        });

        this.mRootFrameLayout.post(new Runnable() {
            @Override
            public void run() {
                // We want the content view to draw at least once before loading the URL.
                //
                // In non edge-to-edge, the insets listener is never called so mLastSeenInsets is null.
                //
                // In edge-to-edge, the insets listener will be called at least once in the first draw,
                // so by the time onPageStart / onPageFinished is called, mLastSeenInsets is not null.
                if (savedInstanceState == null) {
                    WebKitWebViewActivity.this.mWebView.loadUrl(options.url.toString());
                }
            }
        });
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
