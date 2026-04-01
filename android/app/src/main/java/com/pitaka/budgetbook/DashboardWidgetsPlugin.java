package com.pitaka.budgetbook;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DashboardWidgets")
public class DashboardWidgetsPlugin extends Plugin {
    @PluginMethod
    public void saveSnapshot(PluginCall call) {
        String snapshot = call.getString("snapshot");

        if (snapshot == null) {
            call.reject("snapshot is required");
            return;
        }

        WidgetDataStore.saveSnapshot(getContext(), snapshot);
        PitakaWidgetRenderer.notifyWidgetsChanged(getContext());
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void clearSnapshot(PluginCall call) {
        WidgetDataStore.clearSnapshot(getContext());
        PitakaWidgetRenderer.notifyWidgetsChanged(getContext());
        call.resolve(new JSObject());
    }
}
