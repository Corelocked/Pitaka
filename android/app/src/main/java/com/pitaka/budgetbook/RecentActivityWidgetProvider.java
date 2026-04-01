package com.pitaka.budgetbook;

public class RecentActivityWidgetProvider extends BaseSummaryWidgetProvider {
    @Override
    protected String getSectionKey() {
        return "recentTransactions";
    }
}
