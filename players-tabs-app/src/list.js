(() => {
  const db = window.db || firebase.firestore();

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

        actions.appendChild(deleteButton);
        li.appendChild(info);
        li.appendChild(actions);
        list.appendChild(li);
      });
    }).catch(error => {
      console.error("エラー:", error);
    });
  }

  // 初回ロード
  document.addEventListener("DOMContentLoaded", loadPlayers);
})();
