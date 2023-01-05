"use strict";
(() => {
	/**
	 * Timer
	 */
	let timer;
	const caption = document.getElementById("caption"),
		captionRadio = document.getElementById("captionRadio");

	const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut eleifend libero, vel placerat tortor. Sed eget odio a lectus dapibus ornare vel sed felis. Aliquam lobortis, nibh tristique fermentum egestas, elit anteiaculis nibh, quis condimentum lorem lacus non lorem. Maecenas ut libero quis lorem facilisis dignissim. Aenean vitae massa varius, aliquam tellus vel,imperdiet dolor. Morbi cursus lectus id tempor egestas. Aliquamauctor hendrerit nibh, nec congue massa viverra eget. Vestibulum risus nulla,ullamcorper nec ultriciessit amet, rhoncus vellibero. Duis posuere auctor egestas. Aliquam eleifend nunc id mi dictum fringilla.Aenean quis magna nec nulla aliquet pharetra. Aenean at felis a antecondimentum maximus. Pellentesque egestas est vitae rutrum ultricies. Ut vehicula nisi a ipsum viverra viverra. Phasellus orci velit, ultrices ut magnain, cursus dapibus nulla. Phasellus at commodo lorem. Suspendisse porta nisl porttitor interdum tincidunt. Aliquam odio diam, malesuada eget porta vel,facilisis vel neque. Nam congue, arcuat pellentesque sollicitudin, eroslectus rutrum est, vel auctor erat leo sed justo. Mauris ac purus mi. Vestibulum vitae nunc velit. Nullam auctor velit a lacus elementum pharetra. Integerfinibus et est ut varius. Proin a orci vitae nisl lacinia luctus. Aenean at molestie enim.`;

	window.LoremIpsumText = TEXT;

	window.timeType = (str = "") => {
		clearInterval(timer);

		captionRadio.click();
		caption.value = "";

		let index = 0;
		const start = performance.now();

		timer = setInterval(() => {
			if (index < str.length) {
				caption.value += str.charAt(index++);
				caption.dispatchEvent(new Event("input"));
			} else {
				const end = performance.now();
				console.log("Time:", end - start);
				clearInterval(timer);
				timer = 0;
			}
		}, 0);
		return timer;
	};

	const typeEach = (str = "", time = 250, ignoreWarning = false) => {
		captionRadio.click();
		clearInterval(timer);
		if (!ignoreWarning && time < 200) {
			throw new Error("This may be too fast for your computer");
		}
		caption.value = "";
		let index = 0;
		timer = setInterval(() => {
			if (index < str.length) {
				caption.focus();
				caption.value += str.charAt(index++);
				caption.dispatchEvent(new Event("input"));
			} else {
				clearInterval(timer);
				timer = 0;
			}
		}, time);
		return timer;
	};

	window.typeEach = typeEach;
	window.typeIn = (str = "", time, ignoreWarning = false) =>
		typeEach(str, time && time / str.length, ignoreWarning);

	window.typeLoremIpsum = () => {
		typeEach(TEXT, 250);
	};

	window.typeLoremIpsum_DANGER_PLEASE_USE_CAREFULLY = () => {
		typeEach(TEXT, 0, true);
	};

	window.typeLoremIpsumFast = () => {
		captionRadio.click();
		clearInterval(timer);
		let str = TEXT;
		caption.value = "";
		let index = 0;
		return (timer = setInterval(() => {
			if (index < str.length) {
				caption.focus();
				let addition = str.substring(0, TEXT.length / 50);
				str = str.substring(TEXT.length / 50);
				caption.value += addition;
				caption.dispatchEvent(new Event("input"));
			} else {
				clearInterval(timer);
				timer = 0;
			}
		}, 200));
	};

	window.typeLoremIpsumInstant = () => {
		captionRadio.click();
		clearInterval(timer);
		caption.focus();
		caption.value = TEXT;
		caption.dispatchEvent(new Event("input"));
	};

	window.stopTimer = () => {
		clearInterval(timer);
		timer = 0;
	};

	window.stopLoremIpsum = window.stopTimer;

	window.isRunningTypeTimer = () => {
		return !!timer;
	};

	window.mockError = () => {
		captionRadio.click();
		clearInterval(timer);
		caption.value = "؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁";
		caption.dispatchEvent(new Event("input"));
	};
})();
