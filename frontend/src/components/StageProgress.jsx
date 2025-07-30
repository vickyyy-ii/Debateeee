import React from 'react';

const StageProgress = ({ stages, currentIdx }) => (
    <div className="progress-stages">
        {stages.map((stage, index) => {
            let className = 'progress-stage';
            if (index === currentIdx) {
                className += ' active';
            } else if (index < currentIdx) {
                className += ' completed';
            } else {
                className += ' pending';
            }
            
            return (
                <div key={index} className={className}>
                    <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                    }}>
                        {index + 1}
                    </div>
                    <div style={{ 
                        fontSize: '0.85rem',
                        lineHeight: '1.2'
                    }}>
                        {stage}
                    </div>
                </div>
            );
        })}
    </div>
);

export default StageProgress; 