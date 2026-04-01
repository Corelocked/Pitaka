package com.pitaka.budgetbook;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

public class SavingsGoalsWidgetFactory implements RemoteViewsService.RemoteViewsFactory {
    private final Context context;
    private JSONArray rows = new JSONArray();

    public SavingsGoalsWidgetFactory(Context context) {
        this.context = context;
    }

    @Override
    public void onCreate() {}

    @Override
    public void onDataSetChanged() {
        JSONObject snapshot = WidgetDataStore.loadSnapshot(context);
        JSONObject section = WidgetDataStore.getSection(snapshot, "savingsGoals");
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
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.pitaka_savings_widget_item);
        views.setTextViewText(R.id.goalName, WidgetDataStore.getString(row, "label", "Savings goal"));
        views.setTextViewText(R.id.goalAmount, String.format(
                "%s of %s",
                WidgetDataStore.getString(row, "currentLabel", WidgetDataStore.getString(row, "value", "")),
                WidgetDataStore.getString(row, "targetLabel", "")
        ));
        views.setTextViewText(R.id.goalPercent, WidgetDataStore.getString(row, "percentLabel", ""));
        views.setTextViewText(R.id.goalMetaLeft, WidgetDataStore.getString(row, "targetDateLabel", ""));
        views.setTextViewText(R.id.goalMetaRight, WidgetDataStore.getString(row, "remainingLabel", WidgetDataStore.getString(row, "hint", "")));
        views.setProgressBar(R.id.goalProgress, 100, Math.max(0, Math.min(100, (int) Math.round(row == null ? 0 : row.optDouble("progress", 0)))), false);

        Intent fillInIntent = new Intent();
        views.setOnClickFillInIntent(R.id.goalCard, fillInIntent);
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
        return WidgetDataStore.getString(row, "id", String.valueOf(position)).hashCode();
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
