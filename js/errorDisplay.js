(() => {
	const upload = document.getElementById("upload"),
		errorBox = document.getElementById("errorBox");

	document.getElementById("errorCloseButton").addEventListener("click", () => {
		errorBox.remove();
	});

	let cancelHoverTimer;
	let initialTimer;
	const mouseenterHandler = () => {
		clearTimeout(initialTimer);
		clearTimeout(cancelHoverTimer);
		errorBox.classList.remove("fade");
		errorBox.remove();
		document.body.appendChild(errorBox);
	};
	const mouseleaveHandler = () => {
		errorBox.classList.add("fade");
		cancelHoverTimer = setTimeout(() => {
			errorBox.removeEventListener("mouseenter", mouseenterHandler);
			errorBox.remove();
		}, 2750);
	};

	errorBox.remove();

	upload.onerror = () => {
		!document.body.contains(errorBox) && document.body.appendChild(errorBox);
		errorBox.style.display = "flex";
		initialTimer = setTimeout(mouseleaveHandler, 7500);
		errorBox.addEventListener("mouseenter", mouseenterHandler);
		errorBox.addEventListener("mouseleave", () => {
			setTimeout(mouseleaveHandler, 2500);
		});
	};
})();
