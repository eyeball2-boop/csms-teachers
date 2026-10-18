import React from 'react';
import { StudentAnalysis } from '../types';
import { Award, AlertCircle, Sparkles, TrendingUp, Compass, MessageSquareQuote } from 'lucide-react';

interface AnalysisSummaryCardProps {
  analysis: StudentAnalysis;
  onSendToChatClick: () => void;
}

export const AnalysisSummaryCard: React.FC<AnalysisSummaryCardProps> = ({
  analysis,
  onSendToChatClick,
}) => {
  const { student, currentAverage, previousAverage, overallDelta, topImprovedSubject, needsAttentionSubject, aiCommentary } = analysis;
  const isPositive = overallDelta > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Overall Score & Improvement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              종합 성적 향상도
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              isPositive
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isPositive ? `+${overallDelta.toFixed(1)}점 상승` : `${overallDelta.toFixed(1)}점`}
          </span>
        </div>

        <div className="my-3">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentAverage.toFixed(1)}
            <span className="text-sm font-normal text-slate-500 ml-1">점</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>시작 평점 {previousAverage.toFixed(1)}점</span>
            <span className="text-slate-300">|</span>
            <span className={isPositive ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
              {isPositive ? `순성장률 +${((overallDelta / (previousAverage || 1)) * 100).toFixed(1)}%` : '점수 유지'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>🎯 목표: {student.targetGoal}</span>
        </div>
      </div>

      {/* 2. Top Improved Subject (MVP) */}
      <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              최고 성장 MVP 과목
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-900">
            성취도 도약
          </span>
        </div>

        {topImprovedSubject ? (
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-emerald-950">
                {topImprovedSubject.subjectName}
              </div>
              <div className="text-base font-bold text-emerald-700">
                +{topImprovedSubject.delta}점 🚀
              </div>
            </div>
            <div className="text-xs text-emerald-800 mt-1 flex items-center gap-2">
              <span>{topImprovedSubject.previousScore}점 ➡️ {topImprovedSubject.currentScore}점</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 font-bold text-[10px]">
                {topImprovedSubject.fromGrade} ➡️ {topImprovedSubject.toGrade}등급
              </span>
            </div>
          </div>
        ) : (
          <div className="my-3 text-xs text-emerald-700">과목별 향상 데이터 계산 중</div>
        )}

        <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-800 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>자기주도 학습 효과가 가장 두드러지게 나타난 과목</span>
        </div>
      </div>

      {/* 3. Feedback & Focus Opportunity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              다음 학기 중점 과목
            </span>
          </div>
          {needsAttentionSubject && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              보완 포인트
            </span>
          )}
        </div>

        <div className="my-3">
          {needsAttentionSubject ? (
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-xl font-bold text-slate-800">
                  {needsAttentionSubject.subjectName}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  현재 {needsAttentionSubject.currentScore}점 ({needsAttentionSubject.toGrade}등급)
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                기본 개념 복습 및 오답 분석을 병행하면 추가 도약이 기대됩니다.
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-600">
              전과목이 고르게 안정적인 향상세를 나타내고 있습니다.
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onSendToChatClick}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            Google Chat으로 리포트 공유
          </button>
        </div>
      </div>

      {/* 4. Teacher Commentary Banner (Full Span) */}
      <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-indigo-600 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            담당 교사 종합 지도 조언 및 학습 향상 분석
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {aiCommentary}
          </p>
        </div>
      </div>
    </div>
  );
};
