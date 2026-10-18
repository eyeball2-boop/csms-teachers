import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  Student,
  ExamTermId,
  DEFAULT_SUBJECTS,
  EXAM_TERMS,
  getGradeLevel,
  SubjectImprovement,
  StudentAnalysis,
} from './types';
import { INITIAL_STUDENTS } from './services/mockData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/firebase';
import {
  createGradeSpreadsheet,
  syncDataToSpreadsheet,
  loadDataFromSpreadsheet,
} from './services/sheetsService';
import { sendChatMessage } from './services/chatService';
import { exportToSingleHtmlFile } from './utils/exportHtml';
import { saveStudentsToFirestore, loadStudentsFromFirestore } from './services/firestoreService';

import { Header } from './components/Header';
import { StudentList } from './components/StudentList';
import { ImprovementCharts } from './components/ImprovementCharts';
import { AnalysisSummaryCard } from './components/AnalysisSummaryCard';
import { ScoreTable } from './components/ScoreTable';
import { ScoreEntryModal } from './components/ScoreEntryModal';
import { StudentModal } from './components/StudentModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { GoogleChatModal } from './components/GoogleChatModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'ms_progress_students_v1';
const LOCAL_SHEET_KEY = 'ms_progress_sheet_id_v1';

export default function App() {
  // Students state with localStorage fallback
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STUDENTS;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return students[0]?.id || 'std-1';
  });

  // Google Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isFirebaseSaving, setIsFirebaseSaving] = useState<boolean>(false);

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem(LOCAL_SHEET_KEY) || '';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isScoreEntryOpen, setIsScoreEntryOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Confirmation Modal state for Workspace mutations
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Save to local storage whenever students changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Save spreadsheet ID to local storage
  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem(LOCAL_SHEET_KEY, spreadsheetId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    }
  }, [spreadsheetId]);

  // Init Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showToast(`${result.user.displayName || 'Google'} 계정으로 로그인되었습니다!`);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      showToast('로그인 중 문제가 발생했습니다. 팝업 차단 여부를 확인해주세요.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('로그아웃 되었습니다.', 'info');
  };

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Calculate detailed student analysis
  const studentAnalysis: StudentAnalysis = useMemo(() => {
    if (!selectedStudent || selectedStudent.records.length === 0) {
      return {
        student: selectedStudent || {
          id: '',
          name: '',
          grade: 2,
          classroom: 1,
          number: 1,
          targetGoal: '',
          records: [],
        },
        currentAverage: 0,
        previousAverage: 0,
        overallDelta: 0,
        topImprovedSubject: null,
        needsAttentionSubject: null,
        subjectImprovements: [],
        aiCommentary: '등록된 성적 데이터가 없습니다.',
      };
    }

    const firstRec = selectedStudent.records[0];
    const lastRec = selectedStudent.records[selectedStudent.records.length - 1];

    const getAvg = (r: (typeof selectedStudent.records)[0]) => {
      const vals = Object.values(r.scores);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const firstAvg = Number(getAvg(firstRec).toFixed(1));
    const lastAvg = Number(getAvg(lastRec).toFixed(1));
    const overallDelta = Number((lastAvg - firstAvg).toFixed(1));

    const improvements: SubjectImprovement[] = DEFAULT_SUBJECTS.map((sub) => {
      const prev = firstRec.scores[sub.id] ?? 0;
      const curr = lastRec.scores[sub.id] ?? 0;
      const delta = curr - prev;
      const deltaPercent = prev > 0 ? Number(((delta / prev) * 100).toFixed(1)) : 0;
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        color: sub.color,
        fromTerm: EXAM_TERMS.find((t) => t.id === firstRec.termId)?.name || firstRec.termId,
        toTerm: EXAM_TERMS.find((t) => t.id === lastRec.termId)?.name || lastRec.termId,
        previousScore: prev,
        currentScore: curr,
        delta,
        deltaPercent,
        fromGrade: getGradeLevel(prev),
        toGrade: getGradeLevel(curr),
        trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
      };
    });

    // Sort to find top improved and needs attention
    const sortedByDelta = [...improvements].sort((a, b) => b.delta - a.delta);
    const topImproved = sortedByDelta[0]?.delta > 0 ? sortedByDelta[0] : null;

    const sortedByScore = [...improvements].sort((a, b) => a.currentScore - b.currentScore);
    const needsAttention = sortedByScore[0] || null;

    // Rich pedagogical feedback commentary
    let commentary = `${selectedStudent.name} 학생은 ${firstRec.termId === lastRec.termId ? '현재 학기' : `${firstRec.termId}에서 ${lastRec.termId}까지`} 종합 평균이 ${firstAvg}점에서 ${lastAvg}점으로 `;
    if (overallDelta > 0) {
      commentary += `총 +${overallDelta}점 상승하여 매우 긍정적인 학업 성취 향상을 이루어냈습니다. `;
    } else if (overallDelta === 0) {
      commentary += `동일한 수준의 안정적인 점수대를 유지하고 있습니다. `;
    } else {
      commentary += `${Math.abs(overallDelta)}점 하향 조정되어 취약 단원의 보완 학습이 필요한 시기입니다. `;
    }

    if (topImproved) {
      commentary += `특히 [${topImproved.subjectName}] 과목에서 ${topImproved.previousScore}점에서 ${topImproved.currentScore}점으로 무려 +${topImproved.delta}점 도약하며 성취도 [${topImproved.toGrade}등급]을 달성한 점이 돋보입니다. `;
    }

    if (needsAttention && needsAttention.currentScore < 80) {
      commentary += `앞으로는 [${needsAttention.subjectName}] 과목(${needsAttention.currentScore}점, ${needsAttention.toGrade}등급)의 개념 정립과 서술형 문제 풀이에 비중을 두고 지도하면 추가적인 종합 성취도 향상이 기대됩니다.`;
    } else {
      commentary += `모든 교과에서 고른 역량을 발휘하고 있으므로 고난도 심화 탐구 및 흥미 중심 학습을 장려합니다.`;
    }

    return {
      student: selectedStudent,
      currentAverage: lastAvg,
      previousAverage: firstAvg,
      overallDelta,
      topImprovedSubject: topImproved,
      needsAttentionSubject: needsAttention,
      subjectImprovements: improvements,
      aiCommentary: commentary,
    };
  }, [selectedStudent]);

  // Save student profile (add or update)
  const handleSaveStudent = (data: Partial<Student>) => {
    if (data.id) {
      setStudents((prev) =>
        prev.map((s) => (s.id === data.id ? ({ ...s, ...data } as Student) : s))
      );
      showToast(`${data.name} 학생 정보가 수정되었습니다.`);
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        name: data.name || '새 학생',
        grade: data.grade || 2,
        classroom: data.classroom || 3,
        number: data.number || 1,
        targetGoal: data.targetGoal || '전과목 성취도 A 달성',
        notes: data.notes || '',
        records: [
          {
            termId: '1-mid',
            date: new Date().toISOString().slice(0, 10),
            scores: { korean: 75, math: 75, english: 75, science: 75, social: 75, ethics: 80, tech_home: 80 },
            feedback: '초기 성적 등록',
          },
        ],
      };
      setStudents((prev) => [...prev, newStudent]);
      setSelectedStudentId(newStudent.id);
      showToast(`${newStudent.name} 학생이 새로 등록되었습니다!`);
    }
  };

  // Delete student with confirmation dialog
  const handleDeleteStudent = (student: Student) => {
    setConfirmationState({
      isOpen: true,
      title: `${student.name} 학생 정보를 삭제하시겠습니까?`,
      description: `이 학생의 모든 학기별 시험 성적 및 향상도 데이터(${student.records.length}회 기록)가 영구적으로 삭제됩니다. 계속 진행하시겠습니까?`,
      confirmLabel: '삭제',
      isDestructive: true,
      action: async () => {
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
        if (selectedStudentId === student.id) {
          const remaining = students.filter((s) => s.id !== student.id);
          if (remaining.length > 0) {
            setSelectedStudentId(remaining[0].id);
          }
        }
        showToast(`${student.name} 학생 데이터가 삭제되었습니다.`, 'info');
      },
    });
  };

  // Save/update scores for a term
  const handleSaveScores = (
    studentId: string,
    termId: ExamTermId,
    newScores: Record<string, number>,
    date: string,
    feedback: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const existingIdx = s.records.findIndex((r) => r.termId === termId);
        let updatedRecords = [...s.records];
        if (existingIdx >= 0) {
          updatedRecords[existingIdx] = {
            termId,
            date,
            feedback,
            scores: newScores,
          };
        } else {
          updatedRecords.push({
            termId,
            date,
            feedback,
            scores: newScores,
          });
          // Sort records by term order
          updatedRecords.sort((a, b) => {
            const orderA = EXAM_TERMS.find((t) => t.id === a.termId)?.order || 0;
            const orderB = EXAM_TERMS.find((t) => t.id === b.termId)?.order || 0;
            return orderA - orderB;
          });
        }
        return { ...s, records: updatedRecords };
      })
    );
    showToast('시험 성적이 성공적으로 저장되었습니다!');
  };

  // Create new spreadsheet
  const handleCreateNewSheet = async () => {
    if (!token) {
      showToast('Google 로그인이 필요합니다.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await createGradeSpreadsheet(token);
      setSpreadsheetId(res.spreadsheetId);
      setSpreadsheetUrl(res.spreadsheetUrl);
      // Immediately populate initial data
      await syncDataToSpreadsheet(token, res.spreadsheetId, students);
      const timeStr = new Date().toLocaleTimeString('ko-KR');
      setLastSyncedTime(timeStr);
      showToast('새 구글 스프레드시트 DB가 성공적으로 생성 및 동기화되었습니다!');
    } catch (err: any) {
      console.error('Create sheet error:', err);
      showToast(err?.message || '스프레드시트 생성에 실패했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync to spreadsheet with explicit user confirmation (MANDATORY per Workspace guidelines)
  const handleRequestSyncToSheet = () => {
    if (!token) {
      showToast('Google 로그인이 필요합니다.', 'error');
      return;
    }
    if (!spreadsheetId) {
      showToast('연결된 스프레드시트가 없습니다.', 'error');
      return;
    }

    setConfirmationState({
      isOpen: true,
      title: 'Google Sheets DB에 현재 데이터를 저장하시겠습니까?',
      description: `연결된 스프레드시트의 '학생명부', '과목별성적DB', '향상도분석요약' 시트에 현재 등록된 학생 ${students.length}명의 모든 성적 데이터가 덮어쓰기 형태로 저장 및 업데이트됩니다.`,
      confirmLabel: '시트에 저장',
      isDestructive: false,
      action: async () => {
        setIsSyncing(true);
        try {
          await syncDataToSpreadsheet(token, spreadsheetId, students);
          const timeStr = new Date().toLocaleTimeString('ko-KR');
          setLastSyncedTime(timeStr);
          showToast('Google Sheets 스프레드시트에 성공적으로 저장되었습니다!');
        } catch (err: any) {
          console.error('Sync error:', err);
          showToast(err?.message || '스프레드시트 동기화 중 오류가 발생했습니다.', 'error');
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Load from spreadsheet with confirmation
  const handleRequestLoadFromSheet = () => {
    if (!token) {
      showToast('Google 로그인이 필요합니다.', 'error');
      return;
    }
    if (!spreadsheetId) {
      showToast('연결된 스프레드시트가 없습니다.', 'error');
      return;
    }

    setConfirmationState({
      isOpen: true,
      title: 'Google Sheets에서 데이터를 불러오시겠습니까?',
      description: `스프레드시트에 저장된 학생명부와 시험 성적을 불러와 현재 브라우저의 학생 목록을 교체합니다. 저장되지 않은 변경사항은 덮어쓰여집니다.`,
      confirmLabel: '데이터 불러오기',
      isDestructive: true,
      action: async () => {
        setIsSyncing(true);
        try {
          const loaded = await loadDataFromSpreadsheet(token, spreadsheetId);
          if (loaded.length === 0) {
            showToast('스프레드시트에서 학생 데이터를 찾지 못했습니다.', 'error');
          } else {
            setStudents(loaded);
            setSelectedStudentId(loaded[0].id);
            showToast(`스프레드시트에서 ${loaded.length}명의 학생 데이터를 성공적으로 불러왔습니다!`);
          }
        } catch (err: any) {
          console.error('Load error:', err);
          showToast(err?.message || '스프레드시트 데이터 불러오기에 실패했습니다.', 'error');
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Send report to Google Chat with confirmation
  const handleRequestSendChatMessage = (spaceName: string, text: string) => {
    if (!token) {
      showToast('Google 로그인이 필요합니다.', 'error');
      return;
    }

    setConfirmationState({
      isOpen: true,
      title: 'Google Chat 스페이스로 리포트를 발송하시겠습니까?',
      description: `선택하신 '${spaceName}' 스페이스에 ${selectedStudent?.name} 학생의 과목별 성적 향상도 종합 리포트 메시지가 게시됩니다.`,
      confirmLabel: '메시지 발송',
      isDestructive: false,
      action: async () => {
        try {
          await sendChatMessage(token, spaceName, text);
          showToast('Google Chat 스페이스로 향상도 리포트가 성공적으로 발송되었습니다!');
          setIsChatModalOpen(false);
        } catch (err: any) {
          console.error('Send message error:', err);
          showToast(err?.message || '메시지 발송 실패', 'error');
        }
      },
    });
  };

  const handleSaveToFirebase = async () => {
    setIsFirebaseSaving(true);
    try {
      await saveStudentsToFirestore(students);
      showToast('Firebase Firestore (db-pracitce-c0c18) DB에 학생 성적이 저장되었습니다!');
    } catch (err: any) {
      console.error('Firebase save error:', err);
      showToast(err?.message || 'Firebase 저장에 실패했습니다. Firestore 규칙을 확인해주세요.', 'error');
    } finally {
      setIsFirebaseSaving(false);
    }
  };

  const handleLoadFromFirebase = async () => {
    try {
      const loaded = await loadStudentsFromFirestore();
      if (loaded.length === 0) {
        showToast('Firebase Firestore에 저장된 학생 데이터가 없습니다.', 'error');
      } else {
        setStudents(loaded);
        setSelectedStudentId(loaded[0].id);
        showToast(`Firebase DB에서 학생 ${loaded.length}명의 데이터를 불러왔습니다!`);
      }
    } catch (err: any) {
      console.error('Firebase load error:', err);
      showToast(err?.message || 'Firebase 불러오기에 실패했습니다.', 'error');
    }
  };

  const handleExportHtml = () => {
    exportToSingleHtmlFile(students, '중학생 학업 성취도 관리');
    showToast('Firebase DB가 연동된 단일 HTML 파일 다운로드가 시작되었습니다!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-18 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2.5 max-w-md ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenChatModal={() => setIsChatModalOpen(true)}
        onOpenAddStudentModal={() => {
          setStudentToEdit(null);
          setIsStudentModalOpen(true);
        }}
        onExportHtml={handleExportHtml}
        onSaveToFirebase={handleSaveToFirebase}
        onLoadFromFirebase={handleLoadFromFirebase}
        isFirebaseSaving={isFirebaseSaving}
        sheetConnected={Boolean(spreadsheetId)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student List & Filter */}
          <div className="lg:col-span-4 xl:col-span-3 h-[780px] lg:sticky lg:top-20">
            <StudentList
              students={students}
              selectedStudentId={selectedStudentId}
              onSelectStudent={(s) => setSelectedStudentId(s.id)}
              onEditStudent={(s) => {
                setStudentToEdit(s);
                setIsStudentModalOpen(true);
              }}
              onDeleteStudent={handleDeleteStudent}
            />
          </div>

          {/* Right Column: Selected Student's Improvement Dashboard */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {selectedStudent ? (
              <>
                {/* Student Profile Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-100">
                      {selectedStudent.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {selectedStudent.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {selectedStudent.grade}학년 {selectedStudent.classroom}반 {selectedStudent.number}번
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">목표:</span>
                        <span>{selectedStudent.targetGoal || '설정된 학업 목표 없음'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setIsScoreEntryOpen(true)}
                      className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      + 시험 성적 입력
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChatModalOpen(true)}
                      className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Chat 리포트
                    </button>
                  </div>
                </div>

                {/* 1. Analysis Summary Cards (MVP Subject, Overall Delta, Guidance) */}
                <AnalysisSummaryCard
                  analysis={studentAnalysis}
                  onSendToChatClick={() => setIsChatModalOpen(true)}
                />

                {/* 2. Interactive Improvement Charts (Line, Delta Bar, Radar) */}
                <ImprovementCharts
                  student={selectedStudent}
                  improvements={studentAnalysis.subjectImprovements}
                />

                {/* 3. Detailed Matrix Score Table */}
                <ScoreTable
                  student={selectedStudent}
                  onOpenScoreEntry={() => setIsScoreEntryOpen(true)}
                />
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                선택된 학생이 없습니다. 좌측에서 학생을 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedStudent && (
        <ScoreEntryModal
          isOpen={isScoreEntryOpen}
          student={selectedStudent}
          onClose={() => setIsScoreEntryOpen(false)}
          onSaveScores={handleSaveScores}
        />
      )}

      <StudentModal
        isOpen={isStudentModalOpen}
        studentToEdit={studentToEdit}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        onSaveStudent={handleSaveStudent}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        user={user}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
        onClose={() => setIsSheetsModalOpen(false)}
        onLogin={handleLogin}
        onCreateNewSheet={handleCreateNewSheet}
        onConnectExistingSheet={(id) => {
          setSpreadsheetId(id);
          showToast(`스프레드시트 ID(${id})가 성공적으로 연결되었습니다.`);
        }}
        onSyncToSheet={handleRequestSyncToSheet}
        onLoadFromSheet={handleRequestLoadFromSheet}
      />

      <GoogleChatModal
        isOpen={isChatModalOpen}
        user={user}
        accessToken={token}
        analysis={studentAnalysis}
        onClose={() => setIsChatModalOpen(false)}
        onLogin={handleLogin}
        onRequestSendMessage={handleRequestSendChatMessage}
      />

      {/* Workspace Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        description={confirmationState.description}
        confirmLabel={confirmationState.confirmLabel}
        isDestructive={confirmationState.isDestructive}
        isLoading={confirmationState.isLoading}
        onCancel={() => setConfirmationState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (confirmationState.action) {
            setConfirmationState((prev) => ({ ...prev, isLoading: true }));
            try {
              await confirmationState.action();
            } finally {
              setConfirmationState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
            }
          } else {
            setConfirmationState((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      />
    </div>
  );
}
