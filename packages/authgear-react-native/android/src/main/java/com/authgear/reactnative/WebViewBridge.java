package com.authgear.reactnative;

import android.app.Activity;
import android.net.Uri;
import android.os.CancellationSignal;
import android.util.Log;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.PublicKeyCredential;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.GetCredentialProviderConfigurationException;
import androidx.credentials.exceptions.GetCredentialUnsupportedException;
import androidx.credentials.exceptions.NoCredentialException;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// The bridge between AuthUI and the app, as window.authgearBridge in the WebView.
// See docs/specs/webview-bridge.md in authgear-server for the messages.
// Everything here runs on the main thread.
final class WebViewBridge {
    static final String OBJECT_NAME = "authgearBridge";
    private static final String LOGTAG = "AuthgearReactNative";

    // A credentials.get waiting for Credential Manager. Only one runs at a time.
    private static final class PendingGet {
        final CancellationSignal cancellationSignal = new CancellationSignal();
        boolean cancelled = false;
    }

    private final Activity activity;
    @Nullable
    private PendingGet pendingGet;

    WebViewBridge(@NonNull Activity activity) {
        this.activity = activity;
    }

    void install(@NonNull WebView webView, @NonNull List<Uri> allowedOrigins) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            return;
        }
        Set<String> rules = new HashSet<>();
        try {
            for (Uri allowedOrigin : allowedOrigins) {
                if (allowedOrigin == null) {
                    continue;
                }
                String rule = WebViewBridgeMessages.allowedOriginRule(new URI(allowedOrigin.toString()));
                if (rule != null) {
                    rules.add(rule);
                }
            }
        } catch (URISyntaxException e) {
            Log.w(LOGTAG, "authgearBridge is not installed: invalid URL", e);
            return;
        }
        if (rules.isEmpty()) {
            Log.w(LOGTAG, "authgearBridge is not installed: no allowed origin");
            return;
        }
        // The WebView rejects a rule it cannot parse. Then the page has no bridge.
        try {
            WebViewCompat.addWebMessageListener(webView, OBJECT_NAME, rules, new WebViewCompat.WebMessageListener() {
                @Override
                public void onPostMessage(
                    @NonNull WebView view,
                    @NonNull WebMessageCompat message,
                    @NonNull Uri sourceOrigin,
                    boolean isMainFrame,
                    @NonNull JavaScriptReplyProxy replyProxy
                ) {
                    String data = message.getData();
                    if (!isMainFrame || data == null) {
                        return;
                    }
                    WebViewBridgeMessages.Request request = WebViewBridgeMessages.parseRequest(data);
                    if (request == null) {
                        return;
                    }
                    if (activity.isFinishing() || activity.isDestroyed()) {
                        return;
                    }
                    handle(view, request, sourceOrigin, replyProxy);
                }
            });
        } catch (IllegalArgumentException e) {
            Log.w(LOGTAG, "authgearBridge is not installed: invalid origin rule", e);
        }
    }

    // Cancels the pending request without replying: the page that sent it is gone.
    // Cancelling it also cancels the request of Credential Manager.
    void cancelPending() {
        PendingGet pendingGet = this.pendingGet;
        this.pendingGet = null;
        if (pendingGet != null) {
            pendingGet.cancelled = true;
            pendingGet.cancellationSignal.cancel();
        }
    }

    private void handle(
        WebView webView,
        WebViewBridgeMessages.Request request,
        Uri sourceOrigin,
        JavaScriptReplyProxy replyProxy
    ) {
        if (request.type == null) {
            replyProxy.postMessage(WebViewBridgeMessages.reply(request.id, WebViewBridgeMessages.STATUS_UNSUPPORTED));
            return;
        }
        switch (request.type) {
            case WebViewBridgeMessages.TYPE_CAPABILITIES:
                replyProxy.postMessage(WebViewBridgeMessages.capabilitiesReply(request.id));
                break;
            case WebViewBridgeMessages.TYPE_CREDENTIALS_GET:
                credentialsGet(webView, request, sourceOrigin, replyProxy);
                break;
            default:
                replyProxy.postMessage(WebViewBridgeMessages.reply(request.id, WebViewBridgeMessages.STATUS_UNSUPPORTED));
                break;
        }
    }

    private void credentialsGet(
        WebView webView,
        WebViewBridgeMessages.Request request,
        Uri sourceOrigin,
        JavaScriptReplyProxy replyProxy
    ) {
        String id = request.id;
        Object mediation = request.json.opt("mediation");
        Object publicKey = request.json.opt("publicKey");
        // publicKey is the only member supported. Other members, such as password, are ignored.
        if (!"immediate".equals(mediation) || publicKey == null || publicKey == JSONObject.NULL) {
            replyProxy.postMessage(WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_UNSUPPORTED));
            return;
        }
        if (this.pendingGet != null) {
            replyProxy.postMessage(WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_ERROR, "a passkey request is in progress"));
            return;
        }
        if (!(publicKey instanceof JSONObject)) {
            replyProxy.postMessage(WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_ERROR, "publicKey must be an object"));
            return;
        }

        final PendingGet pendingGet = new PendingGet();
        this.pendingGet = pendingGet;
        getPublicKeyCredential(id, (JSONObject) publicKey, pendingGet.cancellationSignal, new ReplyCallback() {
            @Override
            public void onReply(String text) {
                // A cancelled request does not reply: the page that sent it is gone.
                if (pendingGet.cancelled) {
                    return;
                }
                if (WebViewBridge.this.pendingGet == pendingGet) {
                    WebViewBridge.this.pendingGet = null;
                }
                // onPageStarted is not called for every navigation, so cancelPending() may not have
                // been called. Drop the reply if the WebView no longer shows the page that asked.
                if (!WebViewBridgeMessages.isSameOrigin(webView.getUrl(), sourceOrigin.toString())) {
                    return;
                }
                replyProxy.postMessage(text);
            }
        });
    }

    private interface ReplyCallback {
        void onReply(String text);
    }

    private void getPublicKeyCredential(
        String id,
        JSONObject publicKey,
        CancellationSignal cancellationSignal,
        ReplyCallback callback
    ) {
        try {
            JSONObject options = WebViewBridgeMessages.credentialManagerRequestJson(publicKey);
            GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(new GetPublicKeyCredentialOption(options.toString()))
                .setPreferImmediatelyAvailableCredentials(true)
                .build();
            // The activity is the context, so that the sheet is shown over it.
            CredentialManager.create(this.activity).getCredentialAsync(
                this.activity,
                request,
                cancellationSignal,
                ContextCompat.getMainExecutor(this.activity),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        callback.onReply(replyToResult(id, result));
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        callback.onReply(replyToError(id, e));
                    }
                }
            );
        } catch (Exception e) {
            callback.onReply(WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_ERROR, e.toString()));
        }
    }

    private static String replyToResult(String id, GetCredentialResponse result) {
        try {
            Credential credential = result.getCredential();
            if (credential instanceof PublicKeyCredential) {
                JSONObject fields = new JSONObject();
                // Credential Manager already returns AuthenticationResponseJSON. Pass it through unchanged.
                fields.put("credential", new JSONObject(((PublicKeyCredential) credential).getAuthenticationResponseJson()));
                return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_OK, null, fields);
            }
            return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_ERROR, "unexpected credential type: " + credential.getType());
        } catch (Exception e) {
            return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_ERROR, e.toString());
        }
    }

    private static String replyToError(String id, GetCredentialException e) {
        if (e instanceof NoCredentialException) {
            return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_NO_CREDENTIAL);
        }
        if (e instanceof GetCredentialCancellationException) {
            return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_CANCELLED);
        }
        if (e instanceof GetCredentialProviderConfigurationException || e instanceof GetCredentialUnsupportedException) {
            return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_UNSUPPORTED);
        }
        // GetCredentialException.getType() is restricted to androidx.credentials, so the class name is used.
        return WebViewBridgeMessages.reply(id, WebViewBridgeMessages.STATUS_ERROR, e.getClass().getSimpleName() + ": " + e.getMessage());
    }
}
