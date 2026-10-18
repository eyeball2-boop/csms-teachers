import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { X, UserPlus, UserCheck } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  studentToEdit: Student | null;
  onClose: () => void;
  onSaveStudent: (studentData: Partial<Student>) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  studentToEdit,
  onClose,
  onSaveStudent,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(2);
  const [classroom, setClassroom] = useState(3);
  const [number, setNumber] = useState(1);
  const [targetGoal, setTargetGoal] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name);
      setGrade(studentToEdit.grade);
      setClassroom(studentToEdit.classroom);
      setNumber(studentToEdit.number);
      setTargetGoal(studentToEdit.targetGoal || '');
      setNotes(studentToEdit.notes || '');
    } else {
      setName('');
      setGrade(2);
      setClassroom(3);
      setNumber(1);
      setTargetGoal('');
      setNotes('');
    }
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveStudent({
      id: studentToEdit?.id,
      name: name.trim(),
      grade,
      classroom,
      number,
      targetGoal: targetGoal.trim() || '성적 향상 및 균형 잡힌 학업 성취',
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {studentToEdit ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {studentToEdit ? '학생 정보 수정' : '신규 학생 등록'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              학생 이름 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 김민준"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                학년
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                반
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={classroom}
                onChange={(e) => setClassroom(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                번호
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-xl text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              학업 목표 / 성장 지향점
            </label>
            <input
              type="text"
              placeholder="예: 수학 90점 이상 및 성취도 A 달성"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              지도 교사 관찰 메모
            </label>
            <textarea
              rows={2}
              placeholder="학습 태도, 특이사항, 관심 분야 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            >
              {studentToEdit ? '수정 완료' : '학생 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
