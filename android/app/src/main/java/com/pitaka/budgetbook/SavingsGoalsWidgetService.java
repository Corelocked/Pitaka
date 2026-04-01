package com.pitaka.budgetbook;

import android.content.Intent;
import android.widget.RemoteViewsService;

public class SavingsGoalsWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new SavingsGoalsWidgetFactory(getApplicationContext());
    }
}
