const http = require('http');

// 测试1: 正常大小的jsCode (17KB)
console.log('测试1: 正常大小 (17KB) - 应该成功');
testAPI('x'.repeat(17 * 1024));

// 测试2: 超过20KB的jsCode (25KB)
setTimeout(() => {
    console.log('\n测试2: 超过限制 (25KB) - 应该失败');
    testAPI('x'.repeat(25 * 1024));
}, 2000);

function testAPI(jsCode) {
    const postData = JSON.stringify({ jsCode });
    const size = Buffer.byteLength(postData, 'utf8');

    console.log(`  jsCode大小: ${(size / 1024).toFixed(2)}KB`);

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/process',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log(`  状态码: ${res.statusCode}`);
                console.log(`  结果: ${response.success ? '✅ 成功' : '❌ 失败'}`);
                if (!response.success) {
                    console.log(`  错误: ${response.error}`);
                }
            } catch (error) {
                console.log(`  ❌ 解析失败: ${error.message}`);
            }
        });
    });

    req.on('error', (error) => {
        console.log(`  ❌ 请求失败: ${error.message}`);
    });

    req.write(postData);
    req.end();
}