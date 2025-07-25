import React from 'react';
import { Card, Avatar } from 'antd';

// 头像映射，可根据实际需求自定义
const avatarMap = {
    '李明': '🧑‍💼',
    '张华': '🧑‍🎓',
    '王强': '🧑‍🔬',
    '刘芳': '👩‍💼',
    '陈伟': '🧑‍💻',
    '赵敏': '👩‍🎓',
    '孙浩': '🧑‍🏫',
    '周丽': '👩‍🔬',
};

const DebaterPanel = ({ side, debaters, canSpeakIdx = [], visibleIdx = [0, 1, 2, 3] }) => (
    <div style={{ flex: 1, margin: '0 16px', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <h3>{side}</h3>
        <div>
            {debaters.map((debater, idx) => (
                visibleIdx.includes(idx) && (
                    <Card
                        key={idx}
                        title={
                            <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar style={{ background: '#e6f4ff', fontSize: 22 }} size={40}>
                                    {avatarMap[debater.realName] || debater.realName[0]}
                                </Avatar>
                                {debater.name}（{debater.realName}） <span style={{ color: '#1677ff' }}>{debater.model}</span>
                            </span>
                        }
                        style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}
                        headStyle={{ background: '#f5f7fa', borderRadius: '12px 12px 0 0' }}
                    >
                        <div>
                            <b>发言历史：</b>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                {(debater.history || []).map((item, i) => (
                                    <div key={i} style={{
                                        background: '#f6f8fa',
                                        borderRadius: 8,
                                        padding: '8px 18px',
                                        boxShadow: '0 1px 3px #eee',
                                        alignSelf: 'flex-start',
                                        maxWidth: '98%',
                                        minWidth: 180,
                                        wordBreak: 'break-all',
                                        fontSize: 16
                                    }}>{item}</div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )
            ))}
        </div>
    </div>
);

export default DebaterPanel; 