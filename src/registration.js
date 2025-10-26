(() => {
  const db = window.db || firebase.firestore();
  const gradeInput = document.getElementById("grade");
  const gradeButtons = document.querySelectorAll(".grade-button");
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

  const getGradePoints = grade => GRADE_POINTS[grade] ?? DEFAULT_GRADE_POINTS;

  gradeButtons.forEach(button => {
    button.addEventListener("click", () => {
      gradeButtons.forEach(btn => btn.classList.remove("is-selected"));
      button.classList.add("is-selected");
      gradeInput.value = button.dataset.grade;
    });
  });

  function addPlayer() {
    const name = document.getElementById("name").value;
    const grade = gradeInput.value.trim();

    if (!name || !grade) {
      alert("名前と学年を正しく入力してください");
      return;
    }

    db.collection("players").add({
      name: name,
      grade: grade,
      points: getGradePoints(grade),
      participating: false
    })
    .then(() => {
      document.getElementById("name").value = "";
      gradeInput.value = "";
      gradeButtons.forEach(btn => btn.classList.remove("is-selected"));
    })
    .catch(error => {
      console.error("エラー:", error);
    });
  }

  // HTML の onclick から利用できるように公開
  window.addPlayer = addPlayer;
})();
