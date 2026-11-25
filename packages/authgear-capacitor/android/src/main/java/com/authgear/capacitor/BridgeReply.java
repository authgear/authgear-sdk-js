package com.authgear.capacitor;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

// A reply of the WebView bridge, encoded as a JSON object. Fields that are null are left out.
final class BridgeReply {
    // The id of the message. null only in the reply to a message without a string id.
    @Nullable
    final String id;
    @NonNull
    final BridgeStatus status;
    @Nullable
    String message;
    // The ok reply to bridge.capabilities.
    @Nullable
    List<String> capabilities;
    // The ok reply to credentials.get.
    @Nullable
    BridgeCredential credential;

    BridgeReply(@Nullable String id, @NonNull BridgeStatus status) {
        this.id = id;
        this.status = status;
    }

    @NonNull
    BridgeReply setMessage(@Nullable String message) {
        this.message = message;
        return this;
    }

    @NonNull
    BridgeReply setCapabilities(@Nullable List<String> capabilities) {
        this.capabilities = capabilities;
        return this;
    }

    @NonNull
    BridgeReply setCredential(@Nullable BridgeCredential credential) {
        this.credential = credential;
        return this;
    }

    @NonNull
    JSONObject toJSON() {
        JSONObject json = new JSONObject();
        try {
            if (this.id != null) {
                json.put("id", this.id);
            }
            json.put("status", this.status.value);
            if (this.message != null) {
                json.put("message", this.message);
            }
            if (this.capabilities != null) {
                json.put("capabilities", new JSONArray(this.capabilities));
            }
            if (this.credential != null) {
                json.put("credential", this.credential.toJSON());
            }
        } catch (JSONException e) {
            // put throws only for a null key or a non-finite number, which are not used here.
            throw new IllegalStateException(e);
        }
        return json;
    }

    // The text sent to the page.
    @NonNull
    String encode() {
        return toJSON().toString();
    }
}
