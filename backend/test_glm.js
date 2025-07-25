const OpenAI = require('openai');

const glm = new OpenAI({
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    apiKey: 'e1932ad4eca34f8db041cb8c4047d5f6.Wy3oLvL3N08U0Opk'
});

async function test(times = 5) {
    for (let i = 1; i <= times; i++) {
        try {
            const start = Date.now();
            const completion = await glm.chat.completions.create({
                model: "glm-4-air-250414",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: `请你简单自我介绍一下。（第${i}次请求）` }
                ],
                top_p: 0.7,
                temperature: 0.9
            });
            const end = Date.now();
            console.log(`第${i}次调用成功，返回内容：`, completion.choices[0].message.content);
            console.log(`第${i}次API调用耗时：`, (end - start), '毫秒');
        } catch (e) {
            console.error(`第${i}次调用失败，错误信息：`, e.message);
        }
    }
}

test(5); 