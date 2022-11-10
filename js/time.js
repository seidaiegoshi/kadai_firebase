// 日時をいい感じの形式にする関数
function convertTimestampToDatetime(timestamp) {
	const _d = timestamp ? new Date(timestamp * 1000) : new Date();
	const Y = _d.getFullYear();
	const m = (_d.getMonth() + 1).toString().padStart(2, "0");
	const d = _d.getDate().toString().padStart(2, "0");
	const H = _d.getHours().toString().padStart(2, "0");
	const i = _d.getMinutes().toString().padStart(2, "0");
	const s = _d.getSeconds().toString().padStart(2, "0");
	return `${Y}/${m}/${d} ${H}:${i}:${s}`;
}

// 指定した範囲で乱数をつくる関数
const createRandomNumber = (max, min) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
