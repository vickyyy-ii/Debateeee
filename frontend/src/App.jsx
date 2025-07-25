import React, { useState, useRef } from 'react';
import DebateStage from './components/DebateStage';
import DebaterPanel from './components/DebaterPanel';
import ControlPanel from './components/ControlPanel';
import JudgePanel from './components/JudgePanel';
import StageProgress from './components/StageProgress';
import './App.css';
import 'antd/dist/reset.css';

const initialDebaters = [
  { name: '正方一辩', realName: '李明', model: 'GLM-4', history: [] },
  { name: '正方二辩', realName: '张华', model: '腾讯混元', history: [] },
  { name: '正方三辩', realName: '王强', model: 'DeepSeek', history: [] },
  { name: '正方四辩', realName: '刘芳', model: '通义千问', history: [] },
];
const initialOpponents = [
  { name: '反方一辩', realName: '陈伟', model: 'GLM-4', history: [] },
  { name: '反方二辩', realName: '赵敏', model: '通义千问', history: [] },
  { name: '反方三辩', realName: '孙浩', model: '腾讯混元', history: [] },
  { name: '反方四辩', realName: '周丽', model: 'DeepSeek', history: [] },
];
const stages = ['立论', '驳论', '质辩', '自由辩论', '结辩'];

// 每个阶段允许发言的辩手索引
const stageSpeakerMap = {
  '立论': { debaters: [0], opponents: [0] }, // 一辩
  '驳论': { debaters: [1], opponents: [1] }, // 二辩
  '质辩': { debaters: [0, 1, 2, 3], opponents: [0, 1, 2, 3] }, // 全员可提问，三辩小结
  '自由辩论': { debaters: [0, 1, 2, 3], opponents: [0, 1, 2, 3] }, // 全员
  '结辩': { debaters: [3], opponents: [3] }, // 四辩
};

