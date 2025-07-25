import React, { useState, useRef, useEffect } from 'react';
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
  { name: '反方一辩', realName: '陈伟', model: 'DeepSeek', history: [] },
  { name: '反方二辩', realName: '赵敏', model: '通义千问', history: [] },
  { name: '反方三辩', realName: '孙浩', model: '腾讯混元', history: [] },
  { name: '反方四辩', realName: '周丽', model: 'DeepSeek', history: [] },
];
// stages 不再包含“未开始”
const stages = ['立论', '驳论', '质辩', '自由辩论', '结辩'];

// 每个阶段允许发言的辩手索引
const stageSpeakerMap = {
  '立论': { debaters: [0], opponents: [0] }, // 一辩
  '驳论': { debaters: [1], opponents: [1] }, // 二辩
  '质辩': { debaters: [0, 1, 2, 3], opponents: [0, 1, 2, 3] }, // 全员可提问，三辩小结
  '自由辩论': { debaters: [0, 1, 2, 3], opponents: [0, 1, 2, 3] }, // 全员
  '结辩': { debaters: [3], opponents: [3] }, // 四辩
};

// 与后端保持一致的模型映射
const debaterModelMap = {
  '李明': 'glm',
  '张华': 'hy',
  '王强': 'deepseek',
  '刘芳': 'qwen',
  '陈伟': 'deepseek',
  '赵敏': 'qwen',
  '孙浩': 'hy',
  '周丽': 'deepseek'
};

