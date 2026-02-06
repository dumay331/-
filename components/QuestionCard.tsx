
import React, { useState } from 'react';
import { Question, QuestionType } from '../types';

interface QuestionCardProps {
  question: Question;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: (id: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Question>({ ...question });

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(editForm.options || [])];
    newOptions[index] = value;
    setEditForm({ ...editForm, options: newOptions });
  };

  const addOption = () => {
    setEditForm({ 
      ...editForm, 
      options: [...(editForm.options || []), `选项 ${ (editForm.options?.length || 0) + 1 }`] 
    });
  };

  const removeOption = (index: number) => {
    const newOptions = (editForm.options || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, options: newOptions });
  };

  const renderViewMode = () => {
    const getTypeName = (type: QuestionType) => {
      const map = {
        [QuestionType.SINGLE_CHOICE]: '单选题',
        [QuestionType.MULTI_CHOICE]: '多选题',
        [QuestionType.OPEN_ENDED]: '问答题',
        [QuestionType.RATING]: '评分题'
      };
      return map[type];
    };

    return (
      <div className="relative group">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 pr-20">
            <span className="text-blue-600 mr-2">Q{question.id}.</span>
            {question.text}
          </h3>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded uppercase">
              {getTypeName(question.type)}
            </span>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
              title="编辑题目"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          {question.type === QuestionType.SINGLE_CHOICE && question.options?.map((opt, idx) => (
            <div key={idx} className="flex items-center space-x-3 text-gray-700">
              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
              <span>{opt}</span>
            </div>
          ))}
          {question.type === QuestionType.MULTI_CHOICE && question.options?.map((opt, idx) => (
            <div key={idx} className="flex items-center space-x-3 text-gray-700">
              <div className="w-4 h-4 border-2 border-gray-300 rounded" />
              <span>{opt}</span>
            </div>
          ))}
          {question.type === QuestionType.RATING && (
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(v => (
                <div key={v} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 text-sm">{v}</div>
              ))}
            </div>
          )}
          {question.type === QuestionType.OPEN_ENDED && (
            <div className="w-full h-20 border border-gray-100 bg-gray-50 rounded-lg" />
          )}
        </div>
      </div>
    );
  };

  const renderEditMode = () => (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">题目文本</label>
        <input 
          type="text" 
          className="w-full p-2 border-b-2 border-blue-600 bg-blue-50/30 focus:outline-none font-semibold text-gray-900"
          value={editForm.text}
          onChange={e => setEditForm({ ...editForm, text: e.target.value })}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">题型</label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: QuestionType.SINGLE_CHOICE, label: '单选' },
            { id: QuestionType.MULTI_CHOICE, label: '多选' },
            { id: QuestionType.RATING, label: '评分' },
            { id: QuestionType.OPEN_ENDED, label: '问答' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setEditForm({ ...editForm, type: t.id })}
              className={`px-3 py-1 text-sm rounded-full border transition-all ${
                editForm.type === t.id 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(editForm.type === QuestionType.SINGLE_CHOICE || editForm.type === QuestionType.MULTI_CHOICE) && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">选项设置</label>
          {(editForm.options || []).map((opt, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <input 
                type="text" 
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
              />
              <button 
                onClick={() => removeOption(idx)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          <button 
            onClick={addOption}
            className="text-blue-600 text-sm font-medium hover:underline flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加选项
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <button 
          onClick={() => onDelete(question.id)}
          className="text-red-500 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          删除此题
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={() => { setIsEditing(false); setEditForm({ ...question }); }}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-6 bg-white border rounded-xl shadow-sm transition-all ${isEditing ? 'border-blue-300 ring-4 ring-blue-50 shadow-lg scale-[1.02]' : 'border-gray-100 hover:shadow-md'}`}>
      {isEditing ? renderEditMode() : renderViewMode()}
    </div>
  );
};

export default QuestionCard;
