// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Firebase 구성
const firebaseConfig = {
    apiKey: "AIzaSyCdh-JVwPW_ZGOJl_vBH6rDMWl-wJcxFU8",
    authDomain: "t-bridge.firebaseapp.com",
    projectId: "t-bridge",
    storageBucket: "t-bridge.firebasestorage.app",
    messagingSenderId: "896375537648",
    appId: "1:896375537648:web:7d0f83d12dd2c7f9cbbc63"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// 메시징 서비스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
    console.log('백그라운드 메시지 수신:', payload);
    
    const notificationTitle = payload.notification?.title || 'T-Bridge 알림';
    const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 있습니다.',
        icon: payload.notification?.image || '/firebase-logo.png',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});