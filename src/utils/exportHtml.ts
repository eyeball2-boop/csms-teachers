import { Student, DEFAULT_SUBJECTS, EXAM_TERMS } from '../types';

/**
 * Creates and triggers a download of a complete, standalone, self-contained single HTML file
 * connected to Firebase Firestore and containing the full student grade database and charts.
 */
export function exportToSingleHtmlFile(students: Student[], schoolName: string = '중학교'): void {
  const jsonData = JSON.stringify(students, null, 2);
  const subjectsData = JSON.stringify(DEFAULT_SUBJECTS);
  const termsData = JSON.stringify(EXAM_TERMS);

  const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schoolName} 과목별 수업 향상도 분석 시스템 (Firebase 연동)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-light: #eef2ff;
      --success: #10b981;
      --success-light: #ecfdf5;
      --warning: #f59e0b;
      --warning-light: #fffbeb;
      --danger: #ef4444;
      --danger-light: #fef2f2;
      --border: #e2e8f0;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 20px; line-height: 1.5; }
    .container { max-width: 1300px; margin: 0 auto; }
    header {
      background: #ffffff; padding: 20px 24px; border-radius: 20px;
      border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
      margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-badge {
      width: 44px; height: 44px; border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 22px;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
    }
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    .sub-desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .actions-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 12px;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-firebase { background: #ff9100; color: #fff; }
    .btn-firebase:hover { background: #e08100; }
    .btn-outline { background: #fff; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover { background: #f1f5f9; }
    .badge { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
    .badge-success { background: var(--success-light); color: var(--success); }
    .badge-primary { background: var(--primary-light); color: var(--primary); }
    .main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
    @media (max-width: 980px) { .main-grid { grid-template-columns: 1fr; } }
    .sidebar { background: #ffffff; border-radius: 20px; border: 1px solid var(--border); padding: 18px; height: fit-content; }
    .search-box { width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border); font-size: 13px; margin-bottom: 12px; background: #f8fafc; }
    .search-box:focus { outline: none; border-color: var(--primary); background: #fff; }
    .student-item {
      padding: 12px 14px; border-radius: 14px; margin-bottom: 8px; cursor: pointer;
      border: 1px solid transparent; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; background: #fff;
    }
    .student-item:hover { background: #f8fafc; border-color: var(--border); }
    .student-item.active { background: var(--primary-light); border-color: #c7d2fe; }
    .student-avatar {
      width: 38px; height: 38px; border-radius: 12px; background: #e2e8f0;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #475569;
    }
    .student-item.active .student-avatar { background: var(--primary); color: #fff; }
    .card { background: #ffffff; border-radius: 20px; border: 1px solid var(--border); padding: 24px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02); }
    .student-banner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1px solid var(--border); border-radius: 16px; padding: 18px; }
    .stat-card.highlight { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-color: #bbf7d0; }
    .stat-label { font-size: 13px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; }
    .stat-value { font-size: 26px; font-weight: 800; color: #0f172a; }
    .stat-value.up { color: var(--success); }
    .stat-value.down { color: var(--danger); }
    .tabs-bar { display: flex; gap: 8px; margin-bottom: 16px; background: #f1f5f9; padding: 4px; border-radius: 12px; width: fit-content; }
    .tab-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; background: transparent; cursor: pointer; color: var(--text-muted); }
    .tab-btn.active { background: #fff; color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .table-container { overflow-x: auto; margin-top: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: center; }
    th, td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
    th { background: #f8fafc; font-weight: 700; color: #475569; }
    td.left { text-align: left; }
    .grade-badge { display: inline-block; width: 28px; height: 28px; line-height: 28px; border-radius: 8px; font-weight: 800; font-size: 12px; }
    .grade-A { background: #dcfce7; color: #16a34a; }
    .grade-B { background: #e0e7ff; color: #4338ca; }
    .grade-C { background: #fef3c7; color: #d97706; }
    .grade-D { background: #ffedd5; color: #ea580c; }
    .grade-E { background: #fee2e2; color: #dc2626; }
    .db-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 9999px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  </style>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
    import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBGvHU-OoXEBF-4hIQXfFrncfY8G5JjPQo",
      authDomain: "db-pracitce-c0c18.firebaseapp.com",
      projectId: "db-pracitce-c0c18",
      storageBucket: "db-pracitce-c0c18.firebasestorage.app",
      messagingSenderId: "60361713564",
      appId: "1:60361713564:web:bd058c53606c37e22dca59",
      measurementId: "G-9C0Z5QTQ5T"
    };

    let app, analytics, db;
    try {
      app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      db = getFirestore(app);
      window.firebaseDb = db;
    } catch(e) {
      console.warn("Firebase Init:", e);
    }

    window.saveAllStudentsToFirebase = async function() {
      if (!db) { alert("Firebase가 초기화되지 않았습니다."); return; }
      try {
        const btn = document.getElementById('saveDbBtn');
        btn.innerText = '⏳ 저장 중...';
        for (const s of window.currentStudents) {
          await setDoc(doc(db, "middle_school_students", s.id), s);
        }
        btn.innerText = '✅ Firebase 저장 완료!';
        setTimeout(() => { btn.innerText = '🔥 Firebase DB에 저장'; }, 2000);
        alert("학생 데이터가 Firebase Firestore에 성공적으로 저장되었습니다!");
      } catch (err) {
        console.error(err);
        alert("Firebase 저장 실패: " + err.message);
      }
    };

    window.loadStudentsFromFirebase = async function() {
      if (!db) { alert("Firebase가 연결되지 않았습니다."); return; }
      try {
        const snapshot = await getDocs(collection(db, "middle_school_students"));
        const loaded = [];
        snapshot.forEach(d => loaded.push(d.data()));
        if (loaded.length === 0) {
          alert("Firebase에 저장된 데이터가 없습니다. 먼저 저장 버튼을 눌러보세요.");
          return;
        }
        window.currentStudents = loaded;
        window.renderAll();
        alert("Firebase DB에서 학생 " + loaded.length + "명의 데이터를 성공적으로 불러왔습니다!");
      } catch (err) {
        alert("불러오기 실패: " + err.message);
      }
    };
  </script>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo-badge">🎓</div>
        <div>
          <h1>${schoolName} 과목별 수업 향상도 분석 시스템</h1>
          <div class="sub-desc">Firebase DB 연동 및 독립 실행형 단일 HTML 파일 | 저장일시: ${new Date().toLocaleString('ko-KR')}</div>
        </div>
      </div>
      <div class="actions-bar">
        <div class="db-status"><span class="dot"></span><span>Firebase DB (db-pracitce-c0c18)</span></div>
        <button id="saveDbBtn" class="btn btn-firebase" onclick="window.saveAllStudentsToFirebase()">🔥 Firebase DB에 저장</button>
        <button class="btn btn-outline" onclick="window.loadStudentsFromFirebase()">🔄 Firebase에서 불러오기</button>
        <button class="btn btn-outline" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
      </div>
    </header>

    <div class="main-grid">
      <div class="sidebar">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-weight:800; font-size:15px;">
          <span>👥 학생 명단 (<span id="studentCountBadge">0</span>)</span>
        </div>
        <input type="text" id="searchInput" placeholder="학생 이름 검색..." class="search-box" oninput="renderList()" />
        <div id="studentListContainer"></div>
      </div>

      <div class="content-area">
        <div class="card">
          <div class="student-banner">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h2 id="curName" style="font-size:24px; font-weight:800;">학생명</h2>
                <span id="curClass" class="badge badge-primary">2학년 3반</span>
              </div>
              <p id="curGoal" style="font-size:13px; color:var(--primary); font-weight:600; margin-top:4px;"></p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">1학기 중간고사 평점</div>
              <div class="stat-value" id="valInitAvg">0.0점</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">최근 시험 종합 평균</div>
              <div class="stat-value" id="valCurAvg">0.0점</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-label">종합 향상도 (Δ 점수)</div>
              <div class="stat-value up" id="valDelta">+0.0점</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">🌟 최고 성장 MVP 과목</div>
              <div class="stat-value" id="valTopSub" style="font-size:20px; color:var(--primary);">-</div>
            </div>
          </div>

          <div style="margin-top:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:16px; font-weight:800;">📊 과목별 학업 향상도 시각화 차트</h3>
              <div class="tabs-bar">
                <button class="tab-btn active" id="tabLine" onclick="setTab('line')">📈 성적 추이</button>
                <button class="tab-btn" id="tabBar" onclick="setTab('bar')">📊 과목별 향상도(Δ)</button>
              </div>
            </div>
            <div id="chartBox" style="min-height:260px; background:#fff; border:1px solid var(--border); border-radius:16px; padding:16px;"></div>
          </div>

          <div style="margin-top:30px;">
            <h3 style="font-size:16px; font-weight:800; margin-bottom:12px;">📝 과목별 지필·수행평가 성적 상세표</h3>
            <div class="table-container">
              <table>
                <thead><tr id="matrixHeader"></tr></thead>
                <tbody id="matrixBody"></tbody>
              </table>
            </div>
          </div>

          <div style="margin-top:24px; padding:18px; border-radius:16px; background:#f8fafc; border:1px solid var(--border);">
            <div style="font-weight:800; font-size:14px; margin-bottom:6px; color:#1e293b;">💡 담당 교사 종합 학업 성장 분석 & 지도 조언</div>
            <p id="teacherFeedback" style="font-size:13px; color:#475569; line-height:1.7;"></p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const subjects = ${subjectsData};
    const terms = ${termsData};
    window.currentStudents = ${jsonData};
    let selIdx = 0;
    let currentTab = 'line';

    function getGrade(sc) {
      if (sc >= 90) return 'A';
      if (sc >= 80) return 'B';
      if (sc >= 70) return 'C';
      if (sc >= 60) return 'D';
      return 'E';
    }

    function calcAvg(rec) {
      if (!rec || !rec.scores) return 0;
      const v = Object.values(rec.scores);
      return v.length ? Number((v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)) : 0;
    }

    function renderList() {
      const c = document.getElementById('studentListContainer');
      const q = document.getElementById('searchInput').value.toLowerCase();
      c.innerHTML = '';
      window.currentStudents.forEach((s, i) => {
        if (q && !s.name.toLowerCase().includes(q)) return;
        const f = calcAvg(s.records[0]);
        const l = calcAvg(s.records[s.records.length - 1]);
        const d = Number((l - f).toFixed(1));
        const div = document.createElement('div');
        div.className = 'student-item' + (i === selIdx ? ' active' : '');
        div.onclick = () => { selIdx = i; renderAll(); };
        div.innerHTML = '<div style="display:flex; align-items:center; gap:10px;"><div class="student-avatar">' + s.name.slice(0,2) + '</div><div><div style="font-weight:700;">' + s.name + '</div><div style="font-size:12px; color:var(--text-muted);">' + s.grade + '학년 ' + s.classroom + '반 ' + s.number + '번</div></div></div><div style="text-align:right;"><div style="font-weight:800; color:' + (d>=0?'#10b981':'#ef4444') + ';">' + (d>=0?'+':'') + d + '점</div><div style="font-size:11px; color:#64748b;">평균 ' + l + '점</div></div>';
        c.appendChild(div);
      });
      document.getElementById('studentCountBadge').innerText = window.currentStudents.length + '명';
    }

    function renderDetail() {
      const s = window.currentStudents[selIdx];
      if (!s) return;
      document.getElementById('curName').innerText = s.name;
      document.getElementById('curClass').innerText = s.grade + '학년 ' + s.classroom + '반 ' + s.number + '번';
      document.getElementById('curGoal').innerText = '🎯 목표: ' + (s.targetGoal || '전과목 성취도 향상');

      const f = calcAvg(s.records[0]);
      const l = calcAvg(s.records[s.records.length - 1]);
      const d = Number((l - f).toFixed(1));

      document.getElementById('valInitAvg').innerText = f + '점';
      document.getElementById('valCurAvg').innerText = l + '점';
      document.getElementById('valDelta').innerText = (d>=0?'+':'') + d + '점';
      document.getElementById('valDelta').className = 'stat-value ' + (d>=0?'up':'down');

      let maxDiff = -999, topSub = '없음';
      subjects.forEach(sub => {
        const diff = (s.records[s.records.length - 1]?.scores[sub.id] || 0) - (s.records[0]?.scores[sub.id] || 0);
        if (diff > maxDiff) { maxDiff = diff; topSub = sub.name + ' (+' + diff + '점)'; }
      });
      document.getElementById('valTopSub').innerText = topSub;

      // Table
      const mH = document.getElementById('matrixHeader');
      mH.innerHTML = '<th class="left">교과목</th>' + s.records.map(r => {
        const t = terms.find(x => x.id === r.termId);
        return '<th>' + (t ? t.name : r.termId) + '</th>';
      }).join('') + '<th style="background:#eef2ff; color:#4338ca;">총 향상도(Δ)</th><th>성취도</th>';

      const mB = document.getElementById('matrixBody');
      mB.innerHTML = '';
      subjects.forEach(sub => {
        const startSc = s.records[0]?.scores[sub.id] ?? '-';
        const endSc = s.records[s.records.length - 1]?.scores[sub.id] ?? '-';
        const diff = (typeof startSc==='number' && typeof endSc==='number') ? endSc - startSc : 0;
        const gr = typeof endSc==='number' ? getGrade(endSc) : '-';

        let row = '<td class="left" style="font-weight:700;"><span style="color:' + sub.color + '">●</span> ' + sub.name + '</td>';
        s.records.forEach(r => { row += '<td>' + (r.scores[sub.id] !== undefined ? r.scores[sub.id] + '점' : '-') + '</td>'; });
        row += '<td style="font-weight:800; color:' + (diff>0?'#10b981':diff<0?'#ef4444':'#64748b') + '; background:#f5f7ff;">' + (diff>0?'+':'') + diff + '점</td>';
        row += '<td><span class="grade-badge grade-' + gr + '">' + gr + '</span></td>';

        const tr = document.createElement('tr');
        tr.innerHTML = row;
        mB.appendChild(tr);
      });

      // Chart
      renderChart(s);

      document.getElementById('teacherFeedback').innerText = s.name + ' 학생은 시작 시험(평균 ' + f + '점) 대비 최근 시험(평균 ' + l + '점)에서 종합 성적이 ' + (d>=0?'+':'') + d + '점 향상되었습니다. 특히 [' + topSub + '] 과목에서 두드러진 성장을 보였습니다.';
    }

    function renderChart(s) {
      const box = document.getElementById('chartBox');
      const w = 720, h = 240;
      if (currentTab === 'line') {
        const pad = { top: 20, right: 30, bottom: 40, left: 45 };
        const innerW = w - pad.left - pad.right;
        const innerH = h - pad.top - pad.bottom;
        let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%; height:auto;">';
        [0, 20, 40, 60, 80, 90, 100].forEach(sc => {
          const y = pad.top + innerH - (sc/100)*innerH;
          svg += '<line x1="' + pad.left + '" y1="' + y + '" x2="' + (w - pad.right) + '" y2="' + y + '" stroke="' + (sc===90?'#bbf7d0':'#f1f5f9') + '" stroke-width="' + (sc===90?2:1) + '"/>';
          svg += '<text x="' + (pad.left - 8) + '" y="' + (y + 4) + '" fill="#94a3b8" font-size="11" text-anchor="end">' + sc + '</text>';
        });
        s.records.forEach((r, idx) => {
          const t = terms.find(x => x.id === r.termId);
          const x = pad.left + (idx / Math.max(1, s.records.length - 1)) * innerW;
          svg += '<text x="' + x + '" y="' + (h - 12) + '" fill="#475569" font-size="12" font-weight="600" text-anchor="middle">' + (t ? t.shortName : r.termId) + '</text>';
        });
        subjects.slice(0, 5).forEach(sub => {
          const pts = s.records.map((r, idx) => {
            const sc = r.scores[sub.id] || 0;
            const x = pad.left + (idx / Math.max(1, s.records.length - 1)) * innerW;
            const y = pad.top + innerH - (sc/100)*innerH;
            return { x, y };
          });
          if (pts.length > 1) {
            svg += '<path d="' + pts.map((p, i) => (i===0?'M':'L') + p.x + ' ' + p.y).join(' ') + '" fill="none" stroke="' + sub.color + '" stroke-width="2.5" stroke-linecap="round"/>';
          }
          pts.forEach(p => {
            svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4.5" fill="#fff" stroke="' + sub.color + '" stroke-width="2.5"/>';
          });
        });
        svg += '</svg>';
        box.innerHTML = svg;
      } else {
        let html = '<div style="width:100%; display:flex; flex-direction:column; gap:8px;">';
        subjects.forEach(sub => {
          const startSc = s.records[0]?.scores[sub.id] || 0;
          const endSc = s.records[s.records.length - 1]?.scores[sub.id] || 0;
          const diff = endSc - startSc;
          const barW = Math.min(100, Math.max(6, Math.abs(diff)*4));
          const color = diff>0?'#10b981':diff<0?'#ef4444':'#94a3b8';
          html += '<div style="display:flex; align-items:center; gap:12px; font-size:13px;"><span style="width:70px; font-weight:700;">' + sub.name + '</span><div style="flex:1; background:#f1f5f9; height:24px; border-radius:8px; display:flex; align-items:center; padding:0 8px;"><div style="height:14px; border-radius:4px; width:' + barW + '%; background:' + color + ';"></div><span style="font-size:12px; margin-left:8px; color:#475569;">' + startSc + '점 ➡️ ' + endSc + '점</span></div><span style="width:65px; text-align:right; font-weight:800; color:' + color + ';">' + (diff>0?'+':'') + diff + '점</span></div>';
        });
        html += '</div>';
        box.innerHTML = html;
      }
    }

    function setTab(tab) {
      currentTab = tab;
      document.getElementById('tabLine').className = 'tab-btn' + (tab==='line'?' active':'');
      document.getElementById('tabBar').className = 'tab-btn' + (tab==='bar'?' active':'');
      renderChart(window.currentStudents[selIdx]);
    }

    window.renderAll = function() {
      renderList();
      renderDetail();
    };

    window.renderAll();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `중학생_수업향상도_FirebaseDB_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
