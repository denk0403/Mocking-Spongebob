"use strict";
(() => {
	// DOM Constants
	/** @type {HTMLCanvasElement} */
	const canvas = document.getElementById("output"),
		/** @type {CanvasRenderingContext2D} */
		ctx = canvas.getContext("2d"),
		img = document.getElementById("meme"),
		mirror = document.getElementById("mirror"),
		input = document.getElementById("caption"),
		copyLinkBtn = document.getElementById("cpy-link-btn"),
		captionRadio = document.getElementById("captionRadio"),
		imagein = document.getElementById("imagein"),
		imageinRadio = document.getElementById("imageinRadio"),
		upload = document.getElementById("upload"),
		mathin = document.querySelector("#mathin"),
		mathinRadio = document.getElementById("mathinRadio"),
		title = document.getElementById("title"),
		mockSelector = document.getElementById("mockType-selector"),
		cameraStop = mockingSpongebob.cameraStop,
		reader = new FileReader();

	const INITIAL_FONT_SIZE = 100; // in pixels
	const MAX_LINE_BOX_WIDTH = 480; // in pixels

	//set-up canvas context
	ctx.lineJoin = "round";
	ctx.textBaseline = "bottom";
	ctx.imageSmoothingQuality = "high";
	ctx.textAlign = "center";
	ctx.strokeStyle = "black";
	ctx.fillStyle = "white";

	title.onclick = () => {
		window.stopTimer();
		location.hash = "";
		captionRadio.click();
		clear();
	};

	let clearFields;
	clearFields = mockingSpongebob.clearFields = () => {
		input.value = "";
		imagein.value = "";
		mathin.value = "";
	};

	let clear;
	clear = mockingSpongebob.clear = () => {
		//
		clearFields();
		drawMemeText("");
		//
	};

	let processHashV2 = (hash = "") => {
		if (hash) {
			if (hash.startsWith("#math")) {
				// math.js will handle behavior
			} else {
				if (hash.startsWith("#mockType:")) {
					const mockType =
						mockingSpongebob.mockTypes[hash.slice(10, hash.indexOf(":", 10))] ||
						mockingSpongebob.mockTypes[hash.slice(10, hash.length)];
					if (mockType) {
						document.getElementById(mockType.id).selected = true;
						mockingSpongebob.currentMock = mockType;

						if (hash.indexOf(":", 10) !== -1) {
							try {
								clearFields();
								input.value = hash
									.slice(hash.indexOf(":", 10) + 1) // hash includes '#' when present
									.split(":")
									.map((char) => String.fromCodePoint(parseInt(char, 16)))
									.join("");
								captionRadio.click();
								drawMemeText(input.value);
							} catch (err) {
								title.click();
							}
						}
					}
				}
			}
		} else {
			drawMemeText("");
			input.value = "";
			mathin.value = "";
			captionRadio.click();
		}
	};

	let hashify;
	hashify = mockingSpongebob.hashify = (str) => {
		return [...str].map((char) => char.codePointAt(0).toString(16)).join(":");
	};

	window.addEventListener("load", () => {
		processHashV2(location.hash);
	});

	input.addEventListener("input", () => {
		cameraStop();
		let microphoneOn;
		if ((microphoneOn = document.getElementById("microphone--on"))) {
			microphoneOn.click();
		}
		input.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
		imagein.value = "";
		mathin.value = "";

		drawMemeText(input.value);
		copyLinkBtn.onclick = copyLink;
	});

	input.onkeydown = (event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
		}
	};

	mockSelector.addEventListener("input", () => {
		drawMemeText(input.value);
		copyLinkBtn.onclick = copyLink;
	});

	/**
	 * @param {string} str
	 */
	function getTextWidth(str) {
		return ctx.measureText(str).width;
	}

	function formatText(str = "") {
		const MIN_FONT_SIZE = 8;
		const trimmedStr = str.trim();

		if (trimmedStr === "") {
			lastFormatResult = {
				lines: [],
				size: INITIAL_FONT_SIZE,
			};
			return lastFormatResult;
		}

		// Setup font range
		let lowerFontSize = MIN_FONT_SIZE - 1; // always safe
		let upperFontSize = INITIAL_FONT_SIZE; // possibly too large
		let currentFontSize; // assigned in loop

		const words = trimmedStr.split(" ");

		/** @type {string[][]} */
		const lines = [];
		let currentLineIndex = 0;

		/**
		 * This helper function tries to fit a word into the results
		 * array using the current font size of the 2D canvas context.
		 *
		 * Returns if it was able to be added.
		 * @param {string} word The word to try to fit
		 * @returns
		 */
		function fitIntoLines(word) {
			const modifiedLine = lines[currentLineIndex].concat(word);
			if (
				getTextWidth(modifiedLine.join(" ")) >= MAX_LINE_BOX_WIDTH
				// checks if adding new word exceeds the line's box width
			) {
				if (getTextWidth(word) >= MAX_LINE_BOX_WIDTH) {
					// check if a single word is too big
					return false;
				} else {
					if (
						// is there enough vertical room for a new line
						currentFontSize * (currentLineIndex + 2) <
						INITIAL_FONT_SIZE
					) {
						currentLineIndex += 1;
						lines.push([word]);
						return true;
					} else {
						return false;
					}
				}
			} else {
				// add the word if it fits on the current line
				lines[currentLineIndex].push(word);
				return true;
			}
		}

		function tryFormatAllWords(fontSize) {
			currentFontSize = fontSize;
			ctx.font = `bold ${fontSize}px Arial`;

			// set up result array of lines
			lines.length = 0;
			lines.push([]);
			currentLineIndex = 0;

			return words.every(fitIntoLines);
		}

		// Binary search through font range
		while (lowerFontSize !== upperFontSize) {
			// Try new middle font-size
			currentFontSize = upperFontSize - Math.floor((upperFontSize - lowerFontSize) / 2);
			// console.log("Bounds:", lowerFontSize, upperFontSize, "Current:", currentFontSize);

			const formattedAllWords = tryFormatAllWords(currentFontSize);

			if (formattedAllWords) {
				lowerFontSize = currentFontSize;
			} else {
				upperFontSize = currentFontSize - 1;
			}
		}

		let finalFontSize = lowerFontSize;

		// rebuild result array
		tryFormatAllWords(finalFontSize);

		// check for unreadable text
		if (finalFontSize < MIN_FONT_SIZE) {
			const ERROR_SIZE = 59;
			ctx.font = `bold ${ERROR_SIZE}px Arial`;
			ctx.fillStyle = "red";
			return {
				lines: ["Input is too large"],
				fontSize: ERROR_SIZE,
			};
		} else {
			finalFontSize = optimizeSize(lines, finalFontSize);
			ctx.fillStyle = "white";
			return {
				lines: lines.map((line) => line.join(" ").trim()),
				fontSize: finalFontSize,
			};
		}
	}

	/**
	 * Optimizes result array and returns best font-size
	 * @param {[[""]]} lines
	 * @param {number} fontSize
	 */
	function optimizeSize(lines, fontSize) {
		for (let lineIndex = lines.length - 1; lineIndex >= 1; lineIndex--) {
			const line2Index = lineIndex - 1;
			const getLine1Text = () => lines[lineIndex].join(" ");

			while (
				getTextWidth(`${lines[line2Index].slice(-1)[0]} ${getLine1Text()}`.trim()) <
				getTextWidth(lines[line2Index].slice(0, -1).join(" ").trim())
			) {
				lines[lineIndex].unshift(lines[line2Index].pop());
			}
		}
		return tryToIncreaseFont(lines, fontSize);
	}

	/**
	 * Tries to increase the font-size as much as possible
	 * @param {[[""]]} lines
	 * @param {number} fontSize
	 */
	function tryToIncreaseFont(lines, fontSize) {
		const tryOneIncrease = () => {
			const newSize = fontSize + 1;
			ctx.font = `bold ${newSize}px Arial`;
			if (
				lines.every((line) => getTextWidth(line.join(" ").trim()) < MAX_LINE_BOX_WIDTH) &&
				lines.length * newSize < INITIAL_FONT_SIZE
			) {
				fontSize = newSize;
				return true;
			} else {
				ctx.font = `bold ${fontSize}px Arial`;
				return false;
			}
		};

		let increasePossible = true;
		while (increasePossible) {
			increasePossible = tryOneIncrease();
		}

		return fontSize;
	}

	let lastFormatText = "";
	let lastFormatResult = {
		lines: [],
		size: INITIAL_FONT_SIZE,
	};
	function drawMemeText(str) {
		const trimmedStr = str.trim();

		let format;
		if (trimmedStr === lastFormatText) {
			format = lastFormatResult;
		} else {
			lastFormatText = str;
			const altered_str = altText(str);

			// const start = performance.now();
			format = formatText(altered_str);
			// console.log(performance.now() - start);
			lastFormatResult = format;
		}

		// console.log(trimmedStr, format);

		const lines = format.lines;
		const size = format.fontSize;

		ctx.drawImage(img, 0, 0);

		const LINE_WIDTH_SHRINK_FACTOR = 9;
		ctx.lineWidth = size / LINE_WIDTH_SHRINK_FACTOR;

		const BOTTOM_MARGIN = 4;

		const xloc = canvas.width / 2;
		const yloc =
			img.height - // start at bottom of canvas
			(lines.length - 1) * size - // account for the number of lines to move up
			ctx.lineWidth / 2 - // account for the outer border thickness
			ctx.measureText(lines[lines.length - 1]).actualBoundingBoxDescent - // align bottom of bounding boxes
			BOTTOM_MARGIN; // create a bottom margin

		for (let i = 0; i < lines.length; i++) {
			ctx.strokeText(lines[i], xloc, yloc + i * size); // draw border
			ctx.fillText(lines[i], xloc, yloc + i * size); // draw filled texts
		}

		repaint();
	}

	function defaultMock(str) {
		let result = "";
		let lower = true;
		for (let c of str) {
			result += lower ? c.toLowerCase() : c.toUpperCase();
			if (c.match(/[a-z]/i)) lower = !lower;
		}
		return result;
	}

	function altText(str) {
		if (mockingSpongebob.currentMock) {
			return mockingSpongebob.currentMock.apply(str);
		} else {
			return defaultMock(str);
		}
	}

	reader.onload = function () {
		var dataURL = reader.result;
		upload.src = dataURL;
	};

	upload.onload = () => {
		drawMemeImage();
	};

	function drawMemeImage() {
		const MAX_HEIGHT = 105;
		const MAX_WIDTH = 450;

		ctx.drawImage(img, 0, 0);
		let scale = Math.min(MAX_WIDTH / upload.width, MAX_HEIGHT / upload.height);
		let newWidth = upload.width * scale;
		let newHeight = upload.height * scale;
		ctx.drawImage(upload, 250 - newWidth / 2, canvas.height - 5 - newHeight, newWidth, newHeight);
		repaint();
	}

	let repaint;
	repaint = mockingSpongebob.repaint = () => {
		var dataURL = canvas.toDataURL("image/png");
		mirror.src = dataURL;
		mirror.alt = input.value;
		mirror.title = input.value;

		var modes = document.getElementsByName("mode");
		for (let i = 0; i < modes.length; i++) {
			if (modes[i].checked) {
				if (modes[i].id == "captionRadio") {
					document.getElementById("cpy-text-btn").disabled = false;
					document.getElementById("cpy-link-btn").disabled = false;
				} else if (modes[i].id == "mathinRadio") {
					document.getElementById("cpy-text-btn").disabled = true;
					document.getElementById("cpy-link-btn").disabled = false;
				} else {
					document.getElementById("cpy-text-btn").disabled = true;
					document.getElementById("cpy-link-btn").disabled = true;
				}
			}
		}

		document.getElementById("sv-link").href = mirror.src;
		document.getElementById("sv-link").download = `${
			input.value ? altText(input.value) : mathin.value || "img"
		}.png`;
	};

	imagein.onchange = (event) => {
		input.value = "";
		mathin.value = "";
		if (imagein.files[0]) {
			reader.readAsDataURL(imagein.files[0]);
		} else {
			ctx.drawImage(img, 0, 0);
			repaint();
		}
	};

	function updateMode() {
		let modes = document.getElementsByName("mode");
		for (let i = 0; i < modes.length; i++) {
			if (modes[i].checked) {
				document.getElementById(modes[i].value).style.display = "inline-block";
				if (document.getElementById(modes[i].value).id === "captionControls") {
					document.getElementById("caption").focus();
				} else {
					document.getElementById(modes[i].value).focus();
					let microphoneOn;
					if ((microphoneOn = document.getElementById("microphone--on"))) {
						microphoneOn.click();
					}
				}
			} else {
				document.getElementById(modes[i].value).style.display = "none";
			}
		}
		if (!imageinRadio.checked) {
			cameraStop();
		}
	}

	function copyLink() {
		const newHash = hashify(input.value.trim());
		const url = new URL(location);
		url.hash = `#mockType:${mockingSpongebob.currentMock.id}:${newHash}`;
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

	function copyMockText() {
		const text = altText(input.value);
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
		} else if (document.execCommand) {
			let temp = document.createElement("textarea");
			temp.value = text;
			document.body.appendChild(temp);
			temp.select();
			document.execCommand("copy");
			document.body.removeChild(temp);
		}
	}

	function save() {
		document.getElementById("sv-link").click();
	}

	imageinRadio.onclick = updateMode;
	captionRadio.onclick = updateMode;
	mathinRadio.onclick = updateMode;
	document.getElementById("cpy-text-btn").onclick = copyMockText;
	copyLinkBtn.onclick = copyLink;
	document.getElementById("sv-btn").onclick = save;
})();
