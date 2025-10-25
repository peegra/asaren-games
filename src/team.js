(() => {
  const db = window.db || firebase.firestore();
  const teamBoard = document.getElementById("teamBoard");
  const reshuffleButton = document.getElementById("reshuffleButton");
  const teamTitle = document.getElementById("teamTitle");

  const TEAM_COUNT_STORAGE_KEY = "teamCount";
  const TEAM_STATE_KEY = "teamState";
  const TEAM_TRIGGER_KEY = "teamShuffleTrigger";
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

  function loadTeamState() {
    try {
      const stored = localStorage.getItem(TEAM_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("チーム状態の取得に失敗しました:", error);
      return null;
    }
  }

  function saveTeamState(state) {
    try {
      localStorage.setItem(TEAM_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("チーム状態の保存に失敗しました:", error);
    }
  }

  function createTeamState(teamCount) {
    const category = getRandomCategory();
    return {
      categoryName: category.name,
      names: getTeamNames(teamCount, category)
    };
  }

  function ensureTeamState(teamCount, forceNew = false) {
    let state = null;

    if (!forceNew) {
      state = loadTeamState();
      if (state && typeof state.categoryName === "string" && Array.isArray(state.names)) {
        if (state.names.length < teamCount) {
          const additional = [];
          for (let i = state.names.length; i < teamCount; i += 1) {
            additional.push(`チーム ${TEAM_LABEL_FALLBACK[i] || i + 1}`);
          }
          state.names = state.names.concat(additional);
          saveTeamState(state);
        } else if (state.names.length > teamCount) {
          state.names = state.names.slice(0, teamCount);
          saveTeamState(state);
        }
        return state;
      }
    }

    state = createTeamState(teamCount);
    saveTeamState(state);
    return state;
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
    header.appendChild(title);

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

  function renderTeams(players, options = {}) {
    const teamCount = safeGetTeamCount();

    if (!players.length) {
      renderEmptyState();
      return;
    }

    teamBoard.innerHTML = "";

    const teamState = ensureTeamState(teamCount, options.forceNew);
    const shuffledPlayers = shuffle(players);
    const buckets = Array.from({ length: teamCount }, () => []);

    shuffledPlayers.forEach((player, index) => {
      buckets[index % teamCount].push(player);
    });

    const teamNames = teamState.names.slice(0, teamCount);
    const fragment = document.createDocumentFragment();

    buckets.forEach((bucket, index) => {
      const fallbackName = `チーム ${TEAM_LABEL_FALLBACK[index] || index + 1}`;
      fragment.appendChild(createTeamColumn(teamNames[index] || fallbackName, bucket));
    });

    if (teamTitle) {
      teamTitle.textContent = `${teamState.categoryName}カップ`;
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

  function reshuffleTeams({ forceNew = false, broadcast = false } = {}) {
    if (latestPlayers.length) {
      renderTeams(latestPlayers, { forceNew });
    } else {
      loadParticipatingPlayers();
    }

    if (broadcast) {
      try {
        localStorage.setItem(TEAM_TRIGGER_KEY, String(Date.now()));
      } catch (error) {
        console.warn("チーム更新通知の送信に失敗しました:", error);
      }
    }
  }

  if (reshuffleButton) {
    reshuffleButton.addEventListener("click", () => {
      reshuffleTeams({ forceNew: true, broadcast: true });
    });
  }

  window.addEventListener("storage", event => {
    if (event.key === TEAM_TRIGGER_KEY) {
      reshuffleTeams({ forceNew: true });
    }
  });

  loadNamingData().finally(loadParticipatingPlayers);
})();
