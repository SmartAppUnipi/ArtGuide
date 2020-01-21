<script>
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  const submit = d => dispatch("data", d);

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  function uploadFromGallery() {
    console.log("Picked from gallery")
    const image = document.getElementById("image").files[0];
    toBase64(image).then(data => submit(data))
  }

  onMount(() => {
    const camera = document.getElementById("camera");
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const photo = document.getElementById("photo");
    const startbutton = document.getElementById("startbutton");

    // scale the video to max width
    let width = 0;
    let height = 0; // will be computed later
    let streaming = false;
    video.addEventListener(
      "canplay",
      function(ev) {
        if (!streaming) {
          width = document.body.clientWidth;
          height = video.videoHeight / (video.videoWidth / width);

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

    // take the picture on button click
    startbutton.addEventListener(
      "click",
      function(ev) {
        // draw current video frame in the canvas
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(video, 0, 0, width, height);
        // set as image src the canvas data
        const data = canvas.toDataURL("image/png");
        photo.setAttribute("src", data);
        submit(data);
        // show the photo and hide the camera
        photo.style.display = "block";
        camera.style.display = "none";
        ev.preventDefault();
      },
      false
    );
  });
</script>

<style>
  #camera,
  #video,
  #photo {
    width: 100%;
  }

  #canvas,
  #photo {
    display: none;
  }

  #startbutton {
    display: block;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    bottom: 32px;
    background-color: rgba(0, 150, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0px 0px 1px 2px rgba(0, 0, 0, 0.2);
    font-size: 14px;
    font-family: "Lucida Grande", "Arial", sans-serif;
    color: rgba(255, 255, 255, 1);
  }
</style>

<svelte:head>
  <title>ArtGuide</title>
</svelte:head>

<div id="camera">
  <video id="video">Video stream not available.</video>
  <input type="file" id="image" accept="image/*" on:change={uploadFromGallery} />
  <br />
  <button id="startbutton">Take photo</button>
</div>
<canvas id="canvas" />
<img id="photo" alt="The screen capture will appear in this box." />
