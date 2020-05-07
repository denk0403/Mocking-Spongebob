(() => {
	const cameraView = document.querySelector("#camera--view"),
		cameraFrame = document.querySelector("#camera--frame"),
		cameraSensor = document.querySelector("#camera--sensor"),
		cameraTrigger = document.querySelector("#camera--trigger"),
		cameraToggle = document.querySelector("#camera--toggle"),
		cameraFlip = document.querySelector("#camera--flip"),
		upload = document.querySelector("#upload"),
		imagein = document.querySelector("#imagein"),
		mathin = document.querySelector("#mathin"),
		input = document.querySelector("#caption");

	const constraints = { video: { facingMode: "front" }, audio: false };

	let track;

	let cameraStop;
	cameraStop = mockingSpongebob.cameraStop = () => {
		cameraFrame.style.display = "none";
		if (track) {
			track.stop();
			track = undefined;
		}
	};

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
						callback = () => (cameraView.style.transform = "scaleX(1)");
					} else {
						constraints.video.facingMode = "front";
						callback = () => (cameraView.style.transform = "scaleX(-1)");
					}
					cameraFlip.classList.add("disabled");
					cameraTrigger.classList.add("disabled");
					cameraStart(callback);
				}

				cameraView.addEventListener("loadeddata", () => {
					cameraFrame.style.display = "initial";
					cameraFlip.classList.remove("disabled");
					cameraTrigger.classList.remove("disabled");
				});

				cameraToggle.onclick = function () {
					if (cameraFrame.style.display != "none") {
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
					cameraSensor.width = cameraView.videoWidth;
					cameraSensor.height = cameraView.videoHeight;
					cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
					upload.src = cameraSensor.toDataURL("image/webp");
					input.value = "";
					imagein.value = "";
					mathin.value = "";
					location.replace(`${location.origin}${location.pathname}#`);
				};
			}
		});
	}
})();
