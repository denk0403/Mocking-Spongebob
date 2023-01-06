"use strict";
{
	/** @type {HTMLInputElement} */
	const mathin = document.querySelector("#mathin"),
		/** @type {HTMLImageElement} */
		upload = document.querySelector("#upload"),
		mathinRadioLabel = document.querySelector("#mathinRadioLabel"),
		mathinRadio = document.querySelector("#mathinRadio"),
		/** @type {HTMLInputElement} */
		input = document.querySelector("#caption"),
		/** @type {HTMLInputElement} */
		imagein = document.querySelector("#imagein"),
		title = document.getElementById("title"),
		copyLinkBtn = document.getElementById("cpy-link-btn"),
		/** @type {HTMLSpanElement} */
		copyLinkTxt = document.getElementById("cpy-link-txt"),
		cameraStop = mockingSpongebob.cameraStop,
		clearFields = mockingSpongebob.clearFields,
		clearImage = mockingSpongebob.clearImage,
		xmlSerializer = new XMLSerializer();

	const BASE_URL = `${location.origin}${location.pathname}`;

	let copyLinkTimer;
	function copyLink() {
		if (navigator.clipboard) {
			let urlStr = BASE_URL;

			const trimmedStr = mathin.value.trim();
			if (trimmedStr !== "") {
				const newHash = encodeURIComponent(trimmedStr);
				const url = new URL(location);
				url.hash = `#math:${newHash}`;
				urlStr = url.toString();
			}

			navigator.clipboard.writeText(urlStr).then(() => {
				copyLinkTxt.textContent = "Copied!";

				clearTimeout(copyLinkTimer);
				copyLinkTimer = setTimeout(() => {
					copyLinkTxt.textContent = "Copy Shareable Link";
				}, 2000);
			});
		}
	}

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
				const oldOnError = upload.onerror;
				const newOnError = () => {
					// console.error("There was an error rendering MathJax");
					clearImage();
					upload.onerror = oldOnError;
				};

				upload.onerror = newOnError;
				upload.onload = () => (upload.onerror = oldOnError);

				paintWhite(svg);
				upload.src =
					"data:image/svg+xml;base64," + window.btoa(xmlSerializer.serializeToString(svg));

				// The meme will be repainted by the 'upload' handler
			})
			.catch((err) => {
				console.error("Oops. Something went wrong.", err);
			});

		// The meme will be repainted by the 'upload' handler
	}

	function processMathHash(hash) {
		try {
			clearFields();
			const contentPrefixIndex = 5;
			const content = decodeURIComponent(hash.slice(contentPrefixIndex + 1));
			mathin.value = content;

			drawMathHash(mathin.value);
		} catch (err) {
			console.error("Oops. Something went wrong.", err);
		}
	}

	function setup() {
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

				copyLinkBtn.onclick = copyLink;
			};

			mathinRadioLabel.style.display = "inline";
			if (location.hash.startsWith("#math:")) {
				mathinRadio.click();
				mathin.blur();
				processMathHash(location.hash);
				copyLinkBtn.onclick = copyLink;
			}
		} else {
			title.click();
		}
	}

	const mathJaxScript = document.getElementById("mathjax");
	if (mathJaxScript.loaded) {
		setup();
	} else {
		mathJaxScript.addEventListener("load", () => {
			setup();
		});
	}
}
