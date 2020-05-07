(() => {
	const mathin = document.querySelector("#mathin"),
		upload = document.querySelector("#upload"),
		mathinRadioSpan = document.querySelector("#mathinRadioSpan"),
		mathinRadio = document.querySelector("#mathinRadio"),
		input = document.querySelector("#caption"),
		imagein = document.querySelector("#imagein"),
		title = document.getElementById("title"),
		cameraStop = mockingSpongebob.cameraStop,
		hashify = mockingSpongebob.hashify,
		repaint = mockingSpongebob.repaint,
		xmlSerializer = new XMLSerializer();

	function processMathHash(hash) {
		try {
			mathin.value = hash
				.slice(6) // hash includes '#' when present
				.split(":")
				.map((char) => char && String.fromCodePoint(parseInt(char, 16)))
				.join("");
			drawMathHash(mathin.value);
			repaint();
		} catch (err) {
			console.error("Oops. Something went wrong.", err);
			location.replace(`${location.origin}${location.pathname}#math:`);
		}
	}

	window.addEventListener("load", () => {
		if (window.MathJax && MathJax.tex2svgPromise) {
			if (location.hash === "#math") {
				location.replace(`${location.origin}${location.pathname}#math:`);
			}

			window.addEventListener("hashchange", () => {
				if (location.hash === "#math") {
					location.replace(`${location.origin}${location.pathname}#math:`);
				}
			});

			window.addEventListener("hashchange", () => {
				if (location.hash.startsWith("#math:")) {
					processMathHash(location.hash);
					mathinRadio.click();
				}
			});

			mathin.oninput = (event) => {
				cameraStop();
				input.value = "";
				imagein.value = "";
				location.replace(
					`${location.origin}${location.pathname}#math:${hashify(
						event.currentTarget.value.trim()
					)}`
				);
			};

			mathinRadioSpan.style.display = "inline";
			if (location.hash.startsWith("#math:")) {
				mathinRadio.click();
				processMathHash(location.hash);
			}
		} else {
			window.addEventListener("hashchange", () => {
				if (location.hash.startsWith("#math")) {
					location.replace(`${location.origin}${location.pathname}#`);
				}
			});
			title.click();
		}
	});

	function drawMathHash(str) {
		MathJax.tex2svgPromise(str, { display: false })
			.then((container) => container.getElementsByTagName("svg")[0])
			.then((svg) => {
				function paintWhite(elt) {
					if (elt.style) {
						elt.style.fill = "white";
						elt.style.stroke = "black";
						elt.style.strokeWidth = "20";
					}
					if (elt.children) {
						for (let item of elt.children) {
							paintWhite(item);
						}
					}
				}
				paintWhite(svg);
				upload.src =
					"data:image/svg+xml;base64," +
					window.btoa(xmlSerializer.serializeToString(svg));
			})
			.catch((err) => {
				console.error("Oops. Something went wrong.", err);
			});
	}
})();
