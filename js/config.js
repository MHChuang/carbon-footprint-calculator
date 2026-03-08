// ============================================================
// 國家公園低碳生態旅遊 碳足跡計算系統 — 完整係數設定
// ============================================================

const CONFIG = {

    // ----------------------------------------------------------
    // 1. 服務類別定義
    // ----------------------------------------------------------
    serviceTypes: {
        C1: { code: 'C1', name: '門市場館服務', icon: '🏢', required: true },
        C2: { code: 'C2', name: '運輸服務',     icon: '🚌', required: true },
        C3: { code: 'C3', name: '餐飲服務',     icon: '🍽️', required: false },
        C4: { code: 'C4', name: '住宿服務',     icon: '🏨', required: false },
        C5: { code: 'C5', name: '遊樂活動服務', icon: '🎯', required: false }
    },

    // ----------------------------------------------------------
    // 2. 服務基準值 B (kgCO₂e)
    //    各服務類別可選擇的子類型與對應基準值
    // ----------------------------------------------------------
    baselineValues: {
        C1: {
            travelAgency:   { name: '旅行社門店',   B: 0.697, unit: 'kgCO₂e/人-旅' },
            visitorCenter:  { name: '遊客中心',     B: 0.460, unit: 'kgCO₂e/人-旅' }
        },
        C2: {
            hsr:            { name: '高鐵',         B: 0.029,  unit: 'kgCO₂e/pkm', needDistance: true },
            train:          { name: '台鐵',         B: 0.036,  unit: 'kgCO₂e/pkm', needDistance: true },
            largeBus:       { name: '大巴/遊覽車',  B: 0.0441, unit: 'kgCO₂e/pkm', needDistance: true },
            mediumBus:      { name: '小巴/中巴',    B: 0.0784, unit: 'kgCO₂e/pkm', needDistance: true },
            car:            { name: '自用小客車',   B: 0.115,  unit: 'kgCO₂e/pkm', needDistance: true },
            airplane:       { name: '飛機',         B: 0.281,  unit: 'kgCO₂e/pkm', needDistance: true },
            ferry:          { name: '客輪(短程)',   B: 11.6,   unit: 'kgCO₂e/人次', needDistance: false },
            walkBike:       { name: '步行/自行車',  B: 0,      unit: 'kgCO₂e/pkm', needDistance: true }
        },
        C3: {
            tableMealLunch: { name: '合菜午晚餐',   B: 1.54, unit: 'kgCO₂e/人' },
            lunchBox:       { name: '便當',         B: 1.05, unit: 'kgCO₂e/人' },
            hotelBreakfast: { name: '飯店早餐',     B: 0.85, unit: 'kgCO₂e/人' },
            vegetarian:     { name: '素食套餐',     B: 1.60, unit: 'kgCO₂e/人' }
        },
        C4: {
            fiveStar:       { name: '五星級飯店',   B: 22.4, unit: 'kgCO₂e/人-晚' },
            threeStar:      { name: '三星級旅館',   B: 16.2, unit: 'kgCO₂e/人-晚' },
            bnbCabin:       { name: '民宿/山屋',   B: 4.80, unit: 'kgCO₂e/人-晚' }
        },
        C5: {
            guidedTour:     { name: '導覽體驗',     B: 0.15,  unit: 'kgCO₂e/人-次' },
            diy:            { name: '手作DIY',     B: 0.22,  unit: 'kgCO₂e/人-次' },
            naturalVisit:   { name: '自然參觀',     B: 5.00,  unit: 'kgCO₂e/人' },
            largeActivity:  { name: '體驗活動(大型)', B: 14.6, unit: 'kgCO₂e/人' }
        }
    },

    // ----------------------------------------------------------
    // 3. 旅遊型態加權 L
    //    依地理環境 × 服務類別的二維矩陣
    // ----------------------------------------------------------
    tourismTypeWeighting: {
        alpine: {   // 高山型 (> 2000m)
            label: '高山型 (>2000m)',
            C1: 1.00, C2: 1.175, C3: 1.25, C4: 1.20, C5: 1.20
        },
        hills: {    // 淺山型 (< 2000m)
            label: '淺山型 (<2000m)',
            C1: 1.00, C2: 1.175, C3: 1.10, C4: 1.10, C5: 1.10
        },
        flatland: { // 平地型
            label: '平地型 (市區/平原)',
            C1: 1.00, C2: 1.00, C3: 1.00, C4: 1.00, C5: 1.00
        },
        island: {   // 離島型
            label: '離島型 (離島)',
            C1: 1.00, C2: 1.00, C3: 1.05, C4: 1.05, C5: 1.00
        }
    },

    // ----------------------------------------------------------
    // 4. 碳排措施加權 — 比例性調整 (乘法)
    //    Q_措施 = 1 + Σ(已勾選項目的 factor)
    // ----------------------------------------------------------
    measureWeighting: [
        { key: 'meatOver70',    label: '肉類比例 > 70%',     factor: +0.10, category: 'C3' },
        { key: 'vegOver80',     label: '蔬果比例 > 80%',     factor: -0.10, category: 'C3' },
        { key: 'ownTableware',  label: '自備環保餐具',        factor: -0.03, category: 'C3' },
        { key: 'localFood70',  label: '在地食材 > 70%',     factor: -0.03, category: 'C3' },
        { key: 'solarEquip',   label: '太陽能設備',          factor: -0.03, category: 'C4' },
        { key: 'greenPower',   label: '綠電自發自用',        factor: -0.30, category: 'C4' },
        { key: 'eTicket',      label: '使用電子票證',        factor: -0.03, category: 'C1' },
        { key: 'ecoLabel',     label: '環保標章旅館',        factor: -0.05, category: 'C4' },
        { key: 'publicTransit',label: '搭乘大眾運輸',        factor: -0.03, category: 'C2' }
    ],

    // ----------------------------------------------------------
    // 5. 行為排碳加權 — 固定量調整 (加法, kgCO₂e/人)
    // ----------------------------------------------------------
    behaviorWeighting: [
        { key: 'bottledWater',  label: '免費提供瓶裝水',      value: +0.140, category: 'C3' },
        { key: 'cannedDrink',   label: '提供罐裝飲料',        value: +0.278, category: 'C3' },
        { key: 'paperWaste',    label: '免費紙類/文宣耗材',   value: +0.108, category: 'C1' },
        { key: 'singleBattery', label: '一次性電池使用',      value: +0.050, category: 'C5' },
        { key: 'plasticWaste',  label: '一次性塑膠耗材',      value: +0.111, category: 'C3' },
        { key: 'packagedSnack', label: '包裝零食',            value: +0.220, category: 'C3' }
    ],

    // ----------------------------------------------------------
    // 6. R 值評等標準
    //    R = Ci-3 / Ci-2
    // ----------------------------------------------------------
    ratingScale: [
        { grade: 'A+', label: '卓越低碳', max: 0.70,  color: '#1B5E20' },
        { grade: 'A',  label: '低碳級',   max: 0.85,  color: '#4CAF50' },
        { grade: 'B',  label: '基準級',   max: 1.15,  color: '#FF9800' },
        { grade: 'C',  label: '偏高碳',   max: 1.50,  color: '#FF5722' },
        { grade: 'D',  label: '高碳級',   max: Infinity, color: '#D32F2F' }
    ],

    // ----------------------------------------------------------
    // 7. 轉換因子 S 的範圍限制
    // ----------------------------------------------------------
    conversionFactorRange: { min: 0.3, max: 3.0, default: 1.0 },

    // ----------------------------------------------------------
    // 8. 示範遊程 — 台江1日遊 (用於驗證)
    // ----------------------------------------------------------
    demoTrip: {
        name: '台江國家公園1日遊',
        type: 'flatland',
        days: 1,
        passengers: 43,
        guides: 1,
        drivers: 2,
        expectedTotal: 118.02
    },

    // ----------------------------------------------------------
    // 工具函式
    // ----------------------------------------------------------
    
    // 取得 R 值對應的評等
    getRating(rValue) {
        for (const tier of this.ratingScale) {
            if (rValue <= tier.max) return tier;
        }
        return this.ratingScale[this.ratingScale.length - 1];
    },

    // 限制 S 在有效範圍
    clampS(s) {
        return Math.max(this.conversionFactorRange.min,
               Math.min(this.conversionFactorRange.max, s));
    }
};

window.CONFIG = CONFIG;
