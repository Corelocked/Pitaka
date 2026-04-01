package com.pitaka.budgetbook;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.TypedValue;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

public final class WidgetChartRenderer {
    private WidgetChartRenderer() {}

    public static Bitmap createDonutChart(Context context, JSONObject section) {
        int size = dp(context, 132);
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        Paint trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        trackPaint.setStyle(Paint.Style.STROKE);
        trackPaint.setColor(ContextCompat.getColor(context, R.color.widget_chart_track));
        trackPaint.setStrokeWidth(dp(context, 14));
        trackPaint.setStrokeCap(Paint.Cap.ROUND);

        Paint segmentPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        segmentPaint.setStyle(Paint.Style.STROKE);
        segmentPaint.setStrokeWidth(dp(context, 14));
        segmentPaint.setStrokeCap(Paint.Cap.ROUND);

        float inset = dp(context, 12);
        RectF arcBounds = new RectF(inset, inset, size - inset, size - inset);
        canvas.drawArc(arcBounds, 0, 360, false, trackPaint);

        JSONArray segments = section == null ? new JSONArray() : section.optJSONObject("chart") == null ? new JSONArray() : section.optJSONObject("chart").optJSONArray("segments");
        float startAngle = -90f;

        for (int i = 0; i < Math.min(5, segments == null ? 0 : segments.length()); i++) {
            JSONObject segment = segments.optJSONObject(i);
            if (segment == null) continue;

            double share = segment.optDouble("share", 0);
            if (share <= 0) continue;

            segmentPaint.setColor(parseColor(segment.optString("color"), fallbackColor(i)));
            float sweep = (float) Math.max(18d, Math.min(share * 360d, 359d));
            canvas.drawArc(arcBounds, startAngle, sweep, false, segmentPaint);
            startAngle += sweep + 4f;
        }

        return bitmap;
    }

    private static int parseColor(String color, String fallback) {
        try {
            return Color.parseColor(color);
        } catch (Exception ignored) {
            return Color.parseColor(fallback);
        }
    }

    private static String fallbackColor(int index) {
        String[] colors = {"#3F7B5D", "#D08B4C", "#7B8FC9", "#BE6A78", "#6F9D93"};
        return colors[index % colors.length];
    }

    private static int dp(Context context, int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                context.getResources().getDisplayMetrics()
        ));
    }
}
