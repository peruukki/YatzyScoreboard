import $ from 'jquery';
import Rx from 'rx-lite';
import _ from 'lodash';
import Mustache from 'mustache';

import store from './store';

const GAME_COUNT = 2;
const PLAYER_COUNT = 2;

const UPPER_SECTION_INPUTS = [
  Input('Ones', [1], 1, 5), Input('Twos', [2], 2, 10), Input('Threes', [3], 3, 15),
  Input('Fours', [4], 4, 20), Input('Fives', [5], 5, 25), Input('Sixes', [6], 6, 30)
];

const LOWER_SECTION_INPUTS = [
  Input('Pair', [6, 6], 2, 12), Input('Two pairs', [6, 6, 5, 5], 2, 24),
  Input('Three of a kind', [6, 6, 6], 3, 18), Input('Four of a kind', [6, 6, 6, 6], 4, 24),
  Input('Five of a kind', [6, 6, 6, 6, 6], 5, 30),
  Input('Small straight', [1, 2, 3, 4, 5], 15, 15), Input('Large straight', [2, 3, 4, 5, 6], 20, 20),
  Input('Full house', [6, 6, 6, 5, 5], 1, 30), Input('Chance', [6, 6, 5, 4, 3], 1, 30),
  Input('Yatzy', [6, 6, 6, 6, 6], 5, 80)
];

createScoreboard(addEventListeners);

function createScoreboard(onReady) {
  $.get('templates/section.mustache', template => {
    createSection(template, '#upper-section', 'upper', UPPER_SECTION_INPUTS);
    createSection(template, '#lower-section', 'lower', LOWER_SECTION_INPUTS);
    onReady();
  });
}

function addEventListeners() {
  observePlayerNameInput();

  const [upperSectionScores$, lowerSectionScores$] = observeScoreInput();
  observeScoreDifferences(upperSectionScores$, lowerSectionScores$);

  observeElementsHiddenAfterTransition();

  addResetButtons('#lower-section', GAME_COUNT);

  storeScores(upperSectionScores$, lowerSectionScores$);
}

function Input(label, dice, step, max) {
  return { label, dice, step, max };
}

function RowScoreChange(score1, score2) {
  return { score1, score2 };
}

function createSection(template, tableSelector, sectionName, rows) {
  const gameRange = _.range(1, GAME_COUNT + 1);
  const playerRange = _.range(1, PLAYER_COUNT + 1);

  const games = gameRange.map(gameIndex => ({
    gameIndex,
    playerNames: playerRange.map(playerIndex =>
      ({ name: store.readName(gameIndex, playerIndex), playerIndex })),
    scores: rows.map((row, rowIndex) => ({
      player1: store.readScore(sectionName, gameIndex, 1, rowIndex + 1),
      player2: store.readScore(sectionName, gameIndex, 2, rowIndex + 1)
    }))
  }));
  const labels = rows;

  const context = { games, labels };
  $(tableSelector).html(Mustache.render(template, context));
}


function observePlayerNameInput() {
  _.range(GAME_COUNT).forEach(gameIndex => {
    _.range(PLAYER_COUNT).forEach(playerIndex => {
      const inputIndex = gameIndex * PLAYER_COUNT + playerIndex;

      const upperSectionElement = $('#upper-section .game-header input')[inputIndex];
      const lowerSectionElement = $('#lower-section .game-header input')[inputIndex];

      const upperSectionName$ = name$(upperSectionElement);
      const lowerSectionName$ = name$(lowerSectionElement);

      // Sync name inputs
      upperSectionName$.subscribe(name => { lowerSectionElement.value = name; });
      lowerSectionName$.subscribe(name => { upperSectionElement.value = name; });

      // Store names to local storage
      upperSectionName$.subscribe(name => store.storeName(name, gameIndex + 1, playerIndex + 1));
      lowerSectionName$.subscribe(name => store.storeName(name, gameIndex + 1, playerIndex + 1));
    });
  });
}

function name$(inputElement) {
  return Rx.Observable.fromEvent(inputElement, 'keyup')
    .map(e => e.target.value)
    .distinctUntilChanged();
}

function observeScoreInput() {
  const upperSectionObservables = bindScoreData('#upper-section');
  const lowerSectionObservables = bindScoreData('#lower-section', upperSectionObservables.scoreTotalObservables);

  return [ upperSectionObservables, lowerSectionObservables ].map(observables =>
    mergeObservablesByColumn(observables.scoreInputObservables, observables.scoreTotalObservables)
  );
}

function bindScoreData(tableSelector, externalObservableByColumn) {
  const observablesFromTable = getInputObservablesByTableColumn(tableSelector);
  const allObservablesByColumn = mergeObservablesByColumn(observablesFromTable, externalObservableByColumn);

  const totalObservablesByColumn = allObservablesByColumn.map(observables =>
    Rx.Observable.combineLatest(observables, (...args) =>
      _(args).reduce((sum, value) => sum + value).valueOf()
    )
  );
  bindTotalData(tableSelector, totalObservablesByColumn);

  return { scoreInputObservables: observablesFromTable, scoreTotalObservables: totalObservablesByColumn };
}

function bindTotalData(tableSelector, totalObservablesByColumn) {
  totalObservablesByColumn.forEach((observable, index) => {
    observable.subscribe(total => {
      $(`${tableSelector} input.total`)[index].value = total;
    });
  });
}

