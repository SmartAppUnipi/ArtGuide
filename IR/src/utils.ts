import fetch from "node-fetch"

function post<T>(url: string, body: any): Promise<T> {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json());
}

export {
  post
}