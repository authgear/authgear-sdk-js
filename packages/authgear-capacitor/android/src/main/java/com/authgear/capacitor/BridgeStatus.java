package com.authgear.capacitor;

import androidx.annotation.NonNull;

// The status of a reply of the WebView bridge. value is the string sent to the page.
enum BridgeStatus {
    OK("ok"),
    UNSUPPORTED("unsupported"),
    ERROR("error"),
    NO_CREDENTIAL("no_credential"),
    CANCELLED("cancelled");

    @NonNull
    final String value;

    BridgeStatus(@NonNull String value) {
        this.value = value;
    }
}
