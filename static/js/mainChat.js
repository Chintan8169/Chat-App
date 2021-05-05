const socket = io();

let sendLogo = document.querySelector('.sendLogo');
const msgIp = document.querySelector("#ipMsg");
let container = document.querySelector(".container");
let animation = document.querySelector(".animation");
let form = document.querySelector(".sendForm");
let logo = document.querySelector(".logo");


let tone = new Audio('../tone.mp3');
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
const append = (mesg, from, position, date, tonetoplay) => {
	let div = document.createElement("div");
	div.classList.add("messageContainer");
	div.classList.add(position);
	let fromWho = document.createElement("div");
	fromWho.classList.add("from");
	fromWho.innerText = `${from} :`;
	let msg = document.createElement("div");
	msg.classList.add("msg");
	msg.innerText = mesg;
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
	if (tonetoplay) {
		tone.play();
	}
	container.scrollTop = container.scrollHeight - container.clientHeight;
};


animation.classList.add("loader");
const url = `/fetchMsg?from=${userName}&to=${clientUser}`;
fetch(url)
	.then(res => res.text())
	.then(msgJSON => {
		animation.classList.remove("loader");
		let messages = JSON.parse(msgJSON);
		for (i = 0; i < messages.length; i++) {
			if (messages[i] == messages.length - 1 && messages[i].from != userName) {
				append(messages[i].msg, messages[i].from, 'left', messages[i].date, true);
			}
			else if (messages[i].from == userName) {
				append(messages[i].msg, 'You', 'right', messages[i].date, false);
			}
			else {
				append(messages[i].msg, messages[i].from, 'left', messages[i].date, false);
			}
		}
	})
	.catch(e => {
		animation.classList.remove("loader");
		console.log(e.message);
	});


socket.emit("new user", { uname: userName, to: clientUser });


form.addEventListener('submit', e => {
	e.preventDefault();
	if (msgIp.value.trim()) {
		let now = new Date();
		socket.emit('send', { msg: msgIp.value.trim(), from: userName, to: clientUser, date: now.getTime() });
		msgIp.value = "";
		msgIp.focus();
	}
});

msgIp.addEventListener("keypress", e => {
	if (e.keyCode == 13 && e.shiftKey) {
		msgIp.innerHTML = msgIp.value + "&#10;";
	}
	else if (e.keyCode == 13 && msgIp.value.trim()) {
		let now = new Date();
		socket.emit('send', { msg: msgIp.value.trim(), from: userName, to: clientUser, date: now.getTime() });
		msgIp.value = "";
	}
});

sendLogo.addEventListener('click', () => {
	if (msgIp.value.trim()) {
		let now = new Date();
		socket.emit('send', { msg: msgIp.value.trim(), from: userName, to: clientUser, date: now.getTime() });
		msgIp.value = "";
		msgIp.focus();
	}
});

socket.on("newmsg", data => {
	if (data.from == userName) {
		append(data.msg, 'You', 'right', data.date, false);
	}
	else {
		append(data.msg, data.from, 'left', data.date, true);
	}
});