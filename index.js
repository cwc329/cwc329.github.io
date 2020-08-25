/* eslint no-restricted-syntax: 0 */

const request = new XMLHttpRequest();
const ApiEndpoint = 'https://api.twitch.tv/kraken';
const clientId = 'l8v669ong3mcmzuafjnny8y0tcj9vp';
const displayTitle = document.querySelector('.display__title');
const moreResultsBtn = document.querySelector('.display__moreResultsBtn');
const results = document.querySelector('.display__results');
const lis = document.querySelector('.navbar__topGames').children;
const resultWidth = 440;
let offset = 0;
let lastSearchedText = '';

function showTopFiveGames(arr, callback) {
  const navbarTopGames = document.querySelector('.navbar__topGames').children;
  for (let i = 0; i < arr.length; i += 1) {
    navbarTopGames[i + 1].innerText = `${arr[i]}`;
  }
  callback();
}

function showStreamResult(streams) {
  if (offset === 0) {
    results.innerHTML = '';
  }
  const w = resultWidth;
  const h = Math.floor(w / 16 * 9);
  for (const stream of Object.values(streams)) {
    let previewImgUrl = stream.preview.template;
    previewImgUrl = `${previewImgUrl.slice(0, previewImgUrl.indexOf('{'))}${w}x${h}.jpg`;
    const templateHTML = `<img class="display__result__previewImg" src="${previewImgUrl}"/>
      <div class="display__result__info">
        <img class="display__result__info__channelImg" src="${stream.channel.logo}"/>
        <div class="display__result__info__dicriptions">
          <div class="display__result__info__dicriptions__title">${stream.channel.status}</div>
          <div class="display__result__info__dicriptions__host">${stream.channel.display_name}</div>
        </div>
      </div>
    `;
    const newResult = document.createElement('div');
    newResult.setAttribute('onclick', `window.open('${stream.channel.url}','_blank');`);
    newResult.classList.add('display__result');
    newResult.innerHTML = templateHTML;
    results.appendChild(newResult);
  }
  if (streams.length < 20) {
    moreResultsBtn.classList.add('hide');
  } else {
    moreResultsBtn.classList.remove('hide');
  }
  let shownsearchText;
  if (lastSearchedText) {
    shownsearchText = lastSearchedText;
  } else {
    shownsearchText = 'Most Popular';
  }
  const templateMessage = `These are live streams of "${shownsearchText}"`;
  displayTitle.innerText = templateMessage;
}

function getStreamResult(str, callback = showStreamResult) {
  lastSearchedText = str;
  let queryString = '';
  if (str) {
    for (let i = 1; i < lis.length; i += 1) {
      if (str === lis[i].innerText) {
        lis[i].classList.add('active');
        break;
      }
    }
    queryString = `&game=${str}`;
  }
  request.onload = () => {
    try {
      JSON.parse(request.response);
    } catch (err) {
      console.log(err);
    }
    const streamResult = JSON.parse(request.response);
    const { streams } = streamResult;
    callback(streams, str);
  };
  request.open('GET', `${ApiEndpoint}/streams?limit=20&offset=${offset * 20}${queryString}`);
  request.setRequestHeader('Client-ID', clientId);
  request.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
  request.send();
}

function getTopFiveGames(callback) {
  request.onload = () => {
    const topFiveGames = [];
    try {
      JSON.parse(request.response);
    } catch (err) {
      console.log(err);
    }
    const gameData = JSON.parse(request.response).top;
    for (let i = 0; i < gameData.length; i += 1) {
      topFiveGames.push(gameData[i].game.name);
    }
    callback(topFiveGames, getStreamResult);
  };
  request.open('GET', `${ApiEndpoint}/games/top?limit=5`, true);
  request.setRequestHeader('Client-ID', clientId);
  request.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
  request.send();
}

function getGameName(name, callback) {
  const searchQuery = encodeURI(name);
  request.onload = () => {
    try {
      JSON.parse(request.response);
    } catch (err) {
      console.log(err);
    }
    const searchResult = JSON.parse(request.response);
    if (!searchResult.games) {
      results.innerHTML = '';
      moreResultsBtn.classList.add('hide');
      displayTitle.innerText = `These are live streams of "${document.querySelector('.navbar__search__text').value}"`;
      return;
    }
    callback(searchResult.games[0].name);
  };
  request.open('GET', `${ApiEndpoint}/search/games?query=${searchQuery}`, true);
  request.setRequestHeader('Client-ID', clientId);
  request.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
  request.send();
}

document.querySelector('form').addEventListener('submit', (e) => {
  offset = 0;
  for (let i = 0; i < lis.length; i += 1) {
    lis[i].classList.remove('active');
  }
  getGameName(document.querySelector('.navbar__search__text').value, getStreamResult);
  e.preventDefault();
});

document.querySelector('.navbar__topGames').addEventListener('click', (e) => {
  offset = 0;
  for (let i = 0; i < lis.length; i += 1) {
    lis[i].classList.remove('active');
  }
  e.target.classList.add('active');
  let gameName;
  if (e.target.id === 'popularStreams') {
    gameName = '';
  } else {
    gameName = e.target.innerText;
  }
  getStreamResult(gameName, showStreamResult);
});

document.querySelector('.display__moreResultsBtn').addEventListener('click', () => {
  offset += 1;
  getStreamResult(lastSearchedText, showStreamResult);
});

getTopFiveGames(showTopFiveGames);
