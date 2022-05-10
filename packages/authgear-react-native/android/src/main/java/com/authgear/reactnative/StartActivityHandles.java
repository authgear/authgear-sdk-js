package com.authgear.reactnative;

import android.util.SparseArray;

import java.util.concurrent.atomic.AtomicInteger;

class StartActivityHandles<T> {

    private AtomicInteger mIndex;
    private SparseArray<StartActivityHandle<T>> mHandles;

    StartActivityHandles() {
        this.mIndex = new AtomicInteger();
        this.mHandles = new SparseArray<>();
    }

    int push(StartActivityHandle<T> handle) {
        final int index = this.mIndex.incrementAndGet();
        this.mHandles.put(index, handle);
        return index;
    }

    public StartActivityHandle<T> pop(int index) {
        StartActivityHandle<T> activityPromise = this.mHandles.get(index);
        this.mHandles.remove(index);
        return activityPromise;
    }
}
