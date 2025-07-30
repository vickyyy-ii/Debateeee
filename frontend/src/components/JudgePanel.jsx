import React from 'react';

const JudgePanel = ({ debaters, scores, onScoreChange, onAutoJudge }) => (
    <div>
        <h3 style={{ 
            textAlign: 'center', 
            margin: '0 0 1.5rem 0',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2d3748'
        }}>
            裁判评分
        </h3>
        
        <div className="judge-scores">
            {debaters.map((debater, idx) => (
                <div key={idx} className="score-item">
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                    }}>
                        <span style={{ 
                            fontWeight: '600',
                            color: '#2d3748',
                            fontSize: '0.95rem'
                        }}>
                            {debater.name}
                        </span>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={scores[idx] || ''}
                                onChange={e => onScoreChange(idx, e.target.value)}
                                style={{ 
                                    width: '80px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#2d3748',
                                    fontSize: '0.9rem',
                                    textAlign: 'center'
                                }}
                                placeholder="0-100"
                            />
                            <span style={{ 
                                fontSize: '0.85rem',
                                color: '#6b7280'
                            }}>
                                分
                            </span>
                        </div>
                    </div>
                    <div style={{ 
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        fontStyle: 'italic'
                    }}>
                        {debater.realName} ({debater.model})
                    </div>
                </div>
            ))}
        </div>
        
        {onAutoJudge && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                    onClick={onAutoJudge}
                    className="control-button"
                    style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                    }}
                >
                    自动评分
                </button>
            </div>
        )}
    </div>
);

export default JudgePanel; 