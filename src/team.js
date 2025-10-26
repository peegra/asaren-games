(() => {
  const db = window.db || firebase.firestore();
  const teamBoard = document.getElementById("teamBoard");
  const teamTitle = document.getElementById("teamTitle");

  const TEAM_COUNT_STORAGE_KEY = "teamCount";
  const TEAM_LABEL_FALLBACK = ["A", "B", "C", "D", "E", "F"];
  const TEAM_NAMES_URL = new URL("../src/teamNames.json", window.location.href).href;
  const TEAM_STATE_COLLECTION = "appState";
  const TEAM_STATE_DOC_ID = "team";
  const fallbackDocRef = () => db.collection(TEAM_STATE_COLLECTION).doc(TEAM_STATE_DOC_ID);
  const GRADE_POINTS = {
    "小1": 1,
    "小2": 2,
    "小3": 3,
    "小4": 4,
    "小5": 5,
    "小6": 6,
    "中1": 7,
    "中2": 8,
    "中3": 9,
    "大人": 10
  };
  const DEFAULT_GRADE_POINTS = 5;

  const FALLBACK_NAMING = {
    categories: [
      {
        name: "ワクワクアドベンチャー",
        teams: ["チームスター", "チームヒーロー", "チームドラゴン", "チームナイト", "チームフェニックス"]
      }
    ]
  };

  let namingData = FALLBACK_NAMING;

  if (!teamBoard) {
    console.warn("チーム表示エリアが見つかりませんでした。");
    return;
  }

  function safeGetTeamCount() {
    try {
      const stored = localStorage.getItem(TEAM_COUNT_STORAGE_KEY);
      const parsed = Number(stored);
      if (parsed === 3 || parsed === 4) return parsed;
      return 2;
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

  function composeTeamState(players, teamCount) {
    const category = getRandomCategory();
    const names = getTeamNames(teamCount, category);
    const shuffled = shuffle(players);
    const scoredPlayers = shuffled
      .map(player => {
        const score =
          typeof player.points === "number"
            ? player.points
            : GRADE_POINTS[player.grade] ?? DEFAULT_GRADE_POINTS;
        return { data: player, score };
      })
      .sort((a, b) => b.score - a.score);

    const buckets = Array.from({ length: teamCount }, () => []);
    const bucketScores = Array.from({ length: teamCount }, () => 0);
    const totalPlayers = scoredPlayers.length;
    const baseSize = Math.floor(totalPlayers / teamCount);
    const remainder = totalPlayers % teamCount;
    const targetSizes = Array.from({ length: teamCount }, (_, index) => baseSize + (index < remainder ? 1 : 0));

    scoredPlayers.forEach(({ data, score }) => {
      let targetIndex = -1;
      let minScore = Infinity;

      for (let i = 0; i < teamCount; i += 1) {
        if (buckets[i].length >= targetSizes[i]) {
          continue;
        }
        const candidateScore = bucketScores[i];
        if (candidateScore < minScore) {
          minScore = candidateScore;
          targetIndex = i;
        } else if (candidateScore === minScore && targetIndex !== -1) {
          if (buckets[i].length < buckets[targetIndex].length) {
            targetIndex = i;
          }
        }
      }

      if (targetIndex === -1) {
        targetIndex = 0;
      }

      buckets[targetIndex].push(data);
      bucketScores[targetIndex] += score;
    });

    const teams = buckets.map((members, index) => ({
      name: names[index] || `チーム ${TEAM_LABEL_FALLBACK[index] || index + 1}`,
      members
    }));

    return {
      teamCount,
      categoryName: category.name,
      teams,
      createdAt: Date.now()
    };
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

  function renderState(state) {
    if (!state || !Array.isArray(state.teams) || state.teams.length === 0) {
      renderEmptyState();
      return;
    }

    teamBoard.innerHTML = "";
    const fragment = document.createDocumentFragment();

    state.teams.forEach(team => {
      const column = document.createElement("article");
      column.className = "team-column";

      const header = document.createElement("header");
      header.className = "team-header";
      const title = document.createElement("h2");
      title.textContent = team.name;
      header.appendChild(title);

      const list = document.createElement("ul");
      list.className = "team-list";

      if (!team.members || team.members.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "team-player empty";
        emptyItem.textContent = "メンバーがいません";
        list.appendChild(emptyItem);
      } else {
        team.members.forEach(member => {
          const li = document.createElement("li");
          li.className = "team-player";
          li.textContent = member.name;
          list.appendChild(li);
        });
      }

      column.appendChild(header);
      column.appendChild(list);
      fragment.appendChild(column);
    });

    teamBoard.appendChild(fragment);

    if (teamTitle) {
      teamTitle.textContent = `${state.categoryName}カップ`;
    }
  }

  async function fetchTeamStateFromDb() {
    try {
      const snap = await fallbackDocRef().get();
      if (!snap.exists) {
        return null;
      }
      return snap.data();
    } catch (error) {
      console.warn("チーム状態の取得に失敗しました:", error);
      return null;
    }
  }

  async function saveTeamStateToDb(state) {
    try {
      await fallbackDocRef().set(state);
    } catch (error) {
      console.warn("チーム状態の保存に失敗しました:", error);
    }
  }

  async function fetchParticipatingPlayers() {
    const snapshot = await db.collection("players").where("participating", "==", true).get();
    const players = [];
    const updatePromises = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const points =
        typeof data.points === "number"
          ? data.points
          : GRADE_POINTS[data.grade] ?? DEFAULT_GRADE_POINTS;
      if (typeof data.points !== "number" || data.points !== points) {
        updatePromises.push(
          doc.ref.update({ points }).catch(error => {
            console.warn("ポイントの更新に失敗しました:", error);
          })
        );
      }
      players.push({
        id: doc.id,
        name: data.name,
        grade: data.grade || "",
        points,
        participating: true
      });
    });
    if (updatePromises.length) {
      try {
        await Promise.all(updatePromises);
      } catch (error) {
        console.warn("ポイントのバッチ更新に失敗しました:", error);
      }
    }
    return players;
  }

  async function generateAndPersistState(teamCount) {
    const players = await fetchParticipatingPlayers();
    if (!players.length) {
      renderEmptyState();
      await saveTeamStateToDb({
        teamCount,
        categoryName: "",
        teams: [],
        createdAt: Date.now()
      });
      return;
    }

    const state = composeTeamState(players, teamCount);
    await saveTeamStateToDb(state);
    renderState(state);
  }

  async function showCurrentState({ forceNew = false } = {}) {
    const teamCount = safeGetTeamCount();

    if (forceNew) {
      await generateAndPersistState(teamCount);
      return;
    }

    const storedState = await fetchTeamStateFromDb();
    if (storedState && Array.isArray(storedState.teams) && storedState.teams.length) {
      renderState(storedState);
      return;
    }

    await generateAndPersistState(teamCount);
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
          data.categories.every(entry => entry && typeof entry.name === "string" && Array.isArray(entry.teams) && entry.teams.length)
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

  window.loadTeamsOnShow = options => {
    const regenerate =
      options && typeof options === "object"
        ? Boolean(options.regenerate)
        : Boolean(options);
    return showCurrentState({ forceNew: regenerate });
  };

  window.forceTeamsShuffle = () => {
    return showCurrentState({ forceNew: true });
  };

  loadNamingData().finally(() => showCurrentState({ forceNew: false }));
})();
