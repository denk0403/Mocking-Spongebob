let cameraStop;
(() => {
  const cameraView = document.querySelector("#camera--view"),
    cameraFrame = document.querySelector("#camera--frame"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger"),
    cameraToggle = document.querySelector("#camera--toggle"),
    cameraFlip = document.querySelector("#camera--flip"),
    upload = document.querySelector("#upload"),
    input = document.querySelector("#caption");

  const constraints = { video: { facingMode: "front" }, audio: false };

  let track;

  if (navigator.mediaDevices.getUserMedia) {
    cameraToggle.style.display = "inline";
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      if (devices.filter((device) => device.kind === "videoinput").length > 1) {
        cameraFlip.style.display = "inline";
      }
    });
  }

  function cameraStart() {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          track = stream.getTracks()[0];
          cameraView.srcObject = stream;
        })
        .catch(function (error) {
          console.error("Oops. Something went wrong.", error);
        });
    }
  }

  function flipCamera() {
    if (constraints.video.facingMode === "front") {
      constraints.video.facingMode = "environment";
    } else {
      constraints.video.facingMode = "front";
    }
    cameraFlip.classList.add("disabled");
    cameraStart();
  }

  cameraStop = function () {
    cameraFrame.style.display = "none";
    if (track) {
      track.stop();
      track = undefined;
    }
  };

  cameraView.addEventListener("loadeddata", () => {
    cameraFrame.style.display = "initial";
    cameraFlip.classList.remove("disabled");
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
    location.replace(`${location.origin}${location.pathname}#`);
  };
})();
