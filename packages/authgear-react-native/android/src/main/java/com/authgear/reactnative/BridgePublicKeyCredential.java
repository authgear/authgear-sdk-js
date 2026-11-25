package com.authgear.reactnative;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONException;
import org.json.JSONObject;

// The AuthenticationResponseJSON of a passkey assertion, with binary values as base64url.
final class BridgePublicKeyCredential implements BridgeCredential {

    static final class Response {
        @NonNull
        final String clientDataJSON;
        @NonNull
        final String authenticatorData;
        @NonNull
        final String signature;
        // Optional in AuthenticationResponseJSON.
        @Nullable
        final String userHandle;

        Response(
            @NonNull String clientDataJSON,
            @NonNull String authenticatorData,
            @NonNull String signature,
            @Nullable String userHandle
        ) {
            this.clientDataJSON = clientDataJSON;
            this.authenticatorData = authenticatorData;
            this.signature = signature;
            this.userHandle = userHandle;
        }
    }

    @NonNull
    final String id;
    @NonNull
    final String rawId;
    @NonNull
    final String type;
    // Optional in AuthenticationResponseJSON.
    @Nullable
    final String authenticatorAttachment;
    @NonNull
    final Response response;
    // The outputs of the extensions, whose members depend on the extension, so they are kept as JSON.
    @NonNull
    final JSONObject clientExtensionResults;

    BridgePublicKeyCredential(
        @NonNull String id,
        @NonNull String rawId,
        @NonNull String type,
        @Nullable String authenticatorAttachment,
        @NonNull Response response,
        @NonNull JSONObject clientExtensionResults
    ) {
        this.id = id;
        this.rawId = rawId;
        this.type = type;
        this.authenticatorAttachment = authenticatorAttachment;
        this.response = response;
        this.clientExtensionResults = clientExtensionResults;
    }

    // Reads the AuthenticationResponseJSON that Credential Manager returns.
    // Throws when a required member is missing.
    @NonNull
    static BridgePublicKeyCredential fromAuthenticationResponseJson(@NonNull String text) throws JSONException {
        JSONObject json = new JSONObject(text);
        JSONObject response = json.getJSONObject("response");
        JSONObject clientExtensionResults = json.optJSONObject("clientExtensionResults");
        return new BridgePublicKeyCredential(
            json.getString("id"),
            json.getString("rawId"),
            json.getString("type"),
            optString(json, "authenticatorAttachment"),
            new Response(
                response.getString("clientDataJSON"),
                response.getString("authenticatorData"),
                response.getString("signature"),
                optString(response, "userHandle")
            ),
            clientExtensionResults != null ? clientExtensionResults : new JSONObject()
        );
    }

    @Nullable
    private static String optString(@NonNull JSONObject json, @NonNull String name) throws JSONException {
        return json.isNull(name) ? null : json.getString(name);
    }

    @NonNull
    @Override
    public JSONObject toJSON() {
        try {
            JSONObject response = new JSONObject();
            response.put("clientDataJSON", this.response.clientDataJSON);
            response.put("authenticatorData", this.response.authenticatorData);
            response.put("signature", this.response.signature);
            if (this.response.userHandle != null) {
                response.put("userHandle", this.response.userHandle);
            }
            JSONObject json = new JSONObject();
            json.put("id", this.id);
            json.put("rawId", this.rawId);
            json.put("type", this.type);
            if (this.authenticatorAttachment != null) {
                json.put("authenticatorAttachment", this.authenticatorAttachment);
            }
            json.put("response", response);
            json.put("clientExtensionResults", this.clientExtensionResults);
            return json;
        } catch (JSONException e) {
            // put throws only for a null key or a non-finite number, which are not used here.
            throw new IllegalStateException(e);
        }
    }
}
