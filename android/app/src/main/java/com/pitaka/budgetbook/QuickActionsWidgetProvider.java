package com.pitaka.budgetbook;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

public class QuickActionsWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.pitaka_quick_actions_widget);
            views.setOnClickPendingIntent(R.id.quickIncome, createActionIntent(context, "income", 1001));
            views.setOnClickPendingIntent(R.id.quickExpense, createActionIntent(context, "expense", 1002));
            views.setOnClickPendingIntent(R.id.quickTransfer, createActionIntent(context, "transfer", 1003));
            views.setOnClickPendingIntent(R.id.quickGoal, createActionIntent(context, "goal", 1004));
            views.setOnClickPendingIntent(R.id.quickSubscription, createActionIntent(context, "subscription", 1005));
            appWidgetManager.updateAppWidget(widgetId, views);
        }
    }

    private PendingIntent createActionIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW,
                Uri.parse("com.pitaka.budgetbook://quick?action=widget&quickAction=" + action));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                pendingIntentFlags()
        );
    }

    private static int pendingIntentFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.FLAG_UPDATE_CURRENT;
    }
}
