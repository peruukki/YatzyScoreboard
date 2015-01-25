'use strict';

(function () {

  var COLUMN_HEADERS = [ 'Player 1', 'Player 2' ];
  var ROW_HEADERS_UPPER_SECTION = [ 'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Subtotal' ];
  var ROW_HEADERS_LOWER_SECTION = [ 'Pair', 'Two pairs', 'Three of a kind', 'Four of a kind', 'Five of a kind',
                                    'Small straight', 'Large straight', 'Full house', 'Chance', 'Yatzy', 'TOTAL' ];

  $(document).ready(function () {
    addTableRows('#upper-section', COLUMN_HEADERS, ROW_HEADERS_UPPER_SECTION);
    addTableRows('#lower-section', COLUMN_HEADERS, ROW_HEADERS_LOWER_SECTION);
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
    var emptyRowCells = columnHeaders.map(function (header) {
      return '<td><input type="number" min="0" max="80" class="score"></input></td>';
    });

    headerElements.forEach(function (headerElement) {
      $(tableBodyElement).append($('<tr>')
        .append(headerElement)
        .append(emptyRowCells));
    });
  }

})();
