const mongoose = require("mongoose");
try {
	const chatapp = mongoose.createConnection("mongodb+srv://Chintan8169:Chintan@9712@chintan8169.xbadk.mongodb.net/ChatAppUsers?retryWrites=true&w=majority", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false
	});

	module.exports = chatapp;
}
catch (err) {
	console.log(err);
}