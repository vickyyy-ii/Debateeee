import React from 'react';
import { Steps } from 'antd';

const StageProgress = ({ stages, currentIdx }) => (
    <div style={{ margin: '24px 0' }}>
        <Steps
            current={currentIdx}
            items={stages.map(stage => ({ title: stage }))}
            size="small"
        />
    </div>
);

export default StageProgress; 