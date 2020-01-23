<script>
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let width = 0;
  let height = 0;

  // handle data from camera or gallery
  function submit(data) {
    // freeze the camera with the current data
    photo.setAttribute("src", data);
    photo.addEventListener(
      "load",
      () => (picture.style.marginTop = photo.offsetHeight + "px"),
      false
    );
    // show the photo and hide the camera
    photo.style.display = "block";
    camera.style.display = "none";
    // send data to parent component
    dispatch("data", data);
  }

  // encode an image file into a base 64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // handle gallery upload
  function uploadFromGallery() {
    console.log("Picked from gallery");
    const image = document.getElementById("file-picker").files[0];
    toBase64(image).then(data => submit(data));
  }

  function pickFile() {
    document.getElementById("file-picker").click();
  }

  // handle the shot button
  function takePhoto(event) {
    event.preventDefault();
    // draw current video frame in the canvas
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);
    // get base64
    const data = canvas.toDataURL("image/png");
    submit(data);
  }

  onMount(() => {
    const camera = document.getElementById("camera");
    const video = document.getElementById("video");
    const actions = document.getElementById("actions");
    const canvas = document.getElementById("canvas");
    const picture = document.getElementById("picture");
    const photo = document.getElementById("photo");

    // scale the video to max width
    let streaming = false;
    video.addEventListener(
      "canplay",
      function(ev) {
        if (!streaming) {
          width = document.body.clientWidth;
          height = video.videoHeight / (video.videoWidth / width);
          actions.style.marginTop =
            video.offsetHeight - actions.offsetTop - 42 + "px";
          video.setAttribute("width", width);
          video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          streaming = true;
        }
      },
      false
    );

    // get and show the video streaming
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(function(stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function(err) {
        console.error("An error occurred: " + err);
      });
  });
</script>

<style>
  #camera,
  #video,
  #photo {
    width: 100%;
  }

  #video,
  #photo {
    position: absolute;
    top: 0;
    left: 0;
  }

  #canvas,
  #photo {
    display: none;
  }

  #file-picker {
    display: none;
  }

  #camera-button,
  #gallery-button {
    width: 32px;
    height: 32px;
    position: absolute;
    background: #fff;
  }

  #gallery-button {
    left: 10px;
  }

  #camera-button {
    right: 10px;
  }
</style>

<svelte:head>
  <title>ArtGuide</title>
</svelte:head>

<div id="camera">
  <video id="video">Video stream not available.</video>
  <div id="actions">
    <input
      id="file-picker"
      type="file"
      accept="image/*"
      on:change={uploadFromGallery} />
    <input
      id="gallery-button"
      type="image"
      src="gallery.svg"
      alt="Upload from gallery"
      on:click={pickFile} />
    <input
      id="camera-button"
      type="image"
      src="camera.svg"
      alt="Take a photo"
      on:click={takePhoto} />
  </div>
</div>
<canvas id="canvas" />
<div id="picture">
  <img id="photo" alt="The screen capture will appear in this box." />
</div>
