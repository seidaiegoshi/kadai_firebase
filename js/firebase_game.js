// firebaseと、ゲームに関わる操作はここで行う。
// ゲームの流れ
// ◆席につく
//  来た順にタイムスタンプをつけて席につかせる。
// ◆席についた人がみんな準備完了で回答を開始
//  3人から6人の固定人数とした。
// タイムスタンプ先頭の人がホストとして、ホストが乱数を使って質問をピックアップする。プレイヤー人数と質問番号をquestionNoに登録する。
// questionNoコレクションが更新されたら、プレイヤー人数から質問コレクションを選択、番号から、何番目かを選択して、質問を表示する。
// ◆質問に回答完了したらしつもんの答えを表示
//  答えの文字列が空じゃなかったら、回答を表示
// ◆全員席から退出。
//  質問と答えを消してタイムスタンプと準備完了フラグをリセットする。

// import { createRandomNumber, myStatus } from "./script.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";

// https://firebase.google.com/docs/web/setup#available-libraries
import {
	getFirestore,
	collection,
	addDoc,
	getDocs,
	getDoc,
	serverTimestamp,
	deleteDoc,
	doc,
	where,
	updateDoc,
	query,
	onSnapshot,
	orderBy,
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

let usersStatus = [];
let myStatus = {};
let hartBeat;
let imHost = false;
let questionNumber = -1;
let setQuestionNumberFlag = false;
let docsSnap;

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
}, 5000);

//!データ監視ゾーン*************************************************************************
const q = query(collection(db, "game"), orderBy("time", "asc"));
const q3 = query(collection(db, "question3"), orderBy("time", "asc"));
const q4 = query(collection(db, "question4"), orderBy("time", "asc"));
const q5 = query(collection(db, "question5"), orderBy("time", "asc"));
onSnapshot(q, async (querySnapshot) => {
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
			if (Math.abs(hartBeat - el.data.iAmAlive.seconds) > 7) {
				//7秒以上生きていないドキュメントを削除する。判定の瞬間によっては、倍時間がかかる。
				await deleteDoc(doc(db, "game", el.id));
			}
		}
	});

	//オブジェクト配列を画面に表示 みんなの回答を画面に表示する。
	const htmlElements = [];
	documents.forEach((document, index) => {
		if (document.data.seatNumber != null) {
			htmlElements.push(`
      <li id="${document.id}" class="ring-1">
        <div id="${document.data.seatNumber}" class="flex justify-end">
          <span class="mr-5">Name:${document.data.name}</span>
          <span class="mr-5">Ready:${document.data.ready}</span>
          <span class="ml-5">Answer:${document.data.answer}</span>
        </div>
      </li>
    `);
		}
	});
	$("#gameWindow").html(htmlElements);

	//全員が準備完了だったら質問を選択して回答開始！
	let allReady = true;
	let playerCount = 0;
	await documents.forEach((el, i) => {
		if (!el.data.ready) {
			allReady = false;
			setQuestionNumberFlag = false;
		}
		if (i == 0 && el.id == myStatus.id) {
			// 自分がタイムスタンプ一番早かったら、自分がホストになる。
			imHost = true;
		}
		playerCount++;
	});
	// 質問を設定する↓
	console.log(setQuestionNumberFlag);

	if (allReady && 3 <= playerCount && playerCount <= 5) {
		console.log("playerCount" + playerCount);
		// 人数は3人以上5人以下でプレイ可能
		const docRef = doc(db, "questionNo", "question-info");
		const qs = query(collection(db, "questions"), where("length", "==", playerCount));
		// ここは1つのドキュメントを参照しているので「getDoc」
		const docSnap = await getDoc(docRef);
		if (!docsSnap) {
			docsSnap = await getDocs(qs);
		}
		const qdocuments = [];
		docsSnap.forEach((el, i) => {
			const qdocumnt = {
				id: el.id,
				data: el.data(),
			};
			qdocuments.push(qdocumnt);
		});
		// console.log(qdocuments);

		if (imHost && !setQuestionNumberFlag) {
			setQuestionNumberFlag = true;
			// 質問を設定するのはホストとして選ばれた人
			// データ更新を行う処理。awaitで実行完了をまつ。
			console.log("qdoclen" + qdocuments.length);
			const num = createRandomNumber(0, qdocuments.length - 1);
			console.log("set" + num);
			await updateDoc(docRef, {
				questionNumber: num,
			});
		}

		// 全員質問を取得する
		if (docSnap.exists()) {
			questionNumber = docSnap.data().questionNumber;

			// console.log("qnum" + questionNumber);
		}
		// ここはコレクションを参照しているので、「getDocs」
		qdocuments.forEach(async (el, i) => {
			// console.log(el.data);
			console.log("qnum" + questionNumber);
			if (i == questionNumber) {
				await $("#question").text(el.data.question);
				console.log("questontext" + el.data.question);
				await $("#announceAnswer").text("回答してください！");
			}
		});
	}

	//全員質問を投稿したら、質問を表示して回答開始！
	let allSendAnswer = true;
	documents.forEach(async (el) => {
		if (el.data.answer == "") {
			allSendAnswer = false;
		}
	});
	if (allSendAnswer) {
		qdocuments.forEach(async (el, i) => {
			if (i == questionNumber) {
				await $("#collectAnswer").text("正解は・・・「" + el.data.answer + "」でした！");
			}
		});
	}
});

//プレイヤーの名前をドキュメントに追加する。
$("#setUserName").on("click", async () => {
	if ($("#userName").val()) {
		myStatus.name = $("#userName").val();

		const MyDataAddress = doc(db, "game", myStatus.id);
		// データ更新を行う処理。awaitで実行完了をまつ。別にここでいらない？？？
		await updateDoc(MyDataAddress, {
			name: myStatus.name,
		});
		$("#btnReady").css("display", "block");
		$("#chatSend").css("display", "block");
	}
});

// 準備完了を登録する
$("#btnReady").on("click", async () => {
	//ローカルの自分のデータを更新
	myStatus.ready = true;
	// どこに書き込むか
	const MyDataAddress = doc(db, "game", myStatus.id);
	// データ更新を行う処理。awaitで実行完了をまつ。
	await updateDoc(MyDataAddress, {
		ready: myStatus.ready,
	});
});

//問題を設定する。
$("#sendQuestion").on("click", async () => {
	if ($("#myQuestion").val()) {
		myStatus.question = $("#myQuestion").val();

		const MyDataAddress = doc(db, "game", myStatus.id);
		// データ更新を行う処理。awaitで実行完了をまつ。
		await updateDoc(MyDataAddress, {
			question: myStatus.question,
		});
	}
});

//答えを送信する。
$("#sendAnswer").on("click", async () => {
	if ($("#answer").val() && myStatus.id) {
		//ローカルのデータを更新
		myStatus.answer = $("#answer").val();
		// どこに書き込むか
		const MyDataAddress = doc(db, "game", myStatus.id);
		// データ更新を行う処理。awaitで実行完了をまつ。
		await updateDoc(MyDataAddress, {
			answer: myStatus.answer,
		});
	}
});
