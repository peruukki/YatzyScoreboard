import $ from 'jquery';
import Rx from 'rx-lite';
import _ from 'lodash';

const COLUMN_HEADERS = [ 'Name', 'Name', 'Name', 'Name' ];

const UPPER_SECTION_INPUTS = [
  Input('Ones', [1], 1, 5), Input('Twos', [2], 2, 10), Input('Threes', [3], 3, 15),
  Input('Fours', [4], 4, 20), Input('Fives', [5], 5, 25), Input('Sixes', [6], 6, 30)
];
const UPPER_SECTION_TOTAL_LABEL = 'Total';

const LOWER_SECTION_INPUTS = [
  Input('Pair', [6, 6], 2, 12), Input('Two pairs', [6, 6, 5, 5], 2, 24),
  Input('Three of a kind', [6, 6, 6], 3, 18), Input('Four of a kind', [6, 6, 6, 6], 4, 24),
  Input('Five of a kind', [6, 6, 6, 6, 6], 5, 30),
  Input('Small straight', [1, 2, 3, 4, 5], 15, 15), Input('Large straight', [2, 3, 4, 5, 6], 20, 20),
  Input('Full house', [6, 6, 6, 5, 5], 1, 30), Input('Chance', [6, 6, 5, 4, 3], 1, 30),
  Input('Yatzy', [6, 6, 6, 6, 6], 5, 80)
];
const LOWER_SECTION_TOTAL_LABEL = 'TOTAL';


$(document).ready(() => {
  addTableRows('#upper-section', COLUMN_HEADERS, UPPER_SECTION_INPUTS, UPPER_SECTION_TOTAL_LABEL);
  addTableRows('#lower-section', COLUMN_HEADERS, LOWER_SECTION_INPUTS, LOWER_SECTION_TOTAL_LABEL);

  observePlayerNameInput();
  const scoreObservables = observeScoreInput();
  observeScoreDifferences(scoreObservables[0], scoreObservables[1]);

  observeElementsHiddenAfterTransition();

  addResetButtons('#lower-section', COLUMN_HEADERS.length / 2);
});


function Input(label, dice, step, max) {
  return { label: label, dice: dice, step: step, max: max };
}

function RowScoreChange(score1, score2) {
  return { score1: score1, score2: score2 };
}


function addTableRows(tableSelector, columnHeaders, rowHeaders, totalLabel) {
  addColumnHeaderRow(`${tableSelector} thead`, columnHeaders);
  addBodyRows(`${tableSelector} tbody`, columnHeaders, rowHeaders, totalLabel);
}

function addColumnHeaderRow(tableHeadElement, columnHeaders) {
  $(tableHeadElement).append($('<tr>')
    .append('<th>')
    .append(columnHeaders.map((header, index) =>
      `<th class="player-${index % 2 + 1}"><input type="text" class="player" placeholder="${header}"></input></th>`
    )));
}

function addBodyRows(tableBodyElement, columnHeaders, rowHeaders, totalLabel) {
  // Score input cells
  rowHeaders.forEach(header => {
    const input = `<input type="number" min="0" max="${header.max}" step="${header.step}" class="score"></input>`;
    const score1Diff = '<span class="score-diff player-1"></span>';
    const score2Diff = '<span class="score-diff player-2"></span>';
    const scoreCells = [ score1Diff + input, input + score2Diff ];
    const dice = header.dice.map(die =>
      `<img class="die" title="${header.label}" src=svg/${die}.svg></img>`
    ).join('');

    $(tableBodyElement).append($('<tr>')
      .append(`<th class="description"><div>${header.label}</div>${dice}</th>`)
      .append(columnHeaders.map((columnHeader, index) =>
        `<td class="game-${Math.floor(index / 2 + 1)} player-${index % 2 + 1}">${scoreCells[index % 2]}</td>`
      )));
  });

  // Total cells
  const totalScoreInput = '<input type="number" min="0" class="total" readonly></input>';
  const totalScore1Diff = '<span class="score-diff player-1"></span>';
  const totalScore2Diff = '<span class="score-diff player-2"></span>';
  const totalScoreCells = [ totalScore1Diff + totalScoreInput, totalScoreInput + totalScore2Diff ];

  $(tableBodyElement).append($('<tr class="total">')
    .append(`<th>${totalLabel}</th>`)
    .append(columnHeaders.map((columnHeader, index) =>
      `<td class="player-${index % 2 + 1}">${totalScoreCells[index % 2]}</td>`
    )));
}


