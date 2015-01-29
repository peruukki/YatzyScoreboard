'use strict';

(function () {

  var COLUMN_HEADERS = [ 'Player 1', 'Player 2' ];

  var UPPER_SECTION_INPUTS = [
    Input('Ones', 1, 5), Input('Twos', 2, 10), Input('Threes', 3, 15),
    Input('Fours', 4, 20), Input('Fives', 5, 25), Input('Sixes', 6, 30)
  ];
  var UPPER_SECTION_TOTAL_LABEL = 'Subtotal';

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
    observeScoreInput();
  });


  function Input(label, step, max) {
    return { label: label, step: step, max: max };
  }

  function addTableRows(tableSelector, columnHeaders, rowHeaders, totalLabel) {
    addColumnHeaderRow(tableSelector + ' thead', columnHeaders);
    addBodyRows(tableSelector + ' tbody', columnHeaders, rowHeaders, totalLabel);
  }

  function addColumnHeaderRow(tableHeadElement, columnHeaders) {
    $(tableHeadElement).append($('<tr>')
      .append('<th>')
      .append(columnHeaders.map(function (header) {
        return '<th><input type="text" class="player" placeholder="' + header + '"></input></th>';
      })));
  }

  function addBodyRows(tableBodyElement, columnHeaders, rowHeaders, totalLabel) {
    // Score input cells
    rowHeaders.forEach(function (header) {
      var scoreInputCells = columnHeaders.map(function () {
        return '<td><input type="number" min="0" max="' + header.max + '" step="' + header.step + '" class="score"></input></td>';
      });
      $(tableBodyElement).append($('<tr>')
        .append('<th>' + header.label + '</th>')
        .append(scoreInputCells));
    });

    // Total cells
    var totalScoreCells = columnHeaders.map(function () {
      return '<td><input type="number" min="0" class="total" readonly></input></td>';
    });
    $(tableBodyElement).append($('<tr>')
      .append('<th>' + totalLabel + '</th>')
      .append(totalScoreCells));
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
    var upperSectionTotalObservables = bindScoreData('#upper-section');
    bindScoreData('#lower-section', upperSectionTotalObservables);
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

    return totalObservablesByColumn;
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

})();
