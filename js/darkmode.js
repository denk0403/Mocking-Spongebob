"use strict";
window.addEventListener("load", () => {
	Darkmode &&
		new Darkmode({
			time: "0.5s", // default: '0.3s'
			buttonColorDark: "#dddddd", // default: '#100f2c'
			buttonColorLight: "#dddddd",
			label: "🌓", // default: ''
		}).showWidget();
	document.body.classList.remove("preload");
});
