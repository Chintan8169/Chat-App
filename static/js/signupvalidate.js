const name=document.getElementById('name');
const username=document.getElementById('username');
const password=document.getElementById('password');
const cpassword=document.getElementById('cpassword');
const submit=document.getElementById('submit');
let error=document.getElementsByClassName('err');
name.addEventListener('focusout',()=>{
	const reg=/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/g;
	const result=reg.test(name.value);
	if(!result) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled','disabled');
		error[0].style.display='block';
		error[0].innerText=`Name should be in format "abc xyz pqr" and should be 5 to 50 char long`;
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[0].style.display='none';
	}
});
username.addEventListener("focusout",()=>{
	const reg=/^[a-zA-Z0-9]([._-](?![._-])|[a-zA-Z0-9]){5,18}[a-zA-Z0-9]$/;
	const result=reg.test(username.value);
	if(!result) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled','disabled');
		error[1].style.display='block';
		error[1].innerText=`userame should be in format "abc[0-9]" and should be at least 5 char long and shoud not contain whitespaces.`;
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[1].style.display='none';
	}
});

password.addEventListener("focusout",()=>{
	const reg=/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{6,15}$/
	const result=reg.test(password.value);
	if(!result) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled','disabled');
		error[2].style.display='block';
		error[2].innerText=`Password should be 6 to 15 char long and it should have one lowercase, one uppercase, one digit and one special char`;
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[2].style.display='none';
	}
});
cpassword.addEventListener("focusout",()=>{
	const reg=/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{6,15}$/
	const result=reg.test(cpassword.value);
	if(cpassword.value!=password.value) {
		submit.classList.add("notvalid");
		submit.setAttribute('disabled','disabled');
		error[3].style.display='block';
		error[3].innerText=`Password does not match with confirm password please reenter your confirm password`;
		cpassword.value="";
	}
	else {
		submit.classList.remove("notvalid");
		submit.removeAttribute('disabled');
		error[3].style.display='none';
	}
});

