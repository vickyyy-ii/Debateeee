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

const DebaterPanel = ({ side, debaters, canSpeakIdx = [], visibleIdx = [0, 1, 2, 3], stage, stageIdx, isReset = false, addToReadingQueue, isReading }) => {
    console.log(`[${side}] 当前渲染的辩手`, debaters);
    console.log(`[${side}] visibleIdx:`, visibleIdx);
    console.log(`[${side}] canSpeakIdx:`, canSpeakIdx);
    console.log(`[${side}] 当前阶段:`, stage);

    // 自动朗读设置
    const [autoRead, setAutoRead] = useState(true);

    // 监听阶段变化，暂停朗读
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            console.log(`[${side}] 阶段切换，已暂停朗读`);
        }
    }, [stage, stageIdx, side, isReset]);

    // 语音朗读功能
    const speakText = (text, speakerName, cancelPrevious = true) => {
        console.log('speakText被调用:', { text, speakerName, cancelPrevious });
        console.log('speechSynthesis是否可用:', 'speechSynthesis' in window);

        if ('speechSynthesis' in window) {
            console.log('开始语音朗读流程');
            // 停止当前正在播放的语音（仅在需要时）
            if (cancelPrevious) {
                window.speechSynthesis.cancel();
            }

            // 清理文本，只移除特定的特殊符号，保留中文标点
            const cleanText = text
                .replace(/[*]/g, '') // 移除星号
                .replace(/[#]/g, '') // 移除井号
                .replace(/[@]/g, '') // 移除@符号
                .replace(/[`]/g, '') // 移除反引号
                .replace(/[~]/g, '') // 移除波浪号
                .replace(/[|]/g, '') // 移除竖线
                .replace(/[\\]/g, '') // 移除反斜杠
                .replace(/[=]/g, '') // 移除等号
                .replace(/[+]/g, '') // 移除加号
                .replace(/[_]/g, '') // 移除下划线
                .replace(/[{}]/g, '') // 移除大括号
                .replace(/[<>]/g, '') // 移除尖括号
                .replace(/\s+/g, ' ') // 合并多个空格
                .trim(); // 移除首尾空格

            // 检查清理后的文本是否为空
            if (!cleanText || cleanText.trim() === '') {
                console.log('清理后的文本为空，跳过朗读');
                return;
            }

            console.log('清理后的文本:', cleanText);

            // 创建语音合成对象
            const utterance = new SpeechSynthesisUtterance(cleanText);

            // 设置语音参数，让朗读更有感情
            utterance.lang = 'zh-CN'; // 中文
            utterance.rate = 0.85; // 语速稍慢，更有节奏感
            utterance.pitch = 1.1; // 音调稍高，更有活力
            utterance.volume = 0.9; // 音量适中

            // 等待语音列表加载完成
            const speakWithVoice = () => {
                console.log('speakWithVoice被调用');
                const voices = window.speechSynthesis.getVoices();
                console.log('所有可用语音:', voices);
                const chineseVoices = voices.filter(voice =>
                    voice.lang.includes('zh') || voice.lang.includes('cmn')
                );
                console.log('中文语音:', chineseVoices);

                if (chineseVoices.length > 0) {
                    // 根据辩手索引选择不同的声音
                    const voiceIndex = Math.abs(speakerName.length) % chineseVoices.length;
                    utterance.voice = chineseVoices[voiceIndex];
                    console.log('选择的语音:', chineseVoices[voiceIndex]);
                } else {
                    console.log('没有找到中文语音，尝试使用任何可用的语音');
                    if (voices.length > 0) {
                        utterance.voice = voices[0];
                        console.log('使用第一个可用语音:', voices[0]);
                    } else {
                        console.log('没有可用语音，使用默认设置');
                        utterance.voice = null;
                    }
                }

                // 播放语音
                window.speechSynthesis.speak(utterance);
                console.log(`正在朗读 ${speakerName} 的发言内容`);

                // 添加事件监听器来调试
                utterance.onstart = () => console.log('语音开始播放');
                utterance.onend = () => console.log('语音播放结束');
                utterance.onerror = (event) => console.error('语音播放错误:', event);
            };

            // Chrome 浏览器的语音列表需要用户交互后才能获取
            // 先尝试获取语音列表
            let voices = window.speechSynthesis.getVoices();
            console.log('当前可用语音数量:', voices.length);

            if (voices.length > 0) {
                console.log('语音列表已加载，直接播放');
                speakWithVoice();
            } else {
                console.log('语音列表未加载，等待加载完成');
                // 设置一次性事件监听器
                const handleVoicesChanged = () => {
                    console.log('onvoiceschanged 事件触发');
                    voices = window.speechSynthesis.getVoices();
                    console.log('加载后的语音数量:', voices.length);
                    speakWithVoice();
                    // 移除事件监听器，避免重复触发
                    window.speechSynthesis.onvoiceschanged = null;
                };
                window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

                // 如果 5 秒后还没有触发 onvoiceschanged，尝试强制获取
                setTimeout(() => {
                    if (window.speechSynthesis.onvoiceschanged === handleVoicesChanged) {
                        console.log('5秒后强制获取语音列表');
                        voices = window.speechSynthesis.getVoices();
                        if (voices.length > 0) {
                            speakWithVoice();
                        } else {
                            console.log('仍然没有语音，使用默认设置播放');
                            // 即使没有语音列表，也尝试播放
                            utterance.voice = null;
                            window.speechSynthesis.speak(utterance);
                        }
                        window.speechSynthesis.onvoiceschanged = null;
                    }
                }, 5000);
            }
        } else {
            console.log('浏览器不支持语音合成功能');
            alert('您的浏览器不支持语音朗读功能');
        }
    };

    return (
        <div style={{ flex: 1, margin: '0 16px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3>{side}</h3>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                        type="checkbox"
                        checked={autoRead}
                        onChange={(e) => setAutoRead(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    自动朗读
                </label>
            </div>
            <div style={{ flex: 1, minHeight: '300px', overflowY: 'auto' }}>
                {debaters.map((debater, idx) => {
                    // 自由辩论阶段显示所有辩手
                    if (stage === '自由辩论') {
                        console.log(`[${side}] 自由辩论阶段 - 显示辩手${idx}:`, debater.realName);
                        return (
                            <DebaterCard
                                key={`${side}-${idx}-${debater.realName}`}
                                debater={debater}
                                idx={idx}
                                canSpeakIdx={canSpeakIdx}
                                stage={stage}
                                stageIdx={stageIdx}
                                isReset={isReset}
                                autoRead={autoRead}
                                addToReadingQueue={addToReadingQueue}
                                side={side}
                            />
                        );
                    }

                    // 其他阶段按visibleIdx显示
                    if (visibleIdx.includes(idx) || canSpeakIdx.includes(idx)) {
                        console.log(`[${side}] 其他阶段 - 显示辩手${idx}:`, debater.realName);
                        return (
                            <DebaterCard
                                key={`${side}-${idx}-${debater.realName}`}
                                debater={debater}
                                idx={idx}
                                canSpeakIdx={canSpeakIdx}
                                stage={stage}
                                stageIdx={stageIdx}
                                isReset={isReset}
                                autoRead={autoRead}
                                addToReadingQueue={addToReadingQueue}
                                side={side}
                            />
                        );
                    }

                    console.log(`[${side}] 隐藏辩手${idx}:`, debater.realName);
                    return null;
                })}
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
const DebaterCard = ({ debater, idx, canSpeakIdx, stage, stageIdx, isReset = false, autoRead = true, addToReadingQueue, side }) => {
    const latestContent = debater.history && debater.history.length > 0 ? debater.history[debater.history.length - 1] : '';
    const isError = latestContent === '（大模型接口调用失败）';
    const isEmpty = !latestContent;
    const [isTextComplete, setIsTextComplete] = useState(false);

    // 使用useMemo来缓存计算结果，避免不必要的重新计算
    const { argument } = React.useMemo(() => {
        let argument = '';
        if (latestContent) {
            const match = latestContent.match(/(观点|论点)：([\s\S]+)/);
            if (match) {
                argument = match[2].trim();
            } else {
                argument = latestContent;
            }
        }
        return { argument };
    }, [latestContent]);

    // 当内容变化时重置完成状态
    useEffect(() => {
        setIsTextComplete(false);
    }, [latestContent]);

    // 判断质辩阶段且不在可发言名单
    const isDebateStage = stage === '质辩' && !canSpeakIdx.includes(idx);
    // 判断驳论阶段且不是二辩（驳论环节只显示二辩）
    const isNotSecondDebater = stage === '驳论' && idx !== 1;
    // 判断质辩阶段且不是三辩（质辩环节只显示三辩的结论）
    const isNotThirdDebater = stage === '质辩' && idx !== 2;
    // 新增：判断是否正在发言
    const isTyping = latestContent === '（正在调用大模型...）';
    // 新增：判断二辩在驳论阶段是否准备发言
    const isSecondDebaterInRebuttal = stage === '驳论' && idx === 1 && isEmpty && !isTyping;
    return (
        <Card
            title={
                <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="debater-avatar">
                        {avatarMap[debater.realName] || debater.realName[0]}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#2d3748' }}>
                            {debater.name}（{debater.realName}）
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#667eea', fontWeight: '600' }}>
                            {debater.model}
                        </span>
                    </div>
                    {isTyping && (
                        <span
                            key={`speaking-${debater.realName}`}
                            style={{ color: '#f59e0b', marginLeft: 8, display: 'inline', fontSize: '0.9rem' }}
                        >
                            <span className="status-indicator speaking"></span>
                            正在发言<TypingDots />
                        </span>
                    )}
                </span>
            }
            style={{
                marginBottom: 16,
                borderRadius: 16,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
            }}
            styles={{
                header: { 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    borderRadius: '16px 16px 0 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }
            }}
        >
            <div>
                {isDebateStage ? (
                    <div
                        style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}
                    >
                        <TypewriterText
                            key={`no-speech-${debater.realName}`}
                            style={{ color: '#aaa', fontStyle: 'italic' }}
                        >
                            无发言
                        </TypewriterText>
                    </div>
                ) : isNotSecondDebater ? (
                    <div
                        style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}
                    >
                        <TypewriterText
                            key={`wait-second-${debater.realName}`}
                            style={{ color: '#aaa', fontStyle: 'italic' }}
                        >
                            等待二辩反驳
                        </TypewriterText>
                        <TypingDots />
                    </div>
                ) : isNotThirdDebater ? (
                    <div
                        style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}
                    >
                        <TypewriterText
                            key={`wait-third-${debater.realName}`}
                            style={{ color: '#aaa', fontStyle: 'italic' }}
                        >
                            等待三辩总结
                        </TypewriterText>
                        <TypingDots />
                    </div>
                ) : isSecondDebaterInRebuttal ? (
                    <div
                        style={{ color: '#faad14', fontStyle: 'italic', padding: '8px 18px' }}
                    >
                        <TypewriterText
                            key={`prepare-rebuttal-${debater.realName}`}
                            style={{ color: '#faad14', fontStyle: 'italic' }}
                        >
                            准备反驳
                        </TypewriterText>
                        <TypingDots />
                    </div>
                ) : isEmpty ? (
                    <div
                        style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 18px' }}
                    >
                        <TypewriterText
                            key={`waiting-${debater.realName}`}
                            style={{ color: '#aaa', fontStyle: 'italic' }}
                        >
                            等待中…
                        </TypewriterText>
                        <TypingDots />
                    </div>
                ) : (
                    <>
                        <div
                            className="debate-text-container"
                            style={{
                                background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 12,
                                padding: '12px 16px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                alignSelf: 'flex-start',
                                maxWidth: '98%',
                                minWidth: 180,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.95rem',
                                lineHeight: 1.6,
                                color: isError ? '#ef4444' : '#2d3748',
                                border: isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {isError ? (
                                <TypewriterText
                                    key={`error-${debater.realName}`}
                                    style={{ color: '#cf1322' }}
                                >
                                    ⚠️ 大模型接口调用失败，请重试！
                                </TypewriterText>
                            ) : (
                                <>
                                    <TypewriterText
                                        key={`${debater.realName}-${debater.history.length}`}
                                        style={{ fontWeight: 'bold' }}
                                        speakerName={debater.realName}
                                        autoRead={autoRead}
                                        addToReadingQueue={addToReadingQueue}
                                        side={side}
                                        onTypingComplete={() => {
                                            setIsTextComplete(true);
                                        }}
                                    >
                                        {argument}
                                    </TypewriterText>
                                    {latestContent && isTextComplete && (
                                        <button
                                            onClick={() => {
                                                addToReadingQueue(argument, debater.realName, side);
                                            }}
                                            style={{
                                                marginTop: '8px',
                                                padding: '6px 12px',
                                                fontSize: '0.8rem',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                                            }}
                                            title="朗读发言内容"
                                            onMouseOver={e => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                                            }}
                                            onMouseOut={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)';
                                            }}
                                        >
                                            🔊 朗读
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

// 逐字显示动画组件
const TypewriterText = ({ children, style, onClick, onTypingComplete, speakerName, autoRead = true, addToReadingQueue, side }) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const intervalRef = useRef(null);
    const lastSpokenText = useRef('');

    useEffect(() => {
        // 清除之前的定时器
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (!children) {
            setDisplayText('');
            setIsTyping(false);
            return;
        }

        // 将React元素转换为纯文本
        const getTextContent = (element) => {
            if (typeof element === 'string') return element;
            if (typeof element === 'number') return element.toString();
            if (Array.isArray(element)) return element.map(getTextContent).join('');
            if (element && typeof element === 'object' && element.props) {
                return getTextContent(element.props.children);
            }
            return '';
        };

        const text = getTextContent(children);

        if (!text || text.trim() === '') {
            setDisplayText('');
            setIsTyping(false);
            return;
        }

        // 所有文本都使用打字机效果，不再有条件限制

        // 重置状态
        setDisplayText('');
        setIsTyping(true);

        let currentIndex = 0;

        // 开始打字机效果
        intervalRef.current = setInterval(() => {
            if (currentIndex < text.length) {
                const newText = text.substring(0, currentIndex + 1);
                setDisplayText(newText);

                // 实时朗读功能 - 只在文本完成时添加到队列
                if (autoRead && addToReadingQueue && speakerName && side && currentIndex === text.length - 1) {
                    console.log('文本完成，添加到朗读队列:', newText);
                    setTimeout(() => {
                        addToReadingQueue(newText, speakerName, side);
                    }, 0);
                    lastSpokenText.current = newText;
                }

                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(intervalRef.current);
                // 通知父组件打字完成
                if (onTypingComplete) {
                    onTypingComplete();
                }
            }
        }, 80); // 增加间隔时间，让打字效果更慢更明显

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [children]);

    return (
        <span style={style} onClick={onClick}>
            {displayText}
            {isTyping && <span style={{
                animation: 'blink 1s infinite',
                color: '#1677ff',
                fontWeight: 'bold'
            }}>|</span>}
        </span>
    );
};

// 渐出动画组件（保留用于其他用途）
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