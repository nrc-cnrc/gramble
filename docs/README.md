# Documentation Website

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm i
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

#### Automatically Using Github Actions

1. Navigate to the Actions tab
   <img width="779" height="429" alt="image" src="https://github.com/user-attachments/assets/6ae0fe8a-5759-4c76-8899-42675c7380df" />

2. Select the "Deploy Docs to Github Pages" Workflow
<img width="779" height="429" alt="image" src="https://github.com/user-attachments/assets/a06ab880-3310-40af-bfa9-5d5cb84dcfdd" />

3. Press the "run workflow" button.
<img width="1918" height="673" alt="image" src="https://github.com/user-attachments/assets/db062c1a-07a3-4730-83eb-9a0ad3c93724" />

4. Once workflow has successfully completed, navigate to [nrc-cnrc.github.io/gramble](https://nrc-cnrc.github.io/gramble/)

#### Using SSH:

```
$ USE_SSH=true npm run deploy
```

#### Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
