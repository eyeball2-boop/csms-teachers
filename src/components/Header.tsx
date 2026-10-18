import React from 'react';
import { User } from 'firebase/auth';
import {
  GraduationCap,
  FileSpreadsheet,
  MessageSquare,
  FileCode,
  UserPlus,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSheetsModal: () => void;
  onOpenChatModal: () => void;
  onOpenAddStudentModal: () => void;
  onExportHtml: () => void;
  onSaveToFirebase: () => void;
  onLoadFromFirebase: () => void;
  isFirebaseSaving: boolean;
  sheetConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  onOpenSheetsModal,
  onOpenChatModal,
  onOpenAddStudentModal,
  onExportHtml,
  onSaveToFirebase,
  onLoadFromFirebase,
  isFirebaseSaving,
  sheetConnected,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  중학생 수업 향상도 분석 시스템
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  학습 성장 지표
                </span>
              </div>
              <p className="text-xs text-slate-500">
                과목별 지필·수행평가 성취도(A~E) 추적 및 학업 향상도 시각화
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Firebase DB Quick Save */}
            <button
              type="button"
              onClick={onSaveToFirebase}
              disabled={isFirebaseSaving}
              title="Firebase Firestore 클라우드 DB에 전체 학생 성적 저장"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isFirebaseSaving ? '🔥 DB 저장 중...' : '🔥 Firebase DB 저장'}</span>
            </button>

            {/* Export Single HTML Button */}
            <button
              type="button"
              onClick={onExportHtml}
              title="Firebase DB가 연결된 완전한 단일 HTML 파일로 저장"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-slate-600" />
              <span>단일 HTML 저장</span>
            </button>

            {/* View Single HTML Direct Link */}
            <a
              href="/student_progress_firebase.html"
              target="_blank"
              rel="noopener noreferrer"
              title="새 창에서 독립 실행형 단일 HTML 파일 열기"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <span>HTML 바로보기</span>
            </a>

            {/* Google Sheets DB Button */}
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                sheetConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${sheetConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Google Sheets DB</span>
              {sheetConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Google Chat Button */}
            <button
              type="button"
              onClick={onOpenChatModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Google Chat 전송</span>
            </button>

            {/* Add Student Button */}
            <button
              type="button"
              onClick={onOpenAddStudentModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>학생 등록</span>
            </button>

            {/* Google Auth Button / User Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.displayName || '선생님'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="로그아웃"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {/* Official Google G Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoggingIn ? '로그인 중...' : 'Google 로그인'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
