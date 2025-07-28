import React, { useEffect, useRef, useState } from 'react';
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

const DebaterPanel = ({ side, debaters, canSpeakIdx = [], visibleIdx = [0, 1, 2, 3], stage, stageIdx }) => {
    console.log(`[${side}] 当前渲染的辩手`, debaters);
    return (
        <div style={{ flex: 1, margin: '0 16px', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h3>{side}</h3>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {debaters.map((debater, idx) => (
                    (visibleIdx.includes(idx) || canSpeakIdx.includes(idx)) && (
                        <DebaterCard debater={debater} idx={idx} canSpeakIdx={canSpeakIdx} stage={stage} stageIdx={stageIdx} />
                    )
                ))}
            </div>
        </div>
    );
};

// 动态打点动画组件
const TypingDots = () => {
    const [dots, setDots] = useState('');
    useEffect(() => {
        const timer = setInterval(() => {
            setDots(prev => prev.length < 3 ? prev + '…' : '');
        }, 400);
        return () => clearInterval(timer);
    }, []);
    return <span>{dots}</span>;
};

// 单独拆出卡片，支持展开/收起
const DebaterCard = ({ debater, idx, canSpeakIdx, stage, stageIdx }) => {
    const [expanded, setExpanded] = useState(false);
    const latestContent = debater.history && debater.history.length > 0 ? debater.history[debater.history.length - 1] : '';
    const isError = latestContent === '（大模型接口调用失败）';
    const isEmpty = !latestContent;
    // 只显示论点部分，并加粗
    let argument = '';
    if (latestContent) {
        const match = latestContent.match(/(观点|论点)：([\s\S]+)/);
        if (match) {
            argument = match[2].trim();
        } else {
            argument = latestContent;
        }
    }
    const shortArgument = argument.length > 60 ? argument.slice(0, 60) + '...' : argument;
    // 判断质辩阶段且不在可发言名单
    const isDebateStage = stage === '质辩' && !canSpeakIdx.includes(idx);
    // 判断驳论阶段且不在可发言名单（驳论环节显示所有辩手，但只有二辩发言）
    const isRebuttalStage = stage === '驳论' && !canSpeakIdx.includes(idx);
    // 判断质辩阶段且不是三辩（质辩环节只显示三辩的结论）
    const isNotThirdDebater = stage === '质辩' && idx !== 2;
    // 新增：判断是否正在发言
    const isTyping = latestContent === '（正在调用大模型...）';
    return (
        <Card
            title={
                <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar style={{ background: '#e6f4ff', fontSize: 22 }} size={40}>
                        {avatarMap[debater.realName] || debater.realName[0]}
                    </Avatar>
                    {debater.name}（{debater.realName}） <span style={{ color: '#1677ff' }}>{debater.model}</span>
                    {isTyping && <span style={{ color: '#faad14', marginLeft: 8 }}>正在发言<TypingDots /></span>}
                </span>
            }
            style={{
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px #f0f1f2',
                border: undefined,
                background: '#fafdff',
                transition: 'box-shadow 0.3s, border 0.3s'
            }}
            headStyle={{ background: '#f5f7fa', borderRadius: '12px 12px 0 0' }}
        >
            <div>
                {isDebateStage ? (
                    <div style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}>无发言</div>
                ) : isNotThirdDebater ? (
                    <div style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}>等待三辩总结</div>
                ) : isRebuttalStage ? (
                    <div style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}>等待二辩反驳</div>
                ) : isTyping ? (
                    <div style={{ color: '#faad14', fontStyle: 'italic', padding: '8px 18px' }}>正在生成<TypingDots /></div>
                ) : isEmpty ? (
                    <div style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}>等待中…</div>
                ) : (
                    <FadeInText
                        key={latestContent}
                        style={{
                            background: isError ? '#fff1f0' : '#f6f8fa',
                            borderRadius: 8,
                            padding: '8px 18px',
                            boxShadow: '0 1px 3px #eee',
                            alignSelf: 'flex-start',
                            maxWidth: '98%',
                            minWidth: 180,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            fontSize: 16,
                            lineHeight: 1.6,
                            overflow: 'auto',
                            maxHeight: '400px',
                            transition: 'background 0.5s',
                            color: isError ? '#cf1322' : undefined
                        }}
                    >
                        {isError ? (
                            '⚠️ 大模型接口调用失败，请重试！'
                        ) : (
                            <>
                                <span style={{ fontWeight: 'bold' }}>
                                    {expanded ? argument : shortArgument}
                                </span>
                                {argument.length > 60 && (
                                    <span
                                        style={{ color: '#1677ff', cursor: 'pointer', marginLeft: 8 }}
                                        onClick={() => setExpanded(e => !e)}
                                    >
                                        {expanded ? '收起' : '展开'}
                                    </span>
                                )}
                            </>
                        )}
                    </FadeInText>
                )}
            </div>
        </Card>
    );
};

// 渐出动画组件
const FadeInText = ({ children, style }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef();
    useEffect(() => {
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, [children]);
    return (
        <div
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 1.2s',
                ...style
            }}
        >
            {children}
        </div>
    );
};

export default DebaterPanel; 