const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * 批量测试5个样本
 */
async function main() {
    console.log('='.repeat(60));
    console.log('批量样本测试：API完整流程');
    console.log('='.repeat(60));

    const samples = [
        '../samples/test1.js',
        '../samples/test2.js',
        '../samples/test3.js',
        '../samples/test4.js',
        '../samples/test5.js'
    ];

    const results = [];
    let totalTime = 0;

    console.log('\n开始批量提交样本...\n');

    for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const samplePath = path.join(__dirname, sample);
        const jsCode = fs.readFileSync(samplePath, 'utf-8');

        console.log(`[${i + 1}/${samples.length}] 测试样本: ${sample}`);
        console.log(`  代码长度: ${jsCode.length} 字符`);

        const startTime = Date.now();

        try {
            const response = await callAPI(jsCode);
            const elapsed = Date.now() - startTime;
            totalTime += elapsed;

            results.push({
                sample,
                success: response.success,
                elapsed,
                data: response.data,
                error: response.error
            });

            if (response.success) {
                console.log(`  ✅ 成功 (${elapsed}ms)`);
                console.log(`    data: ${JSON.stringify(response.data, null, 2)}`);
                console.log(`    v: ${response.data.v}`);
                console.log(`    e: ${response.data.e.substring(0, 50)}...`);
                console.log(`    s: ${response.data.s.substring(0, 50)}...`);
                console.log(`    d: ${response.data.d}`);
                console.log(`    vr: ${response.data.vr}`);
            } else {
                console.log(`  ❌ 失败 (${elapsed}ms)`);
                console.log(`    错误: ${response.error}`);
            }
        } catch (error) {
            const elapsed = Date.now() - startTime;
            totalTime += elapsed;

            results.push({
                sample,
                success: false,
                elapsed,
                error: error.message
            });

            console.log(`  ❌ 异常 (${elapsed}ms)`);
            console.log(`    错误: ${error.message}`);
        }

        console.log();
    }

    // 汇总结果
    console.log('='.repeat(60));
    console.log('测试汇总');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`总样本数: ${samples.length}`);
    console.log(`成功: ${successCount} ✅`);
    console.log(`失败: ${failCount} ❌`);
    console.log(`成功率: ${((successCount / samples.length) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalTime}ms`);
    console.log(`平均耗时: ${(totalTime / samples.length).toFixed(2)}ms`);
    console.log(`最快: ${Math.min(...results.map(r => r.elapsed))}ms`);
    console.log(`最慢: ${Math.max(...results.map(r => r.elapsed))}ms`);

    console.log('\n=== 详细结果 ===');
    results.forEach((r, i) => {
        const status = r.success ? '✅' : '❌';
        console.log(`${i + 1}. ${path.basename(r.sample)} - ${status} (${r.elapsed}ms)`);
        if (!r.success) {
            console.log(`   错误: ${r.error}`);
        }
    });

    // 验证数据一致性
    if (successCount > 1) {
        console.log('\n=== 数据一致性检查 ===');
        const successResults = results.filter(r => r.success);

        // 检查所有成功的结果是否都有必需字段
        let allValid = true;
        for (const result of successResults) {
            const { b, v, e, s, d, vr } = result.data;
            if (b !== 0 || d !== 0 || vr !== '3') {
                console.log(`⚠️  ${path.basename(result.sample)}: 固定字段值异常`);
                allValid = false;
            }
            if (!v || !e || !s) {
                console.log(`⚠️  ${path.basename(result.sample)}: 缺少必需字段`);
                allValid = false;
            }
        }

        if (allValid) {
            console.log('✅ 所有样本数据结构一致');
        }
    }

    console.log('\n' + '='.repeat(60));
    if (successCount === samples.length) {
        console.log('🎉🎉🎉 全部样本测试通过! 🎉🎉🎉');
    } else {
        console.log(`⚠️  有 ${failCount} 个样本测试失败`);
    }
    console.log('='.repeat(60));
}

/**
 * 调用API
 */
function callAPI(jsCode) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ jsCode });

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
                    resolve(response);
                } catch (error) {
                    reject(new Error('解析响应失败: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        // 设置超时
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        req.write(postData);
        req.end();
    });
}

main().catch(error => {
    console.error('测试出错:', error);
    process.exit(1);
});