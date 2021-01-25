package com.authgear.reactnative;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;

public class OAuthRedirectActivity extends Activity {

    private static String callbackURL;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (isAuthCallback(this.getIntent().getData())) {
            this.startActivity(OAuthCoordinatorActivity.createRedirectIntent(this, this.getIntent().getData()));
            // callbackURL is handled, clear it
            callbackURL = null;
            AuthgearReactNativeModule.unregisterWeChatRedirectURI();
        }
        AuthgearReactNativeModule.handleWeChatRedirectDeepLink(this.getIntent().getData());
        this.finish();
    }

    private Boolean isAuthCallback(Uri uri) {
        if (callbackURL == null || uri == null) {
            return false;
        }

        Uri uriWithoutQuery = uri.buildUpon().clearQuery().build();
        return uriWithoutQuery.toString().equals(callbackURL);
    }

    public static void registerCallbackURL(String callbackURL) {
        OAuthRedirectActivity.callbackURL = callbackURL;
    }
}
