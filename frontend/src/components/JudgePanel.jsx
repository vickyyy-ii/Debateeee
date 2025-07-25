import React from 'react';

const JudgePanel = ({ debaters, scores, onScoreChange }) => (
    <div style={{ marginTop: 24 }}>
        <h3>裁判评分</h3>
        {debaters.map((debater, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
                <span>{debater.name}：</span>
                <input
                    type="number"
                    min={0}
                    max={100}
                    value={scores[idx] || ''}
                    onChange={e => onScoreChange(idx, e.target.value)}
                    style={{ width: 60 }}
                />
            </div>
        ))}
    </div>
);

export default JudgePanel; 