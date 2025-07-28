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
  '质辩': { debaters: [2], opponents: [2] }, // 三辩小结
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
  // 初始化直接进入"立论"阶段
  const [stageIdx, setStageIdx] = useState(0); // 0 表示"立论"
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
  const [isReset, setIsReset] = useState(false); // 新增：跟踪是否是重置后的重新开始

  // 防重复调用状态
  const [speakingDebaters, setSpeakingDebaters] = useState(new Set());
  const [speakingOpponents, setSpeakingOpponents] = useState(new Set());

  // 添加调试信息
  console.log('应用状态:', { isStarted, stageIdx, stages: stages[stageIdx] });

  // 当前阶段允许发言的索引
  const allowedDebaterIdx = stageSpeakerMap[stages[stageIdx]]?.debaters || [];
  const allowedOpponentIdx = stageSpeakerMap[stages[stageIdx]]?.opponents || [];

  // 判断当前阶段是否允许发言
  const canSpeak = stageIdx > 0 && stageIdx < stages.length - 1;

  // 单个辩手发言（调用后端API）
  const handleDebaterSpeak = async idx => {
    // 防重复调用检查
    if (speakingDebaters.has(idx)) {
      console.log('【调试】辩手', idx, '正在发言中，跳过重复调用');
      return;
    }

    const debater = debaters[idx].realName; // 传递真实姓名
    const stage = stages[stageIdx];

    // 检查是否已有有效发言内容，如果有则跳过
    const currentDebater = debaters[idx];
    const hasValidContent = currentDebater.history && currentDebater.history.length > 0 &&
      currentDebater.history[currentDebater.history.length - 1] !== '（正在调用大模型...）' &&
      currentDebater.history[currentDebater.history.length - 1] !== '（大模型接口调用失败）';

    if (hasValidContent) {
      console.log('【调试】辩手', idx, '已有有效发言内容，跳过重复生成');
      return;
    }

    // 检查是否已有发言内容，如果有则不重新设置"正在调用大模型..."
    const hasContent = currentDebater.history && currentDebater.history.length > 0 &&
      currentDebater.history[currentDebater.history.length - 1] !== '（正在调用大模型...）';

    if (!hasContent) {
      let content = '（正在调用大模型...）';
      // 标记为正在发言
      setSpeakingDebaters(prev => new Set([...prev, idx]));
      setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history, content] } : d));
    } else {
      // 如果已有内容，只标记为正在发言，不重新设置提示文本
      setSpeakingDebaters(prev => new Set([...prev, idx]));
    }

    // 获取一辩的发言内容用于驳论（现在驳论环节只显示二辩，不需要获取一辩内容）
    let opponentFirstSpeech = '';
    if (stage === '驳论') {
      // 获取对方一辩的发言内容
      const opponentFirstDebater = opponents[0]; // 反方一辩
      if (opponentFirstDebater && opponentFirstDebater.history && opponentFirstDebater.history.length > 0) {
        opponentFirstSpeech = opponentFirstDebater.history[opponentFirstDebater.history.length - 1];
      }
    }

    try {
      const url = `${import.meta.env.VITE_API_URL}/api/debate/speak`;
      console.log('[API 调用地址]', url);
      const timeout = 30000;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debater,
          stage,
          opponentFirstSpeech: stage === '驳论' ? opponentFirstSpeech : undefined
        })
      }, timeout);
      const data = await res.json();
      console.log('【调试】handleDebaterSpeak fetch返回：', data);

      // 验证 data.content 是否为有效字符串
      if (!data || typeof data.content !== 'string') {
        console.error('【错误】API返回的content无效:', data);
        throw new Error('API返回的content无效');
      }

      console.log('【调试】data.content类型:', typeof data.content, '长度:', data.content.length);

      // 只有在没有内容或内容为"正在调用大模型..."时才更新
      setDebaters(ds =>
        ds.map((d, i) =>
          i === idx
            ? {
              ...d,
              history: d.history.filter(h => h !== '（正在调用大模型...）').concat([data.content])
            }
            : d
        )
      );
    } catch (e) {
      console.log('【调试】handleDebaterSpeak fetch异常：', e);
      setDebaters(ds => ds.map((d, i) => i === idx ? { ...d, history: [...d.history.slice(0, -1), '（大模型接口调用失败）'] } : d));
    } finally {
      // 移除发言状态
      setSpeakingDebaters(prev => {
        const newSet = new Set(prev);
        newSet.delete(idx);
        return newSet;
      });
    }
  };
  const handleOpponentSpeak = async idx => {
    // 防重复调用检查
    if (speakingOpponents.has(idx)) {
      console.log('【调试】反方辩手', idx, '正在发言中，跳过重复调用');
      return;
    }

    const debater = opponents[idx].realName; // 传递真实姓名
    const stage = stages[stageIdx];

    // 检查是否已有有效发言内容，如果有则跳过
    const currentOpponent = opponents[idx];
    const hasValidContent = currentOpponent.history && currentOpponent.history.length > 0 &&
      currentOpponent.history[currentOpponent.history.length - 1] !== '（正在调用大模型...）' &&
      currentOpponent.history[currentOpponent.history.length - 1] !== '（大模型接口调用失败）';

    if (hasValidContent) {
      console.log('【调试】反方辩手', idx, '已有有效发言内容，跳过重复生成');
      return;
    }

    // 检查是否已有发言内容，如果有则不重新设置"正在调用大模型..."
    const hasContent = currentOpponent.history && currentOpponent.history.length > 0 &&
      currentOpponent.history[currentOpponent.history.length - 1] !== '（正在调用大模型...）';

    if (!hasContent) {
      let content = '（正在调用大模型...）';
      // 标记为正在发言
      setSpeakingOpponents(prev => new Set([...prev, idx]));
      setOpponents(os => os.map((o, i) => i === idx ? { ...o, history: [...o.history, content] } : o));
    } else {
      // 如果已有内容，只标记为正在发言，不重新设置提示文本
      setSpeakingOpponents(prev => new Set([...prev, idx]));
    }

    // 获取一辩的发言内容用于驳论（现在驳论环节只显示二辩，不需要获取一辩内容）
    let opponentFirstSpeech = '';
    if (stage === '驳论') {
      // 获取对方一辩的发言内容
      const debaterFirstDebater = debaters[0]; // 正方一辩
      if (debaterFirstDebater && debaterFirstDebater.history && debaterFirstDebater.history.length > 0) {
        opponentFirstSpeech = debaterFirstDebater.history[debaterFirstDebater.history.length - 1];
      }
    }

    try {
      const url = `${import.meta.env.VITE_API_URL}/api/debate/speak`;
      console.log('[API 调用地址]', url);
      const timeout = 30000;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debater,
          stage,
          opponentFirstSpeech: stage === '驳论' ? opponentFirstSpeech : undefined
        })
      }, timeout);
      const data = await res.json();
      console.log('【调试】handleOpponentSpeak fetch返回：', data);

      // 验证 data.content 是否为有效字符串
      if (!data || typeof data.content !== 'string') {
        console.error('【错误】API返回的content无效:', data);
        throw new Error('API返回的content无效');
      }

      console.log('【调试】data.content类型:', typeof data.content, '长度:', data.content.length);

      // 只有在没有内容或内容为"正在调用大模型..."时才更新
      console.log('【调试】更新前反方辩手状态:', opponents);
      setOpponents(os => {
        const newOpponents = os.map((o, i) =>
          i === idx
            ? {
              ...o,
              history: o.history.filter(h => h !== '（正在调用大模型...）').concat([data.content])
            }
            : o
        );
        console.log('【调试】更新后反方辩手状态:', newOpponents);
        return newOpponents;
      });
    } catch (e) {
      console.log('【调试】handleOpponentSpeak fetch异常：', e);
      setOpponents(os => os.map((o, i) => i === idx ? { ...o, history: [...o.history.slice(0, -1), '（大模型接口调用失败）'] } : o));
    } finally {
      // 移除发言状态
      setSpeakingOpponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(idx);
        return newSet;
      });
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
    console.log('【调试】autoSpeakForCurrentStage 开始执行');
    console.log('【调试】当前阶段:', stages[stageIdx]);
    console.log('【调试】允许发言的辩手:', allowedDebaterIdx);
    console.log('【调试】允许发言的反方:', allowedOpponentIdx);

    // 如果是重置状态，清除重置标志
    if (isReset) {
      setIsReset(false);
    }

    for (const idx of allowedDebaterIdx) {
      console.log('【调试】开始调用正方辩手:', idx);
      await handleDebaterSpeak(idx);
      await delay(100);
    }
    for (const idx of allowedOpponentIdx) {
      console.log('【调试】开始调用反方辩手:', idx);
      await handleOpponentSpeak(idx);
      await delay(100);
    }
    console.log('【调试】autoSpeakForCurrentStage 执行完成');
  };

  // 自动推进流程
  const autoProceed = async (startIdx = 1) => {
    setIsAutoRunning(true);
    // 移除暂停和继续相关函数
    // const handlePause = () => { ... }
    // const handleContinue = () => { ... }
    autoIdxRef.current = startIdx;

    // 确保当前阶段已设置
    if (stageIdx !== startIdx) {
      setStageIdx(startIdx);
      // 给状态更新足够的时间
      await new Promise(r => setTimeout(r, 500));
    }

    let currentIdx = startIdx;
    while (currentIdx < stages.length) {
      // 设置当前阶段
      setStageIdx(currentIdx);
      autoIdxRef.current = currentIdx;

      // 使用 requestAnimationFrame 确保 DOM 更新
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          // 给界面更新足够的时间
          setTimeout(resolve, 500);
        });
      });

      // 执行当前阶段的自动发言
      await autoSpeakForCurrentStage();

      if (!isAutoRunning || currentIdx === stages.length - 1) break;

      // 在进入下一阶段前等待
      await new Promise(r => {
        autoTimer.current = setTimeout(r, 1500);
      });

      currentIdx++;
      autoIdxRef.current = currentIdx;
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

    // 暂停所有朗读
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('阶段切换，已暂停所有朗读');
    }

    // 不清空发言历史，让后续环节能看到前面的发言内容
    // setDebaters(ds => ds.map(d => ({ ...d, history: [] })));
    // setOpponents(os => os.map(o => ({ ...o, history: [] })));

    setStageIdx(prev => {
      const next = prev + 1;
      console.log('【调试】切换到下一阶段:', next, stages[next]);
      const newStageIdx = next < stages.length ? next : prev;

      // 如果进入自由辩论阶段，清空所有辩手的发言历史
      if (stages[newStageIdx] === '自由辩论') {
        console.log('【调试】进入自由辩论阶段，清空所有辩手发言历史');
        setDebaters(ds => ds.map(d => ({ ...d, history: [] })));
        setOpponents(os => os.map(o => ({ ...o, history: [] })));
        // 确保自由辩论阶段能正常调用API
        console.log('【调试】自由辩论阶段 - 允许发言辩手:', stageSpeakerMap[stages[newStageIdx]]?.debaters);
        console.log('【调试】自由辩论阶段 - 允许发言反方:', stageSpeakerMap[stages[newStageIdx]]?.opponents);
      }

      // 只有在非重置状态下才自动调用API
      if (!isReset) {
        // 在状态更新后立即调用API
        setTimeout(() => {
          console.log('【调试】开始调用下一阶段API，新阶段:', stages[newStageIdx]);
          // 临时设置当前阶段索引，确保API调用使用正确的阶段
          const tempStageIdx = newStageIdx;
          const tempAllowedDebaterIdx = stageSpeakerMap[stages[tempStageIdx]]?.debaters || [];
          const tempAllowedOpponentIdx = stageSpeakerMap[stages[tempStageIdx]]?.opponents || [];

          console.log('【调试】临时阶段索引:', tempStageIdx);
          console.log('【调试】临时允许发言辩手:', tempAllowedDebaterIdx);
          console.log('【调试】临时允许发言反方:', tempAllowedOpponentIdx);

          // 手动调用API
          (async () => {
            console.log('【调试】开始调用自由辩论阶段API，辩手数量:', tempAllowedDebaterIdx.length + tempAllowedOpponentIdx.length);
            for (const idx of tempAllowedDebaterIdx) {
              console.log('【调试】手动调用正方辩手:', idx);
              await handleDebaterSpeak(idx);
              await delay(100);
            }
            for (const idx of tempAllowedOpponentIdx) {
              console.log('【调试】手动调用反方辩手:', idx);
              await handleOpponentSpeak(idx);
              await delay(100);
            }
            console.log('【调试】自由辩论阶段API调用完成');
          })();
        }, 500);
      }

      return newStageIdx;
    });
  };

  // 重置所有状态
  const handleReset = () => {
    setIsStarted(false); // 回到初始页
    setIsAutoRunning(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);

    // 暂停所有朗读
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('重置辩论，已暂停所有朗读');
    }

    setStageIdx(0);
    setDebaters(initialDebaters);
    setOpponents(initialOpponents);
    setScores(Array(8).fill(''));
    autoIdxRef.current = 1;
    // 清空发言状态
    setSpeakingDebaters(new Set());
    setSpeakingOpponents(new Set());
    setIsReset(true); // 设置重置标志
  };

  const handleScoreChange = (idx, value) => {
    const newScores = [...scores];
    newScores[idx] = value;
    setScores(newScores);
  };

  // 显示当前阶段允许发言的辩手，保留他们的完整发言历史
  const getCurrentTwoDebaters = (allDebaters, allowedIdx) => {
    console.log('【调试】getCurrentTwoDebaters - 当前阶段:', stages[stageIdx]);
    console.log('【调试】getCurrentTwoDebaters - allDebaters:', allDebaters);
    console.log('【调试】getCurrentTwoDebaters - allowedIdx:', allowedIdx);

    return allDebaters.map((d, i) => {
      // 在驳论环节，只显示二辩的发言
      if (stages[stageIdx] === '驳论') {
        const shouldShow = i === 1;
        console.log(`【调试】驳论阶段 - 辩手${i}(${d.realName}) 显示:`, shouldShow);
        return shouldShow ? { ...d } : { ...d, history: [] }; // 只显示二辩（索引1）
      }
      // 在质辩环节，只显示三辩的发言（质辩结论）
      if (stages[stageIdx] === '质辩') {
        const shouldShow = i === 2;
        console.log(`【调试】质辩阶段 - 辩手${i}(${d.realName}) 显示:`, shouldShow);
        return shouldShow ? { ...d } : { ...d, history: [] }; // 只显示三辩（索引2）
      }
      // 在自由辩论环节，显示所有辩手的发言
      if (stages[stageIdx] === '自由辩论') {
        console.log(`【调试】自由辩论阶段 - 辩手${i}(${d.realName}) 显示发言`);
        return { ...d }; // 显示所有辩手的发言历史
      }
      // 其他环节只显示当前阶段发言的辩手
      const shouldShow = allowedIdx.includes(i);
      console.log(`【调试】其他阶段 - 辩手${i}(${d.realName}) 显示:`, shouldShow);
      return shouldShow
        ? { ...d } // 保留完整发言历史
        : { ...d, history: [] }; // 不显示其他辩手的发言
    });
  };

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

  // 新增：监听阶段变化，确保API调用正常执行
  useEffect(() => {
    console.log('【调试】阶段变化监听 - 当前阶段:', stages[stageIdx]);
    console.log('【调试】阶段变化监听 - 允许发言辩手:', allowedDebaterIdx);
    console.log('【调试】阶段变化监听 - 允许发言反方:', allowedOpponentIdx);
  }, [stageIdx, allowedDebaterIdx, allowedOpponentIdx]);

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

    // 只有在非重置状态下才自动调用API
    if (!isReset) {
      // 在状态更新后立即调用API
      setTimeout(() => {
        console.log('【调试】开始调用立论阶段API');
        // 立论阶段应该调用索引0的辩手（一辩）
        const tempAllowedDebaterIdx = [0]; // 正方一辩
        const tempAllowedOpponentIdx = [0]; // 反方一辩

        console.log('【调试】立论阶段 - 允许发言辩手:', tempAllowedDebaterIdx);
        console.log('【调试】立论阶段 - 允许发言反方:', tempAllowedOpponentIdx);

        // 手动调用API
        (async () => {
          for (const idx of tempAllowedDebaterIdx) {
            console.log('【调试】手动调用正方一辩:', idx);
            await handleDebaterSpeak(idx);
            await delay(100);
          }
          for (const idx of tempAllowedOpponentIdx) {
            console.log('【调试】手动调用反方一辩:', idx);
            await handleOpponentSpeak(idx);
            await delay(100);
          }
        })();
      }, 500);
    } else {
      // 重置后，清除重置标志
      setIsReset(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, minHeight: '100vh' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', minHeight: '400px' }}>
            {(() => {
              console.log('【调试】正方DebaterPanel - 当前阶段:', stages[stageIdx]);
              console.log('【调试】正方DebaterPanel - allowedDebaterIdx:', allowedDebaterIdx);
              console.log('【调试】正方DebaterPanel - visibleIdx:', stages[stageIdx] === '驳论' ? [1] : stages[stageIdx] === '质辩' ? [2] : allowedDebaterIdx);
              return (
                <DebaterPanel
                  side="正方"
                  debaters={getCurrentTwoDebaters(debaters, allowedDebaterIdx)}
                  canSpeakIdx={allowedDebaterIdx}
                  visibleIdx={
                    stages[stageIdx] === '驳论' ? [1] :
                      stages[stageIdx] === '质辩' ? [2] :
                        allowedDebaterIdx
                  }
                  stage={stages[stageIdx]}
                  stageIdx={stageIdx}
                  isReset={isReset}
                />
              );
            })()}
            {(() => {
              const processedOpponents = getCurrentTwoDebaters(opponents, allowedOpponentIdx);
              console.log('【调试】反方DebaterPanel - 当前阶段:', stages[stageIdx]);
              console.log('【调试】反方DebaterPanel - processedOpponents:', processedOpponents);
              console.log('【调试】反方DebaterPanel - allowedOpponentIdx:', allowedOpponentIdx);
              console.log('【调试】反方DebaterPanel - visibleIdx:', stages[stageIdx] === '驳论' ? [1] : stages[stageIdx] === '质辩' ? [2] : allowedOpponentIdx);
              return (
                <DebaterPanel
                  side="反方"
                  debaters={processedOpponents}
                  canSpeakIdx={allowedOpponentIdx}
                  visibleIdx={
                    stages[stageIdx] === '驳论' ? [1] :
                      stages[stageIdx] === '质辩' ? [2] :
                        allowedOpponentIdx
                  }
                  stage={stages[stageIdx]}
                  stageIdx={stageIdx}
                  isReset={isReset}
                />
              );
            })()}
          </div>
          <div style={{ marginTop: '24px', padding: '16px', background: '#f5f7fa', borderRadius: '8px' }}>
            <ControlPanel
              onNextStage={handleNextStage}
              onReset={handleReset}
              onAutoSpeak={autoSpeakForCurrentStage}
              disabled={isAutoRunning || stageIdx >= stages.length - 1}
              isAutoRunning={isAutoRunning}
              stage={stages[stageIdx]}
              isReset={isReset}
            />
          </div>
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
