package com.pitaka.budgetbook;

import android.content.Intent;
import android.widget.RemoteViewsService;

public class SummaryWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new SummaryWidgetFactory(getApplicationContext(), intent);
    }
}
