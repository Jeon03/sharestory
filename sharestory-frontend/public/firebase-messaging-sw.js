// firebase-messaging-sw.js

// 이 두 줄은 Firebase 라이브러리를 불러옵니다.
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");

// 여기에 본인의 Firebase 프로젝트 설정값을 넣으세요.
// 이전에 .env 파일에 넣었던 값과 동일합니다.
const firebaseConfig = {
    apiKey: "AIzaSyDrJ5EGDIP9m8KZR3eJyvRgerLtqq-yW_0",
    authDomain: "dreamfire-be9b9.firebaseapp.com",
    projectId: "dreamfire-be9b9",
    storageBucket: "dreamfire-be9b9.firebasestorage.app",
    messagingSenderId: "805827793369",
    appId: "1:805827793369:web:106a27f65d242cf62889c8",
};

// Firebase를 초기화합니다.
firebase.initializeApp(firebaseConfig);

// 메시징 기능을 가져옵니다.
const messaging = firebase.messaging();