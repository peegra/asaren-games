(() => {
  const db = window.db || firebase.firestore();
  const teamSplitButton = document.getElementById("teamSplitButton");

  // 選手一覧を取得して表示する関数
  function loadPlayers() {
    const list = document.getElementById("playersList");
    list.innerHTML = "";

    db.collection("players").orderBy("name").get().then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("li");
        li.className = "player-row";

        const info = document.createElement("span");
        info.className = "player-info";
        info.textContent = `${data.name}（学年: ${data.grade}）`;

        const actions = document.createElement("div");
        actions.className = "player-actions";

        let isParticipating = Boolean(data.participating);

        const participationButton = document.createElement("button");
        participationButton.type = "button";
        participationButton.className = "participation-button";

        function setParticipationState(active) {
          if (active) {
            participationButton.classList.add("is-active");
            participationButton.textContent = "参戦中";
            li.classList.add("is-participating");
          } else {
            participationButton.classList.remove("is-active");
            participationButton.textContent = "参戦する";
            li.classList.remove("is-participating");
          }
        }

        setParticipationState(isParticipating);

        participationButton.addEventListener("click", () => {
          const nextState = !isParticipating;
          participationButton.disabled = true;

          db.collection("players").doc(doc.id).update({
            participating: nextState
          }).then(() => {
            isParticipating = nextState;
            setParticipationState(isParticipating);
          }).catch(error => {
            console.error("参戦状態の更新に失敗しました:", error);
            alert("参戦状態の更新に失敗しました。時間をおいて再度お試しください。");
          }).finally(() => {
            participationButton.disabled = false;
          });
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger-button";
        deleteButton.textContent = "削除";
        deleteButton.addEventListener("click", () => {
          const confirmed = window.confirm(`${data.name} を削除しますか？`);
          if (!confirmed) {
            return;
          }

          db.collection("players").doc(doc.id).delete()
            .then(() => {
              li.remove();
            })
            .catch(error => {
              console.error("削除時にエラーが発生しました:", error);
              alert("削除に失敗しました。再度お試しください。");
            });
        });

        actions.appendChild(participationButton);
        actions.appendChild(deleteButton);
        li.appendChild(info);
        li.appendChild(actions);
        list.appendChild(li);
      });
    }).catch(error => {
      console.error("エラー:", error);
    });
  }

  if (teamSplitButton) {
    teamSplitButton.addEventListener("click", () => {
      if (window.parent && typeof window.parent.showTeam === "function") {
        window.parent.showTeam();
      }
    });
  }

  // 初回ロード
  document.addEventListener("DOMContentLoaded", loadPlayers);
})();
