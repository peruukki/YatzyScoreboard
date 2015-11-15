# Yatzy Scoreboard

Keep track of your [Yatzy](http://en.wikipedia.org/wiki/Yatzy) game scores in the browser.
[Try it.](http://peruukki.github.io/YatzyScoreboard/)

I was running out of Yatzy scoreboard cards again, and making new ones is always a daunting task (I can never get the
lines straight!). So I decided to make a digital one, as it can also count the score totals for you, which is another
time-consuming and error-prone task. It was also a good opportunity to try out
[Reactive Extensions](https://github.com/Reactive-Extensions/RxJS).

## Building

This bundles the JavaScript files to the target file `js/build/app.js` using [Browserify](http://browserify.org/):

```
npm run build
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

## Testing

Lint the JavaScript with [ESLint](http://eslint.org/):

```
npm test
```

## License

MIT
