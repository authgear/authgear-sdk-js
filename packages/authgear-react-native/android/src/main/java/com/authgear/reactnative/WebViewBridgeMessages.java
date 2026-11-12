package com.authgear.reactnative;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

// The pure parts of WebViewBridge, kept apart from WebView and Credential Manager.
// See docs/specs/webview-bridge.md in authgear-server for the messages.
final class WebViewBridgeMessages {

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

    private WebViewBridgeMessages() {}

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
        if (a.getScheme() == null || b.getScheme() == null || a.getHost() == null || b.getHost() == null) {
            return false;
        }
        String schemeA = a.getScheme().toLowerCase(Locale.ROOT);
        String schemeB = b.getScheme().toLowerCase(Locale.ROOT);
        String hostA = a.getHost().toLowerCase(Locale.ROOT);
        String hostB = b.getHost().toLowerCase(Locale.ROOT);
        return schemeA.equals(schemeB) && hostA.equals(hostB) && portOf(a, schemeA) == portOf(b, schemeB);
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

    private static int portOf(URI url, String scheme) {
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
        Object value;
        try {
            JSONTokener tokener = new JSONTokener(text);
            value = tokener.nextValue();
            // Text after the object makes the message invalid, as in the other SDKs.
            if (tokener.nextClean() != 0) {
                return null;
            }
        } catch (JSONException e) {
            return null;
        }
        if (!(value instanceof JSONObject)) {
            return null;
        }
        JSONObject json = (JSONObject) value;
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
        return reply(id, status, null, null);
    }

    @NonNull
    static String reply(@NonNull String id, @NonNull String status, @Nullable String message) {
        return reply(id, status, message, null);
    }

    @NonNull
    static String reply(@NonNull String id, @NonNull String status, @Nullable String message, @Nullable JSONObject fields) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("id", id);
            obj.put("status", status);
            if (message != null) {
                obj.put("message", message);
            }
            if (fields != null) {
                JSONArray names = fields.names();
                if (names != null) {
                    for (int i = 0; i < names.length(); i++) {
                        String name = names.getString(i);
                        obj.put(name, fields.get(name));
                    }
                }
            }
        } catch (JSONException e) {
            // JSONObject.put throws only for a null key or a non-finite number, which are not used here.
            throw new IllegalStateException(e);
        }
        return obj.toString();
    }

    @NonNull
    static String capabilitiesReply(@NonNull String id) {
        JSONObject fields = new JSONObject();
        try {
            fields.put("capabilities", new JSONArray(CAPABILITIES));
        } catch (JSONException e) {
            throw new IllegalStateException(e);
        }
        return reply(id, STATUS_OK, null, fields);
    }
}
