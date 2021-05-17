const socket = io();

let sendLogo = document.querySelector('.sendLogo');
const msgIp = document.querySelector("#ipMsg");
let container = document.querySelector(".container");
let animation = document.querySelector(".animation");
let animate = document.querySelector(".animate");
let form = document.querySelector(".sendForm");
let logo = document.querySelector(".logo");
let cross = document.querySelector(".cross");
let modal = document.querySelector(".modal");
let innerModal = document.querySelector(".innerModal");
let paperclip = document.querySelector(".paperclip");
let err = document.querySelector(".err");
let fileip = document.querySelector("#file");
let filesLabel = document.querySelector("#filesLabel");
let send = document.querySelector("#send");

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

	const result = validator.isURL(mesg);
	let msg = document.createElement("div");
	msg.classList.add("msg");
	if (result) {
		msg.innerHTML = `<a href="${mesg}" target="_blank">${mesg}</a>`;
	}
	else if (mesg.includes("/download?filename=") && mesg.includes("&to=")) {
		const filename = mesg.substring(mesg.indexOf("?") + 1, mesg.indexOf("&")).split("=")[1];
		msg.innerHTML = `<a href="${mesg}" target="_blank">${filename}</a>`;
	}
	else {
		msg.innerText = mesg;
	}

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

cross.addEventListener("click", () => {
	innerModal.classList.add("close");
	setTimeout(() => {
		modal.classList.add("close");
	}, 300);
});

paperclip.addEventListener("click", () => {
	modal.classList.remove("close");
	innerModal.classList.remove("close");
});

form.addEventListener('submit', e => {
	e.preventDefault();
	if (msgIp.value.trim()) {
		let now = new Date();
		socket.emit('send', { msg: msgIp.value.trim(), from: userName, to: clientUser, date: now.getTime() });
		msgIp.value = "";
		msgIp.focus();
	}
});


send.addEventListener("click", () => {
	if (fileip.files.length <= 0) {
		err.innerHTML = "Please Select At Least One File !!";
	}
	else if (fileip.files.length > 0) {
		let totalSize = 0;
		Array.from(fileip.files).forEach(onefile => {
			totalSize += parseFloat((onefile.size / 1024 / 1024).toFixed(3));
		});
		if (totalSize <= 30) {
			animate.classList.add("loader2");
			err.innerHTML = "";
			fetch(`/sendFile?to=${clientUser}`, {
				method: 'POST',
				body: new FormData(form)
			})
				.then(res => res.text())
				.then(resJson => {
					animate.classList.remove("loader2");
					let result = JSON.parse(resJson);
					if (result.upoaded) {
						cross.click();
						socket.emit('send', { msg: `/download?filename=${fileip.files[0].name}&to=${clientUser}&from=${userName}`, from: userName, to: clientUser, date: new Date().getTime() });
						err.innerHTML = "";
					}
					else {
						suc.innerHTML = "";
						err.innerHTML = "Can't Send File due to technical error !!";
					}
				})
				.catch(err => {
					console.log(err);
					animation.classList.remove("loader");
				});
		}
		else {
			err.innerHTML = "Selected files must be less than 30 MB !!";
		}
	}
});


fileip.addEventListener("change", () => {
	if (fileip.files.length <= 0) {
		filesLabel.innerHTML = filesLabel.innerHTML.substr(0, 36) + "Choose File...";
	}
	else if (fileip.files.length == 1) {
		filesLabel.innerHTML = filesLabel.innerHTML.substr(0, 36) + fileip.files[0].name;
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