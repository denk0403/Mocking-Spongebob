import * as gifuct from "https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm";

window.gifuct = gifuct;

"use strict";
{
	// DOM Constants
	/** @type {HTMLCanvasElement} */
	const canvas = document.getElementById("canvas"),
		ctx = canvas.getContext("2d", {
			alpha: true,
			desynchronized: true,
			willReadFrequently: true,
		}),
		/** @type {HTMLImageElement} */
		mirror = document.getElementById("mirror"),
		/** @type {HTMLInputElement} */
		captionin = document.getElementById("caption"),
		/** @type {HTMLInputElement} */
		captionColorInput = document.getElementById("caption-color"),
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
		/** @type {HTMLButtonElement} */
		generateBtn = document.getElementById("generate-btn"),
		/** @type {HTMLDivElement} */
		progressContainer = document.getElementById("progress-container"),
		/** @type {HTMLDivElement} */
		progressBar = document.getElementById("progress-bar"),
		/** @type {HTMLSpanElement} */
		progressText = document.getElementById("progress-text");

	const INITIAL_FONT_SIZE = 100; // in pixels
	const GIF_SRC = "./img/spongebob.gif";

	// GIF frame data storage
	let gifFrames = [];
	let gifWidth = 220;
	let gifHeight = 220;
	let gifLoaded = false;

	// Initialize canvas dimensions
	canvas.width = gifWidth;
	canvas.height = gifHeight;
	ctx.lineJoin = "round";
	ctx.textBaseline = "top";
	ctx.imageSmoothingQuality = "high";
	ctx.textRendering = "optimizeLegibility";
	ctx.textAlign = "center";
	ctx.strokeStyle = "black";
	ctx.fillStyle = "white";

	/**
	 * Parse a GIF and extract all frames
	 * Uses gifuct-js library (loaded via CDN)
	 */
	async function parseGIF(url) {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		
		// Use gifuct-js to parse the GIF
		const gif = window.gifuct.parseGIF(arrayBuffer);
		const frames = window.gifuct.decompressFrames(gif, true);
		
		if (frames.length > 0) {
			gifWidth = gif.lsd.width;
			gifHeight = gif.lsd.height;
			canvas.width = gifWidth;
			canvas.height = gifHeight;
		}
		
		return frames;
	}

	/**
	 * Convert gifuct frame to ImageData
	 */
	function frameToImageData(frame) {
		const imageData = new ImageData(
			new Uint8ClampedArray(frame.patch),
			frame.dims.width,
			frame.dims.height
		);
		return imageData;
	}

	/**
	 * Draw a frame onto a temporary canvas and return as ImageBitmap
	 */
	async function renderFrame(frame, previousCanvas) {
		const tempCanvas = previousCanvas || document.createElement("canvas");
		tempCanvas.width = gifWidth;
		tempCanvas.height = gifHeight;
		const tempCtx = tempCanvas.getContext("2d");
		
		// Handle disposal method
		if (frame.disposalType === 2) {
			// Restore to background
			tempCtx.clearRect(0, 0, gifWidth, gifHeight);
		}
		
		// Draw the frame patch at its position
		const imageData = frameToImageData(frame);
		const patchCanvas = document.createElement("canvas");
		patchCanvas.width = frame.dims.width;
		patchCanvas.height = frame.dims.height;
		const patchCtx = patchCanvas.getContext("2d");
		patchCtx.putImageData(imageData, 0, 0);
		
		tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
		
		return tempCanvas;
	}

	/**
	 * Load and parse the GIF
	 */
	async function loadGIF() {
		try {
			progressContainer.hidden = false;
			progressText.textContent = "Loading GIF...";
			progressBar.style.width = "10%";
			
			gifFrames = await parseGIF(GIF_SRC);
			gifLoaded = true;
			
			progressBar.style.width = "100%";
			progressText.textContent = "GIF loaded!";
			
			setTimeout(() => {
				progressContainer.hidden = true;
				progressBar.style.width = "0%";
			}, 500);
			
			console.log(`Loaded ${gifFrames.length} frames from GIF`);
		} catch (error) {
			console.error("Error loading GIF:", error);
			progressText.textContent = "Error loading GIF";
		}
	}

	// Load GIF on page load
	loadGIF();

	/**
	 * @param {string} str
	 */
	function getTextWidth(str) {
		return ctx.measureText(str).width;
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
		const MAX_LINE_BOX_WIDTH = Math.min(480, gifWidth - 10); // in pixels
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
		 * @param {number} fontSize The font size
		 * @param {number} boxWidth The max width of the region
		 * @returns {(word: string) => boolean} A procedure to determine if a word will fit.
		 */
		function fitIntoLinesAtSize(fontSize, boxWidth) {
			const maxNumberOfLines = ~~(INITIAL_FONT_SIZE / fontSize);

			return (/** @type {string} */ word) => {
				const modifiedLine = linesByWord.at(-1).concat(word).join(" ").trim();

				// checks if adding new word exceeds the last line's box width
				if (getTextWidth(modifiedLine) > boxWidth) {
					// check if a single word is too big to fit
					if (getTextWidth(word) > boxWidth) {
						return false;
					}

					// create a new line
					linesByWord.push([word]);
					// return if we have exceeded the maximum allowed lines
					return linesByWord.length <= maxNumberOfLines;
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

		let numberOfLines = 0;

		// Binary search through font size range
		while (lowerFontSize !== upperFontSize) {
			const currentFontSize = ~~((upperFontSize + lowerFontSize) / 2);
			const formattedAllWords = tryFormatAllWords(currentFontSize, MAX_LINE_BOX_WIDTH);

			if (formattedAllWords) {
				lowerFontSize = currentFontSize + 1;
				numberOfLines = linesByWord.length;
			} else {
				upperFontSize = currentFontSize;
			}
		}

		const finalFontSize = lowerFontSize - 1;

		// check that text is a readable size
		if (finalFontSize < MIN_FONT_SIZE) {
			return null;
		}

		// Setup max width range
		let lowerBoxWidth = MIN_LINE_BOX_WIDTH - 1;
		let upperBoxWidth = MAX_LINE_BOX_WIDTH;

		if (numberOfLines > 1) {
			// Binary search through max width range
			while (lowerBoxWidth !== upperBoxWidth) {
				const currentBoxWidth = ~~((upperBoxWidth + lowerBoxWidth) / 2);
				const formattedAllWords = tryFormatAllWords(finalFontSize, currentBoxWidth);

				if (formattedAllWords) {
					upperBoxWidth = currentBoxWidth;
				} else {
					lowerBoxWidth = currentBoxWidth + 1;
				}
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

	/**
	 * Draw text overlay on a canvas context
	 * @param {CanvasRenderingContext2D} targetCtx
	 * @param {CaptionFormat} format
	 * @param {string} color
	 * @param {number} canvasHeight
	 */
	function drawTextOverlay(targetCtx, format, color, canvasHeight) {
		const { lines, fontSize } = format;

		if (lines.length === 0) return;

		const BOTTOM_MARGIN = 4;
		const DEFAULT_LINE_WIDTH = 16;
		const SHRINK_FACTOR = fontSize / INITIAL_FONT_SIZE;
		const centerX = gifWidth / 2;
		const boxBottom = canvasHeight - BOTTOM_MARGIN;

		targetCtx.fillStyle = color;
		targetCtx.font = `bold ${fontSize}px Arial`;
		targetCtx.lineWidth = DEFAULT_LINE_WIDTH * SHRINK_FACTOR;
		targetCtx.lineJoin = "round";
		targetCtx.textBaseline = "top";
		targetCtx.textAlign = "center";
		targetCtx.strokeStyle = "black";

		// draw lines from bottom to top
		let offset = targetCtx.lineWidth / 2;
		for (let i = lines.length - 1; i >= 0; i--) {
			offset -= targetCtx.measureText(lines[i]).actualBoundingBoxDescent + targetCtx.lineWidth;
			targetCtx.strokeText(lines[i], centerX, boxBottom + offset);
			targetCtx.fillText(lines[i], centerX, boxBottom + offset);
		}
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

	/**
	 * Generate a GIF with text overlay
	 */
	async function generateCaptionedGIF() {
		if (!gifLoaded || gifFrames.length === 0) {
			alert("Please wait for the GIF to load.");
			return;
		}

		const text = captionin.value.trim();
		if (!text) {
			// Reset to original GIF
			mirror.src = GIF_SRC;
			saveLink.href = GIF_SRC;
			saveLink.download = "spongebob.gif";
			updateShareButtons();
			return;
		}

		const transformedText = applyCurrentMockTransform(text);
		const format = formatText(transformedText);

		if (format === null) {
			alert("Input text is too large. Please use shorter text.");
			return;
		}

		const color = captionColorInput.value;

		// Show progress
		progressContainer.hidden = false;
		progressText.textContent = "Generating GIF...";
		progressBar.style.width = "0%";
		generateBtn.disabled = true;

		try {
			// Create GIF encoder
			const gif = new GIF({
				workers: 2,
				quality: 10,
				width: gifWidth,
				height: gifHeight,
				workerScript: "./js/gif.worker.js",
			});

			// Process each frame
			let compositeCanvas = document.createElement("canvas");
			compositeCanvas.width = gifWidth;
			compositeCanvas.height = gifHeight;
			let compositeCtx = compositeCanvas.getContext("2d");

			for (let i = 0; i < gifFrames.length; i++) {
				const frame = gifFrames[i];
				
				// Handle disposal
				if (frame.disposalType === 2) {
					compositeCtx.clearRect(0, 0, gifWidth, gifHeight);
				}
				
				// Draw frame patch
				const imageData = frameToImageData(frame);
				const patchCanvas = document.createElement("canvas");
				patchCanvas.width = frame.dims.width;
				patchCanvas.height = frame.dims.height;
				const patchCtx = patchCanvas.getContext("2d");
				patchCtx.putImageData(imageData, 0, 0);
				compositeCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

				// Create a copy for adding text
				const frameCanvas = document.createElement("canvas");
				frameCanvas.width = gifWidth;
				frameCanvas.height = gifHeight;
				const frameCtx = frameCanvas.getContext("2d");
				frameCtx.drawImage(compositeCanvas, 0, 0);

				// Draw text overlay
				drawTextOverlay(frameCtx, format, color, gifHeight);

				// Add frame to GIF
				gif.addFrame(frameCanvas, { delay: frame.delay || 100 });

				// Update progress
				const progress = ((i + 1) / gifFrames.length) * 80;
				progressBar.style.width = `${progress}%`;
				progressText.textContent = `Processing frame ${i + 1}/${gifFrames.length}`;

				// Yield to UI
				await new Promise(resolve => setTimeout(resolve, 0));
			}

			// Render the GIF
			progressText.textContent = "Encoding GIF...";
			progressBar.style.width = "85%";

			gif.on("progress", (p) => {
				progressBar.style.width = `${85 + p * 15}%`;
			});

			gif.on("finished", (blob) => {
				const url = URL.createObjectURL(blob);
				mirror.src = url;
				saveLink.href = url;
				saveLink.download = `${transformedText.substring(0, 30)}.gif`;

				progressBar.style.width = "100%";
				progressText.textContent = "Done!";

				setTimeout(() => {
					progressContainer.hidden = true;
					progressBar.style.width = "0%";
					generateBtn.disabled = false;
				}, 500);

				mockingSpongeBob.drawn = {
					text,
					color,
					mode: mockingSpongeBob.currentMock?.id || "altsl",
					isErrored: false,
				};

				updateShareButtons();
			});

			gif.render();
		} catch (error) {
			console.error("Error generating GIF:", error);
			progressText.textContent = "Error generating GIF";
			generateBtn.disabled = false;
		}
	}

	// Event listeners
	generateBtn.addEventListener("click", generateCaptionedGIF);

	captionin.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			generateCaptionedGIF();
		}
	});

	mockSelector.addEventListener("input", () => {
		if (captionin.value.trim()) {
			generateCaptionedGIF();
		}
	});

	captionColorInput.addEventListener("change", () => {
		if (captionin.value.trim()) {
			generateCaptionedGIF();
		}
	});

	function updateShareButtons() {
		const haveCopyPermissions = !!navigator.clipboard;
		const hasText = captionin.value.trim() !== "";

		copyTextBtn.disabled = !haveCopyPermissions || !hasText;
		copyLinkBtn.disabled = !haveCopyPermissions;
	}

	let copyLinkTimer;
	function copyLink() {
		if (navigator.clipboard) {
			const resultURL = new URL(location.pathname, location.origin);
			const trimmedStr = captionin.value.trim();
			
			if (trimmedStr !== "") {
				resultURL.searchParams.set("mode", mockingSpongeBob.currentMock?.id || "altsl");
				resultURL.searchParams.set("text", mockingSpongeBob.encodeText(trimmedStr));
				resultURL.searchParams.set("color", captionColorInput.value);
			}

			navigator.clipboard.writeText(resultURL.toString()).then(() => {
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

	copyTextBtn.onclick = copyMockText;
	copyLinkBtn.onclick = copyLink;

	// Process URL search params
	const processSearch = (search) => {
		const searchParams = new URLSearchParams(search);
		const encodedText = searchParams.get("text") ?? "";
		const quick_query = searchParams.get("q") ?? "";
		const mode = searchParams.get("mode") ?? "altsl";
		const color = searchParams.get("color") ?? "#ffffff";

		if (mode in mockingSpongeBob.mockTypes) {
			const mockType = mockingSpongeBob.mockTypes[mode];
			if (mockType) {
				mockType.htmlOption.selected = true;
				mockingSpongeBob.currentMock = mockType;
			}

			captionColorInput.value = color;

			if (encodedText || quick_query) {
				const decodedText = quick_query || mockingSpongeBob.decodeText(encodedText);
				captionin.value = decodedText;
				
				// Wait for GIF to load, then generate
				const waitForGIF = setInterval(() => {
					if (gifLoaded) {
						clearInterval(waitForGIF);
						generateCaptionedGIF();
					}
				}, 100);
			}
		}
	};

	// Initialize
	updateShareButtons();
	
	if (location.search) {
		processSearch(location.search);
	} else {
		captionin.focus();
	}
}

