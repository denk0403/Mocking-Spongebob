"use strict";
(() => {
	const mathin = document.querySelector("#mathin"),
		upload = document.querySelector("#upload"),
		mathinRadioSpan = document.querySelector("#mathinRadioSpan"),
		mathinRadio = document.querySelector("#mathinRadio"),
		input = document.querySelector("#caption"),
		imagein = document.querySelector("#imagein"),
		title = document.getElementById("title"),
		copyLinkBtn = document.getElementById("cpy-link-btn"),
		cameraStop = mockingSpongebob.cameraStop,
		hashify = mockingSpongebob.hashify,
		clearFields = mockingSpongebob.clearFields,
		repaint = mockingSpongebob.repaint,
		xmlSerializer = new XMLSerializer();

	function processMathHash(hash) {
		try {
			clearFields();
			mathin.value = hash
				.slice(6) // hash includes '#' when present
				.split(":")
				.map((char) => char && String.fromCodePoint(parseInt(char, 16)))
				.join("");
			drawMathHash(mathin.value);
			repaint();
		} catch (err) {
			console.error("Oops. Something went wrong.", err);
		}
	}

	function copyLink() {
		const newHash = hashify(mathin.value.trim());
		const url = new URL(location);
		url.hash = `#math:${newHash}`;
		const urlStr = url.toString();

		if (navigator.clipboard) {
			navigator.clipboard.writeText(urlStr);
		} else if (document.execCommand) {
			let temp = document.createElement("textarea");
			temp.value = urlStr;
			document.body.appendChild(temp);
			temp.select();
			document.execCommand("copy");
			document.body.removeChild(temp);
		}
	}

	window.addEventListener("load", () => {
		if (window.MathJax && MathJax.tex2svgPromise) {
			mathin.oninput = () => {
				cameraStop();
				mathin.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});

				input.value = "";
				imagein.value = "";

				drawMathHash(mathin.value);
				repaint();

				copyLinkBtn.onclick = copyLink;
			};

			mathinRadioSpan.style.display = "inline";
			if (location.hash.startsWith("#math:")) {
				mathinRadio.click();
				processMathHash(location.hash);
				copyLinkBtn.onclick = copyLink;
			}
		} else {
			title.click();
		}
	});

	function paintWhite(elt) {
		if (elt.style) {
			elt.style.fill = "white";
			elt.style.stroke = "black";
			elt.style.strokeWidth = "20";
		}
		if (elt.children) {
			for (let item of elt.children) {
				paintWhite(item);
			}
		}
	}

	let lastFormatText = "";
	function drawMathHash(str = "") {
		const trimmedStr = str.trim();

		if (trimmedStr === lastFormatText) {
			return;
		}

		lastFormatText = str;

		MathJax.tex2svgPromise(str, { display: false })
			.then((container) => container.getElementsByTagName("svg")[0])
			.then((svg) => {
				paintWhite(svg);
				upload.src =
					"data:image/svg+xml;base64," + window.btoa(xmlSerializer.serializeToString(svg));
			})
			.catch((err) => {
				console.error("Oops. Something went wrong.", err);
			});
	}
})();