function App() {
  const [stageIdx, setStageIdx] = useState(0);
  const [debaters, setDebaters] = useState(initialDebaters);
  const [opponents, setOpponents] = useState(initialOpponents);
  const [scores, setScores] = useState(Array(8).fill(''));
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoTimer = useRef(null);
  const autoIdxRef = useRef(1);
  const [showStageTip, setShowStageTip] = useState(false);
  const [stageTipText, setStageTipText] = useState('');

  // 当前阶段允许发言的索引
  const allowedDebaterIdx = stageSpeakerMap[stages[stageIdx]]?.debaters || [];
  const allowedOpponentIdx = stageSpeakerMap[stages[stageIdx]]?.opponents || [];

  // 判断当前阶段是否允许发言
  const canSpeak = stageIdx > 0 && stageIdx < stages.length - 1;

  // 单个辩手发言（调用后端API）
  const handleDebaterSpeak = async idx => {
    const debater = debaters[idx].realName; // 传递真实姓名
    const stage = stages[stageIdx];
    let content = '（正在生成...）';
    setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history, content] } : d));
    try {
      const res = await fetch('/api/debate/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debater, stage })
      });
      const data = await res.json();
      setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history.slice(0, -1), data.content] } : d));
    } catch {
      setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history.slice(0, -1), '（大模型接口调用失败）'] } : d));
    }
  };
  const handleOpponentSpeak = async idx => {
    const debater = opponents[idx].realName; // 传递真实姓名
    const stage = stages[stageIdx];
    let content = '（正在生成...）';
    setOpponents(os => os.map((o, i) => i === idx ? { ...o, history: [...o.history, content] } : o));
    try {
      const res = await fetch('/api/debate/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debater, stage })
      });
      const data = await res.json();
      setOpponents(os => os.map((o, i) => i === idx ? { ...o, history: [...o.history.slice(0, -1), data.content] } : o));
    } catch {
      setOpponents(os => os.map((o, i) => i === idx ? { ...o, history: [...o.history.slice(0, -1), '（大模型接口调用失败）'] } : o));
    }
  };

  // 自动发言（正反方全部发言一次，调用API）
  const handleAutoSpeak = async () => {
    for (let i = 0; i < 4; i++) {
      await handleDebaterSpeak(i);
      await handleOpponentSpeak(i);
    }
  };

  // 自动发言（当前阶段所有可发言选手）
  const autoSpeakForCurrentStage = async () => {
    for (let idx of allowedDebaterIdx) {
      await handleDebaterSpeak(idx);
    }
    for (let idx of allowedOpponentIdx) {
      await handleOpponentSpeak(idx);
    }
  };

  // 自动推进流程
  const autoProceed = async (startIdx = 1) => {
    setIsAutoRunning(true);
    setIsPaused(false);
    let idx = startIdx;
    autoIdxRef.current = idx;

    // 确保当前阶段已设置
    if (stageIdx !== idx) {
      setStageIdx(idx);
      setShowStageTip(true);
      setStageTipText(`当前阶段：${stages[idx]}`);
      setTimeout(() => setShowStageTip(false), 800);
      // 给状态更新足够的时间
      await new Promise(r => setTimeout(r, 500));
    }

    while (idx < stages.length) {
      // 设置当前阶段
      setStageIdx(idx);
      setShowStageTip(true);
      setStageTipText(`当前阶段：${stages[idx]}`);
      setTimeout(() => setShowStageTip(false), 800);
      autoIdxRef.current = idx;

      // 使用 requestAnimationFrame 确保 DOM 更新
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          // 给界面更新足够的时间
          setTimeout(resolve, 500);
        });
      });

      // 执行当前阶段的自动发言
      await autoSpeakForCurrentStage();

      if (!isAutoRunning || isPaused || idx === stages.length - 1) break;

      // 在进入下一阶段前等待
      await new Promise(r => {
        autoTimer.current = setTimeout(r, 1500);
      });

      if (!isAutoRunning || isPaused) break;

      idx++;
      autoIdxRef.current = idx;
    }
    setIsAutoRunning(false);
  };

  // 暂停自动流程
  const handlePause = () => {
    setIsPaused(true);
    setIsAutoRunning(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);
  };

  // 继续自动流程
  const handleContinue = () => {
    if (!isAutoRunning && isPaused && stageIdx < stages.length - 1) {
      setIsPaused(false);
      setTimeout(() => autoProceed(autoIdxRef.current), 100);
    }
  };

  // 跳到下一个阶段并自动发言
  const handleNextStage = async () => {
    setIsAutoRunning(false);
    setIsPaused(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (stageIdx < stages.length - 1) {
      setStageIdx(stageIdx + 1);
      setShowStageTip(true);
      setStageTipText(`当前阶段：${stages[stageIdx + 1]}`);
      setTimeout(() => setShowStageTip(false), 800);
      setTimeout(autoSpeakForCurrentStage, 100);
    }
  };

  // 重置所有状态
  const handleReset = () => {
    setIsAutoRunning(false);
    setIsPaused(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setStageIdx(0);
    setDebaters(initialDebaters);
    setOpponents(initialOpponents);
    setScores(Array(8).fill(''));
    autoIdxRef.current = 1;
  };

  const handleScoreChange = (idx, value) => {
    const newScores = [...scores];
    newScores[idx] = value;
    setScores(newScores);
  };

  // 显示当前阶段允许发言的辩手，保留他们的发言历史
  const getCurrentTwoDebaters = (allDebaters, allowedIdx) =>
    allDebaters.map((d, i) =>
      allowedIdx.includes(i)
        ? { ...d, history: d.history.slice(-1) } // 只保留最后一条发言
        : { ...d, history: [] } // 不显示其他辩手的发言
    );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {showStageTip && (
        <div style={{
          position: 'fixed', top: 80, left: 0, right: 0, zIndex: 999,
          textAlign: 'center', fontSize: 22, fontWeight: 'bold',
          background: '#e6f4ff', color: '#1677ff', padding: 12, borderRadius: 8, margin: '0 auto', maxWidth: 400
        }}>
          {stageTipText}
        </div>
      )}
      <DebateStage topic="社交媒体利大于弊还是弊大于利" stage={stages[stageIdx]} />
      <StageProgress stages={stages} currentIdx={stageIdx} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <DebaterPanel side="正方" debaters={getCurrentTwoDebaters(debaters, allowedDebaterIdx)} canSpeakIdx={allowedDebaterIdx} visibleIdx={allowedDebaterIdx} />
        <DebaterPanel side="反方" debaters={getCurrentTwoDebaters(opponents, allowedOpponentIdx)} canSpeakIdx={allowedOpponentIdx} visibleIdx={allowedOpponentIdx} />
      </div>
      <ControlPanel
        onStart={async () => {
          if (!isAutoRunning && !isPaused) {
            // 先设置阶段
            setStageIdx(1);
            setShowStageTip(true);
            setStageTipText(`当前阶段：${stages[1]}`);
            setTimeout(() => setShowStageTip(false), 800);
            // 使用 requestAnimationFrame 确保 DOM 更新后再执行后续操作
            requestAnimationFrame(() => {
              // 给足够时间让界面更新
              setTimeout(() => {
                // 确保界面已更新后再开始自动流程
                autoProceed(1);
              }, 500);
            });
          }
        }}
        onPause={handlePause}
        onContinue={handleContinue}
        onNextStage={handleNextStage}
        onReset={handleReset}
        onAutoSpeak={autoSpeakForCurrentStage}
        disabled={isAutoRunning || stageIdx === 0 || stageIdx === stages.length - 1}
        isAutoRunning={isAutoRunning}
        isPaused={isPaused}
        stage={stages[stageIdx]}
      />
      {/* 只在最后一个阶段显示评分区 */}
      {stageIdx === stages.length - 1 && (
        <JudgePanel
          debaters={[...debaters, ...opponents]}
          scores={scores}
          onScoreChange={handleScoreChange}
        />
      )}
    </div>
  );
}

export default App;
