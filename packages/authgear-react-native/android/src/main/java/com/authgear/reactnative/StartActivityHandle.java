package com.authgear.reactnative;

class StartActivityHandle<T> {
    final T value;
    final int tag;

    StartActivityHandle(int tag, T value) {
        this.tag = tag;
        this.value = value;
    }
}
