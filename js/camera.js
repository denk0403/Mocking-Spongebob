"use strict";
{
	const cameraApp = document.querySelector("#cameraApp"),
		/** @type {HTMLVideoElement} */
		cameraView = document.querySelector("#camera--view"),
		/** @type {HTMLCanvasElement} */
		cameraSensor = document.querySelector("#camera--sensor"),
		cameraTrigger = document.querySelector("#camera--trigger"),
		cameraToggle = document.querySelector("#camera--toggle"),
		cameraFlip = document.querySelector("#camera--flip"),
		upload = document.querySelector("#upload"),
		imagein = document.querySelector("#imagein"),
		mathin = document.querySelector("#mathin"),
		input = document.querySelector("#caption"),
		mirror = document.querySelector("#mirror");

	const constraints = { video: { facingMode: "front" }, audio: false };

	let track;

	const cameraStop = (mockingSpongebob.cameraStop = () => {
		cameraApp.style.display = "none";
		if (track) {
			track.stop();
			track = undefined;

			mirror.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	});

	if (
		navigator.mediaDevices &&
		navigator.mediaDevices.enumerateDevices &&
		navigator.mediaDevices.getUserMedia
	) {
		navigator.mediaDevices.enumerateDevices().then((devices) => {
			if (devices.filter((device) => device.kind === "videoinput").length) {
				cameraToggle.style.display = "inline";

				function cameraStart(callback) {
					if (navigator.mediaDevices.getUserMedia) {
						navigator.mediaDevices
							.getUserMedia(constraints)
							.then(function (stream) {
								track = stream.getTracks()[0];
								cameraView.srcObject = stream;
								console.log(stream, track.getConstraints())
							})
							.then(callback)
							.catch(function (error) {
								console.error("Oops. Something went wrong.", error);
							});
					}
				}

				function flipCamera() {
					let callback;
					if (constraints.video.facingMode === "front") {
						constraints.video.facingMode = "environment";
						callback = () => (cameraView.style.scale = "1 1");
					} else {
						constraints.video.facingMode = "front";
						callback = () => (cameraView.style.scale = "-1 1");
					}
					cameraFlip.classList.add("disabled");
					cameraTrigger.classList.add("disabled");
					cameraStart(callback);
				}

				cameraView.addEventListener("loadeddata", () => {
					cameraApp.style.display = "inline-block";
					cameraFlip.classList.remove("disabled");
					cameraTrigger.classList.remove("disabled");
					cameraView.scrollIntoView({
						behavior: "smooth",
						block: "center",
					});
				});

				cameraToggle.onclick = function () {
					if (cameraApp.style.display != "none") {
						cameraStop();
					} else {
						cameraStart();
					}
				};

				cameraFlip.onclick = function () {
					cameraFlip.disabled = true;
					flipCamera();
				};

				cameraTrigger.onclick = function () {
					const scrollParams = [window.scrollX, window.scrollY];
					const width = cameraView.videoWidth;
					const height = cameraView.videoHeight;
					cameraSensor.width = width;
					cameraSensor.height = height;

					const ctx = cameraSensor.getContext("2d");

					if (constraints.video.facingMode === "front") {
						ctx.save();
						ctx.scale(-1, 1);
						ctx.drawImage(cameraView, 0, 0, -width, height);
						ctx.restore();
					} else {
						ctx.drawImage(cameraView, 0, 0);
					}

					upload.src = cameraSensor.toDataURL("image/jpeg");
					input.value = "";
					imagein.value = "";
					mathin.value = "";
					window.scroll(...scrollParams);
				};
			}
		});
	}
}
