package com.tbridge.userapp;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }
    
    @Override
    public void onResume() {
        super.onResume();
        handleIntent(getIntent());
    }
    
    private void handleIntent(Intent intent) {
        if (intent != null && intent.getData() != null) {
            Uri data = intent.getData();
            String scheme = data.getScheme();
            
            // 커스텀 스킴 또는 OAuth 리다이렉트 처리
            if ("com.tbridge.userapp".equals(scheme) || 
                (data.toString().contains("access_token") && data.toString().contains("auth"))) {
                
                // WebView에 세션 새로고침 신호 보내기
                getBridge().getWebView().post(() -> {
                    getBridge().getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('app-resumed', { detail: { authSuccess: true } }));",
                        null
                    );
                });
                
                // 앱을 포그라운드로 가져오기
                Intent appIntent = new Intent(this, MainActivity.class);
                appIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(appIntent);
            }
        }
    }
}
