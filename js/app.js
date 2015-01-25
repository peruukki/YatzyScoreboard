'use strict';

(function () {

  var COLUMN_HEADERS = [ 'Player 1', 'Player 2' ];
  var ROW_HEADERS_UPPER_SECTION = [ 'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Subtotal' ];
  var ROW_HEADERS_LOWER_SECTION = [ 'Pair', 'Two pairs', 'Three of a kind', 'Four of a kind', 'Five of a kind',
                                    'Small straight', 'Large straight', 'Full house', 'Chance', 'Yatzy', 'TOTAL' ];

  $(document).ready(function () {
    addTableRows('#upper-section', COLUMN_HEADERS, ROW_HEADERS_UPPER_SECTION);
    addTableRows('#lower-section', COLUMN_HEADERS, ROW_HEADERS_LOWER_SECTION);

    observePlayerNameInput();
  });

  function addTableRows(tableSelector, columnHeaders, rowHeaders) {
    addColumnHeaderRow(tableSelector + ' thead', columnHeaders);
    addBodyRows(tableSelector + ' tbody', rowHeaders, columnHeaders);
  }

  function addColumnHeaderRow(tableHeadElement, columnHeaders) {
    $(tableHeadElement).append($('<tr>')
      .append('<th>')
      .append(columnHeaders.map(function (header) {
        return '<th><input type="text" class="player" placeholder="' + header + '"></input></th>';
      })));
  }

  function addBodyRows(tableBodyElement, rowHeaders, columnHeaders) {
    var headerElements = rowHeaders.map(function (header) {
      return '<th>' + header + '</th>';
    });
    var scoreInputCells = columnHeaders.map(function (header) {
      return '<td><input type="number" min="0" max="80" class="score"></input></td>';
    });
    var totalScoreCells = columnHeaders.map(function (header) {
      return '<td><input type="number" min="0" class="total"></input></td>';
    });

    _(headerElements).take(headerElements.length - 1).forEach(function (headerElement) {
      $(tableBodyElement).append($('<tr>')
        .append(headerElement)
        .append(scoreInputCells));
    });
    $(tableBodyElement).append($('<tr>')
      .append(_(headerElements).last())
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

})();
