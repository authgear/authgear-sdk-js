package com.authgear.capacitor;

import androidx.annotation.NonNull;

import org.json.JSONObject;

// The credential in the ok reply to credentials.get. Each kind of credential is a class that implements it.
interface BridgeCredential {
    @NonNull
    JSONObject toJSON();
}
