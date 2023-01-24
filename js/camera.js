"use strict";
(async () => {
	const cameraApp = document.getElementById("cameraApp"),
		/** @type {HTMLVideoElement} */
		cameraView = document.getElementById("camera--view"),
		/** @type {HTMLCanvasElement} */
		cameraSensor = document.getElementById("camera--sensor"),
		/** @type {HTMLButtonElement} */
		cameraTrigger = document.getElementById("camera--trigger"),
		/** @type {HTMLButtonElement} */
		cameraToggle = document.getElementById("camera--toggle"),
		/** @type {HTMLImageElement} */
		cameraToggleImg = document.getElementById("camera--toggle-img"),
		/** @type {HTMLButtonElement} */
		cameraFlip = document.getElementById("camera--flip"),
		upload = document.getElementById("upload");

	/** @type {MediaStreamConstraints} */
	const constraints = { video: { facingMode: "user" }, audio: false };
	/** @type {MediaStreamTrack?} */
	let track;

	const cameraStop = () => {
		cameraToggleImg.src = "./img/webp/camera-icon.webp";
		cameraApp.style.display = "none";
		cameraView.pause();
		track?.stop();
		track = undefined;
	};
	mockingSpongeBob.cameraStop = cameraStop;

	if (!navigator.mediaDevices?.enumerateDevices || !navigator.mediaDevices.getUserMedia) return;

	const devices = await navigator.mediaDevices.enumerateDevices();
	const videoDevices = devices.filter((device) => device.kind === "videoinput");

	if (!videoDevices.length) return;

	cameraToggle.style.display = "inline";

	let currentDeviceIndex = 0;
	constraints.video.deviceId = videoDevices[0].deviceId;

	function cameraStart() {
		mockingSpongeBob.stopAsyncProcesses();

		navigator.mediaDevices
			.getUserMedia?.(constraints)
			.then((stream) => {
				cameraToggleImg.src = "./img/webp/camera-icon-active.webp";

				track = stream.getTracks()[0];
				cameraView.srcObject = stream;

				if (constraints.video.facingMode === "user") {
					cameraView.style.scale = "-1 1";
				} else {
					cameraView.style.scale = "1 1";
				}

				return cameraView.play();
			})
			.catch((error) => {
				console.error("Oops. Something went wrong.", error);

				// try next video device
				if (++currentDeviceIndex < videoDevices.length) {
					const newId = videoDevices[currentDeviceIndex].deviceId;
					constraints.video.deviceId = newId;
					console.error("Trying again with", newId);
					cameraStart();
				} else {
					currentDeviceIndex = 0;
					constraints.video.deviceId = videoDevices[0].deviceId;
				}
			});
	}

	function flipCamera() {
		if (constraints.video.facingMode === "user") {
			constraints.video.facingMode = "environment";
		} else {
			constraints.video.facingMode = "user";
		}
		cameraFlip.disabled = true;
		cameraTrigger.disabled = true;
		cameraStart();
		cameraApp.style.display = "inline-block";
	}

	cameraView.addEventListener("loadeddata", () => {
		cameraApp.style.display = "inline-block";
		cameraFlip.disabled = false;
		cameraTrigger.disabled = false;
		cameraView.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	});

	cameraToggle.onclick = () => {
		if (!track) {
			cameraStart();
		} else {
			cameraStop();
		}
	};

	cameraFlip.onclick = flipCamera;

	cameraTrigger.onclick = () => {
		mockingSpongeBob.clearFields();

		const width = cameraView.videoWidth;
		const height = cameraView.videoHeight;
		cameraSensor.width = width;
		cameraSensor.height = height;

		const ctx = cameraSensor.getContext("2d");

		if (constraints.video.facingMode === "user") {
			ctx.save();
			ctx.scale(-1, 1);
			ctx.drawImage(cameraView, 0, 0, -width, height);
			ctx.restore();
		} else {
			ctx.drawImage(cameraView, 0, 0);
		}

		mockingSpongeBob.drawn = { mode: "image", isErrored: false };
		upload.src = cameraSensor.toDataURL("image/jpeg");
	};
})();
