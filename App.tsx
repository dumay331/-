
import React, { useState, useRef } from 'react';
import { generateSurvey } from './services/geminiService';
import { SurveyConfig, Questionnaire, Question } from './types';
import QuestionCard from './components/QuestionCard';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [config, setConfig] = useState<SurveyConfig>({
    purpose: '',
    targetAudience: '',
    questionCount: 5
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<Questionnaire | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // States for direct editing of questionnaire header
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  const surveyContentRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.purpose || !config.targetAudience) {
      setError('请填写完整的调研目的和对象');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const survey = await generateSurvey(config);
      setResult(survey);
      // Scroll to result
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = (updatedQ: Question) => {
    if (!result) return;
    const newQuestions = result.questions.map(q => q.id === updatedQ.id ? updatedQ : q);
    setResult({ ...result, questions: newQuestions });
  };

  const handleDeleteQuestion = (id: number) => {
    if (!result) return;
    const newQuestions = result.questions.filter(q => q.id !== id);
    setResult({ ...result, questions: newQuestions });
  };

  const handleUpdateHeader = (field: 'title' | 'description', value: string) => {
    if (!result) return;
    setResult({ ...result, [field]: value });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `
标题: ${result.title}
说明: ${result.description}

${result.questions.map(q => `Q${q.id}: ${q.text} [${q.type}]\n${q.options ? q.options.join(' / ') : ''}`).join('\n\n')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const handleExportPDF = async () => {
    if (!surveyContentRef.current || !result) return;
    
    setExporting(true);
    try {
      const element = surveyContentRef.current;
      // Close any open editing states for clean PDF
      setIsEditingHeader(false);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const displayHeight = pdfWidth / ratio;
      
      if (displayHeight > pdfHeight) {
        let heightLeft = displayHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, displayHeight);
        heightLeft -= pdfHeight;
        while (heightLeft >= 0) {
          position = heightLeft - displayHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, displayHeight);
          heightLeft -= pdfHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, displayHeight);
      }
      
      pdf.save(`${result.title || '调研问卷'}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('导出 PDF 失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">灵感问卷 <span className="text-blue-600">AI</span></h1>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">如何工作?</a>
            <a href="#" className="hover:text-blue-600 transition-colors">专业版</a>
            <a href="#" className="hover:text-blue-600 transition-colors">关于我们</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Side */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100">
              <h2 className="text-2xl font-bold mb-6 text-slate-800">开始设计问卷</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">调研目的</label>
                  <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                    placeholder="例如：了解大学生对国产运动品牌的消费倾向和影响因素..."
                    value={config.purpose}
                    onChange={(e) => setConfig({ ...config, purpose: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">调研对象</label>
                  <input
                    type="text"
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="例如：18-25岁的在校大学生"
                    value={config.targetAudience}
                    onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">题目个数: <span className="text-blue-600">{config.questionCount}</span></label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={config.questionCount}
                    onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                    loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>AI 正在思考中...</span>
                    </>
                  ) : (
                    <span>一键生成问卷</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7 space-y-8">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-600">您的问卷预览将出现在这里</h3>
                <p className="text-slate-400 mt-2 max-w-sm">AI 会根据您的输入自动生成科学的调研问卷。</p>
              </div>
            )}

            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-slate-200 rounded-lg w-3/4"></div>
                <div className="h-6 bg-slate-200 rounded-lg w-full"></div>
                <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
                <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
              </div>
            )}

            {result && !loading && (
              <div id="results-section" className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                  <div className="flex justify-end mb-4">
                     <button 
                        onClick={handleCopy}
                        className="no-print inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        复制全文
                      </button>
                  </div>

                  <div ref={surveyContentRef} className="bg-white">
                    <div className="mb-8 group">
                      {isEditingHeader ? (
                        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-blue-100">
                          <input 
                            className="text-3xl font-extrabold text-slate-900 w-full bg-transparent border-b-2 border-blue-300 focus:outline-none"
                            value={result.title}
                            onChange={(e) => handleUpdateHeader('title', e.target.value)}
                            placeholder="输入问卷标题..."
                          />
                          <textarea 
                            className="text-slate-500 w-full bg-transparent focus:outline-none resize-none"
                            value={result.description}
                            onChange={(e) => handleUpdateHeader('description', e.target.value)}
                            rows={2}
                            placeholder="输入问卷说明..."
                          />
                          <button 
                            onClick={() => setIsEditingHeader(false)}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg"
                          >
                            完成编辑
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-slate-50 p-4 rounded-xl transition-all relative group"
                          onClick={() => setIsEditingHeader(true)}
                        >
                          <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">{result.title}</h2>
                          <p className="text-slate-500 mt-2">{result.description}</p>
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">点击修改</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {result.questions.map((q) => (
                        <QuestionCard 
                          key={q.id} 
                          question={q} 
                          onUpdate={handleUpdateQuestion}
                          onDelete={handleDeleteQuestion}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all flex items-center space-x-2 ${
                          exporting ? 'bg-slate-400' : 'bg-slate-900 hover:bg-black'
                        }`}
                      >
                        {exporting ? <span>导出中...</span> : <span>导出为 PDF</span>}
                      </button>
                      <button className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                        发布问卷
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
