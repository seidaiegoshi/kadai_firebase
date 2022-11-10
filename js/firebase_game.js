// firebaseと、ゲームに関わる操作はここで行う。

// import { createRandomNumber, myStatus } from "./script.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";

// https://firebase.google.com/docs/web/setup#available-libraries
import {
	getFirestore,
	collection,
	addDoc,
	doc,
	updateDoc,
	query,
	onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-firestore.js";
import {
	getAuth,
	signInAnonymously,
	setPersistence,
	inMemoryPersistence,
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyARR6GKu_JymMIcqEZQVjnj7U6FAPNtvTw",
	authDomain: "kadai-firebase-3b535.firebaseapp.com",
	projectId: "kadai-firebase-3b535",
	storageBucket: "kadai-firebase-3b535.appspot.com",
	messagingSenderId: "273862643331",
	appId: "1:273862643331:web:1a89e11a1a5679ef0b15b6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

let usersStatus = [];
let myStatus = {
	id: "",
	name: "",
	answer: "",
	question: "",
	ready: false,
	seatNumber: null,
};

//game呼び出し処理
const q = query(collection(db, "game"));
onSnapshot(q, (querySnapshot) => {
	//一旦userStatusにオブジェクト配列として格納
	usersStatus = [];
	querySnapshot.docs.forEach((doc, i) => {
		const document = {
			id: doc.id,
			data: doc.data(),
		};
		usersStatus.push(document);
	});

	//オブジェクト配列を画面に表示
	const htmlElements = [];
	usersStatus.forEach((document, index) => {
		if (document.data.seatNumber != null) {
			htmlElements.push(`
      <li id="${document.id}" class="ring-1">
        <div id="${document.data.seatNumber}" class="flex justify-between">
          <span class="whitespace-normal">seat:${document.data.seatNumber}</span>
          <span class="whitespace-normal">Name:${document.data.name}</span>
          <span class="whitespace-normal">Answer:${document.data.answer}</span>
        </div>
      </li>
    `);
		}
	});
	$("#gameWindow").html(htmlElements);

	//全員が準備完了だったら質問を表示する。
	let readyAll = true;
	let playerCount = 0;
	let questions = [];
	usersStatus.forEach((document) => {
		if (document.data.seatNumber != null && !document.data.ready) {
			readyAll = false;
			playerCount++;
			questions.push(document.data.question);
		}
	});
	if (readyAll) {
		$("#question").text(questions[createRandomNumber(0, questions.length - 1)]);
	}
});

console.log(auth.currentUser);

//プレイヤーをドキュメントに追加する。
$("#setUserName").on("click", async () => {
	//匿名でサインイン
	console.log(auth.currentUser);
	await signInAnonymously(auth)
		.then(() => {
			console.log(auth.currentUser.uid); //自分のUIDを表示
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode + errorMessage);
		});

	if ($("#userName").val()) {
		$("#userName").prop("disabled", true);
		let postData = {};
		if (usersStatus.length < 6) {
			//最大ゲーム人数を6人とする。
			postData = {
				name: $("#userName").val(),
				answer: "",
				seatNumber: usersStatus.length,
				ready: false,
			};
		} else {
			postData = {
				name: $("#userName").val(),
				answer: "",
				seatNumber: null,
				ready: false,
			};
		}
		// firestoreにデータ登録
		const docRef = await addDoc(collection(db, "game"), postData);

		//自分の情報を保持しておく。
		myStatus = {
			id: docRef.id,
			name: $("#userName").val(),
			seatNumber: usersStatus.length,
			ready: false,
			question: "",
			answer: "",
		};
	}
	//TODO一回ボタン押したらおせなくする処理
});

// 準備完了を登録する
$("#btnReady").on("click", async () => {
	console.log(auth.currentUser);

	//ローカルの自分のデータを更新
	myStatus.ready = true;
	// どこに書き込むか
	const MyDataAddress = doc(db, "game", myStatus.id);
	// データ更新を行う処理。awaitで実行完了をまつ。別にここでいらない？？？
	await updateDoc(MyDataAddress, {
		ready: myStatus.ready,
	});
});

//問題を設定する。

//答えを送信する。
$("#sendAnswer").on("click", async () => {
	console.log("here1");
	if ($("#answer").val() && myStatus.id) {
		console.log("here");
		//ローカルのデータを更新
		myStatus.answer = $("#answer").val();
		// どこに書き込むか
		const MyDataAddress = doc(db, "game", myStatus.id);
		// データ更新を行う処理。awaitで実行完了をまつ。別にここでいらない？？？
		await updateDoc(MyDataAddress, {
			answer: myStatus.answer,
		});
	}
});
