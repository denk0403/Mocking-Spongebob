"use strict";
(() => {
	// DOM Constants
	const canvas = document.getElementById("output"),
		ctx = canvas.getContext("2d"),
		img = document.getElementById("meme"),
		mirror = document.getElementById("mirror"),
		input = document.getElementById("caption"),
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
	// ctx.miterLimit = 2;
	ctx.textBaseline = "bottom";
	ctx.imageSmoothingQuality = "high";
	ctx.textAlign = "center";
	ctx.strokeStyle = "black";
	ctx.fillStyle = "white";

	title.onclick = () => {
		location.replace(
			`${location.origin}${location.pathname}#mockType:${mockingSpongebob.currentMock.id}:`
		);
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
		repaint();
		//
	};

	let processHashV2 = (hash = "") => {
		if (hash) {
			if (hash.startsWith("#math")) {
				// math.js will handle behavior
			} else if (hash.startsWith("#image")) {
				imageinRadio.click();
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
								repaint();
							} catch (err) {
								title.click();
							}
						} else {
							location.replace(
								`${location.origin}${location.pathname}#mockType:${mockType.id}:`
							);
						}
					} else {
						location.replace(
							`${location.origin}${location.pathname}#mockType:asl:${hash.slice(
								hash.indexOf(":", 10) + 1
							)}`
						);
					}
				} else {
					location.replace(
						`${location.origin}${location.pathname}#mockType:asl:${hash.slice(
							1
						)}`
					);
				}
			}
		} else {
			location.replace(
				`${location.origin}${location.pathname}#mockType:${mockingSpongebob.currentMock.id}:`
			);
			drawMemeText("");
			repaint();
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

	window.addEventListener("hashchange", () => {
		let currentPosition = input.selectionStart;
		processHashV2(location.hash);
		input.selectionEnd = currentPosition;
	});

	input.addEventListener("input", (event) => {
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
		const newHash = hashify(event.currentTarget.value.trim());
		if (location.hash !== newHash) {
			location.replace(
				`${location.origin}${location.pathname}#mockType:${mockingSpongebob.currentMock.id}:${newHash}`
			);
		}
	});

	input.onkeydown = (event) => {
		if (event.keyCode === 13) {
			event.preventDefault();
		}
	};

	mockSelector.addEventListener("input", (event) => {
		const newHash = hashify(input.value.trim());
		location.replace(
			`${location.origin}${location.pathname}#mockType:${event.currentTarget.value}:${newHash}`
		);
	});

	function formatText(str = "") {
		const MIN_FONT_SIZE = 8;

		if (str.trim() === "") {
			return {
				lines: [],
				size: INITIAL_FONT_SIZE,
			};
		}

		// Set-up font
		let fontSize = INITIAL_FONT_SIZE;

		// Line box width helper
		// function maxBoxWidthFor(curLine) {
		// 	const PADDING_SCALE = 2 / 3;
		// 	const MAX_POSSIBLE_WIDTH_CHANGE = -Math.max(
		// 		fontSize * PADDING_SCALE,
		// 		MIN_FONT_SIZE
		// 	);
		// 	return MAX_LINE_BOX_WIDTH + MAX_POSSIBLE_WIDTH_CHANGE * (curLine % 2);
		// }

		const words = str.split(" ");
		const result = [];

		let formattedAllWords = false;
		while (!formattedAllWords && fontSize >= MIN_FONT_SIZE) {
			// Apply new font-size if neccessary
			ctx.font = `bold ${fontSize}px Arial`;

			// set up result array of lines
			result.length = 0;
			result.push([]);
			let curLine = 0;

			formattedAllWords = !words.some((word) => {
				// returns true if a word cannot fit (font-size or line count need to change)
				if (
					ctx.measureText(result[curLine].concat([word]).join(" ")).width >=
					MAX_LINE_BOX_WIDTH
					// checks if adding new word exceeds the line's box width
				) {
					if (ctx.measureText(word).width >= MAX_LINE_BOX_WIDTH) {
						// check if a single word is too big
						fontSize -= 1;
						return true;
					} else {
						if (
							// is there enough veretical room for a new line
							fontSize * (curLine + 2) <
							INITIAL_FONT_SIZE
						) {
							curLine += 1;
							result.push([word]);
						} else {
							fontSize -= 1;
							return true;
						}
					}
				} else {
					// add the word if it fits just fine
					result[curLine].push(word);
				}
			});
		}

		// check for unreadable text
		if (fontSize < MIN_FONT_SIZE) {
			const ERROR_SIZE = 59;
			ctx.font = `bold ${ERROR_SIZE}px Arial`;
			ctx.fillStyle = "red";
			return {
				lines: ["Input is too large"],
				fontSize: ERROR_SIZE,
			};
		} else {
			fontSize = optimizeSize(result, fontSize);
			ctx.fillStyle = "white";
			return {
				lines: result.map((line) => line.join(" ").trim()),
				fontSize,
			};
		}
	}

	/**
	 * Optimizes result array and returns best font-size
	 * @param {[[""]]} result
	 * @param {number} fontSize
	 */
	function optimizeSize(result, fontSize) {
		for (let lineIndex = result.length - 1; lineIndex >= 1; lineIndex--) {
			const line2Index = lineIndex - 1;
			const getLine1Text = () => result[lineIndex].join(" ");

			while (
				ctx.measureText(`${result[line2Index].slice(-1)[0]} ${getLine1Text()}`)
					.width <
				ctx.measureText(result[line2Index].slice(0, -1).join(" ")).width
			) {
				result[lineIndex].unshift(result[line2Index].pop());
			}
		}
		return tryToIncreaseFont(result, fontSize);
	}

	/**
	 * Tries to increase the font-size as much as possible
	 * @param {[[""]]} result
	 * @param {number} fontSize
	 */
	function tryToIncreaseFont(result, fontSize) {
		const tryOneIncrease = () => {
			const newSize = fontSize + 1;
			ctx.font = `bold ${newSize}px Arial`;
			if (
				result.every(
					(line) => ctx.measureText(line.join(" ")).width < MAX_LINE_BOX_WIDTH
				) &&
				result.length * newSize < INITIAL_FONT_SIZE
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

	function drawMemeText(str) {
		const xloc = canvas.width / 2;

		str = altText(str);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);

		const format = formatText(str);
		const lines = format.lines;
		const size = format.fontSize;

		const LINE_WIDTH_SHRINK_FACTOR = 9;
		ctx.lineWidth = size / LINE_WIDTH_SHRINK_FACTOR;

		const BOTTOM_MARGIN = 4;

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

	upload.onload = (event) => {
		if (
			upload.src !== `${location.origin}/img/transparent.png` &&
			upload.src !==
				`${location.origin}/Mocking-Spongebob/img/transparent.png` &&
			!location.hash.startsWith("#math:")
		) {
			location.replace(`${location.origin}${location.pathname}#image`);
		}
		drawMemeImage();
		repaint();
	};

	function drawMemeImage() {
		const MAX_HEIGHT = 105;
		const MAX_WIDTH = 450;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		let scale = Math.min(MAX_WIDTH / upload.width, MAX_HEIGHT / upload.height);
		let newWidth = upload.width * scale;
		let newHeight = upload.height * scale;
		ctx.drawImage(
			upload,
			250 - newWidth / 2,
			canvas.height - 5 - newHeight,
			newWidth,
			newHeight
		);
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
			ctx.clearRect(0, 0, canvas.width, canvas.height);
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
		if (document.execCommand) {
			let temp = document.createElement("textarea");
			temp.value = location.href;
			document.body.appendChild(temp);
			temp.select();
			document.execCommand("copy");
			document.body.removeChild(temp);
		} else {
			navigator.clipboard && navigator.clipboard.writeText(`${location.href}`);
		}
	}

	function copyMockText() {
		if (document.execCommand) {
			let temp = document.createElement("textarea");
			temp.value = altText(input.value);
			document.body.appendChild(temp);
			temp.select();
			document.execCommand("copy");
			document.body.removeChild(temp);
		} else {
			navigator.clipboard.writeText(`${location.href}`);
		}
	}

	function save() {
		document.getElementById("sv-link").click();
	}

	imageinRadio.onclick = updateMode;
	captionRadio.onclick = updateMode;
	mathinRadio.onclick = updateMode;
	document.getElementById("cpy-text-btn").onclick = copyMockText;
	document.getElementById("cpy-link-btn").onclick = copyLink;
	document.getElementById("sv-btn").onclick = save;
})();
