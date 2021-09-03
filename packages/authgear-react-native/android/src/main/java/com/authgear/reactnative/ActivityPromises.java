package com.authgear.reactnative;

import android.util.SparseArray;

import com.facebook.react.bridge.Promise;

import java.util.concurrent.atomic.AtomicInteger;

public class ActivityPromises {

    public static class ActivityPromise {
        public final Promise promise;
        public final int tag;

        public ActivityPromise(int tag, Promise promise) {
            this.tag = tag;
            this.promise = promise;
        }
    }

    private AtomicInteger mIndex;
    private SparseArray<ActivityPromise> mPromises;

    public ActivityPromises() {
        this.mIndex = new AtomicInteger();
        this.mPromises = new SparseArray<>();
    }

    public int push(ActivityPromise activityPromise) {
        final int index = this.mIndex.incrementAndGet();
        this.mPromises.put(index, activityPromise);
        return index;
    }

    public ActivityPromise pop(int index) {
        ActivityPromise activityPromise = this.mPromises.get(index);
        this.mPromises.remove(index);
        return activityPromise;
    }
}
