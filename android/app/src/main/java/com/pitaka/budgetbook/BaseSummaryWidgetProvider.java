package com.pitaka.budgetbook;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.os.Bundle;
import android.appwidget.AppWidgetProvider;
import android.widget.RemoteViews;

public abstract class BaseSummaryWidgetProvider extends AppWidgetProvider {
    protected abstract String getSectionKey();

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            Bundle options = appWidgetManager.getAppWidgetOptions(widgetId);
            RemoteViews views = PitakaWidgetRenderer.buildSummaryRemoteViews(context, getSectionKey(), widgetId, options);
            appWidgetManager.updateAppWidget(widgetId, views);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        RemoteViews views = PitakaWidgetRenderer.buildSummaryRemoteViews(context, getSectionKey(), appWidgetId, newOptions);
        appWidgetManager.updateAppWidget(appWidgetId, views);
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.summaryList);
    }
}
