import React from 'react';
import { Student, DEFAULT_SUBJECTS, EXAM_TERMS, getGradeLevel } from '../types';
import { PlusCircle, FileText, CheckCircle2 } from 'lucide-react';

interface ScoreTableProps {
  student: Student;
  onOpenScoreEntry: () => void;
}

export const ScoreTable: React.FC<ScoreTableProps> = ({
  student,
  onOpenScoreEntry,
}) => {
  const records = student.records;
  const firstRecord = records[0];
  const lastRecord = records[records.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            과목별 지필·수행평가 성적 상세 기록표
          </h3>
          <span className="text-xs text-slate-400">| 중학교 성취평가제(A~E) 적용</span>
        </div>

        <button
          type="button"
          onClick={onOpenScoreEntry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>시험 성적 입력 / 수정</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4 w-32">교과목</th>
              {records.map((r) => {
                const termInfo = EXAM_TERMS.find((t) => t.id === r.termId);
                return (
                  <th key={r.termId} className="py-3 px-4 text-center min-w-[100px]">
                    <div>{termInfo?.name || r.termId}</div>
                    {r.date && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        {r.date}
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="py-3 px-4 text-center w-28 bg-indigo-50/40 text-indigo-900">
                총 향상도 (Δ)
              </th>
              <th className="py-3 px-4 text-center w-24">최근 성취도</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {DEFAULT_SUBJECTS.map((sub) => {
              const startVal = firstRecord?.scores[sub.id];
              const lastVal = lastRecord?.scores[sub.id];
              const hasComparison =
                typeof startVal === 'number' && typeof lastVal === 'number';
              const delta = hasComparison ? lastVal - startVal : 0;
              const currentGrade =
                typeof lastVal === 'number' ? getGradeLevel(lastVal) : '-';

              return (
                <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                  </td>

                  {records.map((r) => {
                    const score = r.scores[sub.id];
                    const grade = typeof score === 'number' ? getGradeLevel(score) : '-';
                    return (
                      <td key={r.termId} className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-700">
                          {score !== undefined ? `${score}점` : '-'}
                        </span>
                        {score !== undefined && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({grade})
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Delta Column */}
                  <td className="py-3 px-4 text-center bg-indigo-50/20 font-bold">
                    {hasComparison ? (
                      <span
                        className={
                          delta > 0
                            ? 'text-emerald-600'
                            : delta < 0
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }
                      >
                        {delta > 0 ? `+${delta}점` : `${delta}점`}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Current Grade Badge */}
                  <td className="py-3 px-4 text-center">
                    {currentGrade !== '-' ? (
                      <span
                        className={`inline-block w-6 h-6 leading-6 text-center rounded-md font-bold text-xs ${
                          currentGrade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : currentGrade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : currentGrade === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : currentGrade === 'D'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {currentGrade}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Average & Total Summary Row */}
            <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
              <td className="py-3 px-4">시험 평균 점수</td>
              {records.map((r) => {
                const vals = Object.values(r.scores);
                const avg = vals.length
                  ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
                  : 0;
                const grade = getGradeLevel(avg);
                return (
                  <td key={r.termId} className="py-3 px-4 text-center">
                    <span className="text-indigo-700 text-sm">{avg}점</span>
                    <span className="ml-1 text-xs text-slate-500 font-normal">
                      ({grade})
                    </span>
                  </td>
                );
              })}

              {/* Total Average Delta */}
              <td className="py-3 px-4 text-center bg-indigo-100/50 text-indigo-900 font-extrabold text-sm">
                {(() => {
                  if (!firstRecord || !lastRecord) return '-';
                  const fVals = Object.values(firstRecord.scores);
                  const lVals = Object.values(lastRecord.scores);
                  const fAvg = fVals.length ? fVals.reduce((a, b) => a + b, 0) / fVals.length : 0;
                  const lAvg = lVals.length ? lVals.reduce((a, b) => a + b, 0) / lVals.length : 0;
                  const diff = Number((lAvg - fAvg).toFixed(1));
                  return diff >= 0 ? `+${diff}점` : `${diff}점`;
                })()}
              </td>
              <td className="py-3 px-4 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 inline-block" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Term Feedback Footer */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {records.map((r) => {
          const term = EXAM_TERMS.find((t) => t.id === r.termId);
          return (
            <div
              key={r.termId}
              className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs"
            >
              <div className="font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{term?.name || r.termId}</span>
                <span className="text-[10px] text-slate-400 font-normal">{r.date}</span>
              </div>
              <p className="text-slate-500 italic">
                {r.feedback || '등록된 시험 코멘트가 없습니다.'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
