"use strict";
{
	/** @type {HTMLInputElement} */
	const mathin = document.getElementById("mathin"),
		/** @type {HTMLImageElement} */
		upload = document.getElementById("upload"),
		/** @type {HTMLImageElement} */
		img = document.getElementById("meme"),
		/** @type {HTMLImageElement} */
		mirror = document.getElementById("mirror"),
		/** @type {HTMLInputElement} */
		captionRadio = document.getElementById("captionRadio"),
		mathinRadioLabel = document.getElementById("mathinRadioLabel"),
		mathinRadio = document.getElementById("mathinRadio"),
		/** @type {HTMLInputElement} */
		input = document.getElementById("caption"),
		/** @type {HTMLInputElement} */
		imagein = document.getElementById("imagein"),
		/** @type {HTMLInputElement} */
		mathColorInput = document.getElementById("math-color"),
		copyLinkBtn = document.getElementById("cpy-link-btn"),
		/** @type {HTMLSpanElement} */
		copyLinkTxt = document.getElementById("cpy-link-txt"),
		clearFields = mockingSpongeBob.clearFields,
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

	/** @type {SVGElement} */
	let SVG_CACHE = null;

	const isomorphicIdleCallback = window.requestIdleCallback ?? requestAnimationFrame;
	const isomorphicCancelIdleCallback = window.cancelIdleCallback ?? cancelAnimationFrame;

	let updateColorRequest = null;
	mathColorInput.addEventListener("input", () => {
		isomorphicCancelIdleCallback(updateColorRequest);
		updateColorRequest = isomorphicIdleCallback(
			() => {
				drawMathText(mathin.value, mathColorInput.value);
			},
			{ timeout: 16 }
		);
	});

	/**
	 * @param {string} str
	 * @param {string} color
	 */
	function drawMathText(str, color) {
		const trimmedStr = str.trim();

		if (trimmedStr === "") {
			mirror.src = "./img/spongebob.jpg";
			return;
		}

		const { text, color: lastColor, mode } = mockingSpongeBob.drawn;
		if (trimmedStr === text && mode === "math") {
			if (color === lastColor) return;

			mockingSpongeBob.drawn.color = color;
			return paintAndDrawSVG(SVG_CACHE, mathColorInput.value);
		}

		mockingSpongeBob.drawn = {
			text: trimmedStr,
			color,
			mode: "math",
			isErrored: false,
		};

		MathJax.tex2svgPromise(str, { display: false })
			.then((container) => container.firstChild)
			.then((svg) => paintAndDrawSVG(svg, color))
			.catch((err) => {
				console.error("Oops. Something went wrong.", err);
			});

		// The meme will be repainted by the 'upload' handler
	}

	/**
	 * @param {SVGElement} svg
	 * @param {string} color
	 */
	function paintAndDrawSVG(svg, color) {
		SVG_CACHE = svg;
		paintColor(svg, color);
		upload.src = "data:image/svg+xml;base64," + window.btoa(xmlSerializer.serializeToString(svg));
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

			drawMathText(mathin.value, mathColorInput.value);
		} catch (err) {
			console.error("Oops. Something went wrong.", err);
		}
	}

	const processMathSearch = (search) => {
		const searchParams = new URLSearchParams(search);
		let encodedText = searchParams.get("text") ?? "",
			mode = searchParams.get("mode"),
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
					mathin.value = mockingSpongeBob.decodeText(encodedText);
					mathin.dispatchEvent(new InputEvent("input"));
				}
			});
		}
	};

	function setup() {
		if (!window.MathJax || !MathJax.tex2svgPromise) return;

		mathin.addEventListener("input", () => {
			mockingSpongeBob.stopAsyncProcesses();

			mathin.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});

			input.value = "";
			imagein.value = "";

			drawMathText(mathin.value, mathColorInput.value);
			copyLinkBtn.onclick = copyLink;
		});

		mathinRadioLabel.style.display = "inline";
		if (location.hash.startsWith("#math:")) {
			mathinRadio.click();
			mathin.blur();
			processMathHash_DEPRECATED(location.hash);
			copyLinkBtn.onclick = copyLink;
		} else if (location.search) {
			processMathSearch(location.search);
		}

		if ("MathMLElement" in window) {
			const mathBtns = document.getElementById("math-btns");
			mathBtns.removeAttribute("hidden");

			for (const child of mathBtns.children) {
				child.addEventListener("click", () => {
					const selectionStart = mathin.selectionStart;
					const selectionEnd = mathin.selectionEnd;

					/** @type {string} */
					const expandedValue = child.dataset.value;
					mathin.setRangeText(expandedValue, selectionStart, selectionEnd, "end");
					mathin.focus();

					const argumentIndex = expandedValue.indexOf("{}");
					if (~argumentIndex) {
						const newSelectionIndex = selectionStart + argumentIndex + 1;
						mathin.setSelectionRange(newSelectionIndex, newSelectionIndex);
					}

					mathin.dispatchEvent(new InputEvent("input"));
				});
			}
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
				url.searchParams.set("text", mockingSpongeBob.encodeText(trimmedStr));
				url.searchParams.set("color", mathColorInput.value);
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
