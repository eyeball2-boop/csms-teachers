import { Student, ScoreRecord, ExamTermId, EXAM_TERMS, DEFAULT_SUBJECTS } from '../types';

export interface CreateSheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Creates a brand new Google Spreadsheet with structured tables for Middle School Grade & Improvement Tracking
 */
export async function createGradeSpreadsheet(
  accessToken: string,
  title: string = `중학생 과목별 성적 및 향상도 관리 DB (${new Date().toLocaleDateString('ko-KR')})`
): Promise<CreateSheetResponse> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: '학생명부',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
      {
        properties: {
          title: '과목별성적DB',
          gridProperties: { rowCount: 200, columnCount: 15 },
        },
      },
      {
        properties: {
          title: '향상도분석요약',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `스프레드시트 생성 실패 (상태: ${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Saves all students, test score records, and improvement stats to the connected Google Spreadsheet.
 */
export async function syncDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  students: Student[]
): Promise<void> {
  const studentRows: (string | number)[][] = [
    ['학생ID', '학년', '반', '번호', '이름', '학업목표', '선생님메모', '마지막동기화'],
    ...students.map((s) => [
      s.id,
      `${s.grade}학년`,
      `${s.classroom}반`,
      s.number,
      s.name,
      s.targetGoal,
      s.notes || '',
      new Date().toLocaleString('ko-KR'),
    ]),
  ];

  const scoreRows: (string | number)[][] = [
    [
      '학생ID',
      '이름',
      '학기/시험명',
      '시험일자',
      '국어',
      '수학',
      '영어',
      '과학',
      '사회·역사',
      '도덕',
      '기술·가정',
      '총점',
      '평균점수',
      '교사피드백',
    ],
  ];

  students.forEach((s) => {
    s.records.forEach((rec) => {
      const termInfo = EXAM_TERMS.find((t) => t.id === rec.termId);
      const termName = termInfo?.name || rec.termId;
      const scores = rec.scores;
      const kor = scores.korean ?? 0;
      const math = scores.math ?? 0;
      const eng = scores.english ?? 0;
      const sci = scores.science ?? 0;
      const soc = scores.social ?? 0;
      const eth = scores.ethics ?? 0;
      const tech = scores.tech_home ?? 0;
      const total = kor + math + eng + sci + soc + eth + tech;
      const avg = Number((total / 7).toFixed(1));

      scoreRows.push([
        s.id,
        s.name,
        termName,
        rec.date || '',
        kor,
        math,
        eng,
        sci,
        soc,
        eth,
        tech,
        total,
        avg,
        rec.feedback || '',
      ]);
    });
  });

  const improvementRows: (string | number)[][] = [
    [
      '학생ID',
      '이름',
      '1학기 중간 평균',
      '최신 시험 평균',
      '누적 평균 향상도(Δ)',
      '최대 향상 과목',
      '과목 향상점수',
      '총평 요약',
    ],
  ];

  students.forEach((s) => {
    if (s.records.length > 0) {
      const firstRec = s.records[0];
      const lastRec = s.records[s.records.length - 1];

      const getAvg = (r: ScoreRecord) => {
        const vals = Object.values(r.scores);
        if (vals.length === 0) return 0;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      };

      const firstAvg = Number(getAvg(firstRec).toFixed(1));
      const lastAvg = Number(getAvg(lastRec).toFixed(1));
      const deltaAvg = Number((lastAvg - firstAvg).toFixed(1));

      let maxDelta = -999;
      let topSubject = '없음';

      DEFAULT_SUBJECTS.forEach((sub) => {
        const fromScore = firstRec.scores[sub.id];
        const toScore = lastRec.scores[sub.id];
        if (fromScore !== undefined && toScore !== undefined) {
          const diff = toScore - fromScore;
          if (diff > maxDelta) {
            maxDelta = diff;
            topSubject = sub.name;
          }
        }
      });

      improvementRows.push([
        s.id,
        s.name,
        firstAvg,
        lastAvg,
        deltaAvg >= 0 ? `+${deltaAvg}점` : `${deltaAvg}점`,
        topSubject,
        maxDelta >= 0 ? `+${maxDelta}점` : `${maxDelta}점`,
        `${s.name} 학생의 과목별 성취도 향상 진행 중`,
      ]);
    }
  });

  // Batch update values
  const updateData = [
    {
      range: '학생명부!A1:H100',
      values: studentRows,
    },
    {
      range: '과목별성적DB!A1:N250',
      values: scoreRows,
    },
    {
      range: '향상도분석요약!A1:H100',
      values: improvementRows,
    },
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updateData,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `스프레드시트 저장 실패 (상태: ${res.status})`);
  }
}

/**
 * Loads student list and scores from a connected Google Spreadsheet.
 */
export async function loadDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Student[]> {
  const resStudents = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/학생명부!A2:G100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!resStudents.ok) {
    throw new Error('학생명부 시트를 읽을 수 없습니다. 시트 권한 또는 형식을 확인해주세요.');
  }

  const dataStudents = await resStudents.json();
  const rawStudents = dataStudents.values || [];

  const resScores = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/과목별성적DB!A2:N250`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const dataScores = await resScores.json();
  const rawScores = dataScores.values || [];

  const studentsMap = new Map<string, Student>();

  rawStudents.forEach((row: string[]) => {
    if (!row || row.length < 5) return;
    const id = row[0] || `std-${Date.now()}`;
    const grade = parseInt(row[1]?.replace(/[^0-9]/g, '') || '2', 10);
    const classroom = parseInt(row[2]?.replace(/[^0-9]/g, '') || '1', 10);
    const num = parseInt(row[3] || '1', 10);
    const name = row[4];
    const targetGoal = row[5] || '';
    const notes = row[6] || '';

    studentsMap.set(id, {
      id,
      name,
      grade,
      classroom,
      number: num,
      targetGoal,
      notes,
      records: [],
    });
  });

  // Attach score records
  rawScores.forEach((row: (string | number)[]) => {
    if (!row || row.length < 11) return;
    const studentId = String(row[0]);
    const termLabel = String(row[2]);
    const date = String(row[3]);
    const kor = Number(row[4]) || 0;
    const math = Number(row[5]) || 0;
    const eng = Number(row[6]) || 0;
    const sci = Number(row[7]) || 0;
    const soc = Number(row[8]) || 0;
    const eth = Number(row[9]) || 0;
    const tech = Number(row[10]) || 0;
    const feedback = row[13] ? String(row[13]) : '';

    let termId: ExamTermId = '1-mid';
    if (termLabel.includes('1학기 중간') || termLabel.includes('1-중간')) termId = '1-mid';
    else if (termLabel.includes('1학기 기말') || termLabel.includes('1-기말')) termId = '1-final';
    else if (termLabel.includes('2학기 중간') || termLabel.includes('2-중간')) termId = '2-mid';
    else if (termLabel.includes('2학기 기말') || termLabel.includes('2-기말')) termId = '2-final';

    const targetStudent = studentsMap.get(studentId);
    if (targetStudent) {
      targetStudent.records.push({
        termId,
        date,
        feedback,
        scores: {
          korean: kor,
          math: math,
          english: eng,
          science: sci,
          social: soc,
          ethics: eth,
          tech_home: tech,
        },
      });
    }
  });

  return Array.from(studentsMap.values());
}
