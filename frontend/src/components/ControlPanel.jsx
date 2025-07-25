import React from 'react';

const ControlPanel = ({ onNextStage, onReset, onAutoSpeak, disabled, isAutoRunning, stage }) => {
    return (
        <div style={{ margin: '24px 0' }}>
            {/* 只显示“下一阶段”按钮，结辩阶段隐藏 */}
            {stage !== '结辩' && (
                <button onClick={onNextStage} style={{ marginLeft: 0 }} disabled={disabled}>下一阶段</button>
            )}
            {/* 结辩阶段不再显示重置按钮 */}
            {stage !== '结辩' && (
                <button onClick={onReset} style={{ marginLeft: 12 }}>重置</button>
            )}
        </div>
    );
};

export default ControlPanel; 