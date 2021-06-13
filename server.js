const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const path = require("path");
const fs = require("fs");
const chatapp = require("./db/allUsers");
const Users = require("./models/newUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const socketio = require("socket.io");
const cookieParser = require('cookie-parser');
const JavaScriptObfuscator = require("javascript-obfuscator");
const multer = require("multer");

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);




const staticPath = path.join(__dirname, "static");
const uploadsPath = path.join(staticPath, "uploads");
app.use(express.static(staticPath));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const viewsPath = path.join(__dirname, "views");
app.set("view engine", "pug");
app.set("views", viewsPath);



fs.readdir(`${staticPath}\\jsunobfuscated`, (err, files) => {
	if (err) return console.log(err);
	files.forEach(file => {
		fs.readFile(`${staticPath}\\jsunobfuscated\\${file}`, "UTF-8", (err, data) => {
			if (err) return console.log(err);
			const obfuscated_data = JavaScriptObfuscator.obfuscate(data);
			fs.writeFile(`${staticPath}\\js\\${file}`, obfuscated_data.getObfuscatedCode(), err => {
				if (err) return console.log(err);
			});
		});
	});
});




const activeUsers = [];
const socketInfo = {};
const roomNames = [];

// Database connections
const chatsConnection = mongoose.createConnection(`mongodb+srv://Chintan8169:Chintan@9712@chintan8169.xbadk.mongodb.net/Chats?retryWrites=true&w=majority`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
});

const msgSchema = new mongoose.Schema({
	from: String,
	msg: String,
	date: String
});

const contactsConnection = mongoose.createConnection(`mongodb+srv://Chintan8169:Chintan@9712@chintan8169.xbadk.mongodb.net/Contacts?retryWrites=true&w=majority`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
});

const contactsSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true
	},
	name: String,
	isNewContact: {
		type: Boolean,
		default: false
	}
});


// Home page
app.get("/", (req, res) => {
	try {
		const token = req.cookies.jwt;
		const username = req.cookies.username;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		res.render("loggedinHome");
	}
	catch (err) {
		res.render("index");
	}
});



// login get handle
app.get("/login", (req, res) => {
	try {
		const token = req.cookies.jwt;
		const username = req.cookies.username;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		res.render("loggedinHome");
	}
	catch (err) {
		res.render("login");
	}
});


// login post handle
app.post("/login", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	try {
		const userA = await Users.findOne({ username });
		if (userA === null) {
			res.render("login.pug", { display: "block", msg: "Authentication Failed" });
		}
		else {
			const originalPass = userA.password;
			const passwordMatch = await bcrypt.compare(password, originalPass);
			if (passwordMatch) {
				const token = await userA.createToken(userA);
				res.cookie("username", `${username}`);
				res.cookie("name", `${userA.name}`);
				res.cookie("jwt", token);
				res.render("loggedinHome.pug");
			}
			else {
				res.render("login.pug", { display: "block", msg: "Authentication Failed" });
			}
		}
	} catch (e) {
		console.log(e);
		res.render("login.pug", { display: "block", msg: `Error : ${e}` });
	}
});


// signup get handle
app.get("/signup", (req, res) => {
	res.render("signup.pug", { display: "none", msg: "" });
});


// signup post handle
app.post("/signup", async (req, res) => {

	const name = req.body.name;
	const username = req.body.username;
	const password = req.body.password;
	const cpassword = req.body.cpassword;
	try {
		if (password === cpassword) {
			const userA = await Users.findOne({ username });
			if (userA === null) {
				const passwordHashed = await bcrypt.hash(password, 10);
				const userDetails = { name, username, password: passwordHashed };
				const create = new Users(userDetails);
				const created = await create.save();
				res.redirect("/login");
			}
			else {
				res.render("signup.pug", { no: 1, display: "block", msg: "Username is already present please select another." });
			}
		}
	} catch (e) {
		console.log(e);
		res.render("signup.pug", { no: 3, display: "block", msg: `Error : ${e}` });
	}
});


// loggedin home handle
app.get("/loggedinHome", (req, res) => {
	try {
		const token = req.cookies.jwt;
		const username = req.cookies.username;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		res.render("loggedinHome");
	}
	catch (err) {
		res.redirect("/login");
	}
})


// fetch contacts event handle
app.get("/fetchContacts", async (req, res) => {
	try {
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		const username = req.cookies.username;
		const Contacts = contactsConnection.model(username.toLowerCase(), contactsSchema);
		const contacts = await Contacts.find({}, { _id: 0, name: 1, username: 1, isNewContact: 1 });
		res.status(200).send(JSON.stringify(contacts));
	}
	catch (err) {
		console.log(err);
		res.redirect("/login");
	}
});


