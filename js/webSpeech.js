"use strict";
(async () => {
	const caption = document.getElementById("caption"),
		captionLabel = document.getElementById("captionLabel");

	const languages = {
			"en-US": "english",
			ru: "russian",
			es: "spanish",
			fr: "french",
			de: "german",
			it: "italian",
			la: "latin",
			zh: "chinese",
			ja: "japanese",
			he: "hebrew",
			ar: "arabic",
			tr: "turkish",
		},
		languageLabel = document.createElement("label");

	setAttributes(languageLabel, {
		id: "language-label",
		for: "language-selector",
		title: "Change microphone audio language",
	});
	languageLabel.innerText = "Select Language: ";

	/**
	 * @param {string} str
	 * @returns {string}
	 */
	function capitalizeStr(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	/**
	 *
	 * @param {HTMLElement} el
	 * @param {Object} attrs
	 */
	function setAttributes(el, attrs) {
		Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
	}

	/**
	 * @return {HTMLOptionElement[]}
	 */
	function getLanguageSelectorOptions() {
		return Object.keys(languages).map((key) => {
			const option = document.createElement("option");
			setAttributes(option, {
				id: `lang-${key}`,
				value: key,
			});
			option.textContent = capitalizeStr(languages[key]);
			return option;
		});
	}

	const supportsMicrophone =
		(await navigator.mediaDevices?.enumerateDevices?.()).filter(
			(device) => device.kind === "audioinput"
		).length > 0;

	/** @type {SpeechRecognition} */
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

	if (supportsMicrophone && SpeechRecognition) {
		// create necessary elements
		const microphoneOffBtn = document.createElement("button"),
			microphoneOnBtn = document.createElement("button"),
			microphoneOffImg = document.createElement("img"),
			microphoneOnImg = document.createElement("img"),
			languageSelector = document.createElement("select");

		// setup recognition service
		/** @type {SpeechRecognition} */
		const recognition = new SpeechRecognition();
		recognition.lang = "en-US";
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.maxAlternatives = 1;
		mockingSpongeBob.recognition = recognition;

		recognition.addEventListener("audiostart", () => {
			mockingSpongeBob.cameraStop();
			microphoneOffBtn.insertAdjacentElement("afterend", microphoneOnBtn);
			microphoneOffBtn.remove();
			languageSelector.disabled = true;
		});

		recognition.addEventListener("audioend", () => {
			microphoneOnBtn.insertAdjacentElement("afterend", microphoneOffBtn);
			microphoneOnBtn.remove();
			languageSelector.disabled = false;
		});

		recognition.addEventListener("error", (/** @type {SpeechSynthesisErrorEvent} */ event) => {
			console.error(event);
			recognition.abort();

			if (event.error === "service-not-allowed") {
				microphoneOffBtn.remove();
				microphoneOnBtn.remove();
				languageLabel.remove();
			}
		});

		recognition.addEventListener("speechend", () => recognition.stop());

		recognition.addEventListener("result", (/** @type {SpeechRecognitionEvent} */ event) => {
			caption.value = Array.from(event.results)
				.map((result) => capitalizeStr(result[0].transcript.trim()))
				.join(". ");
			caption.dispatchEvent(new CustomEvent("audioinput"));
		});

		// setup element attributes
		setAttributes(microphoneOffBtn, {
			class: "icon-btn",
			type: "button",
			title: "Start using microphone",
		});

		setAttributes(microphoneOnBtn, {
			class: "icon-btn",
			type: "button",
			title: "Stop using microphone",
		});

		setAttributes(microphoneOffImg, {
			id: "microphone--off",
			loading: "lazy",
			class: "icon microphone",
			src: "./img/microphoneOff.png",
			alt: "microphone toggle: off",
			onContextMenu: "return false;",
			draggable: "false",
			width: "30px",
			height: "30px",
		});

		setAttributes(microphoneOnImg, {
			id: "microphone--on",
			loading: "lazy",
			class: "icon microphone",
			src: "./img/microphoneOn.png",
			alt: "microphone toggle: recording",
			onContextMenu: "return false;",
			draggable: "false",
			width: "30px",
			height: "30px",
		});

		setAttributes(languageSelector, {
			id: "language-selector",
			name: "languages",
			title: "List of languages",
		});

		// setup element events
		microphoneOffBtn.onclick = () => recognition.start();
		microphoneOnBtn.onclick = () => recognition.stop();
		languageSelector.oninput = (event) => {
			recognition.lang = event.currentTarget.value;
		};

		// update DOM
		microphoneOffBtn.appendChild(microphoneOffImg);
		microphoneOnBtn.appendChild(microphoneOnImg);
		captionLabel.insertAdjacentElement("beforeend", microphoneOffBtn);
		languageSelector.append(...getLanguageSelectorOptions());
		languageLabel.appendChild(languageSelector);
		document.body.insertAdjacentElement("beforeend", languageLabel);
	}
})();
