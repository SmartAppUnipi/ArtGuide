# ArtGuide

## How to run

### Manually
Open the file [src/index.html](src/index.html) with your browser.

### Node
```sh
npx serve -l 8000 src
```

### Docker
```sh
# Build
docker build -t art/webui .

# Run
docker run --name webui -p 8000:80 art/webui

# Stop
docker rm -f webui
```