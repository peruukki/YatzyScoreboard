# Yatzy Scoreboard

Keep track of your [Yatzy](https://en.wikipedia.org/wiki/Yatzy) game scores in the browser.
[Try it.](https://peruukki.github.io/YatzyScoreboard/)

I was running out of Yatzy scoreboard cards again, and making new ones is always a daunting task (I can never get the
lines straight!). So I decided to make a digital one, as it can also count the score totals for you, which is another
time-consuming and error-prone task. It was also a good opportunity to try out
[Reactive Extensions](https://github.com/Reactive-Extensions/RxJS).

## Getting started

This installs the required dependencies, bundles the JavaScript and starts an HTTP server:

```
npm start
```

Then go to `http://localhost:8000` with your browser to see the scoreboard.

## Serving the page locally

Start a local HTTP server serving scoreboard page:

```
npm run server
```

## Building

Bundle the JavaScript files to the target file `js/build/app.js` using [Browserify](http://browserify.org/):

```
npm run build
```

The bundled JavaScript file is included in the repository so that the scoreboard can be served easily on GitHub pages.

## Deploying

Push the current repository to GitHub pages:

```
./deploy.sh
```

## Watching for JavaScript changes and re-building

Bundle a minified JavaScript file on file changes:

```
npm run watch
```

Bundle a non-minified JavaScript file with source maps on file changes:

```
npm run watch-debug
```

## Linting

Lint the JavaScript with [ESLint](https://eslint.org/):

```
npm run lint
```

Watch for JavaScript file changes and lint on change:

```
npm run lint-watch
```

## License

MIT

## Acknowledgements

This project is a grateful recipient of the
[Futurice Open Source sponsorship program](https://futurice.com/blog/sponsoring-free-time-open-source-activities?utm_source=github&utm_medium=spice).
