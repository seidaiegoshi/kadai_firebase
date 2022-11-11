//firebaseの容量制限に達すると、ブラウザからみることもできなくなる。
//ので、同じようなデータ型をつくろうとしても、データのかたち覚えてなくて更に詰む
//ので、データの型をメモしておく

// コレクション
//chat
game = {
	id: "",
	data: {
		name: "",
		answer: "",
		seatNumber: usersStatus.length,
		ready: false,
		question: "",
		iAmAlive: serverTimestamp(),
		time: serverTimestamp(),
	},
};
question3 = {
	id: "",
	data: {
		question: $("#q3Question").val(),
		answer: $("#q3Answer").val(),
		time: serverTimestamp(),
	},
};
// question4;
// question5;

questionNo = {
	id: "question-info",
	data: {
		playerNumber: playerCount,
		questionNumber: createRandomNumber(0, documents.length),
	},
};

chat = {
	name: $("#name").val(),
	text: $("#chatText").val(),
	time: serverTimestamp(),
};
