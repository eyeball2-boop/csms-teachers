import React, { useState, useMemo } from 'react';
import { Student, getGradeLevel } from '../types';
import { Search, UserCheck, TrendingUp, TrendingDown, Minus, Trash2, Edit3, Award } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
      return matchName && matchGrade;
    });
  }, [students, searchTerm, selectedGrade]);

  const classMetrics = useMemo<{
    avgDelta: number;
    topImprover: Student | null;
    maxDelta: number;
  }>(() => {
    if (students.length === 0) return { avgDelta: 0, topImprover: null, maxDelta: 0 };

    let totalDelta = 0;
    let maxDelta = -999;
    let topStudent: Student | null = null;

    students.forEach((s) => {
      if (s.records.length > 0) {
        const first = s.records[0];
        const last = s.records[s.records.length - 1];
        const fVals = Object.values(first.scores);
        const lVals = Object.values(last.scores);
        const fAvg = fVals.length ? fVals.reduce((a, b) => a + b, 0) / fVals.length : 0;
        const lAvg = lVals.length ? lVals.reduce((a, b) => a + b, 0) / lVals.length : 0;
        const delta = lAvg - fAvg;
        totalDelta += delta;

        if (delta > maxDelta) {
          maxDelta = delta;
          topStudent = s;
        }
      }
    });

    return {
      avgDelta: Number((totalDelta / students.length).toFixed(1)),
      topImprover: topStudent,
      maxDelta: maxDelta > -999 ? Number(maxDelta.toFixed(1)) : 0,
    };
  }, [students]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header & Filter */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">학생 명단</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
              {filteredStudents.length}명
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            반 평균 향상: <span className="text-emerald-600 font-bold">+{classMetrics.avgDelta}점</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="학생 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Grade Filter Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedGrade('all')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedGrade === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            전체
          </button>
          {[1, 2, 3].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedGrade === g
                  ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {g}학년
            </button>
          ))}
        </div>
      </div>

      {/* Top Improver Highlight Banner */}
      {classMetrics.topImprover && (
        <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>학급 성장 MVP: <strong>{classMetrics.topImprover.name}</strong></span>
          </div>
          <span className="font-bold text-amber-700">+{classMetrics.maxDelta}점 향상 🚀</span>
        </div>
      )}

      {/* Student List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            검색 결과와 일치하는 학생이 없습니다.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = student.id === selectedStudentId;
            const records = student.records;
            const latestRecord = records[records.length - 1];
            const firstRecord = records[0];

            let latestAvg = 0;
            let delta = 0;
            let currentGrade = 'E';

            if (latestRecord && firstRecord) {
              const latestVals = Object.values(latestRecord.scores);
              const firstVals = Object.values(firstRecord.scores);
              latestAvg = latestVals.length ? latestVals.reduce((a, b) => a + b, 0) / latestVals.length : 0;
              const firstAvg = firstVals.length ? firstVals.reduce((a, b) => a + b, 0) / firstVals.length : 0;
              delta = latestAvg - firstAvg;
              currentGrade = getGradeLevel(latestAvg);
            }

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className={`group p-3 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                      }`}
                    >
                      {student.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {student.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {student.grade}학년 {student.classroom}반 {student.number}번
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-[170px] mt-0.5">
                        {student.targetGoal || '목표 설정 전'}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-700">
                        {latestAvg.toFixed(1)}점
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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
                    </div>

                    <div
                      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                        delta > 0
                          ? 'text-emerald-600'
                          : delta < 0
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {delta > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : delta < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}점
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Quick Edit / Delete Buttons */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 opacity-90 group-hover:opacity-100">
                  <div className="flex items-center gap-1 text-[11px]">
                    <UserCheck className="w-3 h-3" />
                    <span>시험 {records.length}회 기록</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStudent(student);
                      }}
                      title="학생 정보 수정"
                      className="p-1 hover:text-indigo-600 rounded-md hover:bg-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStudent(student);
                      }}
                      title="학생 삭제"
                      className="p-1 hover:text-rose-600 rounded-md hover:bg-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
