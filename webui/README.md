# Web UI module
This is a [Sapper](https://github.com/sveltejs/sapper) (a [Svelte](https://svelte.dev) framework) app.

Consult [sapper.svelte.dev](https://sapper.svelte.dev) for help getting started.

## Development
```sh
# install development dependencies
npm i

# run development server
npm run dev
```

## Build
```sh
# install development dependencies
npm i

# build the production version
npm run build

# run the server
npm start
```


## Structure

### static
The [static](static) directory contains any static assets that should be available.

### src
The [src](src) directory contains
- the entry points: `client.js`, `server.js`
- the `service-worker.js` (optional)
- the `template.html` file
- the `routes` directory

### src/routes
There are two kinds of routes: *pages*, and *server routes*.

**Pages** are Svelte components written in `.svelte` files.

**Server routes** are modules written in `.js` files, that export functions corresponding to HTTP methods. Each function receives Express `request` and `response` objects as arguments, plus a `next` function. This is useful for creating a JSON API, for example.

There are three simple rules for naming the files that define your routes:
- A file called `src/routes/page.svelte` corresponds to the `/page` route.
- A file called `src/routes/page/[id].svelte` corresponds to the `/page/:id` route, in which case `params.id` is available to the route.
- Files and directories with a leading underscore do *not* create routes. This allows you to colocate helper modules and components with the routes that depend on them — for example you could have a file called `src/routes/_helpers/datetime.js` and it would *not* create a `/_helpers/datetime` route.