// find index of string str in array arr
const findInd = str => {
	let indexs = [];
	for (let i = 0; i < roomNames.length; i++) {
		if (roomNames[i].includes(str)) {
			indexs.push(i);
		}
	}
	if (indexs.length > 0) {
		return indexs;
	}
	else {
		return -1;
	}
}


// handle roomNames array on disconnect event
const handleRoom = str => {
	try {
		const roomIndex = findInd(str);
		if (roomIndex != -1) {
			let a = [];
			roomIndex.forEach(i => {
				a.push(roomNames[i]);
			});
			let b = [];
			for (let i = 0; i < a.length; i++) {
				b.push(false);
			}
			for (let x = 0; x < a.length; x++) {
				const c = a[x].split("-");
				let index = 0;
				if (c.indexOf(str) == 0) {
					index = 1;
				}
				if (activeUsers.indexOf(c[index]) == -1) {
					b[x] = true;
				}
			}
			for (let i = 0; i < b.length; i++) {
				if (b[i]) {
					roomNames.splice(roomNames.indexOf(a[i]), 1);
				}
			}
		}
	}
	catch (err) {
		console.log(err);
	}
}


const setCollectionName = name => {
	collectionNameArr = name.trim().split("-");
	let collectionNameSorted = collectionNameArr[0].localeCompare(collectionNameArr[1]) < 0 ? name : collectionNameArr[1] + "-" + collectionNameArr[0];
	return collectionNameSorted;
}


// socket.io conncection & main chat screen handle
io.on("connection", socket => {
	socket.on("new user", data => {
		socketInfo[socket.id] = data.uname;
		activeUsers.push(data.uname);
		const roomname = setCollectionName(`${data.uname}-${data.to}`);
		if (roomNames.indexOf(roomname) > -1) {
			socket.join(roomname);
		}
		else {
			roomNames.push(roomname);
			socket.join(roomname);
		}
	});

	socket.on("send", async (data) => {
		let roomname = setCollectionName(`${data.from}-${data.to}`);
		try {
			let fromusername = await Users.findOne({ name: data.from });
			let tousername = await Users.findOne({ name: data.to });
			let Msg = chatsConnection.model(setCollectionName(fromusername.username + "-" + tousername.username), msgSchema);
			let msgdata = { from: data.from, msg: data.msg, date: data.date };
			let newMsg = new Msg(msgdata);
			let result = await newMsg.save();
			io.to(roomname).emit("newmsg", { msg: data.msg, from: data.from, date: data.date });
		}
		catch (err) {
			console.log(err);
		}
	});

	socket.on('deleteMessage', data => {
		let roomname = setCollectionName(`${data.from}-${data.to}`);
		io.to(roomname).emit("deletedMessage", { indexes: data.indexes, from: data.from });
	});

	socket.on("disconnect", () => {
		handleRoom(socketInfo[socket.id]);
		activeUsers.splice(activeUsers.indexOf(socketInfo[socket.id]), 1);
		delete socketInfo[socket.id];
		// io.emit("user disconnected", socketInfo[socket.id]);
	});
});


// main chat screen get handle
app.get("/main", (req, res) => {
	try {
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		res.render("mainChat.pug");
	}
	catch (err) {
		res.redirect("/login");
	}
});


// adding file sharing
app.post("/sendFile", async (req, res) => {
	try {
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		const username = req.cookies.username;
		const clientUserName = req.query.to;
		const clientUser = await Users.findOne({ name: clientUserName });
		const filenameAppend = setCollectionName(username + "-" + clientUser.username);
		var storage = multer.diskStorage({
			destination: (req, file, callback) => {
				callback(null, uploadsPath);
			},
			filename: (req, file, callback) => {
				callback(null, filenameAppend + "@457692381@" + file.originalname);
			}
		});

		var upload = multer({ storage }).array('file');

		upload(req, res, err => {
			if (err) {
				return res.status(400).send({ uploaded: false });
			}
			res.status(200).send({ uploaded: true });
		});
	}
	catch (err) {
		res.redirect("/login");
	}
});


// downloading file
app.get("/download", async (req, res) => {
	try {
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		const filename = req.query.filename;
		const to = req.query.to;
		const from = req.query.from;
		const clientUser = await Users.findOne({ name: to });
		const user = await Users.findOne({ name: from });
		const filenameAppend = setCollectionName(user.username + "-" + clientUser.username);
		fs.readdir(uploadsPath, (err, filesList) => {
			let flag = false;
			for (let i = 0; i < filesList.length; i++) {
				let onefile = filesList[i];
				const checkFileArr = onefile.split("@457692381@");
				const downLoadPassword = checkFileArr[0];
				const checkFileName = checkFileArr[1];
				if (filename == checkFileName) {
					if (downLoadPassword == filenameAppend) {
						flag = true;
						const downloadPath = path.join(uploadsPath, onefile);
						res.download(downloadPath, `${filename}`, error => {
							if (error) res.send(error);
						});
						break;
					}
					else {
						res.send("You Are not authorized to download this file !!!");
					}
				}
			}
			if (!flag) {
				res.send("This file does not found !!");
			}
		});
	}
	catch (e) {
		if (e.message == "jwt must be provided") {
			res.send("You Are not authorized to download this file !!!");
		}
		else {
			console.log(e);
			res.send(e);
		}
	}
});


