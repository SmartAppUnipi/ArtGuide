# ArtGuide

### Prerequisites

In order to run this project you will need:
- Node.js
  - [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
- Typescript > 3.7
  - `npm install -g typescript`
- *JavaScript and TypeScript Nightly* Visual Studio Code extension installed. 
  - [https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)
  - To make sure you are using the latest version of *typescript*:
    - Open a TypeScript file in VS Code.
    - In the VS Code command palette (press F1), run the *TypeScript: Select TypeScript version* command.
    - Make sure you have *Use VS Code's version* selected


### How to run
```bash
npm i               # install dependencies
npm start           # start the server in watch mode
```

### Available commands
```bash
npm i               # install dependencies
npm start           # start the server in watch mode

npm run build       # compiles src/*.ts in dist/*.js
npm run watch       # automatically compiles ts when the file is saved

npm t               # run unit tests
npm run test:watch  # run tests in watch mode
npm run test:cov    # run coverage report

npm run docs        # generate the documentation in /docs
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