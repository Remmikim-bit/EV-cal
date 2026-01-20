import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Settings, Info, TrendingUp, Wand2, RefreshCw, CheckCircle2, Clock, LayoutDashboard, BarChart3, PieChart as PieChartIconSvg, BrainCircuit, Sun, CloudSun, Snowflake } from 'lucide-react';

// ==========================================
// UI Components
// ==========================================

const Card = ({ children, className = "", noPadding = false }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-slate-300 ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon size={18} className="text-slate-500" />}
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
    </div>
    {description && <p className="text-xs text-slate-400 pl-7">{description}</p>}
  </div>
);

const InputGroup = ({ label, children, unit, helpText }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {helpText && <span className="text-[10px] text-slate-400">{helpText}</span>}
    </div>
    <div className="relative flex items-center">
      {children}
      {unit && <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">{unit}</span>}
    </div>
  </div>
);

const StyledInput = (props) => (
  <input
    {...props}
    className="w-full h-10 pl-3 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-right placeholder:text-slate-300"
  />
);

const Badge = ({ children, color = 'slate' }) => {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

// ==========================================
// Constants & Initial Data
// ==========================================

const FIXED_PUBLIC_UNIT_COST = 167;
const DEVICE_CAPACITY = { rapid: 50, slow: 7, outlet: 3 };

// Time Zones: 0=Light, 1=Mid, 2=Heavy
const TIME_ZONES = {
  springFall: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0],
  summer: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0],
  winter: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 2, 0]
};

// [수정 완료] 사용자 제공 데이터를 반영한 요금제
const KEPCO_PLANS = [
  { 
    id: 0, 
    name: '선택 I', 
    baseRate: 2580, 
    rates: { 
      springFall: { light: 80.2, mid: 91.0, heavy: 94.9 }, 
      summer: { light: 89.8, mid: 129.9, heavy: 151.2 }, 
      winter: { light: 99.4, mid: 118.4, heavy: 132.4 } 
    } 
  },
  { 
    id: 1, 
    name: '선택 II', 
    baseRate: 2580, 
    rates: { 
      springFall: { light: 80.2, mid: 91.0, heavy: 94.9 }, 
      summer: { light: 78.2, mid: 113.0, heavy: 198.6 }, 
      winter: { light: 95.2, mid: 105.5, heavy: 172.4 } 
    } 
  },
  { 
    id: 2, 
    name: '선택 III', 
    baseRate: 2580, 
    rates: { 
      springFall: { light: 80.2, mid: 91.0, heavy: 94.9 }, 
      summer: { light: 84.5, mid: 111.9, heavy: 174.0 }, 
      winter: { light: 103.6, mid: 104.5, heavy: 151.6 } 
    } 
  },
  { 
    id: 3, 
    name: '선택 IV', 
    baseRate: 2580, 
    rates: { 
      springFall: { light: 91.0, mid: 91.0, heavy: 91.0 }, 
      summer: { light: 137.4, mid: 137.4, heavy: 137.4 }, 
      winter: { light: 127.7, mid: 127.7, heavy: 127.7 } 
    } 
  },
];

const DEFAULT_WEIGHTS_RAPID = [
  1, 1, 1, 1, 1, 2, 4, 6, 8, 9, 9, 9, 8, 8, 8, 9, 9, 8, 6, 4, 3, 2, 1, 1
];

const DEFAULT_WEIGHTS_SLOW = [
  9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 2, 2, 3, 4, 6, 8, 9, 9, 9, 9, 9
];

const DEFAULT_WEIGHTS_OUTLET = [
  9, 9, 8, 8, 8, 7, 7, 3, 2, 1, 0, 0, 0, 0, 0, 1, 4, 6, 8, 9, 9, 9, 9, 9
];

