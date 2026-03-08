const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ============================================================
// 計算引擎
// ============================================================
const CalcEngine = {
    calcCi1(B, S) { return B * S; },
    calcCi2(Ci1, L) { return Ci1 * L; },
    calcCi3(Ci2, qMeasure, wBehavior) { return (Ci2 * qMeasure) + wBehavior; },
    calcCi4(Ci3, G) { return Ci3 * G; },
    calcR(Ci3, Ci2) { return Ci2 === 0 ? 1 : Ci3 / Ci2; },
    
    // 計算單一服務項目的四步驟
    calcService(params) {
        const { B, S, L, qMeasure, wBehavior, G } = params;
        const sVal = window.CONFIG.clampS(S);
        const Ci1 = this.calcCi1(B, sVal);
        const Ci2 = this.calcCi2(Ci1, L);
        const Ci3 = this.calcCi3(Ci2, qMeasure, wBehavior);
        const Ci4 = this.calcCi4(Ci3, G);
        const R = this.calcR(Ci3, Ci2);
        const rating = window.CONFIG.getRating(R);
        return { Ci1, Ci2, Ci3, Ci4, R, rating, B, S: sVal, L, qMeasure, wBehavior, G };
    }
};

// ============================================================
// UUID 產生器
// ============================================================
let _idCounter = 0;
function uid() { return 'id_' + (++_idCounter) + '_' + Date.now(); }

