import React from 'react';

const ControlPanel = ({ onStart, onPause, onContinue, onNextStage, onReset, onAutoSpeak, disabled, isAutoRunning, isPaused, stage }) => {
    const handleStartAndSpeak = async () => {
        await onStart();
    };
    return (
        <div style={{ margin: '24px 0' }}>
            <button onClick={handleStartAndSpeak} disabled={stage !== '未开始' || isAutoRunning || isPaused}>开始辩论</button>
            <button onClick={onPause} disabled={!isAutoRunning} style={{ marginLeft: 12 }}>暂停</button>
            <button onClick={onContinue} disabled={!isPaused} style={{ marginLeft: 12 }}>继续</button>
            <button onClick={onNextStage} disabled={stage === '结辩' || stage === '未开始'} style={{ marginLeft: 12 }}>下一阶段</button>
            <button onClick={onAutoSpeak} disabled={stage === '未开始' || disabled || isAutoRunning || isPaused} style={{ marginLeft: 12 }}>自动发言</button>
            <button onClick={onReset} style={{ marginLeft: 12 }}>重置</button>
        </div>
    );
};

export default ControlPanel; 