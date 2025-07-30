import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const DebateStage = ({ topic, stage }) => (
    <div>
        <Title level={1} style={{ 
            textAlign: 'center', 
            fontWeight: '800', 
            margin: '0 0 1rem 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '2.5rem'
        }}>
            辩题：{topic}
        </Title>
        <Title level={2} style={{ 
            textAlign: 'center', 
            margin: '0.5rem 0 0 0',
            color: '#4a5568',
            fontWeight: '600',
            fontSize: '1.5rem'
        }}>
            当前阶段：{stage}
        </Title>
    </div>
);

export default DebateStage; 