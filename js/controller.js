"use strict";
{
	// DOM Constants
	/** @type {HTMLCanvasElement} */
	const canvas = document.getElementById("canvas"),
		ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }),
		/** @type {HTMLImageElement} */
		img = document.getElementById("meme"),
		/** @type {HTMLImageElement} */
		mirror = document.getElementById("mirror"),
		/** @type {HTMLInputElement} */
		captionin = document.getElementById("caption"),
		/** @type {HTMLInputElement} */
		captionRadio = document.getElementById("captionRadio"),
		/** @type {HTMLInputElement} */
		captionColorInput = document.getElementById("caption-color"),
		/** @type {HTMLInputElement} */
		imagein = document.getElementById("imagein"),
		/** @type {HTMLInputElement} */
		imageinRadio = document.getElementById("imageinRadio"),
		/** @type {HTMLImageElement} */
		upload = document.getElementById("upload"),
		/** @type {HTMLInputElement} */
		mathin = document.getElementById("mathin"),
		/** @type {HTMLInputElement} */
		mathinRadio = document.getElementById("mathinRadio"),
		/** @type {HTMLDivElement} */
		box = document.getElementById("box"),
		/** @type {HTMLHeadingElement} */
		title = document.getElementById("title"),
		/** @type {HTMLSelectElement} */
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
		reader = new FileReader();

	let shareData = null;

	const INITIAL_FONT_SIZE = 100; // in pixels

	const BASE_URL = `${location.origin}${location.pathname}`;

	//set-up canvas context
	canvas.width = img.width;
	canvas.height = img.height;
	ctx.lineJoin = "round";
	ctx.textBaseline = "bottom";
	ctx.imageSmoothingQuality = "high";
	ctx.textRendering = "optimizeLegibility";
	ctx.textAlign = "center";
	ctx.strokeStyle = "black";
	ctx.fillStyle = "white";

	const clearAllFields = (mockingSpongeBob.clearFields = () => {
		captionin.value = "";
		imagein.value = "";
		mathin.value = "";
	});

	const clearOtherInputs = () => {
		imagein.value = "";
		upload.removeAttribute("src");
		mathin.value = "";
	};

	const resetTemplate = (mockingSpongeBob.resetTemplate = () => {
		formatAndDrawText("", captionColorInput.value, true);
	});

	const stopAsyncProcesses = (mockingSpongeBob.stopAsyncProcesses = () => {
		mockingSpongeBob.demo.stopTimer();
		mockingSpongeBob.cameraStop?.();
		mockingSpongeBob.recognition?.abort();
	});

	// add drag and drop
	box.addEventListener("dragover", (event) => {
		event.preventDefault();
	});
	box.addEventListener("drop", (event) => {
		event.preventDefault();

		const item = event.dataTransfer?.items?.[0];
		if (item?.kind === "file") {
			imageinRadio.click();
			imagein.files = event.dataTransfer.files;
			imagein.dispatchEvent(new InputEvent("input"));
		}
	});

	title.addEventListener("click", () => {
		stopAsyncProcesses();

		history.pushState(null, null, "./");
		upload.removeAttribute("src");
		clearAllFields();
		resetTemplate();
	});

	/**
	 * Parses the given hash and renders the encoded meme.
	 * This should only be called once!
	 * @deprecated
	 * @param {string} hash
	 * @returns
	 */
	const processHash_DEPRECATED = (hash = "") => {
		if (!hash) {
			return window.addEventListener("load", () => captionRadio.click(), { once: true });
		}

		// hash format: #mockType:<type>:<content>
		// ex: #mockType:asl:74:65:73:74
		const HASH_PREFIX = "#mockType:";
		if (hash.startsWith(HASH_PREFIX)) {
			const hashSecondColonIndex = hash.indexOf(":", HASH_PREFIX.length);

			const mockTypeId = hash.slice(HASH_PREFIX.length, hashSecondColonIndex);

			const mockType = mockingSpongeBob.mockTypes[mockTypeId];

			if (mockType) {
				/** @type {HTMLOptionElement} */
				const mockOption = document.getElementById(mockType.id);

				mockOption.selected = true;
				mockingSpongeBob.currentMock = mockType;

				const contentPrefixIndex = hash.indexOf(":", 10);
				if (~contentPrefixIndex) {
					try {
						clearAllFields();
						captionin.value = hash
							.slice(contentPrefixIndex + 1) // hash includes '#' when present
							.split(":")
							.map((char) => String.fromCodePoint(parseInt(char, 16)))
							.join("");

						img.decode().then(() => formatAndDrawText(captionin.value, captionColorInput.value));
					} catch (err) {
						console.error(err);
						title.click();
					}
				}
			}
		}
	};

	const processSearch = (search) => {
		const searchParams = new URLSearchParams(search);
		let encodedText = searchParams.get("text") ?? "",
			mode = searchParams.get("mode") ?? "altsl",
			color = searchParams.get("color") ?? "#ffffff",
			animateTime = Number.parseFloat(searchParams.get("animate"));

		if (mode in mockingSpongeBob.mockTypes) {
			const mockType = mockingSpongeBob.mockTypes[mode];

			if (mockType) {
				mockType.htmlOption.selected = true;
				mockingSpongeBob.currentMock = mockType;
			}

			// ensure image has finished decoding
			img.decode().then(() => {
				captionColorInput.value = color;
				captionColorInput.dispatchEvent(new InputEvent("input"));

				if (!encodedText) {
					captionin.focus();
				} else {
					captionin.blur();
					const decodedText = mockingSpongeBob.decodeText(encodedText);

					if (!Number.isNaN(animateTime))
						return mockingSpongeBob.demo.typeIn(decodedText, animateTime * 1000);

					captionin.value = decodedText;
					captionin.dispatchEvent(new InputEvent("input"));
				}
			});
		}
	};

	let formatCaptionRequest = null;
	const captionInputHandler = () => {
		cancelAnimationFrame(formatCaptionRequest);

		captionin.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});

		clearOtherInputs();
		formatCaptionRequest = requestAnimationFrame(() =>
			formatAndDrawText(captionin.value, captionColorInput.value)
		);
		copyLinkBtn.onclick = copyLink;
	};

	// custom event for microphone input
	captionin.addEventListener("audioinput", captionInputHandler);

	// custom event for demo input
	captionin.addEventListener("demoinput", () => {
		mockingSpongeBob.cameraStop?.();
		mockingSpongeBob.recognition?.abort();
		captionInputHandler();
	});

	captionin.addEventListener("input", () => {
		stopAsyncProcesses();
		captionInputHandler();
	});

	mockSelector.addEventListener("input", () => {
		// don't check for error because different text transforms may fit
		formatAndDrawText(captionin.value, captionColorInput.value);
		copyLinkBtn.onclick = copyLink;
	});

	/**
	 * @param {string} str
	 */
	function getTextWidth(str) {
		return ctx.measureText(str).width;
	}

	function maxNumberOfLines(fontSize) {
		return Math.ceil(INITIAL_FONT_SIZE / fontSize);
	}

	/**
	 * @typedef CaptionFormat
	 * @property {string[]} lines
	 * @property {number} fontSize
	 */

	/**
	 * @param {string} str The string to format
	 * @returns {CaptionFormat?} A null value indicates a formatting constraint
	 */
	function formatText(str) {
		const MIN_FONT_SIZE = 8; // in pixels

		const MAX_LINE_BOX_WIDTH = 480; // in pixels
		const MIN_LINE_BOX_WIDTH = 1; // in pixels

		if (str === "") {
			return { lines: [], fontSize: INITIAL_FONT_SIZE };
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

		// Setup font size range
		let lowerFontSize = MIN_FONT_SIZE - 1; // always safe
		let upperFontSize = INITIAL_FONT_SIZE; // possibly too large

		// Binary search through font size range
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

		// check that text is a readable size, otherwise return null
		if (finalFontSize < MIN_FONT_SIZE) {
			return null;
		}

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

		// rebuild result array
		tryFormatAllWords(finalFontSize, finalBoxWidth);

		return {
			lines: linesByWord.map((line) => line.join(" ").trim()),
			fontSize: finalFontSize,
		};
	}

	let FORMAT_CACHE = null;

	const isomorphicIdleCallback = window.requestIdleCallback ?? requestAnimationFrame;
	const isomorphicCancelIdleCallback = window.cancelIdleCallback ?? cancelAnimationFrame;

	let updateColorRequest = null;
	captionColorInput.addEventListener("input", () => {
		isomorphicCancelIdleCallback(updateColorRequest);
		clearOtherInputs();
		updateColorRequest = isomorphicIdleCallback(
			() => formatAndDrawText(captionin.value, captionColorInput.value),
			{ timeout: 16 }
		);
	});

	/**
	 * @param {string} str
	 * @param {string} color
	 * @param {boolean} force Overrides caching. False by default.
	 * @returns
	 */
	function formatAndDrawText(str, color, force = false) {
		const trimmedStr = str.trim();

		if (trimmedStr === "") {
			mockingSpongeBob.drawn = {
				text: "",
				color,
				isErrored: false,
				mode: mockingSpongeBob.currentMock.id,
			};

			const url = "./img/spongebob.jpg";

			mirror.src = url;
			mirror.alt = "Mocking SpongeBob meme";
			mirror.title = "";

			saveLink.href = url;
			saveLink.download = "spongebob.jpg";

			if (navigator.canShare && navigator.share) {
				updateShareData(url);
			}

			return updateShareButtons();
		}

		// handle caching
		if (!force) {
			const { text, color: lastColor, mode } = mockingSpongeBob.drawn;
			if (trimmedStr === text && mockingSpongeBob.currentMock.id === mode) {
				if (color === lastColor) return;

				mockingSpongeBob.drawn.color = color;
				return drawText(FORMAT_CACHE, color);
			}
		}

		const transformedStr = applyCurrentMockTransform(trimmedStr);

		FORMAT_CACHE = formatText(transformedStr);
		mockingSpongeBob.drawn = {
			text: trimmedStr,
			color,
			mode: mockingSpongeBob.currentMock.id,
			isErrored: FORMAT_CACHE === null,
		};

		if (FORMAT_CACHE === null) {
			drawText({ lines: ["Input is too large"], fontSize: 59 }, "#ff0000");
		} else {
			drawText(FORMAT_CACHE, color);
		}
	}

	/**
	 *
	 * @param {CaptionFormat} format
	 * @param {string} color
	 */
	function drawText(format, color) {
		const { lines, fontSize } = format;

		ctx.drawImage(img, 0, 0);

		if (lines.length === 0) {
			return repaint();
		}

		ctx.fillStyle = color;
		ctx.font = `bold ${fontSize}px Arial`;

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

	function applyCurrentMockTransform(str) {
		if (mockingSpongeBob.currentMock) {
			return mockingSpongeBob.currentMock.apply(str);
		} else {
			return defaultMock(str);
		}
	}

	reader.onload = function () {
		mockingSpongeBob.stopAsyncProcesses();
		mockingSpongeBob.drawn = { mode: "image", isErrored: false };
		upload.src = reader.result;
	};

	upload.addEventListener("load", drawUpload);
	upload.addEventListener("error", (event) => {
		console.error(event);
		mockingSpongeBob.drawn = { isErrored: true };
		drawText({ lines: ["There was an error", "uploading the image"], fontSize: 45 }, "#ff0000");
	});

	function drawUpload() {
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

				const canShare = navigator.canShare(shareData);
				if (canShare) {
					shareBtn.disabled = false;
				} else {
					console.error("There was an error sharing this meme.");
					shareBtn.disabled = true;
				}

				return canShare;
			});
	}

	function updateShareButtons() {
		const haveCopyPermissions = !!navigator.clipboard;
		const { mode, isErrored } = mockingSpongeBob.drawn;

		if (isErrored) {
			copyTextBtn.disabled = true;
			copyLinkBtn.disabled = true;
			return;
		}

		if (mode === "image") {
			copyTextBtn.disabled = true;
			copyLinkBtn.disabled = true;
		} else if (mode === "math") {
			copyTextBtn.disabled = true;
			copyLinkBtn.disabled = !haveCopyPermissions;
		} else {
			copyTextBtn.disabled = !haveCopyPermissions;
			copyLinkBtn.disabled = !haveCopyPermissions;
		}
	}

	/**
	 * Re-exports the canvas to the mirror image element,
	 * as well as updates all sharing methods.
	 */
	const repaint = (mockingSpongeBob.repaint = () => {
		const dataURL = canvas.toDataURL("image/jpeg");
		mirror.src = dataURL;
		mirror.alt = captionin.value;
		mirror.title = captionin.value;

		saveLink.href = dataURL;

		const mode = mockingSpongeBob.drawn.mode;
		if (mode === "image") {
			saveLink.download = "image.jpg";
		} else if (mode === "math") {
			saveLink.download = `${mathin.value.trim()}.jpg`;
		} else {
			saveLink.download = `${applyCurrentMockTransform(captionin.value.trim())}.jpg`;
		}

		if (navigator.canShare && navigator.share) {
			updateShareData(dataURL);
		}

		updateShareButtons();
	});

	imagein.addEventListener("input", () => {
		captionin.value = "";
		mathin.value = "";

		if (imagein.files[0]) {
			reader.readAsDataURL(imagein.files[0]);
		} else {
			ctx.drawImage(img, 0, 0);
			repaint();
		}
	});

	/** @deprecated */
	function updateMode_DEPRECATED() {
		let modes = document.getElementsByName("mode");
		for (let i = 0; i < modes.length; i++) {
			if (modes[i].checked) {
				document.getElementById(modes[i].value).style.display = "flex";

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
			mockingSpongeBob.cameraStop?.();
		}
	}

	let copyLinkTimer;
	function copyLink() {
		if (navigator.clipboard) {
			let urlStr = BASE_URL;

			const trimmedStr = captionin.value.trim();
			if (trimmedStr !== "") {
				const url = new URL(location);
				url.searchParams.set("mode", mockingSpongeBob.currentMock.id);
				url.searchParams.set("text", mockingSpongeBob.encodeText(trimmedStr));
				url.searchParams.set("color", captionColorInput.value);
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
			const text = applyCurrentMockTransform(captionin.value);

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
		updateShareData(mirror.src).then((canShare) => {
			shareBtn.hidden = !canShare;
		});

		shareBtn.addEventListener("click", () => {
			if (navigator.canShare(shareData)) {
				navigator.share(shareData);
			} else {
				console.error("There was an error sharing this meme.");
			}
		});
	}

	updateShareButtons();
	if (location.hash) {
		processHash_DEPRECATED(location.hash);
	} else if (location.search) {
		processSearch(location.search);
	} else {
		captionin.focus();
	}

	if (!CSS.supports("selector(:has(_))")) {
		// support Firefox
		imageinRadio.onclick = updateMode_DEPRECATED;
		captionRadio.onclick = updateMode_DEPRECATED;
		mathinRadio.onclick = updateMode_DEPRECATED;

		captionRadio.click();
	} else {
		imageinRadio.onclick = () => imagein.focus();
		captionRadio.onclick = () => captionin.focus();
		mathinRadio.onclick = () => mathin.focus();
	}

	copyTextBtn.onclick = copyMockText;
	copyLinkBtn.onclick = copyLink;
}
