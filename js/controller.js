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
		captionin = document.getElementById("caption"),
		/** @type {HTMLButtonElement} */
		captionRadio = document.getElementById("captionRadio"),
		/** @type {HTMLInputElement} */
		captionColorInput = document.getElementById("caption-color"),
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
		captionin.value = "";
		imagein.value = "";
		mathin.value = "";
	});

	const clearImage = (mockingSpongebob.clearImage = () => {
		formatAndDrawText("");
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

				const contentPrefixIndex = hash.indexOf(":", 10);
				if (~contentPrefixIndex) {
					try {
						clearFields();
						const content = decodeURIComponent(hash.slice(contentPrefixIndex + 1));
						captionin.value = content;

						if (img.complete) {
							formatAndDrawText(captionin.value);
						} else {
							img.onload = () => formatAndDrawText(captionin.value);
						}
					} catch (err) {
						console.error(err);
						title.click();
					}
				}
			}
		}
	};

	// custom event
	captionin.addEventListener("audioinput", () => {
		cameraStop();

		captionin.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});

		imagein.value = "";
		mathin.value = "";

		formatAndDrawText(captionin.value);
		copyLinkBtn.onclick = copyLink;
	});

	captionin.addEventListener("input", () => {
		cameraStop();

		let microphoneOn = document.getElementById("microphone--on");
		if (microphoneOn) {
			microphoneOn.click();
		}

		captionin.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
		imagein.value = "";
		mathin.value = "";

		formatAndDrawText(captionin.value);
		copyLinkBtn.onclick = copyLink;
	});

	captionin.onkeydown = (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
		}
	};

	mockSelector.addEventListener("input", () => {
		formatAndDrawText(captionin.value, null, true);
		copyLinkBtn.onclick = copyLink;
	});

	/**
	 * @param {string} str
	 */
	function getTextWidth(str) {
		return ctx.measureText(str).width;
	}

	/**
	 * @typedef CaptionFormat
	 * @property {string[] | null} lines
	 * @property {number} fontSize
	 */

	/** @type {CaptionFormat} */
	const EMPTY_FORMAT = {
		lines: [],
		fontSize: INITIAL_FONT_SIZE,
	};

	/** @type {CaptionFormat} */
	const ERROR_FORMAT = {
		lines: null,
		fontSize: 59,
	};

	function maxNumberOfLines(fontSize) {
		return Math.ceil(INITIAL_FONT_SIZE / fontSize);
	}

	/**
	 * @param {string} str The string to format
	 * @returns {CaptionFormat}
	 */
	function formatText(str) {
		const MIN_FONT_SIZE = 8; // in pixels

		const MAX_LINE_BOX_WIDTH = 480; // in pixels
		const MIN_LINE_BOX_WIDTH = 25; // in pixels

		if (str === "") {
			return EMPTY_FORMAT;
		}

		const words = str.split(" ");

		/**
		 * A list representing how the caption should be broken up into
		 * separate lines using some formatting strategy.
		 * @type {string[][]}
		 */
		let linesByWord;

		/**
		 * This higher-order function returns a procedure (a.k.a. a callback)
		 * for determining whether a word is able to fit into the {@link linesByWord}
		 * list using the given font size and box width.
		 *
		 * The resulting procedure HAS SIDE EFFECTS: the procedure also appends the
		 * given word to a line of the {@link linesByWord} list if, but not only if,
		 * it fits.
		 *
		 * The resulting procedure should likely be used within another function
		 * that accepts a callback function such as {@link Array.prototype.every}.
		 *
		 * @param {number} fontSize The font size
		 * @param {number} boxWidth The max width of the region
		 * @returns {(word: string) => boolean} A procedure to determine if a word will fit.
		 */
		function fitIntoLinesAtSize(fontSize, boxWidth) {
			return (/** @type {string} */ word) => {
				const modifiedLine = linesByWord.at(-1).concat(word).join(" ").trim();

				// checks if adding new word exceeds the last line's box width
				if (getTextWidth(modifiedLine) >= boxWidth) {
					// check if a single word is too big to fit
					if (getTextWidth(word) >= boxWidth) {
						return false;
					}

					// create a new line
					linesByWord.push([word]);
					// return if we have exceeded the maximum allowed lines
					return linesByWord.length < maxNumberOfLines(fontSize);
				} else {
					// add the word if it fits on the last line
					linesByWord.at(-1).push(word);
					return true;
				}
			};
		}

		function tryFormatAllWords(fontSize, boxWidth) {
			ctx.font = `bold ${fontSize}px Arial`;

			// set up result array of lines
			linesByWord = [[]];

			// tries to fits every word into `linesByWord`, returning whether it was successful
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

		// check that text is readable, return error format otherwise
		if (finalFontSize < MIN_FONT_SIZE || finalBoxWidth < MIN_LINE_BOX_WIDTH) {
			return ERROR_FORMAT;
		}

		// rebuild result array
		tryFormatAllWords(finalFontSize, finalBoxWidth);

		return {
			lines: linesByWord.map((line) => line.join(" ").trim()),
			fontSize: finalFontSize,
		};
	}

	const DRAW_STATE = {
		baseText: "",
		textFormat: { lines: [], fontSize: INITIAL_FONT_SIZE },
		options: { color: "#ffffff" },
	};

	const isomorphicIdleCallback = window.requestIdleCallback ?? requestAnimationFrame;
	const isomorphicCancelIdleCallback = window.cancelIdleCallback ?? cancelAnimationFrame;

	let updateColorRequest = null;
	captionColorInput.addEventListener("input", () => {
		isomorphicCancelIdleCallback(updateColorRequest);
		DRAW_STATE.options.color = captionColorInput.value;
		updateColorRequest = isomorphicIdleCallback(() =>
			drawText(DRAW_STATE.textFormat, DRAW_STATE.options)
		);
	});

	/**
	 * @typedef DrawOptions
	 * @property {string} color
	 */

	/**
	 * @param {string} str
	 * @param {DrawOptions?} options
	 * Customizable options for drawing. Use `null` to reuse previous options.
	 * @param {boolean} force Overrides caching. False by default.
	 * @returns
	 */
	function formatAndDrawText(str, options, force = false) {
		options ??= DRAW_STATE.options;

		const trimmedStr = str.trim();
		// check if the text has already been formatted
		if (trimmedStr === DRAW_STATE.baseText && !force) {
			// check if the color is the same too, making this a no-op
			if (options.color === DRAW_STATE.options.color) return;

			return drawText(DRAW_STATE.textFormat, options);
		}

		const altered_str = altText(trimmedStr);

		// const start = performance.now();
		const format = formatText(altered_str);
		// console.log(performance.now() - start);

		DRAW_STATE.baseText = trimmedStr;
		DRAW_STATE.textFormat = format;
		DRAW_STATE.options = options;

		drawText(format, options);
	}

	/**
	 *
	 * @param {CaptionFormat} format
	 * @param {DrawOptions} options
	 */
	function drawText(format, options) {
		let { lines, fontSize } = format;
		let { color } = options;

		if (lines === null) {
			lines = ["Input is too large"];
			color = "#ff0000";
		}

		ctx.fillStyle = color;
		ctx.font = `bold ${fontSize}px Arial`;

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
		mirror.alt = captionin.value;
		mirror.title = captionin.value;

		saveLink.href = dataURL;
		saveLink.download = `${
			captionin.value ? altText(captionin.value.trim()) : mathin.value.trim() || "img"
		}.jpg`;

		if (navigator.canShare && navigator.share) {
			updateShareData(dataURL);
		}

		updateShareButtons();
	});

	imagein.onchange = () => {
		captionin.value = "";
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
				document.getElementById(modes[i].value).style.display = "block";

				if (document.getElementById(modes[i].value).id === "caption-controls") {
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

			const trimmedStr = captionin.value.trim();
			if (trimmedStr !== "") {
				const newHash = encodeURIComponent(trimmedStr);
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
			const text = altText(captionin.value);

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

	if (!CSS.supports("selector(:has(_))")) {
		imageinRadio.onclick = updateMode;
		captionRadio.onclick = updateMode;
		mathinRadio.onclick = updateMode;
	} else {
		imageinRadio.onclick = () => imagein.focus();
		captionRadio.onclick = () => captionin.focus();
		mathinRadio.onclick = () => mathin.focus();
	}

	copyTextBtn.onclick = copyMockText;
	copyLinkBtn.onclick = copyLink;
}
