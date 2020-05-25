(() => {
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
		document.body.classList.remove("preload");

		// const searchParams = Object.assign(
		// 	{},
		// 	...location.search
		// 		.slice(1)
		// 		.split("&")
		// 		.map((param) => param.split("="))
		// 		.map((arr) => ({ [arr[0]]: arr[1] }))
		// );

		// Check searchParams for modified behavior
		// (None implemented yet)
		processHashV2(location.hash);
	});

	window.addEventListener("hashchange", () => {
		let currentPosition = input.selectionStart;
		processHashV2(location.hash);
		input.selectionEnd = currentPosition;
	});

	input.addEventListener("input", (event) => {
		cameraStop();
		imagein.value = "";
		mathin.value = "";
		const newHash = hashify(event.currentTarget.value.trim());
		if (location.hash !== newHash)
			location.replace(
				`${location.origin}${location.pathname}#mockType:${mockingSpongebob.currentMock.id}:${newHash}`
			);
	});

	input.onkeydown = (event) => {
		if (event.keyCode == 13) {
			event.preventDefault();
		}
	};

	mockSelector.addEventListener("input", (event) => {
		const newHash = hashify(input.value.trim());
		location.replace(
			`${location.origin}${location.pathname}#mockType:${event.currentTarget.value}:${newHash}`
		);
	});

	/**
	 *
	 * @param {String} str
	 */
	function formatText(str) {
		const INITIAL_FONT_SIZE = 100; // in pixels
		const MIN_FONT_SIZE = 8;
		const MAX_LINE_WIDTH = 480; // in pixels

		if (str.trim() === "") {
			return {
				lines: [],
				size: INITIAL_FONT_SIZE,
			};
		}

		const words = str.split(" ");
		const result = [[]];

		let fontSize = INITIAL_FONT_SIZE;

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
					ctx.measureText([...result[curLine], word].join(" ")).width >=
					MAX_LINE_WIDTH
					// checks if adding new word exceeds max line length
				) {
					if (ctx.measureText(word).width >= MAX_LINE_WIDTH) {
						// check if a single word is too big
						fontSize -= 1;
						return true;
					} else {
						if (fontSize * (curLine + 2) < INITIAL_FONT_SIZE) {
							// check whether to add new line instead of shrinking font
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
			const errorSize = 59;
			ctx.font = `bold ${errorSize}px Arial`;
			ctx.fillStyle = "red";
			return {
				tooLarge: true,
				lines: ["Input is too large"],
				size: errorSize,
			};
		} else {
			ctx.fillStyle = "white";
			return {
				lines: result.map((line) => line.join(" ")),
				size: fontSize,
			};
		}
	}

	function drawMemeText(str) {
		let xloc = canvas.width / 2;

		str = altText(str);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);

		let format = formatText(str);
		let lines = format.lines;
		let size = format.size;

		const lineWidthShrinkFactor = 9;
		ctx.lineWidth = size / lineWidthShrinkFactor;

		const bottomMargin = 4;

		yloc =
			img.height - // start at bottom of canvas
			(lines.length - 1) * size - // account for the number of lines to move up
			ctx.lineWidth / 2 - // account for the outer border thickness
			ctx.measureText(lines[lines.length - 1]).actualBoundingBoxDescent - // align bottom of bounding boxes
			bottomMargin; // create a bottom margin

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
		for (i = 0; i < modes.length; i++) {
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
		location.replace(`${location.origin}${location.pathname}#`);
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
		for (i = 0; i < modes.length; i++) {
			if (modes[i].checked) {
				document.getElementById(modes[i].value).style.display = "inline-block";
				if (document.getElementById(modes[i].value).id === "captionControls") {
					document.getElementById("caption").focus();
				} else {
					document.getElementById(modes[i].value).focus();
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
