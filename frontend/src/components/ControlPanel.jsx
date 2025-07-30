import React from 'react';

const ControlPanel = ({ onNextStage, onReset, onAutoSpeak, disabled, isAutoRunning, stage, isReset }) => {
    return (
        <div style={{ textAlign: 'center' }}>
            <div className="control-buttons">
                {/* 只显示"下一阶段"按钮，结辩阶段隐藏 */}
                {stage !== '结辩' && (
                    <button
                        onClick={onNextStage}
                        className="control-button"
                        disabled={disabled}
                    >
                        {isAutoRunning ? '自动进行中...' : '下一阶段'}
                    </button>
                )}
                
                {/* 结辩阶段不再显示重置按钮 */}
                {stage !== '结辩' && (
                    <button
                        onClick={onReset}
                        className="control-button secondary"
                    >
                        重置辩论
                    </button>
                )}
                
                {/* 手动触发当前阶段发言按钮 - 在重置后或需要时显示 */}
                {(isReset || stage === '驳论') && (
                    <button
                        onClick={onAutoSpeak}
                        className="control-button"
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        手动触发发言
                    </button>
                )}
            </div>
        </div>
    );
};

export default ControlPanel; 