// fetch带超时封装
const fetchWithTimeout = (url, options, timeout = 30000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), timeout))
  ]);
};

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function App() {
  // 初始化直接进入“立论”阶段
  const [stageIdx, setStageIdx] = useState(0); // 0 表示“立论”
  const [debaters, setDebaters] = useState(initialDebaters);
  const [opponents, setOpponents] = useState(initialOpponents);
  const [scores, setScores] = useState(Array(8).fill(''));
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  // 移除暂停和继续相关状态
  // const [isPaused, setIsPaused] = useState(false);
  const [showStageTip, setShowStageTip] = useState(false);
  const [stageTipText, setStageTipText] = useState('');
  const autoTimer = useRef(null);
  const autoIdxRef = useRef(1);
  const [isStarted, setIsStarted] = useState(false);

  // 当前阶段允许发言的索引
  const allowedDebaterIdx = stageSpeakerMap[stages[stageIdx]]?.debaters || [];
  const allowedOpponentIdx = stageSpeakerMap[stages[stageIdx]]?.opponents || [];

  // 判断当前阶段是否允许发言
  const canSpeak = stageIdx > 0 && stageIdx < stages.length - 1;

  // 单个辩手发言（调用后端API）
  const handleDebaterSpeak = async idx => {
    const debater = debaters[idx].realName; // 传递真实姓名
    const stage = stages[stageIdx];
    let content = '（正在调用大模型...）';
    setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history, content] } : d));
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/debate/speak`;
      console.log('[API 调用地址]', url);
      const timeout = 30000;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debater, stage })
      }, timeout);
      const data = await res.json();
      console.log('【调试】handleDebaterSpeak fetch返回：', data);
      setDebaters(ds =>
        ds.map((d, i) =>
          i === idx
            ? {
              ...d,
              history:
                d.history.length === 0
                  ? [data.content]
                  : d.history.map((h, j) =>
                    j === d.history.length - 1 && h === '（正在调用大模型...）'
                      ? data.content
                      : h
                  )
            }
            : d
        )
      );
    } catch (e) {
      console.log('【调试】handleDebaterSpeak fetch异常：', e);
      setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history.slice(0, -1), '（大模型接口调用失败）'] } : d));
    }
  };
  const handleOpponentSpeak = async idx => {
    const debater = opponents[idx].realName; // 传递真实姓名
    const stage = stages[stageIdx];
    let content = '（正在调用大模型...）';
    setOpponents(os => os.map((o, i) => i === idx ? { ...o, history: [...o.history, content] } : o));
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/debate/speak`;
      console.log('[API 调用地址]', url);
      const timeout = 30000;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debater, stage })
      }, timeout);
      const data = await res.json();
      console.log('【调试】handleOpponentSpeak fetch返回：', data);
      setOpponents(os =>
        os.map((o, i) =>
          i === idx
            ? {
              ...o,
              history:
                o.history.length === 0
                  ? [data.content]
                  : o.history.map((h, j) =>
                    j === o.history.length - 1 && h === '（正在调用大模型...）'
                      ? data.content
                      : h
                  )
            }
            : o
        )
      );
    } catch (e) {
      console.log('【调试】handleOpponentSpeak fetch异常：', e);
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

  // 自动发言（当前阶段所有可发言选手，正反方完全并发）
  const autoSpeakForCurrentStage = async () => {
    for (const idx of allowedDebaterIdx) {
      await handleDebaterSpeak(idx);
      await delay(100);
    }
    for (const idx of allowedOpponentIdx) {
      await handleOpponentSpeak(idx);
      await delay(100);
    }
  };

  // 自动推进流程
  const autoProceed = async (startIdx = 1) => {
    setIsAutoRunning(true);
    // 移除暂停和继续相关函数
    // const handlePause = () => { ... }
    // const handleContinue = () => { ... }
    autoIdxRef.current = idx;

    // 确保当前阶段已设置
    if (stageIdx !== idx) {
      setStageIdx(idx);
      // 给状态更新足够的时间
      await new Promise(r => setTimeout(r, 500));
    }

    while (idx < stages.length) {
      // 设置当前阶段
      setStageIdx(idx);
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

      if (!isAutoRunning || idx === stages.length - 1) break;

      // 在进入下一阶段前等待
      await new Promise(r => {
        autoTimer.current = setTimeout(r, 1500);
      });

      idx++;
      autoIdxRef.current = idx;
    }
    setIsAutoRunning(false);
  };

  // 移除暂停和继续相关函数
  // const handlePause = () => { ... }
  // const handleContinue = () => { ... }

  // 跳到下一个阶段并自动发言
  const handleNextStage = () => {
    setIsAutoRunning(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);

    // 先清空所有辩手的发言历史
    setDebaters(ds => ds.map(d => ({ ...d, history: [] })));
    setOpponents(os => os.map(o => ({ ...o, history: [] })));

    setStageIdx(prev => {
      const next = prev + 1;
      return next < stages.length ? next : prev;
    });
    setTimeout(autoSpeakForCurrentStage, 100);
  };

  // 重置所有状态
  const handleReset = () => {
    setIsStarted(false); // 回到初始页
    setIsAutoRunning(false);
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

  // 显示当前阶段允许发言的辩手，保留他们的完整发言历史
  const getCurrentTwoDebaters = (allDebaters, allowedIdx) =>
    allDebaters.map((d, i) =>
      allowedIdx.includes(i)
        ? { ...d } // 保留完整发言历史
        : { ...d, history: [] } // 不显示其他辩手的发言
    );

  // 裁判自动打分：结辩阶段自动调用大模型接口获取分数
  const handleAutoJudge = async () => {
    // 假设每个辩手都需要打分，调用后端 /api/debate/judge
    const allDebaters = [...debaters, ...opponents];
    const judgeResults = await Promise.all(
      allDebaters.map(async (d, idx) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/debate/judge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ debater: d.realName, history: d.history })
          });
          const data = await res.json();
          return data.score || '';
        } catch {
          return '（评分失败）';
        }
      })
    );
    setScores(judgeResults);
  };

  // 在组件每次渲染时输出当前阶段索引和名称
  useEffect(() => {
    console.log('【调试】当前 stageIdx:', stageIdx, '当前阶段:', stages[stageIdx]);
  }, [stageIdx, stages]);

  useEffect(() => {
    if (stages[stageIdx] === '质辩') {
      console.log('【调试】当前质辩环节 allowedDebaterIdx:', allowedDebaterIdx);
      console.log('【调试】当前 debaters 状态:', debaters);
    }
  }, [stageIdx, allowedDebaterIdx, debaters]);

  // 新增：评分后判断胜败并自动重置
  useEffect(() => {
    if (stageIdx === stages.length - 1 && scores.every(s => s !== '')) {
      const toNum = s => (typeof s === 'number' ? s : parseFloat(s)) || 0;
      const positive = scores.slice(0, 4).reduce((a, b) => a + toNum(b), 0);
      const negative = scores.slice(4).reduce((a, b) => a + toNum(b), 0);
      let result = '';
      if (positive > negative) result = '正方胜';
      else if (positive < negative) result = '反方胜';
      else result = '平局';
      setStageTipText(`本场结果：${result}（正方总分：${positive}，反方总分：${negative}）`);
      setShowStageTip(true);
      setTimeout(() => {
        setShowStageTip(false);
        handleReset();
      }, 5000);
    }
  }, [stageIdx, scores]);

  const handleStartDebate = () => {
    setIsStarted(true);
    setStageIdx(0);
    setTimeout(() => {
      autoSpeakForCurrentStage();
    }, 100);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {!isStarted ? (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
          <button
            style={{
              fontSize: 24,
              padding: '16px 34px',
              borderRadius: 32,
              background: 'linear-gradient(90deg, #1677ff 0%, #49c6fa 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 16px rgba(22,119,255,0.15)',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: 2,
              transition: 'background 0.3s, box-shadow 0.3s, transform 0.2s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #49c6fa 0%, #1677ff 100%)';
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,119,255,0.22)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #1677ff 0%, #49c6fa 100%)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,119,255,0.15)';
            }}
            onClick={handleStartDebate}
          >
            开始辩论
          </button>
        </div>
      ) : (
        <>
          <DebateStage topic="社交媒体利大于弊还是弊大于利" stage={stages[stageIdx]} />
          <StageProgress stages={stages} currentIdx={stageIdx} />
          {showStageTip && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '20px 40px',
              borderRadius: '8px',
              fontSize: '24px',
              zIndex: 1000
            }}>
              {stageTipText}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <DebaterPanel side="正方" debaters={getCurrentTwoDebaters(debaters, allowedDebaterIdx)} canSpeakIdx={allowedDebaterIdx} visibleIdx={allowedDebaterIdx} stage={stages[stageIdx]} stageIdx={stageIdx} />
            <DebaterPanel side="反方" debaters={getCurrentTwoDebaters(opponents, allowedOpponentIdx)} canSpeakIdx={allowedOpponentIdx} visibleIdx={allowedOpponentIdx} stage={stages[stageIdx]} stageIdx={stageIdx} />
          </div>
          <ControlPanel
            onNextStage={handleNextStage}
            onReset={handleReset}
            onAutoSpeak={autoSpeakForCurrentStage}
            disabled={isAutoRunning || stageIdx >= stages.length - 1}
            isAutoRunning={isAutoRunning}
            stage={stages[stageIdx]}
          />
          {/* 只在最后一个阶段显示评分区 */}
          {stageIdx === stages.length - 1 && (
            <>
              <JudgePanel
                debaters={[...debaters, ...opponents]}
                scores={scores}
                onScoreChange={handleScoreChange}
                onAutoJudge={handleAutoJudge}
              />
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={handleReset} style={{ fontSize: 18, padding: '8px 32px', borderRadius: 8, background: '#f5f7fa', border: '1px solid #d9d9d9', cursor: 'pointer' }}>
                  重置
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
