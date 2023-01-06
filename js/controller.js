"use strict";
{
	// DOM Constants
	/** @type {HTMLCanvasElement} */
	const canvas = document.getElementById("output"),
		/** @type {CanvasRenderingContext2D} */
		ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }),
		/** @type {HTMLImageElement} */
		img = document.getElementById("meme"),
		/** @type {HTMLImageElement} */
		mirror = document.getElementById("mirror"),
		/** @type {HTMLInputElement} */
		input = document.getElementById("caption"),
		/** @type {HTMLButtonElement} */
		captionRadio = document.getElementById("captionRadio"),
		imagein = document.getElementById("imagein"),
		imageinRadio = document.getElementById("imageinRadio"),
		/** @type {HTMLImageElement} */
		upload = document.getElementById("upload"),
		captionModes = document.getElementsByName("mode"),
		mathin = document.getElementById("mathin"),
		mathinRadio = document.getElementById("mathinRadio"),
		title = document.getElementById("title"),
		mockSelector = document.getElementById("mockType-selector"),
		/** @type {HTMLButtonElement} */
		copyTextBtn = document.getElementById("cpy-text-btn"),
		/** @type {HTMLButtonElement} */
		copyLinkBtn = document.getElementById("cpy-link-btn"),
		/** @type {HTMLAnchorElement} */
		saveLink = document.getElementById("sv-link"),
		/** @type {HTMLButtonElement} */
		shareBtn = document.getElementById("share-btn"),
		/** @type {HTMLSpanElement} */
		copyLinkTxt = document.getElementById("cpy-link-txt"),
		/** @type {HTMLSpanElement} */
		copyTextTxt = document.getElementById("cpy-text-txt"),
		cameraStop = mockingSpongebob.cameraStop,
		reader = new FileReader();

	let shareData = null;

	const INITIAL_FONT_SIZE = 100; // in pixels

	const BASE_URL = `${location.origin}${location.pathname}`;

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

	const clearFields = (mockingSpongebob.clearFields = () => {
		input.value = "";
		imagein.value = "";
		mathin.value = "";
	});

	const clearImage = (mockingSpongebob.clearImage = () => {
		drawMemeText("", true);
	});

	const clear = (mockingSpongebob.clear = () => {
		clearFields();
		clearImage();
	});

	// should only be called once in the script!
	let processHashV2 = (hash = "") => {
		if (!hash) {
			return window.addEventListener("load", () => captionRadio.click());
		}

		// hash format: #mockType:<type>:<content>
		// ex: #mockType:asl:74:65:73:74
		const HASH_PREFIX = "#mockType:";
		if (hash.startsWith(HASH_PREFIX)) {
			const hashSecondColonIndex = hash.indexOf(":", HASH_PREFIX.length);

			const mockTypeId = hash.slice(HASH_PREFIX.length, hashSecondColonIndex);

			const mockType = mockingSpongebob.mockTypes[mockTypeId];

			if (mockType) {
				/** @type {HTMLOptionElement} */
				const mockOption = document.getElementById(mockType.id);

				mockOption.selected = true;
				mockingSpongebob.currentMock = mockType;

				if (hash.indexOf(":", 10) !== -1) {
					try {
						clearFields();
						input.value = hash
							.slice(hash.indexOf(":", 10) + 1) // hash includes '#' when present
							.split(":")
							.map((char) => String.fromCodePoint(parseInt(char, 16)))
							.join("");

						if (img.complete) {
							requestAnimationFrame(() => drawMemeText(input.value));
						} else {
							img.onload = () => requestAnimationFrame(() => drawMemeText(input.value));
						}
					} catch (err) {
						console.error(err);
						title.click();
					}
				}
			}
		}
	};

	const hashify = (mockingSpongebob.hashify = (str) => {
		return [...str].map((char) => char.codePointAt(0).toString(16)).join(":");
	});

	// custom event
	input.addEventListener("audioinput", () => {
		cameraStop();

		input.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});

		imagein.value = "";
		mathin.value = "";

		drawMemeText(input.value);
		copyLinkBtn.onclick = copyLink;
	});

	input.addEventListener("input", () => {
		cameraStop();

		let microphoneOn = document.getElementById("microphone--on");
		if (microphoneOn) {
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
		if (event.key === "Enter") {
			event.preventDefault();
		}
	};

	mockSelector.addEventListener("input", () => {
		drawMemeText(input.value, true);
		copyLinkBtn.onclick = copyLink;
	});

	/**
	 * @param {string} str
	 */
	function getTextWidth(str) {
		return ctx.measureText(str).width;
	}

	const EMPTY_FORMAT = {
		lines: [],
		size: INITIAL_FONT_SIZE,
	};

	function maxNumberOfLines(fontSize) {
		return Math.ceil(INITIAL_FONT_SIZE / fontSize);
	}

	/**
	 * @param {string} str The string to format
	 * @returns
	 */
	function formatText(str) {
		const MIN_FONT_SIZE = 8; // in pixels

		const MAX_LINE_BOX_WIDTH = 480; // in pixels
		const MIN_LINE_BOX_WIDTH = 25; // in pixels

		if (str === "") {
			return EMPTY_FORMAT;
		}

		const words = str.split(" ");

		/** @type {string[][]} */
		let lines;

		/**
		 * This helper function tries to fit a word into the results
		 * array using the current font size of the 2D canvas context.
		 *
		 * Returns if it was able to be added.
		 * @param {number} fontSize The font size
		 * @param {number} boxWidth The max width of the region
		 * @returns
		 */
		function fitIntoLinesAtSize(fontSize, boxWidth) {
			return (/** @type {string} */ word) => {
				const modifiedLine = lines.at(-1).concat(word).join(" ").trim();

				// checks if adding new word exceeds the last line's box width
				if (getTextWidth(modifiedLine) >= boxWidth) {
					// check if a single word is too big to fit
					if (getTextWidth(word) >= boxWidth) {
						return false;
					}

					// create a new line
					lines.push([word]);
					// return if we have exceeded the maximum allowed lines
					return lines.length < maxNumberOfLines(fontSize);
				} else {
					// add the word if it fits on the last line
					lines.at(-1).push(word);
					return true;
				}
			};
		}

		function tryFormatAllWords(fontSize, boxWidth) {
			ctx.font = `bold ${fontSize}px Arial`;

			// set up result array of lines
			lines = [[]];

			return words.every(fitIntoLinesAtSize(fontSize, boxWidth));
		}

		// Setup font range
		let lowerFontSize = MIN_FONT_SIZE - 1; // always safe
		let upperFontSize = INITIAL_FONT_SIZE; // possibly too large

		// Binary search through font range
		// This determines the maximum font size that fits all the text into the region
		while (lowerFontSize !== upperFontSize) {
			// Try new middle font-size
			const currentFontSize = ~~((upperFontSize + lowerFontSize) / 2);

			const formattedAllWords = tryFormatAllWords(currentFontSize, MAX_LINE_BOX_WIDTH);

			if (formattedAllWords) {
				lowerFontSize = currentFontSize + 1;
			} else {
				upperFontSize = currentFontSize;
			}
		}

		const finalFontSize = lowerFontSize - 1;

		// Setup max width range
		let lowerBoxWidth = MIN_LINE_BOX_WIDTH - 1; // possibly too small
		let upperBoxWidth = MAX_LINE_BOX_WIDTH; // always safe

		// Binary search through max width range
		// This determines the minimum width that optimally balances the text within the region
		while (lowerBoxWidth !== upperBoxWidth) {
			// Try new middle max width
			const currentBoxWidth = ~~((upperBoxWidth + lowerBoxWidth) / 2);

			const formattedAllWords = tryFormatAllWords(finalFontSize, currentBoxWidth);

			if (formattedAllWords) {
				upperBoxWidth = currentBoxWidth;
			} else {
				lowerBoxWidth = currentBoxWidth + 1;
			}
		}

		const finalBoxWidth = upperBoxWidth;

		// check for unreadable text
		if (finalFontSize < MIN_FONT_SIZE || finalBoxWidth < MIN_LINE_BOX_WIDTH) {
			const ERROR_SIZE = 59;
			ctx.font = `bold ${ERROR_SIZE}px Arial`;
			ctx.fillStyle = "red";
			return {
				lines: ["Input is too large"],
				fontSize: ERROR_SIZE,
			};
		}

		// rebuild result array
		tryFormatAllWords(finalFontSize, finalBoxWidth);

		ctx.fillStyle = "white";
		return {
			lines: lines.map((line) => line.join(" ").trim()),
			fontSize: finalFontSize,
		};
	}

	let lastFormatText = "";
	/**
	 * @param {string} str
	 * @param {boolean} force Overrides caching. False by default.
	 * @returns
	 */
	function drawMemeText(str, force = false) {
		const trimmedStr = str.trim();

		if (trimmedStr === lastFormatText && !force) {
			return;
		}

		lastFormatText = trimmedStr;
		const altered_str = altText(trimmedStr);

		// const start = performance.now();
		const { lines, fontSize } = formatText(altered_str);
		// console.log(performance.now() - start);

		ctx.drawImage(img, 0, 0);

		const LINE_WIDTH_SHRINK_FACTOR = 9;
		ctx.lineWidth = fontSize / LINE_WIDTH_SHRINK_FACTOR;

		const BOTTOM_MARGIN = 4;

		const xloc = canvas.width / 2;
		const yloc =
			img.height - // start at bottom of canvas
			(lines.length - 1) * fontSize - // account for the number of lines to move up
			ctx.lineWidth / 2 - // account for the outer border thickness
			ctx.measureText(lines[lines.length - 1]).actualBoundingBoxDescent - // align bottom of bounding boxes
			BOTTOM_MARGIN; // create a bottom margin

		for (let i = 0; i < lines.length; i++) {
			ctx.strokeText(lines[i], xloc, yloc + i * fontSize); // draw border
			ctx.fillText(lines[i], xloc, yloc + i * fontSize); // draw filled texts
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
		const dataURL = reader.result;
		upload.src = dataURL;
	};

	upload.addEventListener("load", () => {
		drawMemeImage();
	});

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

	/** @type {AbortController} */
	let abortController;

	/**
	 * Update the shareData using the given URL
	 * @param {string} url
	 */
	function updateShareData(url) {
		// abort any pending requests to fetch the image
		if (abortController && !abortController.signal.aborted) {
			// hopefully browsers just cache the requests so it should be done
			// before getting aborted but maybe not ¯\_(ツ)_/¯
			abortController.abort();
		}

		abortController = new AbortController();
		return fetch(url, { signal: abortController.signal })
			.then((res) => res.blob())
			.then((blob) => {
				const file = new File([blob], "image.jpg", { type: "image/jpeg" });

				shareData = {
					files: [file],
					text: `Mocking SpongeBob Meme Generator - ${BASE_URL}`,
				};

				if (navigator.canShare(shareData)) {
					shareBtn.disabled = false;
				} else {
					console.error("There was an error sharing this meme.");
					shareBtn.disabled = true;
				}
			});
	}

	function updateShareButtons() {
		const canCopy = !!navigator.clipboard;

		for (let i = 0; i < captionModes.length; i++) {
			if (captionModes[i].checked) {
				if (captionModes[i].id == "captionRadio") {
					copyTextBtn.disabled = !canCopy;
					copyLinkBtn.disabled = !canCopy;
				} else if (captionModes[i].id == "mathinRadio") {
					copyTextBtn.disabled = true;
					copyLinkBtn.disabled = !canCopy;
				} else {
					copyTextBtn.disabled = true;
					copyLinkBtn.disabled = true;
				}
			}
		}
	}

	/**
	 * Re-exports the canvas to the mirror image element,
	 * as well as updates all sharing methods.
	 */
	const repaint = (mockingSpongebob.repaint = () => {
		const dataURL = canvas.toDataURL("image/jpeg");
		mirror.src = dataURL;
		mirror.alt = input.value;
		mirror.title = input.value;

		saveLink.href = dataURL;
		saveLink.download = `${
			input.value ? altText(input.value.trim()) : mathin.value.trim() || "img"
		}.jpg`;

		if (navigator.canShare && navigator.share) {
			updateShareData(dataURL);
		}

		updateShareButtons();
	});

	imagein.onchange = () => {
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
				document.getElementById(modes[i].value).style.removeProperty("display");

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

	let copyLinkTimer;
	function copyLink() {
		if (navigator.clipboard) {
			let urlStr = BASE_URL;

			const trimmedStr = input.value.trim();
			if (trimmedStr !== "") {
				const newHash = hashify(trimmedStr);
				const url = new URL(location);
				url.hash = `#mockType:${mockingSpongebob.currentMock.id}:${newHash}`;
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

	let copyTextTimer;
	function copyMockText() {
		if (navigator.clipboard) {
			const text = altText(input.value);

			navigator.clipboard.writeText(text).then(() => {
				copyTextTxt.textContent = "Copied!";

				clearTimeout(copyTextTimer);
				copyTextTimer = setTimeout(() => {
					copyTextTxt.textContent = "Copy Mocking Text";
				}, 2000);
			});
		}
	}

	if (navigator.canShare && navigator.share) {
		shareBtn.style.removeProperty("display");
		updateShareData(mirror.src);

		shareBtn.addEventListener("click", () => {
			if (navigator.canShare(shareData)) {
				navigator.share(shareData);
			} else {
				console.error("There was an error sharing this meme.");
			}
		});
	}

	updateShareButtons();
	processHashV2(location.hash);

	imageinRadio.onclick = updateMode;
	captionRadio.onclick = updateMode;
	mathinRadio.onclick = updateMode;
	copyTextBtn.onclick = copyMockText;
	copyLinkBtn.onclick = copyLink;
}
