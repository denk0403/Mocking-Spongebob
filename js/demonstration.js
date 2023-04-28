"use strict";
{
	/** @type {HTMLInputElement} */
	const captionin = document.getElementById("caption"),
		/** @type {HTMLInputElement} */
		captionRadio = document.getElementById("captionRadio"),
		/** @type {HTMLCanvasElement} */
		canvas = document.getElementById("canvas");

	const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut eleifend libero, vel placerat tortor. Sed eget odio a lectus dapibus ornare vel sed felis. Aliquam lobortis, nibh tristique fermentum egestas, elit anteiaculis nibh, quis condimentum lorem lacus non lorem. Maecenas ut libero quis lorem facilisis dignissim. Aenean vitae massa varius, aliquam tellus vel, imperdiet dolor. Morbi cursus lectus id tempor egestas. Aliquamauctor hendrerit nibh, nec congue massa viverra eget. Vestibulum risus nulla, ullamcorper nec ultriciessit amet, rhoncus vellibero. Duis posuere auctor egestas. Aliquam eleifend nunc id mi dictum fringilla. Aenean quis magna nec nulla aliquet pharetra. Aenean at felis a antecondimentum maximus. Pellentesque egestas est vitae rutrum ultricies. Ut vehicula nisi a ipsum viverra viverra. Phasellus orci velit, ultrices ut magnain, cursus dapibus nulla. Phasellus at commodo lorem. Suspendisse porta nisl porttitor interdum tincidunt. Aliquam odio diam, malesuada eget porta vel, facilisis vel neque. Nam congue, arcuat pellentesque sollicitudin, eroslectus rutrum est, vel auctor erat leo sed justo. Mauris ac purus mi. Vestibulum vitae nunc velit. Nullam auctor velit a lacus elementum pharetra. Integerfinibus et est ut varius. Proin a orci vitae nisl lacinia luctus. Aenean at molestie enim.`;

	class Demo {
		/** @type {number?} */
		#timer = null;

		/**
		 * @param {string} str
		 * @returns {string[]}
		 */
		#getSegments(str) {
			if (!("Segmenter" in Intl)) return [...str];
			return Array.from(new Intl.Segmenter().segment(str)).map(({ segment }) => segment);
		}

		#wait(delayInMs) {
			return new Promise((res) => setTimeout(res, delayInMs));
		}

		/**
		 * @param {string[]} segments
		 * @param {number} delay
		 * @param {() => any} callback
		 * @returns {number?}
		 */
		#typeWithDelay(segments, delay, callback) {
			if (segments.length === 0) {
				callback && callback();
				return null;
			}

			let index = 0;
			this.#timer = setInterval(() => {
				captionin.value += segments[index++];
				captionin.dispatchEvent(new CustomEvent("demoinput"));

				if (index >= segments.length) {
					this.stopTimer();
					// queue callback after mirror has the chance to rerender
					callback && mockingSpongeBob.nextRepaint().then(callback);
				}
			}, delay);

			return this.#timer;
		}

		LoremIpsumText = TEXT;

		isRunning = () => !!timer;

		stopTimer = () => {
			clearInterval(this.#timer);
			this.#timer = null;
		};

		time = (str) => {
			this.stopTimer();
			str = str?.trim() ?? "";

			captionRadio.click();
			captionin.value = str;

			let start = performance.now();
			captionin.dispatchEvent(new CustomEvent("demoinput"));
			mockingSpongeBob.nextRepaint().then(() => console.log(performance.now() - start));
		};

		timeType = (str) => {
			this.stopTimer();
			str = str?.trim() ?? "";

			const segments = this.#getSegments(str);
			captionRadio.click();

			const start = performance.now();
			captionin.value = "";
			captionin.dispatchEvent(new CustomEvent("demoinput"));

			return this.#typeWithDelay(segments, 0, () =>
				console.log("Time:", performance.now() - start)
			);
		};

		/**
		 *
		 * @param {string} str
		 * @param {number} time
		 * @param {() => any} callback A callback to execute once the function is
		 * @returns {number?}
		 */
		typeEach = (str, time, callback) => {
			this.stopTimer();
			str = str?.trim() ?? "";
			time ??= 0;

			const segments = this.#getSegments(str);

			captionRadio.click();
			captionin.value = "";
			captionin.dispatchEvent(new CustomEvent("demoinput"));

			return this.#typeWithDelay(segments, time, callback);
		};

		typeIn = (str, time, callback) => {
			this.stopTimer();
			str = str?.trim() ?? "";
			time ??= 0;

			const segments = this.#getSegments(str);

			captionRadio.click();
			captionin.value = "";
			captionin.dispatchEvent(new CustomEvent("demoinput"));

			return this.#typeWithDelay(segments, time / segments.length, callback);
		};

		error = () => {
			this.stopTimer();

			captionRadio.click();
			captionin.value = "؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁";
			captionin.dispatchEvent(new CustomEvent("demoinput"));
		};

		createVideo = (str, time) => {
			this.stopTimer();
			str = str?.trim() ?? "";
			time ??= 0;

			const canvasStream = canvas.captureStream(60);
			const streamBlobChunks = [];

			const mediaRecorder = new MediaRecorder(canvasStream, {
				mimeType: "video/webm; codecs=vp9",
			});

			const requestRecordingEnd = () => {
				canvasStream.getVideoTracks()[0].requestFrame();
				mediaRecorder.stop();
			};

			const typeOneAtATime = async () => {
				captionin.value = "";

				const segments = this.#getSegments(str);
				if (segments.length === 0) return requestRecordingEnd();

				const waitTime = time / segments.length;
				let index = 0;
				while (index < segments.length) {
					captionin.value += segments[index++];
					captionin.dispatchEvent(new CustomEvent("demoinput"));

					const abortController = new AbortController();
					if (index < segments.length) {
						await Promise.any([
							mockingSpongeBob.nextRepaint(abortController.signal),
							this.#wait(waitTime).then(() => abortController.abort()),
						]);
					} else {
						await mockingSpongeBob.nextRepaint().then(() => this.#wait(250));
					}
				}

				requestRecordingEnd();
			};

			mediaRecorder.onstart = () => typeOneAtATime();

			mediaRecorder.ondataavailable = (evt) => {
				streamBlobChunks.push(evt.data);
			};

			mediaRecorder.onstop = () => {
				const videoBlob = new Blob(streamBlobChunks, { type: "video/webm" });
				const videoURL = URL.createObjectURL(videoBlob);

				const a = document.createElement("a");
				a.href = videoURL;
				a.download = `${str.trim()}.webm`;

				a.click();
				URL.revokeObjectURL(videoURL);
			};

			captionin.value = "";
			mockingSpongeBob.resetTemplate();
			mediaRecorder.start();
		};

		timeTypeLoremIpsumText = () => this.timeType(TEXT);
	}

	mockingSpongeBob.demo = new Demo();
}
