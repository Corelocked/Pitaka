package com.pitaka.budgetbook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public final class PitakaWidgetRenderer {
    private PitakaWidgetRenderer() {}

    public static void notifyWidgetsChanged(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        refreshSummaryWidget(context, appWidgetManager, IncomeWidgetProvider.class, "income");
        refreshSummaryWidget(context, appWidgetManager, ExpenseWidgetProvider.class, "expense");
        refreshSummaryWidget(context, appWidgetManager, BalanceWidgetProvider.class, "accountAllocations");
        refreshSummaryWidget(context, appWidgetManager, RecentActivityWidgetProvider.class, "recentTransactions");
        refreshSavingsWidget(context, appWidgetManager);
    }

    private static void refreshSummaryWidget(Context context, AppWidgetManager appWidgetManager, Class<?> providerClass, String sectionKey) {
        ComponentName componentName = new ComponentName(context, providerClass);
        int[] widgetIds = appWidgetManager.getAppWidgetIds(componentName);

        for (int widgetId : widgetIds) {
            RemoteViews views = buildSummaryRemoteViews(context, sectionKey, widgetId, appWidgetManager.getAppWidgetOptions(widgetId));
            appWidgetManager.updateAppWidget(widgetId, views);
            appWidgetManager.notifyAppWidgetViewDataChanged(widgetId, R.id.summaryList);
        }
    }

    private static void refreshSavingsWidget(Context context, AppWidgetManager appWidgetManager) {
        ComponentName componentName = new ComponentName(context, SavingsGoalsWidgetProvider.class);
        int[] widgetIds = appWidgetManager.getAppWidgetIds(componentName);
        for (int widgetId : widgetIds) {
            appWidgetManager.notifyAppWidgetViewDataChanged(widgetId, R.id.savingsStack);
        }
    }

    public static RemoteViews buildSummaryRemoteViews(Context context, String sectionKey, int widgetId, Bundle options) {
        JSONObject snapshot = WidgetDataStore.loadSnapshot(context);
        JSONObject section = WidgetDataStore.getSection(snapshot, sectionKey);
        JSONArray rows = WidgetDataStore.getRows(section);
        boolean recentActivity = "recentTransactions".equals(sectionKey);
        boolean expanded = shouldUseExpandedLayout(rows, options, recentActivity);
        RemoteViews views = new RemoteViews(
                context.getPackageName(),
                recentActivity
                    ? (expanded ? R.layout.pitaka_recent_widget_expanded : R.layout.pitaka_recent_widget)
                    : (expanded ? R.layout.pitaka_summary_widget_expanded : R.layout.pitaka_summary_widget)
        );

        String fallbackSubtitle = snapshot == null
                ? context.getString(R.string.widget_connect_subtitle)
                : WidgetDataStore.getString(snapshot, "updatedLabel", context.getString(R.string.widget_ready_subtitle));

        views.setTextViewText(R.id.widgetTitle, WidgetDataStore.getString(section, "title", context.getString(R.string.app_name)));
        views.setTextViewText(R.id.widgetSubtitle, WidgetDataStore.getString(section, "subtitle", fallbackSubtitle));
        views.setTextViewText(R.id.widgetMetric, WidgetDataStore.getString(section, "metric", "--"));
        views.setTextViewText(R.id.widgetMeta, WidgetDataStore.getString(section, "meta", context.getString(R.string.widget_meta_default)));

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                sectionKey.hashCode(),
                launchIntent,
                pendingIntentFlags()
            );
            int rootId = recentActivity
                ? (expanded ? R.id.recentExpandedRoot : R.id.recentWidgetRoot)
                : (expanded ? R.id.summaryExpandedRoot : R.id.summaryWidgetRoot);
            views.setOnClickPendingIntent(rootId, pendingIntent);
            if (expanded) {
                views.setPendingIntentTemplate(recentActivity ? R.id.recentList : R.id.summaryList, pendingIntent);
            }
        }

        if (expanded) {
            Intent serviceIntent = new Intent(context, SummaryWidgetService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
            serviceIntent.putExtra("sectionKey", sectionKey);
            serviceIntent.setData(android.net.Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
            int listId = recentActivity ? R.id.recentList : R.id.summaryList;
            int emptyId = recentActivity ? R.id.recentEmpty : R.id.summaryEmpty;
            views.setRemoteAdapter(listId, serviceIntent);
            views.setEmptyView(listId, emptyId);
            views.setTextViewText(emptyId, rows.length() == 0 ? "No activity yet" : "");
        } else {
            if (recentActivity) {
                bindRow(views, rows, 0, R.id.row1, R.id.row1Label, R.id.row1Value, R.id.row1Hint);
                bindRow(views, rows, 1, R.id.row2, R.id.row2Label, R.id.row2Value, R.id.row2Hint);
                bindRow(views, rows, 2, R.id.row3, R.id.row3Label, R.id.row3Value, R.id.row3Hint);
            } else {
                views.setImageViewBitmap(R.id.widgetChart, WidgetChartRenderer.createDonutChart(context, section));
                bindRow(views, rows, 0, R.id.row1, R.id.row1Label, R.id.row1Value, R.id.row1Hint);
                bindRow(views, rows, 1, R.id.row2, R.id.row2Label, R.id.row2Value, R.id.row2Hint);
            }
        }

        return views;
    }

    private static boolean shouldUseExpandedLayout(JSONArray rows, Bundle options, boolean recentActivity) {
        int minWidth = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int minHeight = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
        if (recentActivity) {
            return minWidth >= 320 || minHeight >= 220 || rows.length() > 3;
        }
        // Keep donut-chart widgets chart-first unless the launcher has clearly resized them
        // into a larger card. We only switch to scrollable list mode for roomy widgets.
        return minWidth >= 250 && minHeight >= 320;
    }

    private static void bindRow(RemoteViews views, JSONArray rows, int index, int containerId, int labelId, int valueId, int hintId) {
        JSONObject row = rows.optJSONObject(index);
        String label = WidgetDataStore.getString(row, "label", index == 0 ? "No data yet" : "");
        String value = WidgetDataStore.getString(row, "value", "");
        String hint = WidgetDataStore.getString(row, "hint", "");
        boolean hasContent = !label.isEmpty() || !value.isEmpty() || !hint.isEmpty();

        views.setViewVisibility(containerId, hasContent ? View.VISIBLE : View.GONE);
        views.setTextViewText(labelId, label);
        views.setTextViewText(valueId, value);
        views.setTextViewText(hintId, hint);
    }

    private static int pendingIntentFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.FLAG_UPDATE_CURRENT;
    }
}
