package com.authgear.capacitor;

import androidx.annotation.NonNull;

interface BiometricCallback {
    void onSuccess(String jwt);
    void onAuthenticationError(int errorCode, @NonNull CharSequence errString);
    void onException(Exception e);
}
