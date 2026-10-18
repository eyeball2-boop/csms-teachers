import React, { useState, useEffect } from 'react';
import { Student, ExamTermId, EXAM_TERMS, DEFAULT_SUBJECTS, getGradeLevel } from '../types';
import { X, Save, Calculator } from 'lucide-react';

interface ScoreEntryModalProps {
  isOpen: boolean;
  student: Student;
  onClose: () => void;
  onSaveScores: (studentId: string, termId: ExamTermId, scores: Record<string, number>, date: string, feedback: string) => void;
}

export const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({
  isOpen,
  student,
  onClose,
  onSaveScores,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<ExamTermId>('2-final');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      // Find existing record for this term if any
      const existing = student.records.find((r) => r.termId === selectedTerm);
      if (existing) {
        setScores({ ...existing.scores });
        setDate(existing.date || new Date().toISOString().slice(0, 10));
        setFeedback(existing.feedback || '');
      } else {
        // Default default 75 or previous term scores
        const prevRec = student.records[student.records.length - 1];
        const initialScores: Record<string, number> = {};
        DEFAULT_SUBJECTS.forEach((s) => {
          initialScores[s.id] = prevRec?.scores[s.id] ?? 75;
        });
        setScores(initialScores);
        setFeedback('');
      }
    }
  }, [isOpen, selectedTerm, student]);

  if (!isOpen) return null;

  const handleScoreChange = (subjectId: string, valueStr: string) => {
    const val = valueStr === '' ? 0 : Math.min(100, Math.max(0, parseInt(valueStr, 10) || 0));
    setScores((prev) => ({
      ...prev,
      [subjectId]: val,
    }));
  };

  const currentValues = Object.values(scores);
  const average = currentValues.length
    ? Number((currentValues.reduce((a, b) => a + b, 0) / currentValues.length).toFixed(1))
    : 0;
  const grade = getGradeLevel(average);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveScores(student.id, selectedTerm, scores, date, feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {student.name} 학생 시험 성적 입력
            </h3>
            <p className="text-xs text-slate-500">
              {student.grade}학년 {student.classroom}반 {student.number}번
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Term Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              시험 차수 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXAM_TERMS.map((term) => (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => setSelectedTerm(term.id)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    selectedTerm === term.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {term.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                시험 시행일
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                학업 목표 리마인드
              </label>
              <div className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl truncate">
                {student.targetGoal || '설정된 목표 없음'}
              </div>
            </div>
          </div>

          {/* Subject Scores Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                과목별 점수 (0~100점)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <Calculator className="w-3.5 h-3.5 text-slate-400" />
                <span>예상 평균: <strong className="text-indigo-600">{average}점</strong></span>
                <span className="px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-800 text-[10px]">
                  {grade}등급
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_SUBJECTS.map((sub) => {
                const val = scores[sub.id] ?? 0;
                const subGrade = getGradeLevel(val);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {sub.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores[sub.id] ?? ''}
                        onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                        className="w-16 px-2 py-1 text-xs sm:text-sm font-bold text-center border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {subGrade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              지도 교사 시험 총평 / 피드백 메모
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="예: 수학 서술형 문항 해결력이 대폭 향상되었으며, 과학 계산 문제 오답률이 줄어듦."
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              성적 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
