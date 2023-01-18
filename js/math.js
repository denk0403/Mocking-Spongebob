"use strict";
{
	/** @type {HTMLInputElement} */
	const mathin = document.querySelector("#mathin"),
		/** @type {HTMLImageElement} */
		upload = document.querySelector("#upload"),
		/** @type {HTMLImageElement} */
		img = document.getElementById("meme"),
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
		updateColorRequest = isomorphicIdleCallback(() => drawMathText(lastFormatText), {
			timeout: 16,
		});
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

	/**
	 * @deprecated
	 * @param {string} hash
	 */
	function processMathHash_DEPRECATED(hash) {
		try {
			clearFields();
			mathin.value = hash
				.slice(6) // hash includes '#' when present
				.split(":")
				.map((char) => char && String.fromCodePoint(parseInt(char, 16)))
				.join("");

			drawMathText(mathin.value);
		} catch (err) {
			console.error("Oops. Something went wrong.", err);
		}
	}

	const processMathSearch = (search) => {
		const searchParams = new URLSearchParams(search);
		let encodedText = searchParams.get("text") ?? "",
			mode = searchParams.get("mode") ?? "asl",
			color = searchParams.get("color") ?? "#ffffff";

		if (mode === "math") {
			mathinRadio.click();

			img.decode().then(() => {
				mathColorInput.value = color;
				mathColorInput.dispatchEvent(new InputEvent("input"));

				if (!encodedText) {
					mathin.focus();
				} else {
					mathin.blur();
					mathin.value = mockingSpongebob.decodeText(encodedText);
					mathin.dispatchEvent(new InputEvent("input"));
				}
			});
		}
	};

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

				drawMathText(mathin.value);

				copyLinkBtn.onclick = copyLink;
			};

			mathinRadioLabel.style.display = "inline";
			if (location.hash.startsWith("#math:")) {
				mathinRadio.click();
				mathin.blur();
				processMathHash_DEPRECATED(location.hash);
				copyLinkBtn.onclick = copyLink;
			} else if (location.search) {
				processMathSearch(location.search);
			}
		} else {
			title.click();
		}
	}

	const BASE_URL = `${location.origin}${location.pathname}`;

	let copyLinkTimer;
	function copyLink() {
		if (navigator.clipboard) {
			let urlStr = BASE_URL;

			const trimmedStr = mathin.value.trim();
			if (trimmedStr !== "") {
				const url = new URL(location);
				url.searchParams.set("mode", "math");
				url.searchParams.set("text", mockingSpongebob.encodeText(trimmedStr));
				url.searchParams.set("color", color);
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

	const mathJaxScript = document.getElementById("mathjax");
	if (mathJaxScript.loaded) {
		setup();
	} else {
		mathJaxScript.addEventListener("load", () => {
			setup();
		});
	}
}
