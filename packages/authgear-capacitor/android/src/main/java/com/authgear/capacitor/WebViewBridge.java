package com.authgear.capacitor;

import android.annotation.SuppressLint;
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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

// The bridge between AuthUI and the app, as window.authgearBridge in the WebView.
// See docs/specs/webview-bridge.md in authgear-server for the messages.
//
// RequiresFeature: a JavaScriptReplyProxy exists only when WEB_MESSAGE_LISTENER is supported,
// which install() checks.
@SuppressLint("RequiresFeature")
class WebViewBridge {
    static final String OBJECT_NAME = "authgearBridge";
    private static final String LOGTAG = "Authgear";

    static final String TYPE_CAPABILITIES = "bridge.capabilities";
    static final String TYPE_CREDENTIALS_GET = "credentials.get";

    static final String STATUS_OK = "ok";
    static final String STATUS_UNSUPPORTED = "unsupported";
    static final String STATUS_ERROR = "error";
    static final String STATUS_NO_CREDENTIAL = "no_credential";
    static final String STATUS_CANCELLED = "cancelled";

    // The capabilities listed in the reply to bridge.capabilities.
    static final List<String> CAPABILITIES = Collections.unmodifiableList(Arrays.asList(
            "credentials.get",
            "credentials.get:publicKey",
            "credentials.get:immediate"
    ));

    private final Activity activity;

    // The pending credentials.get. Only one runs at a time.
    @Nullable
    private CancellationSignal pendingGet;

    WebViewBridge(@NonNull Activity activity) {
        this.activity = activity;
    }

