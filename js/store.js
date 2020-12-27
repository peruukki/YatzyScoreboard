const haveLocalStorage = isLocalStorageAvailable();

export default {
  storeName,
  readName,
  storeScore,
  readScore,
  storeHistoricalScore,
  removeHistoricalScore,
  readHistoricalScore
};

const getNameKey = (gameIndex, playerIndex) => `name-${gameIndex}-${playerIndex}`;
const getScoreKey = (section, gameIndex, playerIndex, rowIndex) =>
  `score-${section}-${gameIndex}-${playerIndex}-${rowIndex}`;
const getHistoricalScoreKey = type => `historical-${type}`;

export function storeName(name, gameIndex, playerIndex) {
  store(getNameKey(gameIndex, playerIndex), name);
}
export function readName(gameIndex, playerIndex) {
  return read(getNameKey(gameIndex, playerIndex));
}

export function storeScore(section, score, gameIndex, playerIndex, rowIndex) {
  store(getScoreKey(section, gameIndex, playerIndex, rowIndex), score);
}
export function readScore(section, gameIndex, playerIndex, rowIndex) {
  return read(getScoreKey(section, gameIndex, playerIndex, rowIndex));
}

export function storeHistoricalScore(type, { score, playerName, timestamp }) {
  store(getHistoricalScoreKey(type), JSON.stringify({ score, playerName, timestamp }));
}
export function removeHistoricalScore(type) {
  store(getHistoricalScoreKey(type, undefined));
}
export function readHistoricalScore(type) {
  const historicalScoreString = read(getHistoricalScoreKey(type));
  if (!historicalScoreString) {
    return null;
  }
  return JSON.parse(historicalScoreString);
}

function store(key, value) {
  if (haveLocalStorage) {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  }
}

function read(key) {
  if (haveLocalStorage) {
    return window.localStorage.getItem(key) || '';
  } else {
    return '';
  }
}

// From https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function isLocalStorageAvailable() {
  try {
    const x = '__storage_test__';
    window.localStorage.setItem(x, x);
    window.localStorage.removeItem(x);
    return true;
  }
  catch (e) {
    return false;
  }
}
