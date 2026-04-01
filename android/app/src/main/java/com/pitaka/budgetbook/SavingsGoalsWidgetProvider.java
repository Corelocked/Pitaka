package com.pitaka.budgetbook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

public class SavingsGoalsWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.pitaka_savings_widget);
            Intent serviceIntent = new Intent(context, SavingsGoalsWidgetService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
            serviceIntent.setData(android.net.Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.savingsStack, serviceIntent);
            views.setTextViewText(R.id.savingsTitle, "Savings Goals");
            views.setTextViewText(R.id.savingsSubtitle, "Current goals");

            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent != null) {
                PendingIntent pendingIntent = PendingIntent.getActivity(
                        context,
                        widgetId,
                        launchIntent,
                        pendingIntentFlags()
                );
                views.setOnClickPendingIntent(R.id.savingsWidgetRoot, pendingIntent);
                views.setPendingIntentTemplate(R.id.savingsStack, pendingIntent);
            }

            appWidgetManager.updateAppWidget(widgetId, views);
            appWidgetManager.notifyAppWidgetViewDataChanged(widgetId, R.id.savingsStack);
        }
    }

    private static int pendingIntentFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.FLAG_UPDATE_CURRENT;
    }
}
