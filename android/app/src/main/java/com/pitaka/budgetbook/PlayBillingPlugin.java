package com.pitaka.budgetbook;

import android.text.TextUtils;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private String pendingProductId;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
    }

    @PluginMethod
    public void getProduct(PluginCall call) {
        String productId = call.getString("productId");
        if (TextUtils.isEmpty(productId)) {
            call.reject("Missing Google Play product ID");
            return;
        }
        withBillingReady(call, () -> queryProduct(productId, call, productDetails -> {
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = productDetails.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) {
                call.reject("Pitaka Pro is not available for purchase yet.");
                return;
            }
            ProductDetails.OneTimePurchaseOfferDetails offer = offers.get(0);
            JSObject result = new JSObject();
            result.put("productId", productDetails.getProductId());
            result.put("title", productDetails.getTitle());
            result.put("description", productDetails.getDescription());
            result.put("formattedPrice", offer.getFormattedPrice());
            result.put("priceCurrencyCode", offer.getPriceCurrencyCode());
            result.put("priceAmountMicros", offer.getPriceAmountMicros());
            call.resolve(result);
        }));
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        String obfuscatedAccountId = call.getString("obfuscatedAccountId");
        if (TextUtils.isEmpty(productId) || TextUtils.isEmpty(obfuscatedAccountId)) {
            call.reject("Sign in before purchasing Pitaka Pro.");
            return;
        }
        if (pendingPurchaseCall != null) {
            call.reject("A purchase is already in progress.");
            return;
        }

        withBillingReady(call, () -> queryProduct(productId, call, productDetails -> {
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = productDetails.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) {
                call.reject("Pitaka Pro is not available for purchase yet.");
                return;
            }

            ProductDetails.OneTimePurchaseOfferDetails offer = offers.get(0);
            BillingFlowParams.ProductDetailsParams detailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .setOfferToken(offer.getOfferToken())
                    .build();
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(detailsParams))
                    .setObfuscatedAccountId(obfuscatedAccountId)
                    .build();

            pendingPurchaseCall = call;
            pendingProductId = productId;
            call.setKeepAlive(true);
            BillingResult result = billingClient.launchBillingFlow(getActivity(), flowParams);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                finishPurchaseError(result.getDebugMessage());
            }
        }));
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        String productId = call.getString("productId");
        if (TextUtils.isEmpty(productId)) {
            call.reject("Missing Google Play product ID");
            return;
        }
        withBillingReady(call, () -> billingClient.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                (billingResult, purchases) -> {
                    if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        call.reject("Could not check Google Play purchases: " + billingResult.getDebugMessage());
                        return;
                    }
                    JSArray result = new JSArray();
                    for (Purchase purchase : purchases) {
                        if (purchase.getProducts().contains(productId)) result.put(toJson(purchase, productId));
                    }
                    JSObject response = new JSObject();
                    response.put("purchases", result);
                    call.resolve(response);
                }
        ));
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) return;
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject result = new JSObject();
            result.put("state", "cancelled");
            finishPurchase(result);
            return;
        }
        if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
            finishPurchaseError(billingResult.getDebugMessage());
            return;
        }
        for (Purchase purchase : purchases) {
            if (purchase.getProducts().contains(pendingProductId)) {
                finishPurchase(toJson(purchase, pendingProductId));
                return;
            }
        }
        finishPurchaseError("Google Play did not return the Pitaka Pro purchase.");
    }

    private JSObject toJson(Purchase purchase, String productId) {
        JSObject result = new JSObject();
        result.put("productId", productId);
        result.put("purchaseToken", purchase.getPurchaseToken());
        result.put("state", purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED ? "purchased" : "pending");
        result.put("acknowledged", purchase.isAcknowledged());
        result.put("purchaseTime", purchase.getPurchaseTime());
        return result;
    }

    private void withBillingReady(PluginCall call, Runnable action) {
        if (billingClient.isReady()) {
            action.run();
            return;
        }
        billingClient.startConnection(new com.android.billingclient.api.BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) action.run();
                else call.reject("Google Play Billing is unavailable: " + result.getDebugMessage());
            }

            @Override
            public void onBillingServiceDisconnected() { }
        });
    }

    private void queryProduct(String productId, PluginCall call, java.util.function.Consumer<ProductDetails> onProduct) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(
                        QueryProductDetailsParams.Product.newBuilder()
                                .setProductId(productId)
                                .setProductType(BillingClient.ProductType.INAPP)
                                .build()))
                .build();
        billingClient.queryProductDetailsAsync(params, (billingResult, result) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Could not load the Google Play price: " + billingResult.getDebugMessage());
                return;
            }
            List<ProductDetails> products = result.getProductDetailsList();
            if (products.isEmpty()) {
                call.reject("Pitaka Pro is not available for purchase yet.");
                return;
            }
            onProduct.accept(products.get(0));
        });
    }

    private void finishPurchase(JSObject result) {
        if (pendingPurchaseCall == null) return;
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        pendingProductId = null;
        call.setKeepAlive(false);
        call.resolve(result);
    }

    private void finishPurchaseError(String message) {
        if (pendingPurchaseCall == null) return;
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        pendingProductId = null;
        call.setKeepAlive(false);
        call.reject(TextUtils.isEmpty(message) ? "Google Play purchase failed." : message);
    }
}
