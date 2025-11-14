package com.authgear.capacitor;

import com.getcapacitor.JSObject;

class BiometricOptions {
    JSObject payload;
    String kid;
    String alias;
    int allowedAuthenticatorsOnEnableFlags;
    int allowedAuthenticatorsOnAuthenticateFlags;
    boolean invalidatedByBiometricEnrollment;
    String title;
    String subtitle;
    String description;
    String negativeButtonText;

    BiometricOptions() {}
}
