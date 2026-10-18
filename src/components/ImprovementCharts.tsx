import React, { useState, useMemo } from 'react';
import { Student, DEFAULT_SUBJECTS, EXAM_TERMS, SubjectImprovement } from '../types';
import { TrendingUp, BarChart3, Activity, Layers } from 'lucide-react';

interface ImprovementChartsProps {
  student: Student;
  improvements: SubjectImprovement[];
}

export const ImprovementCharts: React.FC<ImprovementChartsProps> = ({
  student,
  improvements,
}) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    DEFAULT_SUBJECTS.map((s) => s.id)
  );
  const [chartTab, setChartTab] = useState<'line' | 'bar' | 'radar'>('line');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    term: string;
    subjectName: string;
    score: number;
  } | null>(null);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((s) => s !== id) : prev) : [...prev, id]
    );
  };

  const records = student.records;

  // Calculate Average score per term
  const termAverages = useMemo(() => {
    return records.map((r) => {
      const vals = Object.values(r.scores);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return {
        termId: r.termId,
        avg: Number(avg.toFixed(1)),
      };
    });
  }, [records]);

  // Line Chart SVG geometry
  const chartWidth = 680;
  const chartHeight = 280;
  const padding = { top: 30, right: 30, bottom: 45, left: 45 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  // Radar Chart geometry
  const radarRadius = 110;
  const radarCenterX = 180;
  const radarCenterY = 140;

  const radarAngles = useMemo(() => {
    const total = DEFAULT_SUBJECTS.length;
    return DEFAULT_SUBJECTS.map((_, i) => (i * 2 * Math.PI) / total - Math.PI / 2);
  }, []);

  const firstRecord = records[0];
  const lastRecord = records[records.length - 1];

  const radarPolygonInitial = useMemo(() => {
    if (!firstRecord) return '';
    return DEFAULT_SUBJECTS.map((sub, i) => {
      const score = firstRecord.scores[sub.id] || 0;
      const r = (score / 100) * radarRadius;
      const angle = radarAngles[i];
      const x = radarCenterX + r * Math.cos(angle);
      const y = radarCenterY + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  }, [firstRecord, radarAngles]);

  const radarPolygonCurrent = useMemo(() => {
    if (!lastRecord) return '';
    return DEFAULT_SUBJECTS.map((sub, i) => {
      const score = lastRecord.scores[sub.id] || 0;
      const r = (score / 100) * radarRadius;
      const angle = radarAngles[i];
      const x = radarCenterX + r * Math.cos(angle);
      const y = radarCenterY + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  }, [lastRecord, radarAngles]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      {/* Chart Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            과목별 학업 향상도 시각화
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            시험 차수별 성적 추이 및 이전 대비 점수 변동폭을 입체적으로 분석합니다.
          </p>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartTab('line')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartTab === 'line'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            추이 꺾은선
          </button>
          <button
            type="button"
            onClick={() => setChartTab('bar')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartTab === 'bar'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            과목별 향상도(Δ)
          </button>
          <button
            type="button"
            onClick={() => setChartTab('radar')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartTab === 'radar'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            성장 다이어그램
          </button>
        </div>
      </div>

      {/* Subject Filter Pills (For Line Chart) */}
      {chartTab === 'line' && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">과목 표시:</span>
          {DEFAULT_SUBJECTS.map((sub) => {
            const isChecked = selectedSubjects.includes(sub.id);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => toggleSubject(sub.id)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isChecked
                    ? 'border-transparent font-bold text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
                style={{
                  backgroundColor: isChecked ? sub.color : '#ffffff',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isChecked ? '#ffffff' : sub.color }}
                />
                {sub.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="mt-4 relative min-h-[300px] flex items-center justify-center">
        {records.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-12">
            등록된 시험 성적 데이터가 없습니다. 상단에서 성적을 입력해주세요.
          </div>
        ) : chartTab === 'line' ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full max-w-full h-auto"
            >
              <defs>
                {/* Gradient for area under average */}
                <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Achievement Level Background Bands (중학교 성취평가제 기준) */}
              <rect
                x={padding.left}
                y={padding.top}
                width={innerW}
                height={(10 / 100) * innerH}
                fill="#f0fdf4"
                opacity="0.6"
              />
              <text
                x={chartWidth - padding.right - 8}
                y={padding.top + 14}
                fill="#16a34a"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
              >
                A (90점 이상)
              </text>

              {/* Y-axis Grid lines */}
              {[0, 20, 40, 60, 80, 90, 100].map((val) => {
                const y = padding.top + innerH - (val / 100) * innerH;
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke={val === 90 ? '#86efac' : '#e2e8f0'}
                      strokeDasharray={val === 90 ? '0' : '4 4'}
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="11"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X-axis Terms */}
              {records.map((rec, idx) => {
                const termInfo = EXAM_TERMS.find((t) => t.id === rec.termId);
                const x =
                  padding.left +
                  (idx / Math.max(1, records.length - 1)) * innerW;
                return (
                  <g key={rec.termId}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={chartHeight - padding.bottom}
                      stroke="#f1f5f9"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 20}
                      fill="#475569"
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {termInfo?.name || rec.termId}
                    </text>
                  </g>
                );
              })}

              {/* Average Trend Line (Dashed Indigo) */}
              {(() => {
                const avgPoints = termAverages.map((t, idx) => {
                  const x =
                    padding.left +
                    (idx / Math.max(1, records.length - 1)) * innerW;
                  const y = padding.top + innerH - (t.avg / 100) * innerH;
                  return { x, y, avg: t.avg };
                });

                if (avgPoints.length < 2) return null;
                const pathStr = avgPoints
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <g>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                    {avgPoints.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x={p.x}
                          y={p.y - 10}
                          fill="#4f46e5"
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {p.avg}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}

              {/* Subject Lines */}
              {DEFAULT_SUBJECTS.filter((sub) => selectedSubjects.includes(sub.id)).map(
                (sub) => {
                  const points = records.map((rec, idx) => {
                    const score = rec.scores[sub.id] || 0;
                    const x =
                      padding.left +
                      (idx / Math.max(1, records.length - 1)) * innerW;
                    const y = padding.top + innerH - (score / 100) * innerH;
                    return { x, y, score, termId: rec.termId };
                  });

                  if (points.length < 2) return null;
                  const d = points
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');

                  return (
                    <g key={sub.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke={sub.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="5"
                          fill="#ffffff"
                          stroke={sub.color}
                          strokeWidth="2.5"
                          className="cursor-pointer transition-transform hover:scale-125"
                          onMouseEnter={() => {
                            const termInfo = EXAM_TERMS.find((t) => t.id === p.termId);
                            setHoveredPoint({
                              x: p.x,
                              y: p.y,
                              term: termInfo?.name || p.termId,
                              subjectName: sub.name,
                              score: p.score,
                            });
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </g>
                  );
                }
              )}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                  transform: 'translate(-50%, -130%)',
                }}
              >
                <div className="text-[10px] text-slate-300">{hoveredPoint.term}</div>
                <div className="font-bold">
                  {hoveredPoint.subjectName}: {hoveredPoint.score}점
                </div>
              </div>
            )}
          </div>
        ) : chartTab === 'bar' ? (
          /* Delta Bar Chart */
          <div className="w-full space-y-3 py-2">
            <div className="text-xs text-slate-500 flex justify-between px-1">
              <span>과목명 및 성취도 변동</span>
              <span>1학기 중간 ➡️ 최근 시험 점수 변화(Δ)</span>
            </div>
            {improvements.map((item) => {
              const isPositive = item.delta > 0;
              const isZero = item.delta === 0;
              const barWidth = Math.min(100, Math.abs(item.delta) * 3);

              return (
                <div key={item.subjectId} className="flex items-center gap-3">
                  <div className="w-20 sm:w-24 shrink-0 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{item.subjectName}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {item.fromGrade}➡️{item.toGrade}
                    </span>
                  </div>

                  {/* Centered or Left Bar Container */}
                  <div className="flex-1 bg-slate-100 h-6 rounded-lg overflow-hidden flex items-center px-2 relative">
                    <div
                      className={`h-4 rounded-md transition-all duration-500 ${
                        isPositive ? 'bg-emerald-500' : isZero ? 'bg-slate-300' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(4, barWidth)}%` }}
                    />
                    <span className="text-xs font-semibold text-slate-700 ml-2">
                      {item.previousScore}점 ➡️ {item.currentScore}점
                    </span>
                  </div>

                  {/* Delta Badge */}
                  <div
                    className={`w-16 text-right text-xs font-bold shrink-0 ${
                      isPositive
                        ? 'text-emerald-600'
                        : isZero
                        ? 'text-slate-500'
                        : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? `+${item.delta}점 🚀` : isZero ? `0점` : `${item.delta}점`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Radar Chart */
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-2">
            <svg width="360" height="280" viewBox="0 0 360 280">
              {/* Concentric Polygons */}
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => {
                const poly = DEFAULT_SUBJECTS.map((_, i) => {
                  const r = ratio * radarRadius;
                  const angle = radarAngles[i];
                  const x = radarCenterX + r * Math.cos(angle);
                  const y = radarCenterY + r * Math.sin(angle);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <polygon
                    key={ratio}
                    points={poly}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={ratio === 1.0 ? '0' : '3 3'}
                  />
                );
              })}

              {/* Axis Rays */}
              {DEFAULT_SUBJECTS.map((sub, i) => {
                const angle = radarAngles[i];
                const x2 = radarCenterX + radarRadius * Math.cos(angle);
                const y2 = radarCenterY + radarRadius * Math.sin(angle);
                const labelX = radarCenterX + (radarRadius + 18) * Math.cos(angle);
                const labelY = radarCenterY + (radarRadius + 18) * Math.sin(angle);

                return (
                  <g key={sub.id}>
                    <line
                      x1={radarCenterX}
                      y1={radarCenterY}
                      x2={x2}
                      y2={y2}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x={labelX}
                      y={labelY + 4}
                      fill="#475569"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {sub.name}
                    </text>
                  </g>
                );
              })}

              {/* Initial Polygon (Slate/Light Blue) */}
              {radarPolygonInitial && (
                <polygon
                  points={radarPolygonInitial}
                  fill="#94a3b8"
                  fillOpacity="0.2"
                  stroke="#64748b"
                  strokeWidth="2"
                />
              )}

              {/* Current Polygon (Emerald/Indigo Expansion) */}
              {radarPolygonCurrent && (
                <polygon
                  points={radarPolygonCurrent}
                  fill="#10b981"
                  fillOpacity="0.3"
                  stroke="#059669"
                  strokeWidth="2.5"
                />
              )}
            </svg>

            {/* Radar Legend & Explanations */}
            <div className="space-y-3 text-xs max-w-xs">
              <div className="font-bold text-slate-800 text-sm">
                과목별 균형 성장 다이어그램
              </div>
              <p className="text-slate-500 leading-relaxed">
                다각형이 바깥쪽으로 넓어질수록 학생의 과목별 성취 역량이 전반적으로
                확장되었음을 의미합니다.
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-slate-400/40 border border-slate-500" />
                  <span className="text-slate-700">1학기 중간고사 (시작 기준선)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500/40 border border-emerald-600" />
                  <span className="text-emerald-800 font-bold">최근 시험 (확장된 성장 영역)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