    void install(@NonNull WebView webView, @NonNull List<Uri> allowedOrigins) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            return;
        }
        Set<String> rules = new HashSet<>();
        try {
            for (Uri uri : allowedOrigins) {
                if (uri == null) {
                    continue;
                }
                String rule = allowedOriginRule(new URI(uri.toString()));
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
                    Request request = parseRequest(data);
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

    // Cancels the pending requests without replying: the page that sent them is gone.
    // Cancelling the signal also cancels the request of Credential Manager.
    void cancelPending() {
        CancellationSignal signal = this.pendingGet;
        this.pendingGet = null;
        if (signal != null) {
            signal.cancel();
        }
    }

    private void handle(
            @NonNull WebView webView,
            @NonNull Request request,
            @NonNull Uri sourceOrigin,
            @NonNull JavaScriptReplyProxy replyProxy
    ) {
        if (TYPE_CAPABILITIES.equals(request.type)) {
            replyProxy.postMessage(capabilitiesReply(request.id));
        } else if (TYPE_CREDENTIALS_GET.equals(request.type)) {
            credentialsGet(webView, request, sourceOrigin, replyProxy);
        } else {
            replyProxy.postMessage(reply(request.id, STATUS_UNSUPPORTED));
        }
    }

    private void credentialsGet(
            @NonNull WebView webView,
            @NonNull Request request,
            @NonNull Uri sourceOrigin,
            @NonNull JavaScriptReplyProxy replyProxy
    ) {
        String id = request.id;
        Object publicKey = request.json.opt("publicKey");
        // publicKey is the only member supported. Other members, such as password, are ignored.
        if (!"immediate".equals(request.json.opt("mediation")) || publicKey == null || publicKey == JSONObject.NULL) {
            replyProxy.postMessage(reply(id, STATUS_UNSUPPORTED));
            return;
        }
        if (this.pendingGet != null) {
            replyProxy.postMessage(reply(id, STATUS_ERROR, "a passkey request is in progress"));
            return;
        }
        if (!(publicKey instanceof JSONObject)) {
            replyProxy.postMessage(reply(id, STATUS_ERROR, "publicKey must be an object"));
            return;
        }

        CancellationSignal signal = new CancellationSignal();
        this.pendingGet = signal;
        CredentialManagerCallback<GetCredentialResponse, GetCredentialException> callback =
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        finish(signal, webView, sourceOrigin, replyProxy, credentialReply(id, result.getCredential()));
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        finish(signal, webView, sourceOrigin, replyProxy, errorReply(id, e));
                    }
                };
        try {
            JSONObject options = credentialManagerRequestJson((JSONObject) publicKey);
            GetCredentialRequest getCredentialRequest = new GetCredentialRequest.Builder()
                    .addCredentialOption(new GetPublicKeyCredentialOption(options.toString()))
                    .setPreferImmediatelyAvailableCredentials(true)
                    .build();
            // The activity is the context, so that the sheet is shown over it.
            CredentialManager.create(this.activity).getCredentialAsync(
                    this.activity,
                    getCredentialRequest,
                    signal,
                    ContextCompat.getMainExecutor(this.activity),
                    callback
            );
        } catch (Exception e) {
            finish(signal, webView, sourceOrigin, replyProxy, reply(id, STATUS_ERROR, e.toString()));
        }
    }

    private void finish(
            @NonNull CancellationSignal signal,
            @NonNull WebView webView,
            @NonNull Uri sourceOrigin,
            @NonNull JavaScriptReplyProxy replyProxy,
            @NonNull String text
    ) {
        // A cancelled request sends no reply: the page that asked is gone.
        if (signal.isCanceled()) {
            return;
        }
        if (this.pendingGet == signal) {
            this.pendingGet = null;
        }
        // onPageStarted is not called for every navigation, so cancelPending() may not have
        // been called. Drop the reply if the WebView no longer shows the page that asked.
        if (!isSameOrigin(webView.getUrl(), sourceOrigin.toString())) {
            return;
        }
        replyProxy.postMessage(text);
    }

    @NonNull
    private static String credentialReply(@NonNull String id, @NonNull Credential credential) {
        if (!(credential instanceof PublicKeyCredential)) {
            return reply(id, STATUS_ERROR, "unexpected credential type: " + credential.getType());
        }
        String json = ((PublicKeyCredential) credential).getAuthenticationResponseJson();
        try {
            return reply(id, STATUS_OK, null, Collections.singletonMap("credential", new JSONObject(json)));
        } catch (JSONException e) {
            return reply(id, STATUS_ERROR, e.toString());
        }
    }

    @NonNull
    private static String errorReply(@NonNull String id, @NonNull GetCredentialException e) {
        if (e instanceof NoCredentialException) {
            return reply(id, STATUS_NO_CREDENTIAL);
        }
        if (e instanceof GetCredentialCancellationException) {
            return reply(id, STATUS_CANCELLED);
        }
        if (e instanceof GetCredentialProviderConfigurationException || e instanceof GetCredentialUnsupportedException) {
            return reply(id, STATUS_UNSUPPORTED);
        }
        // GetCredentialException.getType() is restricted to its library group, so the class name is used.
        return reply(id, STATUS_ERROR, e.getClass().getSimpleName() + ": " + e.getMessage());
    }

    static final class Request {
        @NonNull
        final String id;
        @Nullable
        final String type;
        @NonNull
        final JSONObject json;

        Request(@NonNull String id, @Nullable String type, @NonNull JSONObject json) {
            this.id = id;
            this.type = type;
            this.json = json;
        }
    }

    // The rule of WebViewCompat.addWebMessageListener that allows the origin of url,
    // or null when url has no scheme or host. The authority is not used because it can carry user info.
    @Nullable
    static String allowedOriginRule(@NonNull URI url) {
        String scheme = url.getScheme();
        String host = url.getHost();
        if (scheme == null || host == null) {
            return null;
        }
        String rule = scheme + "://" + host;
        if (url.getPort() != -1) {
            return rule + ":" + url.getPort();
        }
        return rule;
    }

    static boolean sameOrigin(@NonNull URI a, @NonNull URI b) {
        String schemeA = a.getScheme();
        String schemeB = b.getScheme();
        String hostA = a.getHost();
        String hostB = b.getHost();
        if (schemeA == null || schemeB == null || hostA == null || hostB == null) {
            return false;
        }
        schemeA = schemeA.toLowerCase(Locale.ROOT);
        schemeB = schemeB.toLowerCase(Locale.ROOT);
        return schemeA.equals(schemeB) &&
                hostA.toLowerCase(Locale.ROOT).equals(hostB.toLowerCase(Locale.ROOT)) &&
                portOf(a, schemeA) == portOf(b, schemeB);
    }

    // False when either is null or not a valid URI.
    static boolean isSameOrigin(@Nullable String a, @Nullable String b) {
        if (a == null || b == null) {
            return false;
        }
        try {
            return sameOrigin(new URI(a), new URI(b));
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private static int portOf(@NonNull URI url, @NonNull String scheme) {
        if (url.getPort() != -1) {
            return url.getPort();
        }
        switch (scheme) {
            case "http":
                return 80;
            case "https":
                return 443;
            default:
                return -1;
        }
    }

    // Returns null when text is not a JSON object with a string id.
    @Nullable
    static Request parseRequest(@NonNull String text) {
        JSONObject json;
        try {
            JSONTokener tokener = new JSONTokener(text);
            Object value = tokener.nextValue();
            if (!(value instanceof JSONObject) || tokener.nextClean() != 0) {
                return null;
            }
            json = (JSONObject) value;
        } catch (JSONException e) {
            return null;
        }
        Object id = json.opt("id");
        if (!(id instanceof String)) {
            return null;
        }
        Object type = json.opt("type");
        return new Request((String) id, type instanceof String ? (String) type : null, json);
    }

    // The fields of publicKey that the spec lets the app use, so that both platforms
    // handle the same request the same way. A later field needs its own capability.
    @NonNull
    static JSONObject credentialManagerRequestJson(@NonNull JSONObject publicKey) throws JSONException {
        JSONObject fields = new JSONObject();
        for (String key : Arrays.asList("challenge", "rpId", "userVerification")) {
            if (publicKey.has(key)) {
                fields.put(key, publicKey.get(key));
            }
        }
        Object allowCredentials = publicKey.opt("allowCredentials");
        if (allowCredentials instanceof JSONArray && ((JSONArray) allowCredentials).length() > 0) {
            fields.put("allowCredentials", allowCredentials);
        }
        return fields;
    }

    @NonNull
    static String reply(@NonNull String id, @NonNull String status) {
        return reply(id, status, null);
    }

    @NonNull
    static String reply(@NonNull String id, @NonNull String status, @Nullable String message) {
        return reply(id, status, message, Collections.<String, Object>emptyMap());
    }

    @NonNull
    static String reply(
            @NonNull String id,
            @NonNull String status,
            @Nullable String message,
            @NonNull Map<String, Object> fields
    ) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("id", id);
            obj.put("status", status);
            if (message != null) {
                obj.put("message", message);
            }
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                obj.put(entry.getKey(), entry.getValue());
            }
        } catch (JSONException e) {
            // put throws only for a null key or a non-finite number, which never happen here.
            throw new IllegalStateException(e);
        }
        return obj.toString();
    }

    @NonNull
    static String capabilitiesReply(@NonNull String id) {
        return reply(id, STATUS_OK, null, Collections.<String, Object>singletonMap("capabilities", new JSONArray(CAPABILITIES)));
    }
}
