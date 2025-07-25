// 加载环境变量
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const winston = require('winston');
const app = express();
app.use(express.json());
app.use(cors());
const OpenAI = require('openai');

// Winston 日志配置
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'debate-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'debate-combined.log' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// 引入OpenAI SDK用于Deepseek、混元、通义千问、智谱GLM-4

const deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-5030c129fdd74bba89bd3b38e666d698'
});
const hunyuan = new OpenAI({
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
    apiKey: 'sk-ul8ixprFBfZQ0w7tCEB9PC7G84C6Bz09ogxXUWCbiibqtVZL'
});
const qwen = new OpenAI({
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: 'sk-9c88fb729c76488799f932fbe46f0306'
});
const glm = new OpenAI({
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    apiKey: 'e1932ad4eca34f8db041cb8c4047d5f6.Wy3oLvL3N08U0Opk'
});

// 姓名到模型的映射
const debaterModelMap = {
    '李明': 'glm',
    '张华': 'hy',
    '王强': 'deepseek',
    '刘芳': 'qwen',
    '陈伟': 'deepseek',
    '赵敏': 'qwen',
    '孙浩': 'hy',
    '周丽': 'deepseek'
};

// 辩手发言API（按姓名分配模型）
app.post('/api/debate/speak', async (req, res) => {
    let { debater, stage, side } = req.body;
    // 如果是陈伟，强制为反方，并在prompt前加特殊要求
    let chenweiPrefix = '';
    if (debater.replace(/（.*?）/, '') === '陈伟') {
        side = '反方';
        chenweiPrefix = '你必须以“反方一辩陈伟”身份发言，禁止出现“正方”字样，必须全程以反方立场作答，否则视为无效。请严格遵守！';
    }
    const fullIdentity = side ? `${side}${debater}` : debater;
    let prompt = '';
    const topicPrefix = '辩题为“社交媒体是否利大于弊”。';
    if (stage === '立论') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请阐述立场，定义核心概念，说明判断标准，提出3个论点并总结。每个论点需有真实数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else if (stage === '驳论') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请回应本方+反驳对方，补充论据，逻辑清晰。每条需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else if (stage === '质辩提问') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请提出1个具体问题，暴露对方漏洞，不能泛泛而谈。问题需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else if (stage === '质辩答复') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请针对性回答问题，引用真实数据，强化立场，不能回避。每条需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else if (stage === '质辩小结') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请总结我方优势和对方漏洞，为后续阶段铺垫。需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else if (stage === '自由辩论') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请加强论点，攻击对方漏洞，提出引导性问题。需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else if (stage === '总结陈词') {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请回顾全场，升华立场，重申核心论点。需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    } else {
        prompt = `${topicPrefix}${chenweiPrefix}你是${fullIdentity}，现在是${stage}阶段。请结合本方立场，围绕当前阶段任务发言。需有数据/案例/学术研究支撑，注明来源，总字数不超过300字。禁止编造内容、不得抄袭。`;
    }
    // 提取姓名（去除括号及内容）
    const name = debater.replace(/（.*?）/, '');
    const modelType = debaterModelMap[name] || 'glm';

    const startTime = Date.now();
    logger.info({
        event: 'debater_speak_request',
        debater,
        stage,
        modelType,
        prompt,
        timestamp: new Date().toISOString()
    });

    try {
        let content = '';
        if (modelType === 'glm') {
            const completion = await glm.chat.completions.create({
                model: "glm-4-air-250414",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ],
                top_p: 0.7,
                temperature: 0.9
            });
            content = completion.choices[0].message.content;
        } else if (modelType === 'qwen') {
            const completion = await qwen.chat.completions.create({
                model: "qwen-plus",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ]
            });
            content = completion.choices[0].message.content;
        } else if (modelType === 'hy') {
            const completion = await hunyuan.chat.completions.create({
                model: "hunyuan-turbos-latest",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ],
                enable_enhancement: true
            });
            content = completion.choices[0].message.content;
        } else if (modelType === 'deepseek') {
            const completion = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ]
            });
            content = completion.choices[0].message.content;
        }
        const duration = Date.now() - startTime;
        logger.info({
            event: 'debater_speak_success',
            debater,
            modelType,
            stage,
            duration_ms: duration,
            content: content.slice(0, 200),
            timestamp: new Date().toISOString()
        });
        res.json({ content });
    } catch (e) {
        const duration = Date.now() - startTime;
        logger.error({
            event: 'debater_speak_error',
            debater,
            modelType,
            stage,
            duration_ms: duration,
            error: e.message,
            timestamp: new Date().toISOString()
        });
        res.json({ content: '（大模型接口调用失败，返回模拟内容）' });
    }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001')); 