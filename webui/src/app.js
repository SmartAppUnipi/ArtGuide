
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

function buildJson(image, language = "en", expertiseLevel = 1, tastes = []) {
  return {
    location: {
      lat: 43.7228,
      lng: 10.4017
    },
    userProfile: {
      id: 42,
      tastes: tastes,
      language: language,
      expertiseLevel: expertiseLevel
    },
    image: image
  }
}

function post(json, endpoint) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(json)
  }).then(res => res.json())
}

function main() {
  const image = document.getElementById("image").files[0]
  const tastes = document.getElementById("tastes").value.split(",")
  const language = document.getElementById("language").value
  const expertiseLevel = document.getElementById("expertiseLevel").value
  const endpoint = document.getElementById("endpoint").value
  const response = document.getElementById("response")

  response.innerText = "loading..."

  toBase64(image)
    .then(b64 => buildJson(b64, language, expertiseLevel, tastes))
    .then(json => post(json, endpoint))
    .then(json => {
      console.log(json)
      response.innerText = json.tailoredText
    })
    .catch(ex => {
      console.error(ex)
      response.innerText = "Error. Check the console."
    })
}