package com.pitaka.budgetbook;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DashboardWidgetsPlugin.class);
        registerPlugin(GoogleSignInPlugin.class);
        registerPlugin(PlayBillingPlugin.class);
        super.onCreate(savedInstanceState);
        // Use the same system-bar inset handling before Android 15 enforcement.
        EdgeToEdge.enable(this);
    }
}
