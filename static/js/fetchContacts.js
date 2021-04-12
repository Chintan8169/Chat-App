const container = document.querySelector(".container");
const err = document.querySelector(".err");

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
	if (this.readyState == 4 && this.status == 200) {
		let contactsJSON = xhttp.responseText;
		let contacts = JSON.parse(contactsJSON);
		container.innerHTML = "";
		if (contacts.length == 0) {
			err.innerHTML = `You Have not any contacts in your contact list !! <a href="/addContact">Click Here</a> to add contacts !`;
		}
		else {
			contacts.forEach(element => {
				container.innerHTML += `<div class="contacts">Chat with - <a href="/main?name=${element.name}">${element.name}</a></div>`;
			});
		}
	}
};
xhttp.open("GET", "/fetchContacts", true);
xhttp.send();