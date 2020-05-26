"use strict";
(() => {
	/**
	 * Timer
	 */
	let timer;

	const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut eleifend libero, vel placerat tortor. Sed eget odio a lectus dapibus ornare vel sed felis. Aliquam lobortis, nibh tristique fermentum egestas, elit anteiaculis nibh, quis condimentum lorem lacus non lorem. Maecenas ut libero quis lorem facilisis dignissim. Aenean vitae massa varius, aliquam tellus vel,imperdiet dolor. Morbi cursus lectus id tempor egestas. Aliquamauctor hendrerit nibh, nec congue massa viverra eget. Vestibulum risus nulla,ullamcorper nec ultriciessit amet, rhoncus vellibero. Duis posuere auctor egestas. Aliquam eleifend nunc id mi dictum fringilla.Aenean quis magna nec nulla aliquet pharetra. Aenean at felis a antecondimentum maximus. Pellentesque egestas est vitae rutrum ultricies. Ut vehicula nisi a ipsum viverra viverra. Phasellus orci velit, ultrices ut magnain, cursus dapibus nulla. Phasellus at commodo lorem. Suspendisse porta nisl porttitor interdum tincidunt. Aliquam odio diam, malesuada eget porta vel,facilisis vel neque. Nam congue, arcuat pellentesque sollicitudin, eroslectus rutrum est, vel auctor erat leo sed justo. Mauris ac purus mi. Vestibulum vitae nunc velit. Nullam auctor velit a lacus elementum pharetra. Integerfinibus et est ut varius. Proin a orci vitae nisl lacinia luctus. Aenean at molestie enim. Suspendisse`;

	const typeEach = (str = "", time = 250) => {
		clearInterval(timer);
		if (time < 200) {
			throw new Error("This may be too fast for your computer");
		}
		document.getElementById("caption").value = "";
		let index = 0;
		return (timer = setInterval(() => {
			if (index < str.length) {
				document.getElementById("caption").focus();
				document.getElementById("caption").value += str.charAt(index++);
				document.getElementById("caption").dispatchEvent(new Event("input"));
			} else {
				clearInterval(timer);
			}
		}, time));
	};

	window.typeEach = typeEach;
	window.typeIn = (str = "", time) => typeEach(str, time && time / str.length);

	window.typeLoremIpsum = () => {
		typeEach(TEXT, 250);
	};

	window.typeLoremIpsumFast = () => {
		clearInterval(timer);
		let str = TEXT;
		document.getElementById("caption").value = "";
		let index = 0;
		return (timer = setInterval(() => {
			if (index < str.length) {
				document.getElementById("caption").focus();
				let addition = str.substring(0, TEXT.length / 1);
				str = str.substring(TEXT.length / 1);
				document.getElementById("caption").value += addition;
				document.getElementById("caption").dispatchEvent(new Event("input"));
			} else {
				clearInterval(timer);
			}
		}, 200));
	};

	window.stopLoremIpsum = () => {
		clearInterval(timer);
	};

	window.mockError = () => {
		clearInterval(timer);
		const input = document.getElementById("caption");
		input.value = "؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁؁";
		input.dispatchEvent(new Event("input"));
	};
})();
