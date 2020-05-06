(() => {
	const canvas = document.getElementById("output"),
		ctx = canvas.getContext("2d"),
		img = document.getElementById("meme"),
		mirror = document.getElementById("mirror"),
		input = document.getElementById("caption"),
		imagein = document.getElementById("imagein"),
		upload = document.getElementById("upload"),
		reader = new FileReader();

	document.getElementById("title").onclick = () => {
		location.replace(`${location.origin}${location.pathname}`);
	};

	let processHashV2 = (hash) => {
		if (hash) {
			input.value = hash
				.slice(1)
				.split(":")
				.map((char) => String.fromCodePoint(parseInt(char, 16)))
				.join("");
			drawMemeText(input.value);
			repaint();
		} else {
			location.replace(`${location.origin}${location.pathname}#`);
			drawMemeText("");
			repaint();
		}
	};

	let hashify = (str) => {
		return [...str].map((char) => char.codePointAt(0).toString(16)).join(":");
	};

	window.onload = () => {
		const searchParams = Object.assign(
			{},
			...location.search
				.slice(1)
				.split("&")
				.map((param) => param.split("="))
				.map((arr) => ({ [arr[0]]: arr[1] }))
		);

		// Check searchParams for modified behavior
		// (None implemented yet)
		processHashV2(location.hash);
	};

	window.onhashchange = () => {
		processHashV2(location.hash);
	};

	input.oninput = (event) => {
		cameraStop();
		imagein.value = "";
		location.replace(
			`${location.origin}${location.pathname}#${hashify(
				event.currentTarget.value.trim()
			)}`
		);
	};

	input.onkeydown = (event) => {
		if (event.keyCode == 13) {
			event.preventDefault();
		}
	};

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

	function altText(str) {
		let result = "";
		let lower = true;
		for (let c of str) {
			result += lower ? c.toLowerCase() : c.toUpperCase();
			if (c.match(/[a-z]/i)) lower = !lower;
		}
		return result;
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
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		let newHeight = 105;
		let scale = newHeight / upload.height;
		let newWidth = upload.width * scale;
		ctx.drawImage(
			upload,
			250 - newWidth / 2,
			canvas.height - 5 - newHeight,
			newWidth,
			newHeight
		);
	}

	function repaint() {
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
				} else {
					document.getElementById("cpy-text-btn").disabled = true;
					document.getElementById("cpy-link-btn").disabled = true;
				}
			}
		}

		document.getElementById("sv-link").href = mirror.src;
		document.getElementById("sv-link").download = `${
			input.value ? altText(input.value) : "img"
		}.png`;
	}

	imagein.onchange = (event) => {
		input.value = "";
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
		var modes = document.getElementsByName("mode");

		for (i = 0; i < modes.length; i++) {
			if (modes[i].checked) {
				document.getElementById(modes[i].value).style.display = "initial";
			} else {
				document.getElementById(modes[i].value).style.display = "none";
			}
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
			navigator.clipboard.writeText(`${location.href}`);
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

	document.getElementById("imageinRadio").onclick = updateMode;
	document.getElementById("captionRadio").onclick = updateMode;
	document.getElementById("cpy-text-btn").onclick = copyMockText;
	document.getElementById("cpy-link-btn").onclick = copyLink;
	document.getElementById("sv-btn").onclick = save;
})();
