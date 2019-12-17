function pickFile() {
  document.getElementById("filePicker").click()
}

function fileSelectedHandler(files) {
  if (!files || !files.length) {
    console.error("No file selected.");
    return;
  }
  main(files[0]);
}

function dragOverHandler(event) {
  event.preventDefault();
}

function dropHandler(event) {
  event.preventDefault();

  // reject if no file
  if (!(event.dataTransfer.items || event.dataTransfer.files) ||
    !(event.dataTransfer.items.length || event.dataTransfer.files.length)) {
    console.error("No file selected.");
    return;
  }

  // reject if multiple files
  if (event.dataTransfer.items.length > 1 || event.dataTransfer.files > 1) {
    console.error("Only one file can be send.");
    return;
  }

  // retrieve the file
  let file = null;
  if (event.dataTransfer.files && event.dataTransfer.files.length)
    file = event.dataTransfer.files[0];
  if (!file && event.dataTransfer.items) {
    // If dropped items aren't files, reject them
    if (event.dataTransfer.items[0].kind !== 'file') {
      console.error("Not a file.");
      return;
    }
    file = event.dataTransfer.items[0].getAsFile();
  }

  // check a file is present
  if (!file) {
    console.error("No file selected.");
    return;
  }

  main(file);
}

function init() {
  let settings = JSON.parse(localStorage.getItem("settings"))

  if (!settings) {
    // use default values
    saveSettings()
    settings = JSON.parse(localStorage.getItem("settings"))
  }

  // set settings panel to match
  document.getElementById("tastes").value = settings.userProfile.tastes.join(",")
  document.getElementById("language").value = settings.userProfile.language
  document.getElementById("expertiseLevel").value = settings.userProfile.expertiseLevel
  document.getElementById("endpoint").value = settings.endpoint
}

function saveSettings() {
  const tastes = document.getElementById("tastes").value.split(",")
    .filter(taste => taste) // remove null values and empty strings
  const language = document.getElementById("language").value
  const expertiseLevel = document.getElementById("expertiseLevel").value
  const endpoint = document.getElementById("endpoint").value

  const settings = {
    endpoint,
    userProfile: {
      id: 42,
      language,
      tastes,
      expertiseLevel
    },
    location: {
      lat: 43.7228,
      lng: 10.4017
    }
  }

  localStorage.setItem("settings", JSON.stringify(settings))
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

function post(b64image) {
  const settings = JSON.parse(localStorage.getItem("settings"))
  const body = {
    userProfile: settings.userProfile,
    location: settings.location,
    image: b64image
  }

  return fetch(settings.endpoint, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(res => res.json())
}

function main(file = null) {
  console.log("Uploading file " + file.name);

  const image = file || document.getElementById("image").files[0]
  const container = document.getElementById("container")

  toBase64(image)
    .then(b64 => post(b64))
    .then(response => {
      console.log(response)
      container.innerText = response.tailoredText
      container.style.background = "none"
    })
    .catch(ex => console.error(ex))
}