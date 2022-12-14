//firebaseのチャットに関わる操作はここで行う。

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import {
	getFirestore,
	collection,
	addDoc,
	serverTimestamp,
	query,
	orderBy,
	onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyBaKWvCbFpizYxsQDFf2XPwd6DlF7a9Ycg",
	authDomain: "kadai-firebase2.firebaseapp.com",
	projectId: "kadai-firebase2",
	storageBucket: "kadai-firebase2.appspot.com",
	messagingSenderId: "339246993251",
	appId: "1:339246993251:web:b7c87d59527656174f4d56",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//1日以上前のチャットは闇に消し去る。
//1日以上前のチャットを呼び出して、
//各々のIDを取り出して
//ドキュメントを削除
// const delOldChatQuery = query(collection(db, "chat"), where("time","<=","")));

//チャット呼び出し処理
const q = query(collection(db, "chat"), orderBy("time", "asc"));
onSnapshot(q, (querySnapshot) => {
	//一旦documentsにオブジェクト配列として格納
	const documents = [];
	querySnapshot.docs.forEach((doc, i) => {
		const document = {
			id: doc.id,
			data: doc.data(),
		};
		documents.push(document);
	});

	//オブジェクト配列を画面に表示
	const htmlElements = [];
	documents.forEach((document) => {
		htmlElements.push(`
          <li id="${document.id}" class="ring-1 ring-gray-200">
            <p>
            <span>${document.data.name}</span>
            <span class="text-gray-500"> ${convertTimestampToDatetime(document.data.time?.seconds)}</span> 
            </p>
            <p>${document.data.text}</p>
          </li>
        `);
	});
	$("#output").html(htmlElements);

	//TODO 以下の機能が効いているかわからないので、デプロイしたら確認する。
	//チャットの履歴を見ている場合は、新しいチャットがきてもスクロールしない。
	if ("chatHistory" != $(":focus").attr("id")) {
		//一番下までスクロールするよ
		$("#chatHistory")[0].scrollTop = $("#chatHistory")[0].scrollHeight;
	}
});

//チャット書き込み処理
$("#chatSend").on("click", () => {
	if ($("#chatText").val()) {
		const postData = {
			name: $("#userName").val(),
			text: $("#chatText").val(),
			time: serverTimestamp(),
		};
		addDoc(collection(db, "chat"), postData);
		$("#chatText").val("");
	}
});
