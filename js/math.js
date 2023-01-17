"use strict";
{
	/** @type {HTMLInputElement} */
	const mathin = document.querySelector("#mathin"),
		/** @type {HTMLImageElement} */
		upload = document.querySelector("#upload"),
		/** @type {HTMLImageElement} */
		mirror = document.getElementById("mirror"),
		mathinRadioLabel = document.querySelector("#mathinRadioLabel"),
		mathinRadio = document.querySelector("#mathinRadio"),
		/** @type {HTMLInputElement} */
		input = document.querySelector("#caption"),
		/** @type {HTMLInputElement} */
		imagein = document.querySelector("#imagein"),
		/** @type {HTMLInputElement} */
		mathColorInput = document.getElementById("math-color"),
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

	/**
	 * @param {SVGElement} elt
	 * @param {string} color
	 */
	function paintColor(elt, color) {
		const errorElt = elt.querySelector("[data-mjx-error]");
		if (errorElt) {
			errorElt.setAttribute("fill", "none");
			errorElt.setAttribute("stroke", "none");
			return _paintColor(errorElt.lastChild, color);
		}

		_paintColor(elt, color);
	}

	/**
	 * @param {SVGElement} elt
	 * @param {string} color
	 */
	function _paintColor(elt, color) {
		elt.setAttribute("fill", color);
		elt.setAttribute("stroke", "black");
		elt.setAttribute("stroke-width", "20");

		for (const item of elt.children) {
			_paintColor(item);
		}
	}

	let lastFormatText = "";
	let lastColor = "#ffffff";

	const isomorphicIdleCallback = window.requestIdleCallback ?? requestAnimationFrame;
	const isomorphicCancelIdleCallback = window.cancelIdleCallback ?? cancelAnimationFrame;

	let color = mathColorInput.value;
	let updateColorRequest = null;
	mathColorInput.addEventListener("input", (event) => {
		isomorphicCancelIdleCallback(updateColorRequest);
		color = event.currentTarget.value;
		updateColorRequest = isomorphicIdleCallback(() => drawMathText(lastFormatText));
	});

	function drawMathText(str = "") {
		const trimmedStr = str.trim();

		if (trimmedStr === lastFormatText && color === lastColor) {
			return;
		}

		lastFormatText = str;
		lastColor = color;

		if (trimmedStr === "") {
			mirror.src = "./img/spongebob.jpg";
			return;
		}

		MathJax.tex2svgPromise(str, { display: false })
			.then((container) => container.firstChild)
			.then((svg) => {
				const oldOnError = upload.onerror;
				const newOnError = () => {
					// console.error("There was an error rendering MathJax");
					clearImage();
					upload.onerror = oldOnError;
				};

				upload.onerror = newOnError;
				upload.onload = () => (upload.onerror = oldOnError);

				paintColor(svg, color);
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

			drawMathText(mathin.value);
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

				console.log(mathin.value);
				drawMathText(mathin.value);

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
