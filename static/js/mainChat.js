const socket = io();

let sendLogo = document.querySelector('.sendLogo');
const msgIp = document.querySelector("#ipMsg");
let container = document.querySelector(".container");
let form = document.querySelector(".sendForm");
let logo = document.querySelector(".logo");


// let tone = new Audio('/includes/tone.mp3');
const temp = decodeURI(window.location.search.substr(1));
const clientUser = temp.split("=")[1];
const userName = getCookie("name");
logo.innerText = `${clientUser}`;


// cookie value function
function getCookie(name) {
	var cookieArr = document.cookie.split(";");

	for (var i = 0; i < cookieArr.length; i++) {
		var cookiePair = cookieArr[i].split("=");

		if (name == cookiePair[0].trim()) {
			// Decode the cookie value and return
			return decodeURIComponent(cookiePair[1]);
		}
	}

	return null;
}


// append function
const append = (mesg, from, position, date) => {
	let div = document.createElement("div");
	div.classList.add("messageContainer");
	div.classList.add(position);
	let fromWho = document.createElement("div");
	fromWho.classList.add("from");
	fromWho.innerText = `${from} :`;
	let msg = document.createElement("div");
	msg.classList.add("msg");
	let str = mesg;
	let regex = /(\*)(?![ ])(.*?)(?![ ])(\*)/gm;
	while (result = regex.exec(str)) {
		str = str.replace(result[0], result[0].replace("*", `<strong>`).replace("*", `</strong>`));
	}
	regex = /(_)(?![ ])(.*?)(?![ ])(_)/gm;
	while (result = regex.exec(str)) {
		str = str.replace(result[0], result[0].replace("_", `<em>`).replace("_", `</em>`));
	}
	regex = /(```)(?![ ])(.*?)(?![ ])(```)/gm;
	while (result = regex.exec(str)) {
		str = str.replace(result[0], result[0].replace("```", `<pre>`).replace("```", `</pre>`));
	}
	msg.innerHTML = str;
	let time = document.createElement("span");
	time.classList.add("time");
	let now = new Date(parseInt(date));
	let day = now.getDate();
	let month = now.toString().substr(4, 3);
	let year = now.getFullYear();
	let hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
	let minutes = now.getMinutes();
	let ampm = now.getHours() > 12 ? "PM" : "AM";
	time.innerHTML = `${day} ${month} ${year} | ${hours}:${minutes} ${ampm}`;
	div.appendChild(fromWho);
	div.appendChild(msg);
	div.appendChild(time);
	container.appendChild(div);
	container.scrollTop = container.scrollHeight - container.clientHeight;
};

async function fetchMsg(url) {
	let myObject = await fetch(url);
	let msgJSON = await myObject.text();
	let messages = JSON.parse(msgJSON);
	messages.forEach(data => {
		if (data.from == userName) {
			append(data.msg, 'You', 'right', data.date);
		}
		else {
			append(data.msg, data.from, 'left', data.date);
		}
	});
}

const url = `/fetchMsg?from=${userName}&to=${clientUser}`;
fetchMsg(url);

socket.emit("new user", { uname: userName, to: clientUser });


form.addEventListener('submit', e => {
	e.preventDefault();
	if (msgIp.value.trim()) {
		let now = new Date();
		socket.emit('send', { msg: msgIp.value, from: userName, to: clientUser, date: now.getTime() });
		msgIp.value = "";
	}
});

sendLogo.addEventListener('click', () => {
	if (msgIp.value.trim()) {
		let now = new Date();
		socket.emit('send', { msg: msgIp.value, from: userName, to: clientUser, date: now.getTime() });
		msgIp.value = "";
	}
});

socket.on("newmsg", data => {
	if (data.from == userName) {
		append(data.msg, 'You', 'right', data.date);
	}
	else {
		append(data.msg, data.from, 'left', data.date);
	}
});