export default function App() {
  // ... (State 및 로직은 이전과 동일하며 데이터만 업데이트됨)
  // [State]
  const [inputTotalUsage, setInputTotalUsage] = useState(15000); 
  const [inputTargetProfit, setInputTargetProfit] = useState(125); 
  const [inputAnnualInsurance, setInputAnnualInsurance] = useState(225); 
  
  const [inputShare, setInputShare] = useState({ rapid: 10, slow: 50, outlet: 40 });
  const [inputDeviceCount, setInputDeviceCount] = useState({ rapid: 2, slow: 8, outlet: 36 });
  const [inputDevicePublic, setInputDevicePublic] = useState({ rapid: true, slow: false, outlet: false });
  const [inputContractPower, setInputContractPower] = useState(164);
  
  const [inputHourlyWeights, setInputHourlyWeights] = useState({
    rapid: [...DEFAULT_WEIGHTS_RAPID],
    slow: [...DEFAULT_WEIGHTS_SLOW],
    outlet: [...DEFAULT_WEIGHTS_OUTLET]
  });

  const [inputDeviceFees, setInputDeviceFees] = useState({
    rapid: { light: 290, mid: 290, heavy: 290 }, 
    slow: { light: 200, mid: 250, heavy: 300 },   
    outlet: { light: 180, mid: 230, heavy: 280 }  
  });
  
  const [inputUseTOU, setInputUseTOU] = useState(true);
  const [simulationSeason, setSimulationSeason] = useState('summer'); 
  const [activeFeeTab, setActiveFeeTab] = useState('slow');
  const [activePatternTab, setActivePatternTab] = useState('slow'); 

  const [simData, setSimData] = useState({
    totalUsage: 15000,
    targetProfit: 1250000, 
    annualInsurance: 2250000,
    share: { rapid: 10, slow: 50, outlet: 40 },
    devicePublic: { rapid: true, slow: false, outlet: false },
    costRapidUnit: FIXED_PUBLIC_UNIT_COST, 
    contractPower: 50,
    hourlyWeights: {
      rapid: [...DEFAULT_WEIGHTS_RAPID],
      slow: [...DEFAULT_WEIGHTS_SLOW],
      outlet: [...DEFAULT_WEIGHTS_OUTLET]
    },
    deviceFees: {
      rapid: { light: 290, mid: 290, heavy: 290 }, 
      slow: { light: 200, mid: 250, heavy: 300 },   
      outlet: { light: 180, mid: 230, heavy: 280 }  
    },
    useTOU: true, 
    season: 'summer'
  });

  const [allPlanResults, setAllPlanResults] = useState([]);
  const [isDirty, setIsDirty] = useState(true);

  // [Effects]
  useEffect(() => {
    let newContractPower = 0;
    if (!inputDevicePublic.rapid) newContractPower += inputDeviceCount.rapid * DEVICE_CAPACITY.rapid;
    if (!inputDevicePublic.slow) newContractPower += inputDeviceCount.slow * DEVICE_CAPACITY.slow;
    if (!inputDevicePublic.outlet) newContractPower += inputDeviceCount.outlet * DEVICE_CAPACITY.outlet;
    setInputContractPower(newContractPower);
  }, [inputDeviceCount, inputDevicePublic]);

  useEffect(() => {
    setIsDirty(true);
  }, [inputTotalUsage, inputTargetProfit, inputAnnualInsurance, inputShare, inputDevicePublic, inputContractPower, inputHourlyWeights, inputDeviceFees, simulationSeason, inputUseTOU]);

  // [Calculation Logic]
  const calculateMonthly = (data, seasonKey, plan) => {
    const { totalUsage, annualInsurance, share, devicePublic, costRapidUnit, contractPower, hourlyWeights, deviceFees } = data;
    const baseRate = plan.baseRate;
    const rates = plan.rates[seasonKey];
    const timeZones = TIME_ZONES[seasonKey];

    const dailyTotal = totalUsage / 30;
    const dailyVol = {
        rapid: dailyTotal * (share.rapid / 100),
        slow: dailyTotal * (share.slow / 100),
        outlet: dailyTotal * (share.outlet / 100)
    };

    const sumWeights = {
        rapid: hourlyWeights.rapid.reduce((a, b) => a + b, 0) || 1,
        slow: hourlyWeights.slow.reduce((a, b) => a + b, 0) || 1,
        outlet: hourlyWeights.outlet.reduce((a, b) => a + b, 0) || 1
    };

    let loads = { 0: 0, 1: 0, 2: 0 }; 
    for (let h = 0; h < 24; h++) {
      const uRapid = dailyVol.rapid * (hourlyWeights.rapid[h] / sumWeights.rapid);
      const uSlow = dailyVol.slow * (hourlyWeights.slow[h] / sumWeights.slow);
      const uOutlet = dailyVol.outlet * (hourlyWeights.outlet[h] / sumWeights.outlet);
      loads[timeZones[h]] += (uRapid + uSlow + uOutlet);
    }

    const monthlyLoads = { light: loads[0] * 30, mid: loads[1] * 30, heavy: loads[2] * 30 };
    const pattern = { 
      light: (monthlyLoads.light / totalUsage) * 100 || 0, 
      mid: (monthlyLoads.mid / totalUsage) * 100 || 0, 
      heavy: (monthlyLoads.heavy / totalUsage) * 100 || 0 
    };
    
    const avgKwhCost = (rates.light * pattern.light + rates.mid * pattern.mid + rates.heavy * pattern.heavy) / 100;
    const getAvgPrice = (fees) => (fees.light * pattern.light + fees.mid * pattern.mid + fees.heavy * pattern.heavy) / 100;
    
    const volRapid = totalUsage * (share.rapid / 100);
    const volSlow = totalUsage * (share.slow / 100);
    const volOutlet = totalUsage * (share.outlet / 100);
    
    const revenue = (volRapid * getAvgPrice(deviceFees.rapid)) + (volSlow * getAvgPrice(deviceFees.slow)) + (volOutlet * getAvgPrice(deviceFees.outlet));
    const calcCost = (vol, isPublic) => isPublic ? vol * costRapidUnit : vol * avgKwhCost;
    const costElectricity = calcCost(volRapid, devicePublic.rapid) + calcCost(volSlow, devicePublic.slow) + calcCost(volOutlet, devicePublic.outlet);
    
    const costBase = contractPower > 0 ? (contractPower * baseRate) : 0;
    const totalCost = costElectricity + costBase + (annualInsurance / 12);
    
    return { revenue, cost: totalCost, profit: revenue - totalCost, pattern };
  };

  const calculateAnnualStats = (data, plan) => {
    const months = { springFall: 5, summer: 3, winter: 4 };
    let totalProfit = 0, totalRevenue = 0, totalCost = 0;
    Object.keys(months).forEach(season => {
      const result = calculateMonthly(data, season, plan);
      totalProfit += result.profit * months[season];
      totalRevenue += result.revenue * months[season];
      totalCost += result.cost * months[season];
    });
    return { totalProfit, monthlyAvgProfit: totalProfit / 12, totalRevenue, totalCost };
  };

  const handleRunSimulation = () => {
    const commonData = {
      totalUsage: inputTotalUsage,
      targetProfit: inputTargetProfit * 10000, 
      annualInsurance: inputAnnualInsurance * 10000,
      share: { ...inputShare },
      devicePublic: { ...inputDevicePublic },
      costRapidUnit: FIXED_PUBLIC_UNIT_COST, 
      contractPower: inputContractPower,
      hourlyWeights: JSON.parse(JSON.stringify(inputHourlyWeights)),
      deviceFees: JSON.parse(JSON.stringify(inputDeviceFees)),
      useTOU: inputUseTOU,
      season: simulationSeason
    };
    setSimData(commonData);
    const results = KEPCO_PLANS.map(plan => {
      const annual = calculateAnnualStats(commonData, plan);
      const springFall = calculateMonthly(commonData, 'springFall', plan);
      const summer = calculateMonthly(commonData, 'summer', plan);
      const winter = calculateMonthly(commonData, 'winter', plan);
      return { plan, annual, seasons: { springFall, summer, winter } };
    });
    setAllPlanResults(results);
    setIsDirty(false);
  };

  const optimizeFees = () => {
    const tempData = {
      totalUsage: inputTotalUsage,
      targetProfit: inputTargetProfit * 10000, 
      annualInsurance: inputAnnualInsurance * 10000,
      share: { ...inputShare },
      devicePublic: { ...inputDevicePublic },
      costRapidUnit: FIXED_PUBLIC_UNIT_COST,
      contractPower: inputContractPower,
      hourlyWeights: JSON.parse(JSON.stringify(inputHourlyWeights)),
      deviceFees: inputDeviceFees, 
      useTOU: inputUseTOU,
      season: simulationSeason
    };

    let bestPlan = KEPCO_PLANS[0]; 
    let minCost = Infinity;
    KEPCO_PLANS.forEach(plan => {
        const annualStats = calculateAnnualStats(tempData, plan);
        if (annualStats.totalCost < minCost) { minCost = annualStats.totalCost; bestPlan = plan; }
    });

    const annualTargetProfit = tempData.targetProfit * 12;
    const requiredAnnualRevenue = annualTargetProfit + minCost;
    
    const currentStats = calculateAnnualStats(tempData, bestPlan);
    const currentRevenue = currentStats.totalRevenue;
    const revenueGap = requiredAnnualRevenue - currentRevenue;

    if (Math.abs(revenueGap) < 1000) return;

    const weightsIncrease = { light: 0.6, mid: 1.0, heavy: 1.4 };
    const weightsDecrease = { light: 1.4, mid: 1.0, heavy: 0.6 };
    const weights = revenueGap > 0 ? weightsIncrease : weightsDecrease;

    let totalWeightedVolume = 0;
    const months = { springFall: 5, summer: 3, winter: 4 };

    Object.keys(months).forEach(season => {
        const monthCount = months[season];
        const timeZones = TIME_ZONES[season];
        const dailyTotal = tempData.totalUsage / 30;
        const sumWeights = {
            rapid: tempData.hourlyWeights.rapid.reduce((a, b) => a + b, 0) || 1,
            slow: tempData.hourlyWeights.slow.reduce((a, b) => a + b, 0) || 1,
            outlet: tempData.hourlyWeights.outlet.reduce((a, b) => a + b, 0) || 1
        };

        ['rapid', 'slow', 'outlet'].forEach(dev => {
            const dailyDevVol = dailyTotal * (tempData.share[dev] / 100);
            for(let h=0; h<24; h++) {
                const hourVol = dailyDevVol * (tempData.hourlyWeights[dev][h] / sumWeights[dev]);
                const type = timeZones[h] === 0 ? 'light' : timeZones[h] === 1 ? 'mid' : 'heavy';
                const annualVol = hourVol * 30 * monthCount;
                totalWeightedVolume += annualVol * weights[type];
            }
        });
    });

    const basePriceDelta = revenueGap / totalWeightedVolume;
    const roundToTen = (num) => Math.round(num / 10) * 10;
    const newDeviceFees = { ...inputDeviceFees };

    ['rapid', 'slow', 'outlet'].forEach(dev => {
        ['light', 'mid', 'heavy'].forEach(load => {
            const currentPrice = inputDeviceFees[dev][load];
            const delta = basePriceDelta * weights[load];
            let newPrice = roundToTen(currentPrice + delta);
            if (newPrice < 50) newPrice = 50; 
            if (newPrice > 2000) newPrice = 2000;
            newDeviceFees[dev] = { ...newDeviceFees[dev], [load]: newPrice };
        });
    });

    setInputDeviceFees(newDeviceFees);
    
    setTimeout(() => {
        const nextSimData = { ...tempData, deviceFees: newDeviceFees };
        setSimData(nextSimData);
        const results = KEPCO_PLANS.map(plan => {
            const annual = calculateAnnualStats(nextSimData, plan);
            const sf = calculateMonthly(nextSimData, 'springFall', plan);
            const sm = calculateMonthly(nextSimData, 'summer', plan);
            const wt = calculateMonthly(nextSimData, 'winter', plan);
            return { plan, annual, seasons: { springFall: sf, summer: sm, winter: wt } };
        });
        setAllPlanResults(results);
        setIsDirty(false);
    }, 100);
  };

  const dailyChartData = useMemo(() => {
    const timeZoneTypes = TIME_ZONES[simulationSeason]; 
    const dailyTotalKwh = inputTotalUsage / 30;
    
    const sumWeights = {
        rapid: inputHourlyWeights.rapid.reduce((a, b) => a + b, 0) || 1,
        slow: inputHourlyWeights.slow.reduce((a, b) => a + b, 0) || 1,
        outlet: inputHourlyWeights.outlet.reduce((a, b) => a + b, 0) || 1
    };

    const dailyVol = {
        rapid: dailyTotalKwh * (inputShare.rapid / 100),
        slow: dailyTotalKwh * (inputShare.slow / 100),
        outlet: dailyTotalKwh * (inputShare.outlet / 100)
    };

    return Array.from({ length: 24 }, (_, h) => {
       const uRapid = dailyVol.rapid * (inputHourlyWeights.rapid[h] / sumWeights.rapid);
       const uSlow = dailyVol.slow * (inputHourlyWeights.slow[h] / sumWeights.slow);
       const uOutlet = dailyVol.outlet * (inputHourlyWeights.outlet[h] / sumWeights.outlet);
       const totalUsage = uRapid + uSlow + uOutlet;
       
       const type = timeZoneTypes[h];
       return {
           hour: h,
           usage: totalUsage,
           type: type,
           color: type === 0 ? '#10b981' : type === 1 ? '#f59e0b' : '#ef4444'
       };
    });
  }, [simulationSeason, inputHourlyWeights, inputTotalUsage, inputShare]);

  const currentResult = useMemo(() => {
    return calculateMonthly(simData, simulationSeason, KEPCO_PLANS[0]); 
  }, [simData, simulationSeason]);

  const revenueBreakdown = [
    { name: '급속', value: currentResult.revenue * (simData.share.rapid/100) },
    { name: '완속', value: currentResult.revenue * (simData.share.slow/100) },
    { name: '콘센트', value: currentResult.revenue * (simData.share.outlet/100) },
  ];

  const bestPlanId = useMemo(() => {
    if (allPlanResults.length === 0) return -1;
    return allPlanResults.reduce((maxIdx, result, idx, arr) => 
      result.annual.totalProfit > arr[maxIdx].annual.totalProfit ? idx : maxIdx
    , 0);
  }, [allPlanResults]);

  // [Render]
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Zap size={20} className="text-white fill-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">EV Profit Simulator</h1>
                </div>
            </div>
            <div className="flex items-center gap-4">
               {isDirty && <span className="text-xs text-amber-600 font-medium animate-pulse flex items-center gap-1"><Info size={12}/>설정 변경됨</span>}
               <button className="text-xs font-semibold text-slate-500 hover:text-slate-800">도움말</button>
            </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDEBAR */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1 custom-scrollbar">
                
                {/* 1. Basic Info */}
                <Card>
                    <SectionHeader icon={Settings} title="기본 설정" />
                    <div className="space-y-5">
                        <InputGroup label="월간 총 사용량" unit="kWh">
                            <StyledInput type="number" value={inputTotalUsage} onChange={(e) => setInputTotalUsage(Number(e.target.value))} />
                        </InputGroup>
                        <InputGroup label="목표 월 수익" unit="만원">
                            <StyledInput type="number" value={inputTargetProfit} onChange={(e) => setInputTargetProfit(Number(e.target.value))} />
                        </InputGroup>
                        <div className="pt-2 border-t border-slate-100">
                             <InputGroup label="계약 전력 (자동)" unit="kW" helpText="공용기기 제외">
                                <div className="w-full h-10 flex items-center justify-end pl-3 pr-12 bg-slate-100 rounded-lg text-sm font-bold text-slate-600">
                                    {inputContractPower}
                                </div>
                            </InputGroup>
                        </div>
                    </div>
                </Card>

                {/* 2. Infrastructure */}
                <Card>
                    <SectionHeader icon={Zap} title="인프라 구성" description="기기 수량 및 사용 비중 설정" />
                    <div className="space-y-4">
                         {[
                            { id: 'rapid', label: '급속 50kW', bg: 'bg-blue-500' },
                            { id: 'slow', label: '완속 7kW', bg: 'bg-emerald-500' },
                            { id: 'outlet', label: '콘센트 3kW', bg: 'bg-orange-500' }
                        ].map(dev => (
                            <div key={dev.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${dev.bg}`}></div>
                                        <span className="text-xs font-bold text-slate-700">{dev.label}</span>
                                    </div>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={inputDevicePublic[dev.id]} 
                                            onChange={() => setInputDevicePublic(prev => ({ ...prev, [dev.id]: !prev[dev.id] }))}
                                            className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className={`text-[10px] ${inputDevicePublic[dev.id] ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>공용설정</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={inputDeviceCount[dev.id]} 
                                            onChange={(e) => setInputDeviceCount(prev => ({...prev, [dev.id]: Number(e.target.value)}))}
                                            className="w-full h-8 px-2 text-right text-xs border border-slate-200 rounded focus:border-indigo-500 outline-none"
                                        />
                                        <span className="absolute left-2 top-2 text-[10px] text-slate-400">수량(대)</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={inputShare[dev.id]} 
                                            onChange={(e) => setInputShare(prev => ({...prev, [dev.id]: Number(e.target.value)}))}
                                            className="w-full h-8 px-2 text-right text-xs border border-slate-200 rounded focus:border-indigo-500 outline-none"
                                        />
                                        <span className="absolute left-2 top-2 text-[10px] text-slate-400">점유율(%)</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                 {/* 3. Pricing Strategy */}
                 <Card>
                    <SectionHeader icon={TrendingUp} title="요금 책정" />
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        {['rapid', 'slow', 'outlet'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveFeeTab(tab)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeFeeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab === 'rapid' ? '급속' : tab === 'slow' ? '완속' : '콘센트'}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <span className="text-xs font-semibold text-slate-500">계절별 부하 요금제 (TOU)</span>
                        <div 
                            onClick={() => setInputUseTOU(!inputUseTOU)}
                            className={`w-9 h-5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${inputUseTOU ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${inputUseTOU ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {inputUseTOU ? ['light', 'mid', 'heavy'].map(load => (
                            <div key={load} className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold w-10 ${load === 'light' ? 'text-emerald-600' : load === 'mid' ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {load === 'light' ? '경부하' : load === 'mid' ? '중간' : '최대'}
                                </span>
                                <input 
                                    type="range" min="100" max="600" step="10"
                                    value={inputDeviceFees[activeFeeTab][load]}
                                    onChange={(e) => setInputDeviceFees(prev => ({...prev, [activeFeeTab]: {...prev[activeFeeTab], [load]: Number(e.target.value)}}))}
                                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-xs font-bold w-8 text-right">{inputDeviceFees[activeFeeTab][load]}</span>
                            </div>
                        )) : (
                            <div className="flex items-center gap-3 py-4">
                                <span className="text-[10px] font-bold w-10 text-slate-500">단일</span>
                                <input 
                                    type="range" min="100" max="600" step="10"
                                    value={inputDeviceFees[activeFeeTab].mid}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setInputDeviceFees(prev => ({...prev, [activeFeeTab]: { light: val, mid: val, heavy: val }}));
                                    }}
                                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-xs font-bold w-8 text-right">{inputDeviceFees[activeFeeTab].mid}</span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={optimizeFees}
                        className="group w-full mt-6 py-2.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <BrainCircuit size={16} className="text-indigo-500 group-hover:text-white" />
                        AI 지능형 요금 최적화
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        부하 패턴과 사용량을 분석하여 경부하/최대부하 요금을 차등 적용합니다.
                    </p>
                </Card>

                {/* 4. Patterns */}
                <Card className="overflow-hidden">
                    <SectionHeader icon={Clock} title="기기별 부하 패턴" />
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4 mx-2">
                        {['rapid', 'slow', 'outlet'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActivePatternTab(tab)}
                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${activePatternTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab === 'rapid' ? '급속 패턴' : tab === 'slow' ? '완속 패턴' : '콘센트 패턴'}
                            </button>
                        ))}
                    </div>
                    <div className="h-32 flex items-end justify-between gap-[2px] mt-2 px-2">
                        {inputHourlyWeights[activePatternTab].map((weight, h) => {
                            const type = TIME_ZONES[simulationSeason][h];
                            const color = type === 0 ? 'bg-emerald-400' : type === 1 ? 'bg-amber-400' : 'bg-rose-400';
                            return (
                                <div key={h} className="relative group flex-1 h-full flex items-end">
                                    <div 
                                        className={`w-full rounded-t-sm transition-all ${color} opacity-80 group-hover:opacity-100`}
                                        style={{ height: `${weight * 10}%` }}
                                    ></div>
                                    <input 
                                        type="range" min="0" max="10" step="1"
                                        value={weight}
                                        onChange={(e) => {
                                            const newWeights = [...inputHourlyWeights[activePatternTab]];
                                            newWeights[h] = Number(e.target.value);
                                            setInputHourlyWeights(prev => ({
                                                ...prev,
                                                [activePatternTab]: newWeights
                                            }));
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-10"
                                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 px-2 mt-1 mb-2">
                        <span>0시</span>
                        <span>12시</span>
                        <span>23시</span>
                    </div>
                </Card>
            </aside>

            {/* RIGHT MAIN: DASHBOARD */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                
                {/* Action Area */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-900 rounded-2xl p-6 shadow-lg text-white">
                    <div>
                        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">시뮬레이션 대시보드 <LayoutDashboard size={18} className="text-indigo-300"/></h2>
                        <p className="text-indigo-200 text-sm">설정값을 바탕으로 4가지 요금제를 분석한 결과입니다.</p>
                    </div>
                    <button 
                        onClick={handleRunSimulation}
                        disabled={!isDirty && allPlanResults.length > 0}
                        className={`mt-4 md:mt-0 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isDirty || allPlanResults.length === 0 ? 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-md' : 'bg-indigo-800 text-indigo-400 cursor-not-allowed'}`}
                    >
                        {isDirty ? <RefreshCw size={16} className="animate-spin-slow"/> : <CheckCircle2 size={16}/>}
                        {isDirty ? '분석 실행하기' : '분석 완료됨'}
                    </button>
                </div>

                {/* KPI Cards Grid */}
                {allPlanResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {allPlanResults.map((res, idx) => {
                            const isBest = idx === bestPlanId;
                            return (
                                <Card key={res.plan.id} noPadding className={`relative overflow-hidden flex flex-col ${isBest ? 'ring-2 ring-indigo-500 shadow-indigo-100' : 'hover:border-slate-300'}`}>
                                    {isBest && <div className="bg-indigo-600 text-white text-[10px] font-bold py-1 text-center">BEST CHOICE</div>}
                                    <div className="p-5 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`text-sm font-bold truncate ${isBest ? 'text-indigo-700' : 'text-slate-700'}`}>{res.plan.name}</h3>
                                            </div>
                                            <div className="mb-4">
                                                <span className="text-xs text-slate-400 block mb-0.5">연간 예상 순수익</span>
                                                <span className={`text-2xl font-extrabold tracking-tight ${res.annual.totalProfit > 0 ? 'text-slate-900' : 'text-rose-500'}`}>
                                                    {Math.floor(res.annual.totalProfit / 10000).toLocaleString()}
                                                    <span className="text-sm font-medium text-slate-400 ml-0.5">만원</span>
                                                </span>
                                            </div>
                                            
                                            {/* [NEW] 계절별 예상 수익 추가 */}
                                            <div className="grid grid-cols-3 gap-1 mb-2">
                                                <div className="bg-slate-50/80 rounded p-1.5 text-center">
                                                    <div className="text-[9px] text-slate-400 mb-0.5 flex justify-center items-center gap-0.5"><CloudSun size={8}/>봄/가을</div>
                                                    <div className={`text-[10px] font-bold ${res.seasons.springFall.profit > 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                                                        {Math.floor(res.seasons.springFall.profit / 10000).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50/80 rounded p-1.5 text-center">
                                                    <div className="text-[9px] text-slate-400 mb-0.5 flex justify-center items-center gap-0.5"><Sun size={8}/>여름</div>
                                                    <div className={`text-[10px] font-bold ${res.seasons.summer.profit > 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                                                        {Math.floor(res.seasons.summer.profit / 10000).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50/80 rounded p-1.5 text-center">
                                                    <div className="text-[9px] text-slate-400 mb-0.5 flex justify-center items-center gap-0.5"><Snowflake size={8}/>겨울</div>
                                                    <div className={`text-[10px] font-bold ${res.seasons.winter.profit > 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                                                        {Math.floor(res.seasons.winter.profit / 10000).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 pt-3 border-t border-slate-50 mt-auto">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">월평균</span>
                                                <span className="font-semibold text-slate-600">{Math.floor(res.annual.monthlyAvgProfit / 10000).toLocaleString()}만</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">기본료</span>
                                                <span className="font-semibold text-slate-600">{res.plan.baseRate.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-40 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 gap-2">
                        <Info size={20}/> 시뮬레이션을 실행하면 결과가 표시됩니다.
                    </div>
                )}

                {/* Charts Area */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Chart 1: Revenue Mix */}
                    <Card className="flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <SectionHeader icon={PieChartIconSvg} title="예상 매출 구성" />
                            <Badge color="blue">Total: {(currentResult.revenue / 10000).toFixed(0)}만원</Badge>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={revenueBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#3b82f6" /> {/* Blue */}
                                        <Cell fill="#10b981" /> {/* Emerald */}
                                        <Cell fill="#f97316" /> {/* Orange */}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val) => `${Math.floor(val).toLocaleString()}원`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text Removed for cleaner look */}
                        </div>
                        <div className="flex justify-center gap-4 mt-4 bg-slate-50 rounded-lg p-3">
                             {revenueBreakdown.map((item, i) => (
                                 <div key={item.name} className="flex items-center gap-1.5">
                                     <div className={`w-2.5 h-2.5 rounded-full ${i===0 ? 'bg-blue-500' : i===1 ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                     <span className="text-xs text-slate-500">{item.name}</span>
                                     <span className="text-xs font-bold text-slate-800 ml-0.5">
                                        {Math.floor(item.value / 10000).toLocaleString()}만원
                                     </span>
                                 </div>
                             ))}
                        </div>
                    </Card>

                    {/* Chart 2: Load Pattern */}
                    <Card className="flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <SectionHeader icon={BarChart3} title="시간대별 부하량" />
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                {['springFall', 'summer', 'winter'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSimulationSeason(s)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${simulationSeason === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {s === 'springFall' ? '봄/가을' : s === 'summer' ? '여름' : '겨울'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                                    <XAxis 
                                        dataKey="hour" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10 }} 
                                        interval={3}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                                        {dailyChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                             <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                 <span className="text-xs font-medium text-slate-600">경부하</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                 <span className="text-xs font-medium text-slate-600">중간부하</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                 <span className="text-xs font-medium text-slate-600">최대부하</span>
                             </div>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
}