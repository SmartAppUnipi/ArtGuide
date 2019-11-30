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
npm t -- filename   # run a specific test file
npm run test:watch  # run tests in watch mode (TDD)
npm run test:cov    # run coverage report
npm tun test:debug  # run tests and attach VS Code debugger

npm run lint        # run linter
npm run lint:fix    # run linter with --fix option

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

### Linter

We are using ESLint as linter together with a plugin to make it work properly with TypeScript. The list of our rules can be found in [eslintrc.js](.eslintrc.js). Whenever we use a rule specified in *typescript-eslint-plugin* we need to disable the original *ESLint* rule and override it with the one provided by the plugin.

Useful links:
    - [Available ESLint rules](https://eslint.org/docs/rules)
    - [Available TypeScript rules](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/docs/rules)