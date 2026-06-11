import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

const PHASES = { setup: "setup", taking: "taking", result: "result" };

export default function QuizPage() {
  const { authFetch } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [docs, setDocs]           = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [rawText, setRawText]     = useState("");
  const [numQ, setNumQ]           = useState(5);
  const [phase, setPhase]         = useState(PHASES.setup);
  const [quiz, setQuiz]           = useState([]);
  const [answers, setAnswers]     = useState({});
  const [score, setScore]         = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [savedId, setSavedId]     = useState(null);

  useEffect(() => {
    authFetch("/documents").then(r => r.json()).then(d => {
      setDocs(d);
      const docId = searchParams.get("doc");
      if (docId) setSelectedDoc(docId);
    });
  }, []);

  const generateQuiz = async () => {
    if (!selectedDoc && !rawText.trim()) {
      setError("Chọn tài liệu hoặc nhập nội dung học"); return;
    }
    setError(""); setGenerating(true);
    try {
      const body = { num_questions: numQ };
      if (selectedDoc) body.document_id = parseInt(selectedDoc);
      else body.text = rawText;

      const res = await authFetch("/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Lỗi tạo quiz"); return; }
      if (!Array.isArray(data) || data.length === 0) { setError("Không tạo được câu hỏi"); return; }
      setQuiz(data);
      setAnswers({});
      setScore(null);
      setSavedId(null);
      setPhase(PHASES.taking);
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (qIdx, option) => {
    if (phase === PHASES.result) return;
    setAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const submitQuiz = async () => {
    const totalScore = quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
    setScore(totalScore);
    setPhase(PHASES.result);

    // Auto-save result
    setSaving(true);
    try {
      const res = await authFetch("/quiz-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: selectedDoc ? parseInt(selectedDoc) : null,
          score: totalScore,
          total: quiz.length,
          questions: quiz,
          answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
        }),
      });
      const data = await res.json();
      if (res.ok) setSavedId(data.id);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const resetQuiz = () => {
    setPhase(PHASES.setup);
    setQuiz([]); setAnswers({}); setScore(null);
  };

  const getOptionClass = (qIdx, option) => {
    if (phase !== PHASES.result) return answers[qIdx] === option ? " selected" : "";
    const correct = quiz[qIdx]?.answer === option;
    const chosen  = answers[qIdx] === option;
    if (correct) return " correct";
    if (chosen && !correct) return " wrong";
    return "";
  };

  const pct = score !== null ? Math.round(score / quiz.length * 100) : 0;

  return (
    <Layout title="📝 Làm bài Quiz">
      {phase === PHASES.setup && (
        <div style={{ maxWidth: 640 }}>
          <div className="card">
            <div className="card-title">⚙️ Cài đặt Quiz</div>

            <div className="form-group">
              <label>Tài liệu (tuỳ chọn)</label>
              <select className="form-control" value={selectedDoc}
                onChange={e => { setSelectedDoc(e.target.value); setRawText(""); }}>
                <option value="">-- Nhập nội dung thủ công --</option>
                {docs.map(d => <option key={d.id} value={d.id}>{d.original_name}</option>)}
              </select>
            </div>

            {!selectedDoc && (
              <div className="form-group">
                <label>Nội dung học tập</label>
                <textarea className="form-control" rows={6}
                  placeholder="Dán nội dung tài liệu vào đây..."
                  value={rawText} onChange={e => setRawText(e.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label>Số câu hỏi: <strong>{numQ}</strong></label>
              <input type="range" min={3} max={15} value={numQ}
                onChange={e => setNumQ(parseInt(e.target.value))}
                style={{ width: "100%", marginTop: 6, accentColor: "var(--primary)" }} />
              <div className="flex" style={{ justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                <span>3</span><span>15</span>
              </div>
            </div>

            {error && <div className="error-msg mb-4">{error}</div>}

            <button className="btn btn-primary btn-full" onClick={generateQuiz} disabled={generating}>
              {generating ? <><span className="spinner" /> Đang tạo...</> : "🎲 Tạo Quiz"}
            </button>
          </div>
        </div>
      )}

      {phase === PHASES.taking && (
        <div style={{ maxWidth: 720 }}>
          <div className="flex" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <strong>{quiz.length} câu hỏi</strong>
              <span className="text-muted text-sm" style={{ marginLeft: 12 }}>
                Đã trả lời: {Object.keys(answers).length}/{quiz.length}
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={resetQuiz}>← Cài đặt lại</button>
          </div>

          <div className="progress-bar" style={{ marginBottom: 20 }}>
            <div className="progress-fill"
              style={{ width: `${Object.keys(answers).length / quiz.length * 100}%` }} />
          </div>

          {quiz.map((q, qi) => (
            <div key={qi} className="quiz-question-card">
              <div className="quiz-q-num">Câu {qi + 1} / {quiz.length}</div>
              <div className="quiz-q-text">{q.question}</div>
              {q.options.map((opt, oi) => (
                <div key={oi}
                  className={"quiz-option" + (answers[qi] === opt ? " selected" : "")}
                  onClick={() => selectAnswer(qi, opt)}>
                  <input type="radio" readOnly checked={answers[qi] === opt}
                    style={{ accentColor: "var(--primary)" }} />
                  {opt}
                </div>
              ))}
            </div>
          ))}

          <button className="btn btn-primary btn-full"
            onClick={submitQuiz}
            disabled={Object.keys(answers).length < quiz.length}
            style={{ marginTop: 8 }}>
            {Object.keys(answers).length < quiz.length
              ? `Còn ${quiz.length - Object.keys(answers).length} câu chưa trả lời`
              : "✅ Nộp bài"}
          </button>
        </div>
      )}

      {phase === PHASES.result && (
        <div style={{ maxWidth: 720 }}>
          <div className="card text-center" style={{ marginBottom: 24 }}>
            <div className="score-circle" style={{
              borderColor: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)",
              color: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)",
            }}>
              {pct}%
              <small>{score}/{quiz.length}</small>
            </div>
            <h2 style={{ marginBottom: 8 }}>
              {pct >= 80 ? "🎉 Xuất sắc!" : pct >= 50 ? "👍 Khá tốt!" : "💪 Cần cố gắng hơn!"}
            </h2>
            {saving ? (
              <span className="text-muted text-sm"><span className="spinner spinner-dark" /> Đang lưu kết quả...</span>
            ) : savedId ? (
              <span className="text-sm" style={{ color: "var(--success)" }}>✅ Đã lưu kết quả</span>
            ) : null}
            <div className="flex gap-2 items-center" style={{ justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-primary" onClick={resetQuiz}>🔄 Làm lại</button>
              <button className="btn btn-outline" onClick={() => navigate("/results")}>📊 Xem kết quả</button>
            </div>
          </div>

          <div className="card-title" style={{ marginBottom: 12 }}>📋 Chi tiết đáp án</div>
          {quiz.map((q, qi) => {
            const userAns = answers[qi];
            const correct = userAns === q.answer;
            return (
              <div key={qi} className="quiz-question-card">
                <div className="quiz-q-num">
                  Câu {qi + 1} — {correct ? "✅ Đúng" : "❌ Sai"}
                </div>
                <div className="quiz-q-text">{q.question}</div>
                {q.options.map((opt, oi) => (
                  <div key={oi} className={"quiz-option" + getOptionClass(qi, opt)}>
                    <input type="radio" readOnly checked={userAns === opt} />
                    {opt}
                    {opt === q.answer && <span style={{ marginLeft: "auto", color: "var(--success)", fontSize: 13, fontWeight: 700 }}>✓ Đáp án đúng</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
