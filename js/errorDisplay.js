"use strict";
(() => {
	const upload = document.getElementById("upload"),
		errorBoxString = `
        <div id="errorBox" style="display: flex;">
            <div id="errorBoxMessage">
                There was an issue loading in the requested image. Make sure you have the correct permissions for that
                image.
            </div>
            <button id="errorCloseButton">×</button>
        </div>
    `;

	let errorBox;
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

	upload.onerror = (event) => {
		event.type === "error" &&
			!document.getElementById("errorBox") &&
			document.body.insertAdjacentHTML("beforeend", errorBoxString);
		errorBox = document.getElementById("errorBox");
		errorBox
			.querySelector("#errorCloseButton")
			.addEventListener("click", () => {
				errorBox.remove();
			});
		initialTimer = setTimeout(mouseleaveHandler, 7500);
		errorBox.addEventListener("mouseenter", mouseenterHandler);
		errorBox.addEventListener("mouseleave", () => {
			setTimeout(mouseleaveHandler, 2500);
		});
	};
})();