// add contact get handle
app.get("/addContact", (req, res) => {
	try {
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		res.render("addContact.pug", { display: "none", msg: "" });
	}
	catch (err) {
		res.redirect("/login");
	}
});


// add contact post handle
app.post("/addContact", async (req, res) => {
	const username = req.cookies.username;
	const contactName = req.body.username;
	console.log(req.body);
	try {
		const token = req.cookies.jwt;
		const r = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		if (username === contactName) {
			throw new Error("You can't add yourself in your contacts !!");
		}
		const userA = await Users.findOne({ username });
		const userB = await Users.findOne({ username: contactName });
		if (userB === null) {
			res.render("addContact.pug", { display: "block", msg: "This user does not exist in our database !!" });
		}
		else {
			const Contacts1 = contactsConnection.model(username.toLowerCase(), contactsSchema);
			const Contacts2 = contactsConnection.model(contactName.toLowerCase(), contactsSchema);
			const alreadyExist = await Contacts1.findOne({ username: contactName });
			if (alreadyExist === null) {
				const newContact1 = new Contacts1({ username: contactName, name: userB.name });
				const result1 = await newContact1.save();
				const newContact2 = new Contacts2({ username, name: userA.name, isNewContact: true });
				const result2 = await newContact2.save();
				res.render("loggedinHome.pug");
			}
			else if(alreadyExist && alreadyExist.isNewContact) {
				alreadyExist.isNewContact=false;
				await alreadyExist.save();
				res.send("Success!!");
			}
			else {
				res.render("addContact.pug", { display: "block", msg: "This User already present in your contact list !!" });
			}
		}
	}
	catch (err) {
		if (err.message == "jwt must be provided") {
			res.redirect("/login");
		}
		else {
			res.render("addContact.pug", { display: "block", msg: err.message });
			console.log(err);
		}
	}
});


// fetch message from database
app.get("/fetchMsg", async (req, res) => {
	try {
		const token = req.cookies.jwt;
		const r = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		let fromusername = req.cookies.username;
		let tousername = await Users.findOne({ name: req.query.to });
		let Msg = chatsConnection.model(setCollectionName(fromusername + "-" + tousername.username), msgSchema);
		let result = await Msg.find({}, { _id: 0, from: 1, msg: 1, date: 1 });
		res.status(200).type("json").send(JSON.stringify(result));
	}
	catch (err) {
		res.redirect("/login");
		console.log(err);
	}
});


app.delete("/deleteMessage", async (req, res) => {
	try {
		const token = req.cookies.jwt;
		const r = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		let fromusername = req.cookies.username;
		let fromname = req.cookies.name;
		let tousername = await Users.findOne({ name: req.query.to });
		const collectionName = setCollectionName(fromusername + "-" + tousername.username);
		let Msg = chatsConnection.model(collectionName, msgSchema);
		let allDeleted = true;
		req.body.forEach(async (message) => {
			if (typeof message.msg == "object") {
				const filename = collectionName + "@457692381@" + decodeURI(message.msg.filename);
				fs.readdir(uploadsPath, async (err, filesList) => {
					let fileExist = false;
					filesList.forEach(file => {
						if (file == filename)
							fileExist = true;
					});
					if (fileExist) {
						fs.unlink(path.join(uploadsPath, filename), err => {
							if (err) {
								allDeleted = false;
							}
						});
						const result = await Msg.deleteOne({
							from: fromname,
							msg: decodeURI(message.msg.href)
						});
						if (!result)
							allDeleted = false;
					}
				});
			}
			else {
				const result = await Msg.deleteOne({
					from: fromname,
					msg: message.msg
				});
				if (!result)
					allDeleted = false;
			}
		})
		if (allDeleted)
			res.status(200).type("json").send(JSON.stringify({ suc: "Successfully Deleted !!!!" }));
		else
			res.status(500).type("json").send(JSON.stringify({ error: "Technical Error !!!" }));

	}
	catch (err) {
		res.redirect("/login");
		console.log(err);
	}
});


app.get("/logout", async (req, res) => {
	try {
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		const userData = await Users.findOne({ username: req.cookies.username });
		userData.tokens = userData.tokens.filter(currentToken => currentToken.token !== token);
		await userData.save()
		res.clearCookie("jwt");
		res.clearCookie("username");
		res.clearCookie("name");
		res.redirect("/");
	}
	catch (err) {
		res.redirect("/login");
		console.log(err);
	}
});


// getting error
server.on("error", err => {
	console.log(err);
});


// listening server to port
server.listen(port);