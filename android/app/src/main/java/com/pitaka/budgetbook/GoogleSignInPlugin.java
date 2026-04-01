package com.pitaka.budgetbook;

import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class GoogleSignInPlugin extends Plugin {
    private CredentialManager credentialManager;

    @Override
    public void load() {
        super.load();
        credentialManager = CredentialManager.create(getContext());
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Android activity is not available");
            return;
        }

        String serverClientId = getServerClientId();
        if (TextUtils.isEmpty(serverClientId)) {
            call.reject("Missing google_web_client_id. Add your Firebase Web client ID to android/app/src/main/res/values/strings.xml or supply google-services.json.");
            return;
        }

        requestCredential(call, serverClientId, true);
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        ClearCredentialStateRequest request = new ClearCredentialStateRequest();
        credentialManager.clearCredentialStateAsync(
                request,
                null,
                Executors.newSingleThreadExecutor(),
                new CredentialManagerCallback<Void, ClearCredentialException>() {
                    @Override
                    public void onResult(Void result) {
                        call.resolve(new JSObject());
                    }

                    @Override
                    public void onError(@NonNull ClearCredentialException e) {
                        call.reject(e.getLocalizedMessage(), e);
                    }
                }
        );
    }

    private void requestCredential(PluginCall call, String serverClientId, boolean filterAuthorizedAccounts) {
        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setServerClientId(serverClientId)
                .setFilterByAuthorizedAccounts(filterAuthorizedAccounts)
                .setAutoSelectEnabled(false)
                .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build();

        credentialManager.getCredentialAsync(
                getActivity(),
                request,
                null,
                Executors.newSingleThreadExecutor(),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        handleCredential(call, result.getCredential());
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        if (filterAuthorizedAccounts) {
                            requestCredential(call, serverClientId, false);
                            return;
                        }
                        call.reject(e.getLocalizedMessage(), e);
                    }
                }
        );
    }

    private void handleCredential(PluginCall call, Credential credential) {
        if (!(credential instanceof CustomCredential)) {
            call.reject("Unsupported credential type returned from Google sign-in");
            return;
        }

        CustomCredential customCredential = (CustomCredential) credential;
        if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(customCredential.getType())) {
            call.reject("Unexpected Google credential type");
            return;
        }

        try {
            GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(customCredential.getData());
            JSObject result = new JSObject();
            result.put("idToken", googleCredential.getIdToken());
            result.put("displayName", googleCredential.getDisplayName());
            result.put("familyName", googleCredential.getFamilyName());
            result.put("givenName", googleCredential.getGivenName());
            result.put("profilePictureUri", googleCredential.getProfilePictureUri() == null ? null : googleCredential.getProfilePictureUri().toString());
            result.put("email", googleCredential.getId());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to parse Google credential", e);
        }
    }

    private String getServerClientId() {
        int generatedId = getContext().getResources().getIdentifier("default_web_client_id", "string", getContext().getPackageName());
        if (generatedId != 0) {
            String generatedValue = getContext().getString(generatedId);
            if (!TextUtils.isEmpty(generatedValue)) {
                return generatedValue;
            }
        }

        int fallbackId = getContext().getResources().getIdentifier("google_web_client_id", "string", getContext().getPackageName());
        if (fallbackId != 0) {
            String fallbackValue = getContext().getString(fallbackId);
            if (!TextUtils.isEmpty(fallbackValue)) {
                return fallbackValue;
            }
        }

        return null;
    }
}