// ============================================================
// 步驟指示器
// ============================================================
function StepIndicator({ current, steps }) {
    return (
        <div className="step-indicator">
            {steps.map((s, i) => (
                <div key={i} className={`step-dot ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
                    <div className="dot-circle">{i < current ? '✓' : i + 1}</div>
                    <span className="dot-label">{s}</span>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Step 1 — 遊程基本設定
// ============================================================
function TripSetup({ data, onChange }) {
    const types = window.CONFIG.tourismTypeWeighting;
    return (
        <div className="step-content fade-in">
            <h2 className="step-title">🌲 遊程基本設定</h2>
            <p className="step-desc">設定旅遊類型、天數與人員配置</p>

            <div className="form-grid">
                <div className="form-group">
                    <label>旅遊類型</label>
                    <div className="custom-select">
                        <select value={data.tripType} onChange={e => onChange({ ...data, tripType: e.target.value })}>
                            {Object.entries(types).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>旅遊天數</label>
                    <input type="number" min="1" max="30" value={data.days}
                        onChange={e => onChange({ ...data, days: Math.max(1, +e.target.value || 1) })} />
                </div>
                <div className="form-group">
                    <label>旅客人數</label>
                    <input type="number" min="1" max="200" value={data.passengers}
                        onChange={e => onChange({ ...data, passengers: Math.max(1, +e.target.value || 1) })} />
                </div>
                <div className="form-group">
                    <label>導遊人數</label>
                    <input type="number" min="0" max="10" value={data.guides}
                        onChange={e => onChange({ ...data, guides: Math.max(0, +e.target.value || 0) })} />
                </div>
                <div className="form-group">
                    <label>司機人數</label>
                    <input type="number" min="0" max="10" value={data.drivers}
                        onChange={e => onChange({ ...data, drivers: Math.max(0, +e.target.value || 0) })} />
                </div>
            </div>

            <div className="notice-box">
                <div className="notice-icon">💡</div>
                <div className="notice-text">
                    導遊司機加權比例 G = (旅客 + 導遊 + 司機) / 旅客 = <strong>{((data.passengers + data.guides + data.drivers) / data.passengers).toFixed(4)}</strong>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Step 2 — 商家管理
// ============================================================
function MerchantManager({ merchants, setMerchants }) {
    const sTypes = window.CONFIG.serviceTypes;

    const addMerchant = () => {
        setMerchants(prev => [...prev, {
            id: uid(),
            name: '',
            services: [],
            serviceDetails: {},
            measures: [],
            behaviors: [],
            conversionFactors: {}
        }]);
    };

    const removeMerchant = (id) => {
        setMerchants(prev => prev.filter(m => m.id !== id));
    };

    const updateMerchant = (id, field, value) => {
        setMerchants(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const toggleService = (id, svc) => {
        setMerchants(prev => prev.map(m => {
            if (m.id !== id) return m;
            const svcs = m.services.includes(svc)
                ? m.services.filter(s => s !== svc)
                : [...m.services, svc];
            return { ...m, services: svcs };
        }));
    };

    return (
        <div className="step-content fade-in">
            <h2 className="step-title">🏪 商家管理</h2>
            <p className="step-desc">新增遊程中的各商家，並勾選其提供的服務類型</p>

            <div className="merchant-list">
                {merchants.map((m, idx) => (
                    <div key={m.id} className="merchant-card">
                        <div className="merchant-header">
                            <span className="merchant-num">#{idx + 1}</span>
                            <input type="text" className="merchant-name-input"
                                placeholder="輸入商家名稱..."
                                value={m.name}
                                onChange={e => updateMerchant(m.id, 'name', e.target.value)} />
                            <button className="btn-remove" onClick={() => removeMerchant(m.id)} title="移除">✕</button>
                        </div>
                        <div className="service-chips">
                            {Object.entries(sTypes).map(([k, v]) => (
                                <label key={k} className={`chip ${m.services.includes(k) ? 'active' : ''}`}>
                                    <input type="checkbox" checked={m.services.includes(k)}
                                        onChange={() => toggleService(m.id, k)} />
                                    <span>{v.icon} {v.name}</span>
                                    {v.required && <span className="chip-required">必要</span>}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn-add" onClick={addMerchant}>
                ＋ 新增商家
            </button>

            <div className="notice-box">
                <div className="notice-icon">⚠️</div>
                <div className="notice-text">
                    每條遊程必須至少包含一個 <strong>門市場館服務 (C1)</strong> 與一個 <strong>運輸服務 (C2)</strong> 的商家。
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Step 3 — 商家數據輸入
// ============================================================
function MerchantDataInput({ merchants, setMerchants, tripData }) {
    const baselines = window.CONFIG.baselineValues;

    const updateDetail = (mId, serviceCode, field, value) => {
        setMerchants(prev => prev.map(m => {
            if (m.id !== mId) return m;
            const sd = { ...m.serviceDetails };
            if (!sd[serviceCode]) sd[serviceCode] = {};
            sd[serviceCode] = { ...sd[serviceCode], [field]: value };
            return { ...m, serviceDetails: sd };
        }));
    };

    const updateS = (mId, serviceCode, value) => {
        setMerchants(prev => prev.map(m => {
            if (m.id !== mId) return m;
            const cf = { ...m.conversionFactors, [serviceCode]: +value || 1.0 };
            return { ...m, conversionFactors: cf };
        }));
    };

    return (
        <div className="step-content fade-in">
            <h2 className="step-title">📊 商家數據輸入</h2>
            <p className="step-desc">為每個商家的各項服務輸入基準類型與轉換因子</p>

            {merchants.map((m, idx) => (
                <div key={m.id} className="merchant-card data-card">
                    <div className="merchant-header">
                        <span className="merchant-num">#{idx + 1}</span>
                        <span className="merchant-name-display">{m.name || '(未命名)'}</span>
                    </div>

                    {m.services.map(svc => {
                        const options = baselines[svc];
                        if (!options) return null;
                        const detail = m.serviceDetails[svc] || {};
                        const sType = window.CONFIG.serviceTypes[svc];
                        const selectedType = detail.type || Object.keys(options)[0];
                        const selectedOption = options[selectedType];

                        return (
                            <div key={svc} className="service-data-block">
                                <h4>{sType.icon} {sType.name} ({svc})</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>服務子類型</label>
                                        <div className="custom-select">
                                            <select value={selectedType}
                                                onChange={e => updateDetail(m.id, svc, 'type', e.target.value)}>
                                                {Object.entries(options).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.name} (B={v.B})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>轉換因子 S <span className="hint">(0.3~3.0)</span></label>
                                        <input type="number" step="0.01" min="0.3" max="3.0"
                                            value={m.conversionFactors[svc] ?? 1.0}
                                            onChange={e => updateS(m.id, svc, e.target.value)} />
                                    </div>

                                    {selectedOption && selectedOption.needDistance && (
                                        <div className="form-group">
                                            <label>距離 (公里)</label>
                                            <input type="number" min="0"
                                                value={detail.distance || 0}
                                                onChange={e => updateDetail(m.id, svc, 'distance', +e.target.value || 0)} />
                                        </div>
                                    )}

                                    {svc === 'C3' && (
                                        <div className="form-group">
                                            <label>用餐次數</label>
                                            <input type="number" min="1"
                                                value={detail.quantity || 1}
                                                onChange={e => updateDetail(m.id, svc, 'quantity', Math.max(1, +e.target.value || 1))} />
                                        </div>
                                    )}

                                    {svc === 'C4' && (
                                        <div className="form-group">
                                            <label>住宿晚數</label>
                                            <input type="number" min="1"
                                                value={detail.nights || Math.max(1, tripData.days - 1)}
                                                onChange={e => updateDetail(m.id, svc, 'nights', Math.max(1, +e.target.value || 1))} />
                                        </div>
                                    )}

                                    {svc === 'C5' && (
                                        <div className="form-group">
                                            <label>活動次數</label>
                                            <input type="number" min="1"
                                                value={detail.quantity || 1}
                                                onChange={e => updateDetail(m.id, svc, 'quantity', Math.max(1, +e.target.value || 1))} />
                                        </div>
                                    )}
                                </div>

                                <div className="baseline-info">
                                    基準值 B = <strong>{selectedOption?.B}</strong> {selectedOption?.unit}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Step 4 — 碳排問卷
// ============================================================
function CarbonSurvey({ merchants, setMerchants }) {
    const measures = window.CONFIG.measureWeighting;
    const behaviors = window.CONFIG.behaviorWeighting;

    const toggleMeasure = (mId, key) => {
        setMerchants(prev => prev.map(m => {
            if (m.id !== mId) return m;
            const ms = m.measures.includes(key)
                ? m.measures.filter(k => k !== key)
                : [...m.measures, key];
            return { ...m, measures: ms };
        }));
    };

    const toggleBehavior = (mId, key) => {
        setMerchants(prev => prev.map(m => {
            if (m.id !== mId) return m;
            const bs = m.behaviors.includes(key)
                ? m.behaviors.filter(k => k !== key)
                : [...m.behaviors, key];
            return { ...m, behaviors: bs };
        }));
    };

    return (
        <div className="step-content fade-in">
            <h2 className="step-title">📋 碳排措施問卷</h2>
            <p className="step-desc">勾選各商家已採行的減碳措施與行為碳排項目</p>

            {merchants.map((m, idx) => {
                const relevantMeasures = measures.filter(ms => m.services.includes(ms.category));
                const relevantBehaviors = behaviors.filter(bh => m.services.includes(bh.category));

                if (relevantMeasures.length === 0 && relevantBehaviors.length === 0) return null;

                return (
                    <div key={m.id} className="merchant-card survey-card">
                        <div className="merchant-header">
                            <span className="merchant-num">#{idx + 1}</span>
                            <span className="merchant-name-display">{m.name || '(未命名)'}</span>
                        </div>

                        {relevantMeasures.length > 0 && (
                            <div className="survey-section">
                                <h4>📉 碳排措施加權 (比例調整)</h4>
                                <div className="checkbox-group">
                                    {relevantMeasures.map(ms => (
                                        <label key={ms.key} className="checkbox-item">
                                            <input type="checkbox"
                                                checked={m.measures.includes(ms.key)}
                                                onChange={() => toggleMeasure(m.id, ms.key)} />
                                            <span className="checkmark"></span>
                                            <span>{ms.label} ({ms.factor > 0 ? '+' : ''}{(ms.factor * 100).toFixed(0)}%)</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {relevantBehaviors.length > 0 && (
                            <div className="survey-section">
                                <h4>🔋 行為排碳加權 (固定量)</h4>
                                <div className="checkbox-group">
                                    {relevantBehaviors.map(bh => (
                                        <label key={bh.key} className="checkbox-item">
                                            <input type="checkbox"
                                                checked={m.behaviors.includes(bh.key)}
                                                onChange={() => toggleBehavior(m.id, bh.key)} />
                                            <span className="checkmark"></span>
                                            <span>{bh.label} ({bh.value > 0 ? '+' : ''}{bh.value} kg)</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================
// Step 5 — 計算結果
// ============================================================
function ResultsDashboard({ results, tripData }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const barChartRef = useRef(null);
    const barChartInstance = useRef(null);
    const reportRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    // PDF 下載
    const handleDownloadPDF = useCallback(async () => {
        if (!reportRef.current || downloading) return;
        setDownloading(true);
        try {
            const element = reportRef.current;
            const opt = {
                margin:       [10, 10, 10, 10],
                filename:     `碳足跡計算報告_${new Date().toISOString().slice(0,10)}.pdf`,
                image:        { type: 'jpeg', quality: 0.95 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('PDF 生成失敗:', err);
            alert('PDF 下載失敗，請稍後再試。');
        } finally {
            setDownloading(false);
        }
    }, [downloading]);

    // 圓餅圖 — 服務類別佔比
    useEffect(() => {
        if (!chartRef.current || !results) return;
        const serviceBreakdown = {};
        results.merchantResults.forEach(mr => {
            mr.services.forEach(sr => {
                const label = window.CONFIG.serviceTypes[sr.serviceCode]?.name || sr.serviceCode;
                serviceBreakdown[label] = (serviceBreakdown[label] || 0) + Math.max(0, sr.Ci4);
            });
        });
        const labels = Object.keys(serviceBreakdown);
        const data = Object.values(serviceBreakdown);
        const colors = ['#2A9D8F', '#F4A261', '#E76F51', '#264653', '#E9C46A'];

        if (chartInstance.current) {
            chartInstance.current.data.labels = labels;
            chartInstance.current.data.datasets[0].data = data;
            chartInstance.current.update();
        } else {
            chartInstance.current = new Chart(chartRef.current, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0, hoverOffset: 6 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { family: "'Noto Sans TC', sans-serif" }, padding: 16 } }
                    }
                }
            });
        }
    }, [results]);

    // 長條圖 — 各商家碳排比較
    useEffect(() => {
        if (!barChartRef.current || !results) return;
        const labels = results.merchantResults.map(mr => mr.name || '未命名');
        const data = results.merchantResults.map(mr => mr.totalCi4);

        if (barChartInstance.current) {
            barChartInstance.current.data.labels = labels;
            barChartInstance.current.data.datasets[0].data = data;
            barChartInstance.current.update();
        } else {
            barChartInstance.current = new Chart(barChartRef.current, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Ci-4 (kgCO₂e/人-旅)',
                        data,
                        backgroundColor: 'rgba(42, 157, 143, 0.7)',
                        borderColor: '#2A9D8F',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'kgCO₂e/人-旅' } }
                    }
                }
            });
        }
    }, [results]);

    if (!results) return <div className="step-content"><p>計算中...</p></div>;

    return (
        <div className="step-content fade-in">
            <div className="results-actions">
                <h2 className="step-title">📊 計算結果</h2>
                <button className="btn btn-pdf" onClick={handleDownloadPDF} disabled={downloading}>
                    {downloading ? '⏳ 生成中...' : '📄 下載 PDF 報告'}
                </button>
            </div>

            <div ref={reportRef}>

            {/* 總碳足跡大卡 */}
            <div className="score-card">
                <div className="leaf-bg"></div>
                <div className="score-content">
                    <div className="score-label">遊程總碳足跡</div>
                    <div className="score-wrapper">
                        <div className="score-value">{results.totalCarbon.toFixed(2)}</div>
                        <div className="unit">kgCO₂e/人-旅</div>
                    </div>
                    <div className="score-subtitle">
                        {tripData.passengers} 位旅客 · {tripData.days} 天行程 · {window.CONFIG.tourismTypeWeighting[tripData.tripType]?.label}
                    </div>
                </div>
            </div>

            {/* 圖表區 */}
            <div className="charts-row">
                <div className="chart-block">
                    <h3>服務類別碳排佔比</h3>
                    <div className="chart-container"><canvas ref={chartRef}></canvas></div>
                </div>
                <div className="chart-block">
                    <h3>各商家碳排比較</h3>
                    <div className="chart-container"><canvas ref={barChartRef}></canvas></div>
                </div>
            </div>

            {/* 各商家明細 */}
            <h3 className="section-title">📋 各商家四步驟碳足跡明細</h3>
            <div className="results-table-wrap">
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>商家</th>
                            <th>服務</th>
                            <th>Ci-1<br/><small>基礎</small></th>
                            <th>Ci-2<br/><small>型態校正</small></th>
                            <th>Ci-3<br/><small>情境介入</small></th>
                            <th>Ci-4<br/><small>完整服務</small></th>
                            <th>R 值</th>
                            <th>等級</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.merchantResults.map(mr =>
                            mr.services.map((sr, si) => (
                                <tr key={mr.id + '_' + sr.serviceCode}>
                                    {si === 0 && <td rowSpan={mr.services.length} className="merchant-cell">{mr.name || '未命名'}</td>}
                                    <td>{window.CONFIG.serviceTypes[sr.serviceCode]?.icon} {sr.serviceCode}</td>
                                    <td>{sr.Ci1.toFixed(3)}</td>
                                    <td>{sr.Ci2.toFixed(3)}</td>
                                    <td>{sr.Ci3.toFixed(3)}</td>
                                    <td className="bold">{sr.Ci4.toFixed(2)}</td>
                                    <td>{sr.R.toFixed(3)}</td>
                                    <td>
                                        <span className="rating-badge" style={{ backgroundColor: sr.rating.color }}>
                                            {sr.rating.grade}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        <tr className="total-row">
                            <td colSpan="5" className="text-right"><strong>遊程總碳足跡</strong></td>
                            <td className="bold">{results.totalCarbon.toFixed(2)}</td>
                            <td colSpan="2">kgCO₂e/人-旅</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 減碳建議 */}
            <div className="suggestions-block">
                <h3 className="section-title">🌱 減碳建議</h3>
                {results.suggestions.length === 0 ? (
                    <p className="no-suggestions">目前所有服務均已達到良好的碳排水準！</p>
                ) : (
                    <ul className="suggestion-list">
                        {results.suggestions.map((s, i) => (
                            <li key={i} className="suggestion-item">
                                <span className="suggestion-icon">{s.icon}</span>
                                <span>{s.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            </div>{/* end reportRef */}
        </div>
    );
}

// ============================================================
// 主應用程式
// ============================================================
function App() {
    const [step, setStep] = useState(0);
    const stepNames = ['遊程設定', '商家管理', '數據輸入', '碳排問卷', '計算結果'];

    const [tripData, setTripData] = useState({
        tripType: 'flatland',
        days: 1,
        passengers: 43,
        guides: 1,
        drivers: 2
    });

    const [merchants, setMerchants] = useState([]);
    const [results, setResults] = useState(null);

    // 計算 G (導遊司機加權)
    const G = useMemo(() =>
        (tripData.passengers + tripData.guides + tripData.drivers) / tripData.passengers,
        [tripData.passengers, tripData.guides, tripData.drivers]
    );

    // 進入結果頁時自動計算
    useEffect(() => {
        if (step !== 4) return;

        const merchantResults = merchants.map(m => {
            const serviceResults = m.services.map(svc => {
                const baselines = window.CONFIG.baselineValues[svc];
                const detail = m.serviceDetails[svc] || {};
                const selectedType = detail.type || Object.keys(baselines)[0];
                const option = baselines[selectedType];
                if (!option) return null;

                let B = option.B;

                // C2 運輸：B = B值(每pkm) × 距離
                if (svc === 'C2' && option.needDistance) {
                    B = option.B * (detail.distance || 0);
                }
                // C3 餐飲：B = B值 × 用餐次數
                if (svc === 'C3') {
                    B = option.B * (detail.quantity || 1);
                }
                // C4 住宿：B = B值 × 晚數
                if (svc === 'C4') {
                    B = option.B * (detail.nights || Math.max(1, tripData.days - 1));
                }
                // C5 遊樂：B = B值 × 次數
                if (svc === 'C5') {
                    B = option.B * (detail.quantity || 1);
                }

                const S = m.conversionFactors[svc] ?? 1.0;
                const L = window.CONFIG.tourismTypeWeighting[tripData.tripType]?.[svc] || 1.0;

                // 碳排措施比例加權 Q
                const relevantMeasures = window.CONFIG.measureWeighting.filter(ms => ms.category === svc);
                let qMeasure = 1.0;
                relevantMeasures.forEach(ms => {
                    if (m.measures.includes(ms.key)) {
                        qMeasure += ms.factor;
                    }
                });

                // 行為排碳固定加權 W
                const relevantBehaviors = window.CONFIG.behaviorWeighting.filter(bh => bh.category === svc);
                let wBehavior = 0;
                relevantBehaviors.forEach(bh => {
                    if (m.behaviors.includes(bh.key)) {
                        wBehavior += bh.value;
                    }
                });

                const result = CalcEngine.calcService({ B, S, L, qMeasure, wBehavior, G });
                return { serviceCode: svc, typeName: option.name, ...result };
            }).filter(Boolean);

            const totalCi4 = serviceResults.reduce((sum, sr) => sum + sr.Ci4, 0);
            return { id: m.id, name: m.name, services: serviceResults, totalCi4 };
        });

        const totalCarbon = merchantResults.reduce((sum, mr) => sum + mr.totalCi4, 0);

        // 減碳建議
        const suggestions = [];
        merchantResults.forEach(mr => {
            mr.services.forEach(sr => {
                if (sr.rating.grade === 'C' || sr.rating.grade === 'D') {
                    suggestions.push({
                        icon: '⚠️',
                        text: `「${mr.name}」的${window.CONFIG.serviceTypes[sr.serviceCode]?.name}碳排等級為 ${sr.rating.grade}，建議加強減碳措施。`
                    });
                }
            });
        });

        // 通用建議
        const allMeasureKeys = merchants.flatMap(m => m.measures);
        const unusedMeasures = window.CONFIG.measureWeighting.filter(ms => !allMeasureKeys.includes(ms.key) && ms.factor < 0);
        if (unusedMeasures.length > 0) {
            suggestions.push({
                icon: '💡',
                text: `尚可採行的減碳措施：${unusedMeasures.slice(0, 3).map(ms => ms.label).join('、')}。`
            });
        }

        setResults({ merchantResults, totalCarbon, suggestions });
    }, [step, merchants, tripData, G]);

    // 步驟導航驗證
    const canProceed = useMemo(() => {
        if (step === 0) return true;
        if (step === 1) {
            const hasC1 = merchants.some(m => m.services.includes('C1'));
            const hasC2 = merchants.some(m => m.services.includes('C2'));
            return merchants.length > 0 && hasC1 && hasC2;
        }
        return true;
    }, [step, merchants]);

    return (
        <div className="container">
            <header className="fade-in">
                <div className="header-icon">🌿</div>
                <h1>旅遊碳足跡計算系統</h1>
                <p>國家公園低碳生態旅遊 · 四大類型碳足跡計算模組</p>
            </header>

            <StepIndicator current={step} steps={stepNames} />

            <main className="main-panel slide-up">
                {step === 0 && <TripSetup data={tripData} onChange={setTripData} />}
                {step === 1 && <MerchantManager merchants={merchants} setMerchants={setMerchants} />}
                {step === 2 && <MerchantDataInput merchants={merchants} setMerchants={setMerchants} tripData={tripData} />}
                {step === 3 && <CarbonSurvey merchants={merchants} setMerchants={setMerchants} />}
                {step === 4 && <ResultsDashboard results={results} tripData={tripData} />}
            </main>

            {/* 導航按鈕 */}
            <div className="nav-buttons">
                {step > 0 && (
                    <button className="btn btn-prev" onClick={() => setStep(s => s - 1)}>
                        ← 上一步
                    </button>
                )}
                {step < 4 && (
                    <button className="btn btn-next" onClick={() => setStep(s => s + 1)}
                        disabled={!canProceed}>
                        {step === 3 ? '🔍 開始計算' : '下一步 →'}
                    </button>
                )}
            </div>

            <footer>
                <p>※ 本系統依據「國家公園低碳生態旅遊四大類型碳足跡計算模組」規劃報告開發，數據僅供模擬評估參考。</p>
            </footer>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
