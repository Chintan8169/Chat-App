const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const chatapp = require("../db/allUsers");

try {

	const userSchema = new mongoose.Schema({
		name: String,
		username: String,
		password: String,
		tokens: [{
			token: {
				type: String
			}
		}]
	});

	userSchema.methods.createToken = async (user) => {
		try {
			const token = jwt.sign({ _id: user._id.toString() }, "chintanrajsinh@Harendrasinh@Gohil");
			user.tokens = user.tokens.concat({ token });
			await user.save();
			return token;
		}
		catch (e) {
			console.log(`Error : ${e}`);
		}
	}

	const Users = chatapp.model("Users", userSchema);
	module.exports = Users;

}
catch (err) {
	console.log(err);
}