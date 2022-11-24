"use strict";
(async () => {
	const caption = document.getElementById("caption");

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
	 *
	 * @param {HTMLSelectElement} selector
	 * @param {(event: InputEvent) => void} optionClickHandler
	 */
	function populateLanguageSelector(selector) {
		Object.keys(languages)
			.map((key) => {
				const option = document.createElement("option");
				setAttributes(option, {
					id: `lang-${key}`,
					value: key,
				});
				option.innerText = capitalizeStr(languages[key]);
				return option;
			})
			.forEach((option) => {
				selector.appendChild(option);
			});
	}

	if (
		navigator.mediaDevices &&
		navigator.mediaDevices.enumerateDevices &&
		(await navigator.mediaDevices.enumerateDevices()).filter(
			(device) => device.kind === "audioinput"
		).length
	) {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			const microphoneOff = document.createElement("img"),
				microphoneOn = document.createElement("img"),
				languageSelector = document.createElement("select");

			let initLanguage = "en-US";

			document.getElementById("captionLabel").insertAdjacentElement("beforeend", microphoneOff);

			setAttributes(languageSelector, {
				id: "language-selector",
				name: "languages",
				title: "List of languages",
			});
			populateLanguageSelector(languageSelector);
			languageSelector.addEventListener("input", (event) => {
				recognition.lang = event.currentTarget.value;
			});
			languageLabel.appendChild(languageSelector);

			document.body.insertAdjacentElement("beforeend", languageLabel);

			if (languages[navigator.language]) {
				document.getElementById(`lang-${navigator.language}`).selected = true;
				initLanguage = navigator.language;
			}

			/** @type {SpeechRecognition} */
			let recognition = new SpeechRecognition();
			recognition.lang = initLanguage;
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.maxAlternatives = 1;

			setAttributes(microphoneOff, {
				id: "microphone--off",
				loading: "lazy",
				class: "icon microphone",
				title: "Listen for speech",
				src: "./img/microphoneOff.png",
				alt: "microphone toggle: off",
				onContextMenu: "return false;",
				draggable: "false",
			});
			microphoneOff.onclick = () => {
				recognition.start();
				microphoneOff.insertAdjacentElement("afterend", microphoneOn);
				microphoneOff.remove();
				languageSelector.disabled = true;
			};

			setAttributes(microphoneOn, {
				id: "microphone--on",
				loading: "lazy",
				class: "icon microphone",
				title: "Stop recording",
				src: "./img/microphoneOn.png",
				alt: "microphone toggle: recording",
				onContextMenu: "return false;",
				draggable: "false",
			});
			microphoneOn.onclick = () => {
				recognition.stop();
				microphoneOn.insertAdjacentElement("afterend", microphoneOff);
				microphoneOn.remove();
				languageSelector.disabled = false;
			};

			recognition.addEventListener("error", (/** @type {SpeechSynthesisErrorEvent} */ event) => {
				recognition.stop();

				if (event.error === "service-not-allowed") {
					microphoneOn.remove();
					languageLabel.remove();
				} else {
					microphoneOn.click();
				}
			});

			recognition.addEventListener("speechend", () => {
				microphoneOn.click();
			});

			recognition.addEventListener("result", (event) => {
				caption.value = Array.from(event.results)
					.map((result) => capitalizeStr(result[0].transcript.trim()))
					.join(". ");
				caption.dispatchEvent(new CustomEvent("audioinput"));
			});
		}
	}
})();
