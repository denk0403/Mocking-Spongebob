"use strict";
{
	/** @type {HTMLInputElement} */
	const captionin = document.getElementById("caption"),
		/** @type {HTMLInputElement} */
		captionRadio = document.getElementById("captionRadio"),
		/** @type {HTMLCanvasElement} */
		canvas = document.getElementById("canvas");

	const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut eleifend libero, vel placerat tortor. Sed eget odio a lectus dapibus ornare vel sed felis. Aliquam lobortis, nibh tristique fermentum egestas, elit anteiaculis nibh, quis condimentum lorem lacus non lorem. Maecenas ut libero quis lorem facilisis dignissim. Aenean vitae massa varius, aliquam tellus vel,imperdiet dolor. Morbi cursus lectus id tempor egestas. Aliquamauctor hendrerit nibh, nec congue massa viverra eget. Vestibulum risus nulla,ullamcorper nec ultriciessit amet, rhoncus vellibero. Duis posuere auctor egestas. Aliquam eleifend nunc id mi dictum fringilla.Aenean quis magna nec nulla aliquet pharetra. Aenean at felis a antecondimentum maximus. Pellentesque egestas est vitae rutrum ultricies. Ut vehicula nisi a ipsum viverra viverra. Phasellus orci velit, ultrices ut magnain, cursus dapibus nulla. Phasellus at commodo lorem. Suspendisse porta nisl porttitor interdum tincidunt. Aliquam odio diam, malesuada eget porta vel,facilisis vel neque. Nam congue, arcuat pellentesque sollicitudin, eroslectus rutrum est, vel auctor erat leo sed justo. Mauris ac purus mi. Vestibulum vitae nunc velit. Nullam auctor velit a lacus elementum pharetra. Integerfinibus et est ut varius. Proin a orci vitae nisl lacinia luctus. Aenean at molestie enim.`;

	class Demo {
		#timer = null;

		LoremIpsumText = TEXT;

		isRunning = () => !!timer;

		stopTimer = () => {
			clearInterval(this.#timer);
			this.#timer = null;
		};

		time = (str) => {
			this.stopTimer();
			str ??= "";

			captionRadio.click();
			captionin.value = str;

			let start = performance.now();
			captionin.dispatchEvent(new CustomEvent("demoinput"));
			queueMicrotask(() => console.log(performance.now() - start));
		};

		timeType = (str) => {
			this.stopTimer();
			str ??= "";
			str = str.trim();

			captionRadio.click();
			captionin.value = "";
			captionin.dispatchEvent(new CustomEvent("demoinput"));

			if (!str) return;
			const unicodeCodePoints = [...str];

			let index = 0;
			const start = performance.now();

			if (index >= unicodeCodePoints.length) {
				const end = performance.now();
				console.log("Time:", end - start);
			}

			this.#timer = setInterval(() => {
				captionin.value += unicodeCodePoints[index++];
				captionin.dispatchEvent(new CustomEvent("demoinput"));

				if (index >= unicodeCodePoints.length) {
					const end = performance.now();
					console.log("Time:", end - start);
					this.stopTimer();
				}
			}, 0);

			return this.#timer;
		};

		/**
		 *
		 * @param {string} str
		 * @param {number} time
		 * @param {() => any} callback A callback to execute once the function is
		 * @returns
		 */
		typeEach = (str, time, callback) => {
			this.stopTimer();
			str ??= "";
			str = str.trim();
			time ??= 0;

			captionRadio.click();
			captionin.value = "";
			captionin.dispatchEvent(new CustomEvent("demoinput"));

			if (!str) return;
			const unicodeCodePoints = [...str];

			let index = 0;
			if (index >= unicodeCodePoints.length) {
				return callback?.();
			}

			this.#timer = setInterval(() => {
				captionin.value += unicodeCodePoints[index++];
				captionin.dispatchEvent(new CustomEvent("demoinput"));

				if (index >= unicodeCodePoints.length) {
					this.stopTimer();
					return callback?.();
				}
			}, time);

			return this.#timer;
		};

		typeIn = (str, time, callback) => this.typeEach(str, time / str.length, callback);

		error = () => {
			this.stopTimer();

			captionRadio.click();
			captionin.value = "؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁";
			captionin.dispatchEvent(new CustomEvent("demoinput"));
		};

		createVideo = (str, time) => {
			const canvasStream = canvas.captureStream(60);
			const streamBlobChunks = [];

			const mediaRecorder = new MediaRecorder(canvasStream, {
				mimeType: "video/webm; codecs=vp9",
			});

			mediaRecorder.ondataavailable = (evt) => streamBlobChunks.push(evt.data);

			mediaRecorder.onstop = () => {
				const videoBlob = new Blob(streamBlobChunks, { type: "video/webm" });
				const videoURL = URL.createObjectURL(videoBlob);

				const a = document.createElement("a");
				a.href = videoURL;
				a.download = `${str.trim()}.webm`;

				a.click();
				URL.revokeObjectURL(videoURL);
			};

			mediaRecorder.start();
			this.typeIn(str, time, () => mediaRecorder.stop());
		};

		timeTypeLoremIpsumText = () => this.timeType(TEXT);
	}

	mockingSpongeBob.demo = new Demo();
}
