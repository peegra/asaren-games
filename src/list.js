(() => {
  const db = window.db || firebase.firestore();
  const teamSplitButton = document.getElementById("teamSplitButton");
  const teamCountInputs = document.querySelectorAll('input[name="teamCount"]');
  const TEAM_COUNT_STORAGE_KEY = "teamCount";

  function getStoredTeamCount() {
    try {
      const stored = localStorage.getItem(TEAM_COUNT_STORAGE_KEY);
      return stored === "3" ? "3" : "2";
    } catch (error) {
      console.warn("チーム数の取得に失敗しました:", error);
      return "2";
    }
  }

  function storeTeamCount(value) {
    try {
      localStorage.setItem(TEAM_COUNT_STORAGE_KEY, value);
    } catch (error) {
      console.warn("チーム数の保存に失敗しました:", error);
    }
  }

  const initialTeamCount = getStoredTeamCount();
  storeTeamCount(initialTeamCount);

  if (teamCountInputs.length) {
    teamCountInputs.forEach(input => {
      if (input.value === initialTeamCount) {
        input.checked = true;
      }

      input.addEventListener("change", () => {
        if (input.checked) {
          storeTeamCount(input.value);
        }
      });
    });
  } else {
    storeTeamCount(initialTeamCount);
  }

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
        info.textContent = data.grade ? `${data.name}（${data.grade}）` : data.name;

        const actions = document.createElement("div");
        actions.className = "player-actions";

        let isParticipating = Boolean(data.participating);

        const participationButton = document.createElement("button");
        participationButton.type = "button";
        participationButton.className = "participation-button";

        function setParticipationState(active) {
          if (active) {
            participationButton.classList.add("is-active");
            participationButton.textContent = "エントリー中";
            li.classList.add("is-participating");
          } else {
            participationButton.classList.remove("is-active");
            participationButton.textContent = "エントリー";
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
            console.error("エントリー状態の更新に失敗しました:", error);
            alert("エントリー状態の更新に失敗しました。時間をおいて再度お試しください。");
          }).finally(() => {
            participationButton.disabled = false;
          });
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger-button";
        deleteButton.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4.5 6.5h15" />
            <path d="M9.5 3.5h5a1 1 0 0 1 1 1v2h-7v-2a1 1 0 0 1 1-1Z" />
            <path d="M18 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5v-12" />
            <path d="M10.5 11v6" />
            <path d="M13.5 11v6" />
          </svg>
        `;
        deleteButton.setAttribute("aria-label", `${data.name} を削除`);
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
      const selected = Array.from(teamCountInputs).find(input => input.checked)?.value || "2";
      storeTeamCount(selected);

      if (window.parent && typeof window.parent.showTeam === "function") {
        window.parent.showTeam();
      }
    });
  }

  // 初回ロード
  document.addEventListener("DOMContentLoaded", loadPlayers);
})();