function observePlayerNameInput() {
  COLUMN_HEADERS.forEach((header, index) => {
    const upperSectionElement = $('#upper-section thead input')[index];
    const lowerSectionElement = $('#lower-section thead input')[index];

    bindNameData(upperSectionElement, lowerSectionElement);
    bindNameData(lowerSectionElement, upperSectionElement);
  });
}

function bindNameData(sourceElement, targetElement) {
  Rx.Observable.fromEvent(sourceElement, 'keyup')
    .map(e => e.target.value)
    .distinctUntilChanged()
    .subscribe(text => {
      targetElement.value = text;
    });
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
  const inputsByColumn = _($(`${tableSelector} input.score`).get())
    .groupBy((value, index) => index % COLUMN_HEADERS.length)
    .valueOf();
  const inputObservablesByColumn = COLUMN_HEADERS.map((header, columnIndex) =>
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
  return Rx.Observable.just(0)
    .merge(Rx.Observable.fromEvent($(inputElement), 'input')
      .map(e => +e.target.value || 0)
      .distinctUntilChanged());
}


function observeScoreDifferences(upperSectionObservables, lowerSectionObservables) {
  bindRowScoreData('#upper-section', upperSectionObservables);
  bindRowScoreData('#lower-section', lowerSectionObservables);
}

function bindRowScoreData(tableSelector, scoreObservables) {
  $(`${tableSelector} tbody tr`).each((rowIndex, rowElement) => {
    const scoreObservablePairs = _(scoreObservables).groupBy((value, index) => Math.floor(index / 2))
      .toArray().valueOf();
    scoreObservablePairs.forEach((scoreObservablePair, pairIndex) => {
      const rowScoreChangeObservable = Rx.Observable.combineLatest(
        scoreObservablePair[0][rowIndex],
        scoreObservablePair[1][rowIndex],
        (score1, score2) => RowScoreChange(score1, score2)
      );

      const score1MinusScore2 = (change) => change.score1 - change.score2;
      const score2MinusScore1 = (change) => change.score2 - change.score1;
      const isScore1Bigger = (change) => score1MinusScore2(change) > 0;
      const isScore2Bigger = (change) => score2MinusScore1(change) > 0;
      const not = (comparisonFunc) => (change) => !comparisonFunc(change);

      // Show score difference next to bigger score cell
      rowScoreChangeObservable.filter(isScore1Bigger)
        .subscribe(showScoreDifference(rowElement, '.score-diff.player-1', pairIndex, score1MinusScore2));
      rowScoreChangeObservable.filter(isScore2Bigger)
        .subscribe(showScoreDifference(rowElement, '.score-diff.player-2', pairIndex, score2MinusScore1));

      // Hide score difference cell next to score cell that is smaller or equal to the other one
      rowScoreChangeObservable.filter(not(isScore1Bigger))
        .subscribe(hideScoreDifference(rowElement, '.score-diff.player-1', pairIndex));
      rowScoreChangeObservable.filter(not(isScore2Bigger))
        .subscribe(hideScoreDifference(rowElement, '.score-diff.player-2', pairIndex));
    });
  });
}

function showScoreDifference(rowElement, diffElementSelector, diffElementIndex, scoreDiffCalculator) {
  return (change) => {
    $(rowElement).find(diffElementSelector).slice(diffElementIndex, diffElementIndex + 1)
      .addClass('visible')
      .html(`+${scoreDiffCalculator(change)}`);
  };
}

function hideScoreDifference(rowElement, diffElementSelector, diffElementIndex) {
  return () => {
    $(rowElement).find(diffElementSelector).slice(diffElementIndex, diffElementIndex + 1)
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


function addResetButtons(tableSelector, buttonCount) {
  // Add buttons
  const buttonCells = _(buttonCount).times(() =>
    '<td class="reset" colspan="2"><a class="button no-select" title="Reset scores for this game">Reset</a></td>'
  ).valueOf();
  $(`${tableSelector} tbody`).append($('<tr>')
    .append('<th>')
    .append(buttonCells));

  // Add click event handlers to clear score inputs
  $(`${tableSelector} td.reset .button`).each((index, element) => {
    Rx.Observable.fromEvent(element, 'click')
      .subscribe(() => {
        $(`td.game-${index + 1} input.score`).val('')
          .trigger('input');
      });
  });
}
