const registration = require('./registration');
const list = require('./list');

document.addEventListener('DOMContentLoaded', () => {
  const registrationTab = document.getElementById('registrationTab');
  const listTab = document.getElementById('listTab');
  const registrationView = document.getElementById('registrationView');
  const listView = document.getElementById('listView');

  registrationTab.addEventListener('click', () => {
    registrationView.style.display = 'block';
    listView.style.display = 'none';
  });

  listTab.addEventListener('click', () => {
    registrationView.style.display = 'none';
    listView.style.display = 'block';
    list.loadPlayers();
  });

  // 初期表示は登録画面
  registrationView.style.display = 'block';
  listView.style.display = 'none';
});