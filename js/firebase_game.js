// firebaseと、ゲームに関わる操作はここで行う。

// import { createRandomNumber, myStatus } from "./script.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";

// https://firebase.google.com/docs/web/setup#available-libraries
import {
	getFirestore,
	collection,
	addDoc,
	serverTimestamp,
	deleteDoc,
	doc,
	updateDoc,
	query,
	onSnapshot,
	orderBy,
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-firestore.js";

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

let usersStatus = [];
let myStatus = {};
let hartBeat;

//自分が生きていることをサーバーに送信し続ける。
setInterval(async () => {
	if (myStatus.id) {
		//すでにIDを持っていたら、現在時刻を更新する。
		// ローカルの現在時刻をセット
		myStatus.iAmAlive = serverTimestamp();

		const MyDataAddress = doc(db, "game", myStatus.id);
		// サーバーの自分が持つ現在時刻を更新
		await updateDoc(MyDataAddress, {
			iAmAlive: myStatus.iAmAlive,
		});
	} else {
		//IDを持ってなかったら新規に登録する。
		let postData = {
			name: "",
			answer: "",
			seatNumber: usersStatus.length,
			ready: false,
			question: "",
			iAmAlive: serverTimestamp(),
			time: serverTimestamp(),
		};

		// firestoreにデータ登録
		const docRef = await addDoc(collection(db, "game"), postData);

		//ローカルに自分の情報を持っておく。
		myStatus = postData;
		myStatus.id = docRef.id;
	}
}, 3000);

//監視
const q = query(collection(db, "game"), orderBy("time", "asc"));
onSnapshot(q, (querySnapshot) => {
	//一旦userStatusにオブジェクト配列として格納
	const documents = [];
	querySnapshot.docs.forEach((doc, i) => {
		const document = {
			id: doc.id,
			data: doc.data(),
		};
		documents.push(document);
	});

	//自分のタイムスタンプと他の人のタイムスタンプを比較していない人を退場させる。
	//超エラーでるけど動いている。
	documents.forEach((el, index) => {
		if (el.id == myStatus.id) {
			//これがないとめっちゃエラー出る
			if (el.data.iAmAlive) {
				hartBeat = el.data.iAmAlive.seconds;
			}
		}
	});
	documents.forEach(async (el, index) => {
		if (el.data.iAmAlive) {
			//これがないとめっちゃエラー出る
			if (Math.abs(hartBeat - el.data.iAmAlive.seconds) > 10) {
				//10秒以上生きていないドキュメントを削除する。
				await deleteDoc(doc(db, "game", el.id));
			}
		}
		// if (myStatus.id) {
		// 	const MyDataAddress = doc(db, "game", myStatus.id);
		// 	updateDoc(MyDataAddress, {
		// 		seatNumber: index,
		// 	});
		// }
	});

	//オブジェクト配列を画面に表示 みんなの回答を画面に表示する。
	//TODO 全員の回答が揃ったらにする。(回答したら、Readyフラグを下げて、Readyフラグがみんな下がったら答えを表示する。)
	const htmlElements = [];
	documents.forEach((document, index) => {
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
	// TODO: ブラウザでランダムつくっても問題が統一しないので、誰かがデータベースに登録するようにする。
	let readyAll = true;
	let playerCount = 0;
	let questions = [];
	documents.forEach((document) => {
		if (document.data.ready) {
			playerCount++;
		}
		if (document.data.seatNumber != null && !document.data.ready) {
			readyAll = false;
			questions.push(document.data.question);
		}
	});
	//みんな準備完了なら質問をランダムに表示する。
	if (readyAll) {
		$("#question").text(questions[createRandomNumber(0, playerCount)]);
	}
});

//プレイヤーの名前をドキュメントに追加する。
$("#setUserName").on("click", async () => {
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
			iAmAlive: serverTimestamp(),
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
