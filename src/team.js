(() => {
  const db = window.db || firebase.firestore();
  const teamAList = document.getElementById("teamAList");
  const teamBList = document.getElementById("teamBList");
  const teamACount = document.getElementById("teamACount");
  const teamBCount = document.getElementById("teamBCount");
  const reshuffleButton = document.getElementById("reshuffleButton");

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderTeams(players) {
    teamAList.innerHTML = "";
    teamBList.innerHTML = "";

    const shuffled = shuffle(players);

    shuffled.forEach((player, index) => {
      const targetList = index % 2 === 0 ? teamAList : teamBList;
      const li = document.createElement("li");
      li.className = "team-player";
      li.textContent = `${player.name}（${player.grade}）`;
      targetList.appendChild(li);
    });

    teamACount.textContent = `${teamAList.children.length} 人`;
    teamBCount.textContent = `${teamBList.children.length} 人`;
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
            grade: data.grade || "学年不明"
          });
        });

        if (players.length === 0) {
          teamAList.innerHTML = "";
          teamBList.innerHTML = "";

          const emptyMessage = () => {
            const li = document.createElement("li");
            li.className = "team-player empty";
            li.textContent = "参戦中のメンバーがいません";
            return li;
          };

          teamAList.appendChild(emptyMessage());
          teamBList.appendChild(emptyMessage());
          teamACount.textContent = "0 人";
          teamBCount.textContent = "0 人";
          return;
        }

        renderTeams(players);
      })
      .catch(error => {
        console.error("チーム分けの取得に失敗しました:", error);
        teamAList.innerHTML = "";
        teamBList.innerHTML = "";
      });
  }

  reshuffleButton.addEventListener("click", loadParticipatingPlayers);

  loadParticipatingPlayers();
})();
