import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { GoogleChatSpace, StudentAnalysis } from '../types';
import {
  MessageSquare,
  Send,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  fetchChatSpaces,
  formatStudentReportForChat,
  ChatError,
} from '../services/chatService';

interface GoogleChatModalProps {
  isOpen: boolean;
  user: User | null;
  accessToken: string | null;
  analysis: StudentAnalysis;
  onClose: () => void;
  onLogin: () => void;
  onRequestSendMessage: (spaceName: string, text: string) => void;
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({
  isOpen,
  user,
  accessToken,
  analysis,
  onClose,
  onLogin,
  onRequestSendMessage,
}) => {
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [chatError, setChatError] = useState<ChatError | null>(null);
  const [customReportText, setCustomReportText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomReportText(formatStudentReportForChat(analysis));
      if (accessToken) {
        loadSpaces();
      }
    }
  }, [isOpen, accessToken, analysis]);

  const loadSpaces = async () => {
    if (!accessToken) return;
    setIsLoadingSpaces(true);
    setChatError(null);
    try {
      const fetched = await fetchChatSpaces(accessToken);
      setSpaces(fetched);
      if (fetched.length > 0) {
        setSelectedSpace(fetched[0].name);
      }
    } catch (err: any) {
      if (err?.isChatAppNotConfigured) {
        setChatError(err);
      } else {
        setChatError({
          isChatAppNotConfigured: false,
          message: err?.message || '스페이스 목록을 불러오지 못했습니다.',
          configUrl: '',
        });
      }
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  if (!isOpen) return null;

  const handleSendClick = () => {
    if (!selectedSpace) return;
    onRequestSendMessage(selectedSpace, customReportText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Chat 학생 향상도 리포트 전송
              </h3>
              <p className="text-xs text-slate-500">
                선택한 구글 챗 스페이스(교과 협의회, 학급 방 등)로 성장 리포트를 공유합니다.
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
                Google Chat에 메시지를 발송하려면 먼저 Google 계정으로 로그인해야 합니다.
              </p>
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <span>Google 계정으로 로그인</span>
              </button>
            </div>
          ) : chatError?.isChatAppNotConfigured ? (
            /* Chat App Configuration Notice (Per Workspace references/chat.md) */
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Google Chat 앱 사전 구성 안내
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Google Chat API로 스페이스에 접근하려면 Google Cloud Console에서 Chat 앱 정보(앱 이름, 설명, 아바타)가 한 번 등록되어 있어야 합니다.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href={chatError.configUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors"
                >
                  <span>Google Cloud Console Chat 구성 열기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={loadSpaces}
                  className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>재시도</span>
                </button>
              </div>
            </div>
          ) : (
            /* Space Selector */
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    발송 대상 Google Chat 스페이스 선택
                  </label>
                  <button
                    type="button"
                    onClick={loadSpaces}
                    disabled={isLoadingSpaces}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
                    <span>새로고침</span>
                  </button>
                </div>

                {isLoadingSpaces ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    스페이스 목록 조회 중...
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="p-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
                    가입된 스페이스가 없거나 워크스페이스 권한이 필요합니다. 아래에서 직접 스페이스 ID를 지정하거나 미리보기를 복사할 수 있습니다.
                  </div>
                ) : (
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {spaces.map((sp) => (
                      <option key={sp.name} value={sp.name}>
                        {sp.displayName} ({sp.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Message Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  리포트 내용 미리보기 (수정 가능)
                </label>
                <textarea
                  rows={8}
                  value={customReportText}
                  onChange={(e) => setCustomReportText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-50 leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!user || !selectedSpace || !customReportText.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>스페이스로 전송하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
