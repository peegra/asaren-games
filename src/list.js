(() => {
  const db = window.db || firebase.firestore();
  const teamSplitButton = document.getElementById("teamSplitButton");
  const teamCountInputs = document.querySelectorAll('input[name="teamCount"]');
  const teamEntryCountDisplay = document.getElementById("teamEntryCountDisplay");
  const kamiSound = document.getElementById("kamiSound");
  const TEAM_COUNT_STORAGE_KEY = "teamCount";
  const GRADE_PRIORITY = new Map(
    ["小1", "小2", "小3", "小4", "小5", "小6", "中1", "中2", "中3", "大人"].map((grade, index) => [grade, index])
  );
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

  function getStoredTeamCount() {
    try {
      const stored = localStorage.getItem(TEAM_COUNT_STORAGE_KEY);
      return stored === "3" || stored === "4" ? stored : "2";
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

  function updateEntryCountDisplay(value) {
    if (teamEntryCountDisplay) {
      teamEntryCountDisplay.textContent = `エントリー数：${value}人`;
    }
  }

  // 選手一覧を取得して表示する関数
  function loadPlayers() {
    const list = document.getElementById("playersList");
    list.innerHTML = "";

    updateEntryCountDisplay(0);

    db.collection("players").get().then(snapshot => {
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
          participating: Boolean(data.participating)
        });
      });
      if (updatePromises.length) {
        Promise.all(updatePromises).catch(error => {
          console.warn("ポイントのバッチ更新に失敗しました:", error);
        });
      }

      const getGradeOrder = grade => {
        if (GRADE_PRIORITY.has(grade)) {
          return GRADE_PRIORITY.get(grade);
        }
        return GRADE_PRIORITY.size;
      };

      players.sort((a, b) => {
        const gradeDifference = getGradeOrder(a.grade) - getGradeOrder(b.grade);
        if (gradeDifference !== 0) {
          return gradeDifference;
        }
        return a.name.localeCompare(b.name, "ja");
      });

      let entryCount = players.reduce((total, player) => total + (player.participating ? 1 : 0), 0);
      updateEntryCountDisplay(entryCount);

      const attachSwipeHandlers = (track, onDeleteRequest) => {
        const li = track.parentElement;
        const maxLeft = -180;
        const threshold = 110;
        let pointerId = null;
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let isProcessing = false;

        const setTranslate = value => {
          track.style.transform = `translateX(${value}px)`;
        };

        const resetPosition = () => {
          track.style.transition = "transform 0.2s ease";
          setTranslate(0);
          li.classList.remove("is-dragging");
          li.classList.remove("is-swipe-open");
          isProcessing = false;
        };

        const handlePointerDown = event => {
          if (isProcessing || pointerId !== null) {
            return;
          }
          const interactiveTarget = event.target.closest("button, a, input, textarea");
          if (interactiveTarget) {
            return;
          }
          if (event.pointerType === "mouse" && event.button !== 0) {
            return;
          }
          pointerId = event.pointerId;
          startX = event.clientX;
          currentX = 0;
          isDragging = true;
          track.style.transition = "none";
          li.classList.add("is-dragging");
          track.setPointerCapture(pointerId);
        };

        const handlePointerMove = event => {
          if (!isDragging || event.pointerId !== pointerId) {
            return;
          }
          const deltaX = event.clientX - startX;
          if (deltaX < 0) {
            currentX = Math.max(deltaX, maxLeft);
            setTranslate(currentX);
            if (event.pointerType === "touch") {
              event.preventDefault();
            }
          } else {
            currentX = 0;
            setTranslate(0);
          }
        };

        const handlePointerEnd = event => {
          if (!isDragging || event.pointerId !== pointerId) {
            return;
          }
          track.releasePointerCapture(pointerId);
          isDragging = false;
          li.classList.remove("is-dragging");
          track.style.transition = "transform 0.2s ease";
          const shouldDelete = currentX <= -threshold;
          if (shouldDelete) {
            isProcessing = true;
            li.classList.add("is-swipe-open");
            setTranslate(maxLeft);
            onDeleteRequest(resetPosition);
          } else {
            resetPosition();
          }
          pointerId = null;
        };

        track.addEventListener("pointerdown", handlePointerDown);
        track.addEventListener("pointermove", handlePointerMove);
        track.addEventListener("pointerup", handlePointerEnd);
        track.addEventListener("pointercancel", handlePointerEnd);
        track.addEventListener("lostpointercapture", handlePointerEnd);
      };

      players.forEach(player => {
        const li = document.createElement("li");
        li.className = "player-row";

        const swipeTrack = document.createElement("div");
        swipeTrack.className = "player-swipe-track";

        const info = document.createElement("span");
        info.className = "player-info";
        info.textContent = player.grade ? `${player.name}（${player.grade}）` : player.name;

        const actions = document.createElement("div");
        actions.className = "player-actions";

        let isParticipating = player.participating;

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

          db.collection("players").doc(player.id).update({
            participating: nextState
          }).then(() => {
            isParticipating = nextState;
            entryCount += nextState ? 1 : -1;
            if (entryCount < 0) {
              entryCount = 0;
            }
            updateEntryCountDisplay(entryCount);
            setParticipationState(isParticipating);
          }).catch(error => {
            console.error("エントリー状態の更新に失敗しました:", error);
            alert("エントリー状態の更新に失敗しました。時間をおいて再度お試しください。");
          }).finally(() => {
            participationButton.disabled = false;
          });
        });

        actions.appendChild(participationButton);
        swipeTrack.appendChild(info);
        swipeTrack.appendChild(actions);
        li.appendChild(swipeTrack);

        attachSwipeHandlers(swipeTrack, resetSwipe => {
          const confirmed = window.confirm(`${player.name} を削除しますか？`);
          if (!confirmed) {
            resetSwipe();
            return;
          }

          li.classList.add("is-removing");
          db.collection("players").doc(player.id).delete()
            .then(() => {
              if (isParticipating) {
                entryCount = Math.max(0, entryCount - 1);
                updateEntryCountDisplay(entryCount);
              }
              swipeTrack.style.transition = "transform 0.2s ease";
              swipeTrack.style.transform = `translateX(-${Math.max(li.offsetWidth, 320)}px)`;
              setTimeout(() => {
                li.remove();
              }, 200);
            })
            .catch(error => {
              console.error("削除時にエラーが発生しました:", error);
              alert("削除に失敗しました。再度お試しください。");
              resetSwipe();
            });
        });

        list.appendChild(li);
      });
    }).catch(error => {
      console.error("エラー:", error);
    });
  }

  window.loadPlayersOnShow = loadPlayers;

  if (teamSplitButton) {
    teamSplitButton.addEventListener("click", () => {
      const selected = Array.from(teamCountInputs).find(input => input.checked)?.value || "2";
      storeTeamCount(selected);

      if (kamiSound) {
        try {
          kamiSound.currentTime = 0;
          const promise = kamiSound.play();
          if (promise && typeof promise.catch === "function") {
            promise.catch(() => {});
          }
        } catch (error) {
          console.warn("サウンドの再生に失敗しました:", error);
        }
      }

      const parentWindow = window.parent || window;

      if (typeof parentWindow.forceTeamsShuffle === "function") {
        Promise.resolve(parentWindow.forceTeamsShuffle()).finally(() => {
          if (typeof parentWindow.showTeam === "function") {
            parentWindow.showTeam(true);
          }
        });
      } else if (typeof parentWindow.showTeam === "function") {
        parentWindow.showTeam(true);
      }
    });
  }

  // 初回ロード
  document.addEventListener("DOMContentLoaded", loadPlayers);
})();
