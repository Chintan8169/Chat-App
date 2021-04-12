const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const path = require("path");
const chatapp = require("./db/allUsers");
const Users = require("./models/newUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const socketio = require("socket.io");
const cookieParser = require('cookie-parser');

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);




const staticPath = path.join(__dirname, "static");
app.use(express.static(staticPath));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const viewsPath = path.join(__dirname, "views");
app.set("view engine", "pug");
app.set("views",viewsPath);

const activeUsers = [];
const socketInfo = {};
const roomNames = [];


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
		const username = req.cookies.username;
		const token = req.cookies.jwt;
		const result = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		const contactsColl = createContact(username.toLowerCase());
		const contacts = await contactsColl.find();
		res.send(contacts);
	}
	catch (err) {
		console.log(err);
		res.redirect("/login");
	}
})



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

// save message function
const msgSaveFun = async (from, to, mesg, date) => {
	try {
		const conn = mongoose.createConnection(`mongodb+srv://Chintan8169:Chintan@9712@chintan8169.xbadk.mongodb.net/Chats?retryWrites=true&w=majority`, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
			useFindAndModify: false
		});
		conn.once("open", async () => {
			const msgSchema = new mongoose.Schema({
				from: String,
				msg: String,
				date: String
			});
			conn.db.listCollections().toArray(async (err, names) => {
				let userData = await Users.findOne({ name: from });
				let clientData = await Users.findOne({ name: to });
				if (err) {
					console.log(err);
				}
				else {
					let collectionName = `${userData.username.toLowerCase()}-${clientData.username.toLowerCase()}`;
					for (let i = 0; i < names.length; i++) {
						if (names[i].name == `${clientData.username.toLowerCase()}-${userData.username.toLowerCase()}`) {
							collectionName = `${clientData.username.toLowerCase()}-${userData.username.toLowerCase()}`;
							break;
						}
					}
					let Msg = conn.model(collectionName, msgSchema);
					let data = { from, msg: mesg, date }
					let newMsg = new Msg(data);
					let result = await newMsg.save();
					return result;
				}
			});
		});
	}
	catch (err) {
		console.log(err);
	}
}

// socket.io conncection & main chat screen handle
io.on("connection", socket => {
	socket.on("new user", data => {
		socketInfo[socket.id] = data.uname;
		activeUsers.push(data.uname);
		if (roomNames.indexOf(`${data.uname}-${data.to}`) > -1) {
			socket.join(`${data.uname}${data.to}`);
		}
		else if (roomNames.indexOf(`${data.to}-${data.uname}`) > -1) {
			socket.join(`${data.to}-${data.uname}`);
		}
		else {
			roomNames.push(`${data.uname}-${data.to}`);
			socket.join(`${data.uname}-${data.to}`);
		}
	});


	socket.on("disconnect", () => {
		handleRoom(socketInfo[socket.id]);
		activeUsers.splice(activeUsers.indexOf(socketInfo[socket.id]), 1);
		delete socketInfo[socket.id];
		// console.log(Object.keys(socketInfo).find(key => socketInfo[key] === socket.id));
		// io.emit("user disconnected", socketInfo[socket.id]);
	});

	socket.on("send", async (data) => {
		let roomname = "";
		if (roomNames.indexOf(`${data.from}-${data.to}`) > -1) {
			roomname = `${data.from}-${data.to}`;
		}
		else {
			roomname = `${data.to}-${data.from}`;
		}
		try {
			const result = await msgSaveFun(data.from, data.to, data.msg, data.date);
			io.to(roomname).emit("newmsg", { msg: data.msg, from: data.from, date: data.date });
		}
		catch (err) {
			console.log(err);
		}
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
	try {
		const token = req.cookies.jwt;
		const r = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		if (username === contactName) {
			throw new Error("You cant add yourself in your contacts");
		}
		const userA = await Users.findOne({ username });
		const userB = await Users.findOne({ username: contactName });
		if (userB === null) {
			res.render("addContact.pug", { display: "block", msg: "This user does not exist in our database" });
		}
		else {
			const Contacts = createContact(username.toLowerCase());
			const alreadyExist = await Contacts.findOne({ username: contactName });
			if (alreadyExist === null) {
				const newContact = new Contacts({ username: contactName, name: userB.name });
				const result = await newContact.save();
				res.render("loggedinHome.pug");
			}
			else {
				res.render("addContact.pug", { display: "block", msg: "This User already present in your contact list" });
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
		let userData = await Users.findOne({ name: req.query.from });
		let clientData = await Users.findOne({ name: req.query.to });
		const token = req.cookies.jwt;
		const r = jwt.verify(token, "chintanrajsinh@Harendrasinh@Gohil");
		const conn = mongoose.createConnection(`mongodb+srv://Chintan8169:Chintan@9712@chintan8169.xbadk.mongodb.net/Chats?retryWrites=true&w=majority`, {
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
		conn.once("open", async () => {
			conn.db.listCollections().toArray(async (err, names) => {
				if (err) {
					console.log(err);
				}
				else {
					let collectionName = `${userData.username.toLowerCase()}-${clientData.username.toLowerCase()}`;
					for (let i = 0; i < names.length; i++) {
						if (names[i].name == `${clientData.username.toLowerCase()}-${userData.username.toLowerCase()}`) {
							collectionName = `${clientData.username.toLowerCase()}-${userData.username.toLowerCase()}`;
							break;
						}
					}
					let Msg = conn.model(collectionName, msgSchema);
					let result = await Msg.find();
					let messages = [];
					result.forEach(e => {
						let data = {
							from: e.from,
							msg: e.msg,
							date: e.date
						}
						messages.push(data);
					});
					res.status(200).type("json").send(JSON.stringify(messages));
				}
			});
		});
	}
	catch (err) {
		res.redirect("/login");
		console.log(err);
	}
});


const createContact = (username) => {
	try {
		const conn2 = mongoose.createConnection(`mongodb+srv://Chintan8169:Chintan@9712@chintan8169.xbadk.mongodb.net/${username}?retryWrites=true&w=majority`, {
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
			name: String
		});
		const Contacts = conn2.model("Contact", contactsSchema);
		return Contacts;
	}
	catch (err) {
		console.log(err);
	}
}


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