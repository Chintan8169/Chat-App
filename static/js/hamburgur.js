const hamburger = document.querySelector(".hamburger");
const navul = document.querySelector(".navul");


hamburger.addEventListener("click", () => {
	navul.classList.toggle("toggle");
	hamburger.classList.toggle("open");
});