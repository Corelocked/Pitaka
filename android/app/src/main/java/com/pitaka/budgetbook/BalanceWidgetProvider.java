package com.pitaka.budgetbook;

public class BalanceWidgetProvider extends BaseSummaryWidgetProvider {
    @Override
    protected String getSectionKey() {
        return "accountAllocations";
    }
}
