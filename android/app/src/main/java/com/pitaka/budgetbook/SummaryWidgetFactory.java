package com.pitaka.budgetbook;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

public class SummaryWidgetFactory implements RemoteViewsService.RemoteViewsFactory {
    private final Context context;
    private final String sectionKey;
    private JSONArray rows = new JSONArray();

    public SummaryWidgetFactory(Context context, Intent intent) {
        this.context = context;
        this.sectionKey = intent.getStringExtra("sectionKey");
    }

    @Override
    public void onCreate() {}

    @Override
    public void onDataSetChanged() {
        JSONObject snapshot = WidgetDataStore.loadSnapshot(context);
        JSONObject section = WidgetDataStore.getSection(snapshot, sectionKey);
        rows = WidgetDataStore.getRows(section);
    }

    @Override
    public void onDestroy() {}

    @Override
    public int getCount() {
        return rows.length();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        JSONObject row = rows.optJSONObject(position);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.pitaka_summary_widget_item);
        views.setTextViewText(R.id.summaryItemLabel, WidgetDataStore.getString(row, "label", ""));
        views.setTextViewText(R.id.summaryItemValue, WidgetDataStore.getString(row, "value", ""));
        views.setTextViewText(R.id.summaryItemHint, WidgetDataStore.getString(row, "hint", ""));
        Intent fillInIntent = new Intent();
        views.setOnClickFillInIntent(R.id.summaryItemRoot, fillInIntent);
        return views;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public long getItemId(int position) {
        JSONObject row = rows.optJSONObject(position);
        return WidgetDataStore.getString(row, "label", String.valueOf(position)).hashCode();
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
