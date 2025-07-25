const OpenAI = require('openai');

const deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-5030c129fdd74bba89bd3b38e666d698'
});

async function test(times = 5) {
    for (let i = 1; i <= times; i++) {
        try {
            const start = Date.now();
            const completion = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个辩论赛选手，请根据提示发言。" },
                    { role: "user", content: `请你简单自我介绍一下。（第${i}次请求）` }
                ]
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