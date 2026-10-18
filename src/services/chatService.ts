import { GoogleChatSpace, StudentAnalysis } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export interface ChatError {
  isChatAppNotConfigured: boolean;
  message: string;
  configUrl: string;
}

export const CHAT_CONFIG_URL = `https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=${firebaseConfig.projectId}`;

/**
 * Fetches the list of Google Chat spaces the authenticated user belongs to.
 */
export async function fetchChatSpaces(accessToken: string): Promise<GoogleChatSpace[]> {
  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw {
          isChatAppNotConfigured: true,
          message:
            'Google Chat 앱 구성이 아직 완료되지 않았습니다. Google Cloud Console에서 Chat 앱을 구성(App name, Avatar 등)해야 스페이스에 메시지를 보낼 수 있습니다.',
          configUrl: CHAT_CONFIG_URL,
        };
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `스페이스 목록 조회 실패 (${res.status})`);
    }

    const data = await res.json();
    return (data.spaces || []).map((s: { name: string; displayName?: string; type?: string }) => ({
      name: s.name,
      displayName: s.displayName || s.name.replace('spaces/', '스페이스 '),
      type: s.type,
    }));
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'isChatAppNotConfigured' in error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Sends a message to a specific Google Chat space.
 */
export async function sendChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<void> {
  const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw {
        isChatAppNotConfigured: true,
        message:
          'Google Chat 앱 구성이 필요합니다. Google Cloud Console의 Chat API 구성 페이지에서 앱 정보를 등록해주세요.',
        configUrl: CHAT_CONFIG_URL,
      };
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `메시지 전송 실패 (${res.status})`);
  }
}

/**
 * Generates an inspiring, structured middle school student improvement report formatted for Google Chat.
 */
export function formatStudentReportForChat(analysis: StudentAnalysis): string {
  const { student, currentAverage, previousAverage, overallDelta, topImprovedSubject, aiCommentary } = analysis;
  const deltaText = overallDelta >= 0 ? `+${overallDelta.toFixed(1)}점 상승` : `${overallDelta.toFixed(1)}점 변동`;

  let report = `📊 [중학생 수업 향상도 리포트] ${student.grade}학년 ${student.classroom}반 ${student.number}번 ${student.name} 학생\n\n`;
  report += `🎯 학업 목표: "${student.targetGoal}"\n`;
  report += `📈 종합 평균: ${previousAverage.toFixed(1)}점 ➡️ ${currentAverage.toFixed(1)}점 (${deltaText})\n\n`;

  if (topImprovedSubject) {
    report += `🌟 [최고 성장 과목]: ${topImprovedSubject.subjectName}\n`;
    report += `  - 점수 변화: ${topImprovedSubject.previousScore}점 ➡️ ${topImprovedSubject.currentScore}점 (+${topImprovedSubject.delta}점)\n`;
    report += `  - 성취도 등급: [${topImprovedSubject.fromGrade}등급] ➡️ [${topImprovedSubject.toGrade}등급]\n\n`;
  }

  report += `📝 [과목별 세부 향상도]\n`;
  analysis.subjectImprovements.forEach((item) => {
    const symbol = item.delta > 0 ? '🔺' : item.delta < 0 ? '🔻' : '➖';
    report += `  ${symbol} ${item.subjectName}: ${item.previousScore}점 ➡️ ${item.currentScore}점 (${item.delta >= 0 ? `+${item.delta}` : item.delta}점, ${item.toGrade}등급)\n`;
  });

  report += `\n💡 [교사 종합 의견 및 향상 분석]\n${aiCommentary}\n`;
  report += `\n---\n*중학생 수업 향상도 관리 시스템에서 발송되었습니다.*`;

  return report;
}
