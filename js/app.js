'use strict';

(function () {

  var COLUMN_HEADERS = [ 'Name', 'Name' ];

  var UPPER_SECTION_INPUTS = [
    Input('Ones', 1, 5), Input('Twos', 2, 10), Input('Threes', 3, 15),
    Input('Fours', 4, 20), Input('Fives', 5, 25), Input('Sixes', 6, 30)
  ];
  var UPPER_SECTION_TOTAL_LABEL = 'Total';

  var LOWER_SECTION_INPUTS = [
    Input('Pair', 2, 12), Input('Two pairs', 2, 24),
    Input('Three of a kind', 3, 18), Input('Four of a kind', 4, 24), Input('Five of a kind', 5, 30),
    Input('Small straight', 15, 15), Input('Large straight', 20, 20),
    Input('Full house', 1, 30), Input('Chance', 1, 30), Input('Yatzy', 5, 80)
  ];
  var LOWER_SECTION_TOTAL_LABEL = 'TOTAL';


  $(document).ready(function () {
    addTableRows('#upper-section', COLUMN_HEADERS, UPPER_SECTION_INPUTS, UPPER_SECTION_TOTAL_LABEL);
    addTableRows('#lower-section', COLUMN_HEADERS, LOWER_SECTION_INPUTS, LOWER_SECTION_TOTAL_LABEL);

    observePlayerNameInput();
    var scoreObservables = observeScoreInput();
    observeScoreDifferences(scoreObservables[0], scoreObservables[1]);

    observeElementsHiddenAfterTransition();
  });


  function Input(label, step, max) {
    return { label: label, step: step, max: max };
  }

  function RowScoreChange(score1, score2) {
    return { score1: score1, score2: score2 };
  }


  function addTableRows(tableSelector, columnHeaders, rowHeaders, totalLabel) {
    addColumnHeaderRow(tableSelector + ' thead', columnHeaders);
    addBodyRows(tableSelector + ' tbody', columnHeaders, rowHeaders, totalLabel);
  }

  function addColumnHeaderRow(tableHeadElement, columnHeaders) {
    $(tableHeadElement).append($('<tr>')
      .append('<th>')
      .append(columnHeaders.map(function (header, index) {
        return '<th class="player-' + (index + 1) + '">' +
          '<input type="text" class="player" placeholder="' + header + '"></input></th>';
      })));
  }

  function addBodyRows(tableBodyElement, columnHeaders, rowHeaders, totalLabel) {
    // Score input cells
    rowHeaders.forEach(function (header) {
      var input = '<input type="number" min="0" max="' + header.max + '" step="' + header.step + '" class="score"></input>';
      var score1Diff = '<span class="score-diff player-1"></span>';
      var score2Diff = '<span class="score-diff player-2"></span>';

      $(tableBodyElement).append($('<tr>')
        .append('<th>' + header.label + '</th>')
        .append('<td class="player-1">' + score1Diff + input + '</td>')
        .append('<td class="player-2">' + input + score2Diff + '</td>'));
    });

    // Total cells
    var totalScoreInput = '<input type="number" min="0" class="total" readonly></input>';
    var totalScore1Diff = '<span class="score-diff player-1"></span>';
    var totalScore2Diff = '<span class="score-diff player-2"></span>';

    $(tableBodyElement).append($('<tr>')
      .append('<th>' + totalLabel + '</th>')
      .append('<td class="player-1">' + totalScore1Diff + totalScoreInput + '</td>')
      .append('<td class="player-2">' + totalScoreInput + totalScore2Diff + '</td>'));
  }


  function observePlayerNameInput() {
    COLUMN_HEADERS.forEach(function (header, index) {
      var upperSectionElement = $('#upper-section thead input')[index];
      var lowerSectionElement = $('#lower-section thead input')[index];

      bindNameData(upperSectionElement, lowerSectionElement);
      bindNameData(lowerSectionElement, upperSectionElement);
    });
  }

  function bindNameData(sourceElement, targetElement) {
    Rx.Observable.fromEvent(sourceElement, 'keyup')
      .map(function (e) { return e.target.value; })
      .distinctUntilChanged()
      .subscribe(function (text) {
        targetElement.value = text;
      });
  }


  function observeScoreInput() {
    var upperSectionObservables = bindScoreData('#upper-section');
    var lowerSectionObservables = bindScoreData('#lower-section', upperSectionObservables.scoreTotalObservables);

    return [ upperSectionObservables, lowerSectionObservables ].map(function (observables) {
      return mergeObservablesByColumn(observables.scoreInputObservables, observables.scoreTotalObservables);
    });
  }

  function bindScoreData(tableSelector, externalObservableByColumn) {
    var observablesFromTable = getInputObservablesByTableColumn(tableSelector);
    var allObservablesByColumn = mergeObservablesByColumn(observablesFromTable, externalObservableByColumn);

    var totalObservablesByColumn = allObservablesByColumn.map(function (observables) {
      return Rx.Observable.combineLatest(observables, function () {
        return _(arguments).reduce(function (sum, value) { return sum + value; })
          .valueOf();
      });
    });
    bindTotalData(tableSelector, totalObservablesByColumn);

    return { scoreInputObservables: observablesFromTable, scoreTotalObservables: totalObservablesByColumn };
  }

  function bindTotalData(tableSelector, totalObservablesByColumn) {
    totalObservablesByColumn.forEach(function (observable, index) {
      observable.subscribe(function (total) {
        $(tableSelector + ' input.total')[index].value = total;
      });
    });
  }

  function getInputObservablesByTableColumn(tableSelector) {
    var inputsByColumn = _($(tableSelector + ' input.score').get())
      .groupBy(function (value, index) { return index % COLUMN_HEADERS.length; })
      .valueOf();
    var inputObservablesByColumn = COLUMN_HEADERS.map(function (header, columnIndex) {
      return inputsByColumn[columnIndex].map(createObservableForNumberInputField);
    });
    return inputObservablesByColumn;
  }

  function mergeObservablesByColumn(observables, extraObservableByColumn) {
    if (extraObservableByColumn && extraObservableByColumn.length > 0) {
      return observables.map(function (columnObservables, columnIndex) {
        return columnObservables.concat([extraObservableByColumn[columnIndex]]);
      });
    } else {
      return observables;
    }
  }

  function createObservableForNumberInputField(inputElement) {
    return Rx.Observable.just(0)
      .merge(Rx.Observable.fromEvent(inputElement, 'input')
        .map(function (e) { return +e.target.value || 0; })
        .distinctUntilChanged());
  }


  function observeScoreDifferences(upperSectionObservables, lowerSectionObservables) {
    bindRowScoreData('#upper-section', upperSectionObservables);
    bindRowScoreData('#lower-section', lowerSectionObservables);
  }

  function bindRowScoreData(tableSelector, scoreObservables) {
    $(tableSelector + ' tbody tr').each(function (rowIndex, rowElement) {
      var rowScoreChangeObservable = Rx.Observable.combineLatest(
        scoreObservables[0][rowIndex],
        scoreObservables[1][rowIndex],
        function (score1, score2) { return RowScoreChange(score1, score2); }
      );

      // Show score difference next to bigger score cell
      rowScoreChangeObservable.filter(function (change) { return change.score1 > change.score2; })
        .subscribe(function (change) {
          $(rowElement).find('.score-diff.player-1')
            .addClass('visible')
            .html('+' + (change.score1 - change.score2));
        });
      rowScoreChangeObservable.filter(function (change) { return change.score2 > change.score1; })
        .subscribe(function (change) {
          $(rowElement).find('.score-diff.player-2')
            .addClass('visible')
            .html('+' + (change.score2 - change.score1));
        });

      // Hide score difference cell next to score cell that is smaller or equal to the other one
      rowScoreChangeObservable.filter(function (change) { return change.score1 <= change.score2; })
        .subscribe(function () {
          $(rowElement).find('.score-diff.player-1')
            .removeClass('visible');
        });
      rowScoreChangeObservable.filter(function (change) { return change.score2 <= change.score1; })
        .subscribe(function () {
          $(rowElement).find('.score-diff.player-2')
            .removeClass('visible');
        });
    });
  }


  function observeElementsHiddenAfterTransition() {
    $('.score-diff').each(function (index, element) {
      Rx.Observable.fromEvent(element, 'transitionend')
        .filter(function (e) { return e.propertyName === 'opacity' && !$(e.target).hasClass('visible'); })
        .subscribe(function (e) { $(e.target).html(''); });
    });
  }

})();
