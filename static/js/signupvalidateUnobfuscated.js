const name = document.getElementById('name');
const username = document.getElementById('username');
const password = document.getElementById('password');
const cpassword = document.getElementById('cpassword');
const submit = document.getElementById('submit');
let error = document.getElementsByClassName('err');
name.addEventListener('focusout', () => {
	const result = validator.isAlpha(name.value.trim(), "en-IN", { ignore: " " }) && name.value.trim().length >= 5;
	if (!result) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled', 'disabled');
		error[0].style.display = 'block';
		error[0].innerText = `Name should be in format "abc xyz pqr" and should be 5 to 50 char long`;
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[0].style.display = 'none';
	}
});
username.addEventListener("focusout", () => {
	const result = validator.isAlphanumeric(username.value, "en-IN") && username.value.length >= 5;
	if (!result) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled', 'disabled');
		error[1].style.display = 'block';
		error[1].innerText = `userame should be in format "abc[0-9]" and should be at least 5 char long and shoud not contain whitespaces.`;
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[1].style.display = 'none';
	}
});

password.addEventListener("focusout", () => {
	const result = validator.isStrongPassword(password.value);
	if (!result) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled', 'disabled');
		error[2].style.display = 'block';
		error[2].innerText = `Password should be 8 char long and it should have one lowercase, one uppercase, one digit and one special char`;
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[2].style.display = 'none';
	}
});
cpassword.addEventListener("focusout", () => {
	if (cpassword.value != password.value) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled', 'disabled');
		error[3].style.display = 'block';
		error[3].innerText = `Password does not match with confirm password please reenter your confirm password`;
		cpassword.value = "";
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[3].style.display = 'none';
	}
});

