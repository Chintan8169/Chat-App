const container = document.querySelector(".container");
const err = document.querySelector(".err");
const animation = document.querySelector(".animation");

animation.classList.add("loader");
fetch("/fetchContacts")
	.then(res => res.text())
	.then(contactsJSON => {
		animation.classList.remove("loader");
		console.log(contactsJSON);
		let contacts = JSON.parse(contactsJSON);
		container.innerHTML = "";
		if (contacts.length <= 0) {
			err.innerHTML = `You Have not any contacts in your contact list !! <a href="/addContact">Click Here</a> to add contacts !`;
		}
		else {
			contacts.forEach(contact => {
				container.innerHTML += `<div class="contacts">Chat with - <a href="/main?name=${contact.name}">${contact.name}</a></div>`;
			});
		}
	})
	.catch(e => err.innerHTML = e.message);