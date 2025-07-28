import React from 'react';

const ControlPanel = ({ onNextStage, onReset, onAutoSpeak, disabled, isAutoRunning, stage, isReset }) => {
    return (
        <div style={{ margin: '24px 0', textAlign: 'center' }}>
            {/* 只显示"下一阶段"按钮，结辩阶段隐藏 */}
            {stage !== '结辩' && (
                <button
                    onClick={onNextStage}
                    style={{
                        marginLeft: 0,
                        fontSize: '16px',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        background: '#1677ff',
                        color: 'white',
                        border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1
                    }}
                    disabled={disabled}
                >
                    下一阶段
                </button>
            )}
            {/* 结辩阶段不再显示重置按钮 */}
            {stage !== '结辩' && (
                <button
                    onClick={onReset}
                    style={{
                        marginLeft: 12,
                        fontSize: '16px',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        background: '#f5f7fa',
                        color: '#666',
                        border: '1px solid #d9d9d9',
                        cursor: 'pointer'
                    }}
                >
                    重置
                </button>
            )}
            {/* 手动触发当前阶段发言按钮 - 在重置后或需要时显示 */}
            {(isReset || stage === '驳论') && (
                <button
                    onClick={onAutoSpeak}
                    style={{
                        marginLeft: 12,
                        fontSize: '14px',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#52c41a',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    手动触发发言
                </button>
            )}
        </div>
    );
};

export default ControlPanel; 