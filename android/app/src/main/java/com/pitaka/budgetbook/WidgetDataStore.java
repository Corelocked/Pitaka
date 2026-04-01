package com.pitaka.budgetbook;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class WidgetDataStore {
    private static final String PREFERENCES_NAME = "pitaka_dashboard_widgets";
    private static final String KEY_SNAPSHOT = "snapshot";

    private WidgetDataStore() {}

    public static void saveSnapshot(Context context, String snapshot) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        preferences.edit().putString(KEY_SNAPSHOT, snapshot).apply();
    }

    public static void clearSnapshot(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        preferences.edit().remove(KEY_SNAPSHOT).apply();
    }

    public static JSONObject loadSnapshot(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        String raw = preferences.getString(KEY_SNAPSHOT, null);

        if (raw == null || raw.isEmpty()) {
            return null;
        }

        try {
            return new JSONObject(raw);
        } catch (JSONException ignored) {
            return null;
        }
    }

    public static JSONObject getSection(JSONObject snapshot, String key) {
        if (snapshot == null) {
            return null;
        }

        return snapshot.optJSONObject(key);
    }

    public static JSONArray getRows(JSONObject section) {
        if (section == null) {
            return new JSONArray();
        }

        JSONArray rows = section.optJSONArray("rows");
        return rows == null ? new JSONArray() : rows;
    }

    public static String getString(JSONObject object, String key, String fallback) {
        if (object == null) {
            return fallback;
        }

        String value = object.optString(key, fallback);
        return value == null || value.isEmpty() ? fallback : value;
    }
}
