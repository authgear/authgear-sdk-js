package com.authgear.capacitor;

class StartActivityHandle<T> {
    final T value;
    final int tag;

    StartActivityHandle(int tag, T value) {
        this.tag = tag;
        this.value = value;
    }
}

