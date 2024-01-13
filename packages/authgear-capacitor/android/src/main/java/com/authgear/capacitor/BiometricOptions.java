package com.authgear.capacitor;

import com.getcapacitor.JSObject;

class BiometricOptions {
    JSObject payload;
    String kid;
    String alias;
    int flags;
    boolean invalidatedByBiometricEnrollment;
    String title;
    String subtitle;
    String description;
    String negativeButtonText;

    BiometricOptions() {}
}