function getInputObservablesByTableColumn(tableSelector) {
  const columnCount = GAME_COUNT * PLAYER_COUNT;
  const gameColumns$ = $(`${tableSelector} .game-column`);
  const inputsByColumn = gameColumns$.map((columnIndex, column) =>
    _($(column).find('input.score').get())
      .groupBy((value, index) => (columnIndex * PLAYER_COUNT) + (index % PLAYER_COUNT))
      .toArray()
      .valueOf()
  ).get();
  const inputObservablesByColumn = _.range(columnCount).map(columnIndex =>
    inputsByColumn[columnIndex].map(createObservableForNumberInputField)
  );
  return inputObservablesByColumn;
}

function mergeObservablesByColumn(observables, extraObservableByColumn) {
  if (extraObservableByColumn && extraObservableByColumn.length > 0) {
    return observables.map((columnObservables, columnIndex) =>
      columnObservables.concat([extraObservableByColumn[columnIndex]])
    );
  } else {
    return observables;
  }
}

function createObservableForNumberInputField(inputElement) {
  return Rx.Observable.just(+$(inputElement).val() || 0)
    .merge(Rx.Observable.fromEvent($(inputElement), 'input')
      .map(e => +e.target.value || 0)
      .distinctUntilChanged());
}


function observeScoreDifferences(upperSectionObservables, lowerSectionObservables) {
  bindRowScoreData('#upper-section', upperSectionObservables);
  bindRowScoreData('#lower-section', lowerSectionObservables);
}

function bindRowScoreData(tableSelector, scoreObservables) {
  $(`${tableSelector} .game-column`).each((gameIndex, gameColumn) => {
    $(gameColumn).find('.score-container').each((rowIndex, rowElement) => {
      const rowScoreChangeObservable = Rx.Observable.combineLatest(
        scoreObservables[gameIndex * PLAYER_COUNT][rowIndex],
        scoreObservables[gameIndex * PLAYER_COUNT + 1][rowIndex],
        (score1, score2) => RowScoreChange(score1, score2)
      );

      const score1MinusScore2 = (change) => change.score1 - change.score2;
      const score2MinusScore1 = (change) => change.score2 - change.score1;
      const isScore1Bigger = (change) => score1MinusScore2(change) > 0;
      const isScore2Bigger = (change) => score2MinusScore1(change) > 0;
      const not = (comparisonFunc) => (change) => !comparisonFunc(change);

      // Show score difference next to bigger score cell
      rowScoreChangeObservable.filter(isScore1Bigger)
        .subscribe(showScoreDifference(rowElement, '.score-diff.player-1', score1MinusScore2));
      rowScoreChangeObservable.filter(isScore2Bigger)
        .subscribe(showScoreDifference(rowElement, '.score-diff.player-2', score2MinusScore1));

      // Hide score difference cell next to score cell that is smaller or equal to the other one
      rowScoreChangeObservable.filter(not(isScore1Bigger))
        .subscribe(hideScoreDifference(rowElement, '.score-diff.player-1'));
      rowScoreChangeObservable.filter(not(isScore2Bigger))
        .subscribe(hideScoreDifference(rowElement, '.score-diff.player-2'));
    });
  });
}

function showScoreDifference(rowElement, diffElementSelector, scoreDiffCalculator) {
  return (change) => {
    $(rowElement).find(diffElementSelector)
      .addClass('visible')
      .html(`+${scoreDiffCalculator(change)}`);
  };
}

function hideScoreDifference(rowElement, diffElementSelector) {
  return () => {
    $(rowElement).find(diffElementSelector)
      .removeClass('visible');
  };
}


function observeElementsHiddenAfterTransition() {
  $('.score-diff').each((index, element) => {
    Rx.Observable.fromEvent(element, 'transitionend')
      .filter(e => e.propertyName === 'opacity')
      .filter(e => !$(e.target).hasClass('visible'))
      .subscribe(e => { $(e.target).html(''); });
  });
}


function addResetButtons(tableSelector) {
  // Add buttons
  $(`${tableSelector} .game-column`)
    .append('<a class="button reset no-select" title="Reset scores for this game">Reset</a>');

  // Add click event handlers to clear name and score inputs
  $(`${tableSelector} .button.reset`).each((index, element) => {
    Rx.Observable.fromEvent(element, 'click')
      .subscribe(() => {
        $(`.game-${index + 1} input.score`).val('')
          .trigger('input');
        $(`.game-${index + 1}.player`).val('');

        // For some reason triggering any event doesn't call the event listener,
        // so need to clear names manually from local storage
        _.range(1, PLAYER_COUNT + 1).forEach(playerIndex => {
          store.storeName('', index + 1, playerIndex);
        });
      });
  });
}


function storeScores(upperSectionScores$, lowerSectionScores$) {
  storeSectionScores(upperSectionScores$, 'upper');
  storeSectionScores(lowerSectionScores$, 'lower');
}

function storeSectionScores(sectionScores$, sectionName) {
  sectionScores$.forEach((columnScores$, columnIndex) => {
    // Drop total score row, it's calculated from other values
    _.dropRight(columnScores$).forEach((score$, rowIndex) => {
      score$.subscribe(score => {
        const gameIndex = Math.floor(columnIndex / PLAYER_COUNT) + 1;
        const playerIndex = columnIndex % PLAYER_COUNT + 1;
        store.storeScore(sectionName, score, gameIndex, playerIndex, rowIndex + 1);
      });
    });
  });
}
