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
    '陈伟': 'glm',
    '赵敏': 'qwen',
    '孙浩': 'hy',
    '周丽': 'deepseek'
};

// 辩手发言API（按姓名分配模型）
app.post('/api/debate/speak', async (req, res) => {
    const { debater, stage } = req.body;
    const prompt = `你是${debater}，现在是${stage}阶段，请发表你的观点。`;
    // 提取姓名（去除括号及内容）
    const name = debater.replace(/（.*?）/, '');
    const modelType = debaterModelMap[name] || 'glm';

    logger.info({
        event: 'debater_speak_request',
        debater,
        stage,
        modelType,
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
            try {
                content = completion.choices[0].message.content;
            } catch (error) {
                console.error(`API调用失败 (${modelType}):`, error);
                throw new Error(`模型响应解析失败: ${error.message}`);
            }
        } else if (modelType === 'qwen') {
            const completion = await qwen.chat.completions.create({
                model: "qwen-plus",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ]
            });
            try {
                content = completion.choices[0].message.content;
            } catch (error) {
                console.error(`API调用失败 (${modelType}):`, error);
                throw new Error(`模型响应解析失败: ${error.message}`);
            }
        } else if (modelType === 'hy') {
            const completion = await hunyuan.chat.completions.create({
                model: "hunyuan-turbos-latest",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ],
                enable_enhancement: true
            });
            try {
                content = completion.choices[0].message.content;
            } catch (error) {
                console.error(`API调用失败 (${modelType}):`, error);
                throw new Error(`模型响应解析失败: ${error.message}`);
            }
        } else if (modelType === 'deepseek') {
            const completion = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: prompt }
                ]
            });
            try {
                content = completion.choices[0].message.content;
            } catch (error) {
                console.error(`API调用失败 (${modelType}):`, error);
                throw new Error(`模型响应解析失败: ${error.message}`);
            }
        }
        logger.info({
            event: 'debater_speak_success',
            debater,
            modelType,
            content: content.slice(0, 100),
            timestamp: new Date().toISOString()
        });
        res.json({ content });
    } catch (e) {
        logger.error({
            event: 'debater_speak_error',
            debater,
            modelType,
            error: e.message,
            timestamp: new Date().toISOString()
        });
        res.json({ content: '（大模型接口调用失败，返回模拟内容）' });
    }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001')); 