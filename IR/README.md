# ArtGuide


### How to run
```bash
npm i
npm start
```

### Available commands
```bash
npm i       # install dependencies
npm start   # start the server in watch mode

npm run build   # compiles src/*.ts in dist/*.js
npm run watch   # automatically compiles ts when the file is saved

npm t               # run unit tests
npm run test:watch  # run tests in watch mode
npm run test:cov    # run coverage report

npm run docs    # generate the documentation in docs
```

### Docker
```bash
# Build
sudo docker build -t artguide/ir .
# Run
sudo docker run -dit --restart=always --name ir -p 3000:3000 artguide/ir
# Stop
sudo docker stop ir
sudo docker rm ir
```