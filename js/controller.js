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
		mockSelector = document.getElementById("mockType-selector");
	(cameraStop = mockingSpongebob.cameraStop), (reader = new FileReader());

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

	function splitUp(str) {
		const maxLength = 20;
		let result = "";

		if (str.length > maxLength) {
			let lineCount = Math.floor(str.length / maxLength) + 1;
			let breakPoint = str.length / lineCount;
			let counter = 0;
			for (let c of str) {
				result += c;
				counter += 1;
				if (counter >= breakPoint && c === " ") {
					result += "\n";
					counter = 0;
				}
			}
		}
		return result || str;
	}

	function getFontSize(str) {
		let lines = str.split("\n");
		let xLength = lines.reduce(
			(prev, cur) => Math.max(prev, cur.length),
			lines[0].length
		);
		return Math.min(Math.floor(75 - 1.5 * xLength), 100 / lines.length);
	}

	function setFont(str) {
		str = splitUp(str);

		let size = getFontSize(str);

		ctx.textAlign = "center";
		ctx.lineWidth = getFontSize(str) / 8;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "white";
		ctx.font = `${size}px Arial`;
		return str;
	}

	function drawMemeText(str) {
		let xloc = canvas.width / 2;

		str = altText(str);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		str = setFont(str);

		let lines = str.split("\n");
		let lineheight = getFontSize(str);

		yloc = img.height - (lines.length - 1) * lineheight - 20;

		for (let i = 0; i < lines.length; i++) {
			ctx.strokeText(lines[i], xloc, yloc + i * lineheight);
			ctx.fillText(lines[i], xloc, yloc + i * lineheight);
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
