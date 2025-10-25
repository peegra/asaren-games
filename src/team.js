(() => {
  const db = window.db || firebase.firestore();
  const teamBoard = document.getElementById("teamBoard");
  const reshuffleButton = document.getElementById("reshuffleButton");
  const teamTitle = document.getElementById("teamTitle");

  const TEAM_COUNT_STORAGE_KEY = "teamCount";
  const TEAM_LABEL_FALLBACK = ["A", "B", "C", "D", "E"];
  const TEAM_NAMES_URL = "/src/teamNames.json";
  const FALLBACK_NAMING = {
    categories: [
      {
        name: "ワクワクアドベンチャー",
        teams: ["チームスター", "チームヒーロー", "チームドラゴン", "チームナイト", "チームフェニックス"]
      }
    ]
  };

  let namingData = FALLBACK_NAMING;
  let latestPlayers = [];

  if (!teamBoard) {
    console.warn("チーム表示エリアが見つかりませんでした。");
    return;
  }

  function safeGetTeamCount() {
    try {
      const stored = localStorage.getItem(TEAM_COUNT_STORAGE_KEY);
      return stored === "3" ? 3 : 2;
    } catch (error) {
      console.warn("チーム数の取得に失敗しました:", error);
      return 2;
    }
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getRandomCategory() {
    const categories = Array.isArray(namingData.categories) && namingData.categories.length
      ? namingData.categories
      : FALLBACK_NAMING.categories;
    return categories[Math.floor(Math.random() * categories.length)] || FALLBACK_NAMING.categories[0];
  }

  function getTeamNames(teamCount, category) {
    const pool =
      category && Array.isArray(category.teams) && category.teams.length
        ? category.teams.slice()
        : FALLBACK_NAMING.categories[0].teams.slice();

    if (pool.length < teamCount) {
      while (pool.length < teamCount) {
        pool.push(`チーム ${TEAM_LABEL_FALLBACK[pool.length] || pool.length + 1}`);
      }
    }

    const shuffledNames = shuffle(pool);
    return Array.from({ length: teamCount }, (_, index) => shuffledNames[index]);
  }

  function renderEmptyState() {
    teamBoard.innerHTML = "";
    const emptyContainer = document.createElement("div");
    emptyContainer.className = "team-empty";
    emptyContainer.textContent = "エントリー中のメンバーがいません";
    teamBoard.appendChild(emptyContainer);

    if (teamTitle) {
      teamTitle.textContent = "チーム分け";
    }
  }

  function createTeamColumn(teamName, players) {
    const column = document.createElement("article");
    column.className = "team-column";

    const header = document.createElement("header");
    header.className = "team-header";

    const title = document.createElement("h2");
    title.textContent = teamName;

    const count = document.createElement("span");
    count.className = "team-count";
    count.textContent = `${players.length} 人`;

    header.appendChild(title);
    header.appendChild(count);

    const list = document.createElement("ul");
    list.className = "team-list";

    if (!players.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "team-player empty";
      emptyItem.textContent = "メンバーがいません";
      list.appendChild(emptyItem);
    } else {
      players.forEach(player => {
        const li = document.createElement("li");
        li.className = "team-player";
        li.textContent = player.grade ? `${player.name}（${player.grade}）` : player.name;
        list.appendChild(li);
      });
    }

    column.appendChild(header);
    column.appendChild(list);
    return column;
  }

  function renderTeams(players) {
    const teamCount = safeGetTeamCount();

    if (!players.length) {
      renderEmptyState();
      return;
    }

    teamBoard.innerHTML = "";

    const shuffledPlayers = shuffle(players);
    const buckets = Array.from({ length: teamCount }, () => []);

    shuffledPlayers.forEach((player, index) => {
      buckets[index % teamCount].push(player);
    });

    const category = getRandomCategory();
    const teamNames = getTeamNames(teamCount, category);
    const fragment = document.createDocumentFragment();

    buckets.forEach((bucket, index) => {
      const fallbackName = `チーム ${TEAM_LABEL_FALLBACK[index] || index + 1}`;
      fragment.appendChild(createTeamColumn(teamNames[index] || fallbackName, bucket));
    });

    if (teamTitle) {
      teamTitle.textContent = `${category.name}チーム`;
    }

    teamBoard.appendChild(fragment);
  }

  function loadParticipatingPlayers() {
    db.collection("players")
      .where("participating", "==", true)
      .get()
      .then(snapshot => {
        const players = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          players.push({
            id: doc.id,
            name: data.name,
            grade: data.grade || ""
          });
        });

        latestPlayers = players;
        renderTeams(players);
      })
      .catch(error => {
        console.error("チーム分けの取得に失敗しました:", error);
        renderEmptyState();
      });
  }

  function loadNamingData() {
    return fetch(TEAM_NAMES_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`名前データの取得に失敗しました: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (
          data &&
          Array.isArray(data.categories) &&
          data.categories.every(
            entry => entry && typeof entry.name === "string" && Array.isArray(entry.teams) && entry.teams.length
          )
        ) {
          namingData = data;
        } else {
          console.warn("teamNames.json の形式が不正です。既定値を使用します。");
          namingData = FALLBACK_NAMING;
        }
      })
      .catch(error => {
        console.warn(error.message);
        namingData = FALLBACK_NAMING;
      });
  }

  function reshuffleTeams() {
    if (latestPlayers.length) {
      renderTeams(latestPlayers);
    } else {
      loadParticipatingPlayers();
    }
  }

  if (reshuffleButton) {
    reshuffleButton.addEventListener("click", reshuffleTeams);
  }

  window.addEventListener("storage", event => {
    if (event.key === TEAM_COUNT_STORAGE_KEY) {
      reshuffleTeams();
    }
  });

  loadNamingData().finally(loadParticipatingPlayers);
})();
