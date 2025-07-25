import React from 'react';
import { Typography, Divider } from 'antd';

const DebateStage = ({ topic, stage }) => (
    <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ textAlign: 'center', fontWeight: 'bold', margin: 0 }}>
            辩题：{topic}
        </Typography.Title>
        <Divider style={{ margin: '12px 0' }} />
        <Typography.Title level={4} style={{ textAlign: 'center', margin: 0 }}>
            当前阶段：{stage}
        </Typography.Title>
    </div>
);

export default DebateStage; 