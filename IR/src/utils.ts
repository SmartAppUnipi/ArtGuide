import fetch from "node-fetch"

function post(url: string, body: string) {
  fetch(url, {
    method: 'POST',
    body: body,
    headers: { 'Content-Type': 'application/json' },
  })
  .then(res => res.json()).then(console.log)
}

export {
    post
}