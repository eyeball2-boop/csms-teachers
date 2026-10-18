import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, ExternalLink, RefreshCw, Upload, Download, Sparkles, CheckCircle, X } from 'lucide-react';
import { extractSpreadsheetId } from '../services/sheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  user: User | null;
  spreadsheetId: string;
  spreadsheetUrl: string;
  isSyncing: boolean;
  lastSyncedTime: string | null;
  onClose: () => void;
  onLogin: () => void;
  onCreateNewSheet: () => void;
  onConnectExistingSheet: (id: string) => void;
  onSyncToSheet: () => void;
  onLoadFromSheet: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  user,
  spreadsheetId,
  spreadsheetUrl,
  isSyncing,
  lastSyncedTime,
  onClose,
  onLogin,
  onCreateNewSheet,
  onConnectExistingSheet,
  onSyncToSheet,
  onLoadFromSheet,
}) => {
  const [sheetInput, setSheetInput] = useState('');

  if (!isOpen) return null;

  const handleConnectInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) return;
    const cleanId = extractSpreadsheetId(sheetInput);
    onConnectExistingSheet(cleanId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Sheets 데이터베이스 연동 관리
              </h3>
              <p className="text-xs text-slate-500">
                스프레드시트를 실시간 DB로 활용하여 학생 성적과 향상도를 영구 보관합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Auth Check */}
          {!user ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-3">
              <p className="text-xs text-amber-800">
                Google Sheets에 접근하여 데이터를 저장하거나 불러오려면 먼저 Google 계정으로
                로그인해야 합니다.
              </p>
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <span>Google 계정으로 로그인</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>
                  인증된 계정: <strong>{user.email}</strong>
                </span>
              </div>
              {lastSyncedTime && (
                <span className="text-[11px] text-slate-400">
                  마지막 동기화: {lastSyncedTime}
                </span>
              )}
            </div>
          )}

          {/* Current Connection Info */}
          {spreadsheetId ? (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  스프레드시트 DB 연결됨
                </span>
                <a
                  href={spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  <span>Google Sheets 열기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-[11px] font-mono bg-white/80 p-2 rounded-lg border border-emerald-200/60 text-slate-700 truncate">
                ID: {spreadsheetId}
              </div>

              {/* Sync Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onSyncToSheet}
                  disabled={!user || isSyncing}
                  className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>현재 성적 DB에 저장 (동기화)</span>
                </button>
                <button
                  type="button"
                  onClick={onLoadFromSheet}
                  disabled={!user || isSyncing}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DB에서 성적 불러오기</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not Connected State */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                <p className="text-xs text-slate-600">
                  클릭 한 번으로 <strong>학생명부</strong>, <strong>과목별 성적DB</strong>,{' '}
                  <strong>향상도 분석 요약</strong> 시트가 자동 구성된 새 구글 스프레드시트를
                  생성합니다.
                </p>
                <button
                  type="button"
                  onClick={onCreateNewSheet}
                  disabled={!user || isSyncing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>새 Google 스프레드시트 DB 자동 생성</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-xs text-slate-400 font-medium">
                  또는 기존 시트 연결
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleConnectInput} className="flex gap-2">
                <input
                  type="text"
                  placeholder="구글 스프레드시트 URL 또는 ID 붙여넣기"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={!user || isSyncing || !sheetInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  연결
                </button>
              </form>
            </div>
          )}

          {/* Database Schema Guide */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800">📋 자동 생성되는 시트 구조</div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
              <li>
                <strong>학생명부:</strong> 학생 기본정보 (학년, 반, 번호, 이름, 학업목표)
              </li>
              <li>
                <strong>과목별성적DB:</strong> 학기별 전과목(국·영·수·과·사·도·기) 점수, 평균, 피드백
              </li>
              <li>
                <strong>향상도분석요약:</strong> 시작 대비 점수 변화(Δ), 최대 성장 과목 집계
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
