const fs = require('fs');
const path = require('path');

async function main() {
    console.log('='.repeat(60));
    console.log('性能测试：优化后的反混淆速度');
    console.log('='.repeat(60));

    const { deobfuscate } = await import('../dist/src/deobfuscator/index.js');
    const { extractBotIDxIsHuman } = await import('../dist/src/extractors/astExtractor.js');
    const { parse } = await import('@babel/parser');

    // 测试所有5个样本
    const samples = [
        'samples/test1.js',
        'samples/test2.js',
        'samples/test3.js',
        'samples/test4.js',
        'samples/test5.js'
    ];

    let totalTime = 0;
    const results = [];

    console.log('\n开始测试...\n');

    for (const sample of samples) {
        const samplePath = path.join(__dirname, '..', sample);
        const jsCode = fs.readFileSync(samplePath, 'utf-8');

        console.log(`测试样本: ${sample}`);
        console.log(`代码长度: ${jsCode.length} 字符`);

        const startTime = Date.now();

        // 反混淆
        const deobfuscatedCode = deobfuscate(jsCode);
        const deobTime = Date.now() - startTime;

        // 解析AST
        const ast = parse(deobfuscatedCode, { sourceType: 'script' });

        // 提取数据
        const xIsHuman = await extractBotIDxIsHuman(ast);

        const totalSampleTime = Date.now() - startTime;
        totalTime += totalSampleTime;

        results.push({
            sample,
            deobTime,
            totalTime: totalSampleTime,
            success: !!xIsHuman
        });

        console.log(`  ├─ 反混淆: ${deobTime}ms`);
        console.log(`  ├─ 总耗时: ${totalSampleTime}ms`);
        console.log(`  └─ 结果: ${xIsHuman ? '✅ 成功' : '❌ 失败'}\n`);
    }

    console.log('='.repeat(60));
    console.log('测试汇总');
    console.log('='.repeat(60));
    console.log(`测试样本数: ${samples.length}`);
    console.log(`成功数: ${results.filter(r => r.success).length}`);
    console.log(`失败数: ${results.filter(r => !r.success).length}`);
    console.log(`总耗时: ${totalTime}ms`);
    console.log(`平均耗时: ${(totalTime / samples.length).toFixed(2)}ms`);
    console.log(`最快: ${Math.min(...results.map(r => r.totalTime))}ms`);
    console.log(`最慢: ${Math.max(...results.map(r => r.totalTime))}ms`);

    console.log('\n=== 详细结果 ===');
    results.forEach((r, i) => {
        console.log(`${i + 1}. ${r.sample}`);
        console.log(`   反混淆: ${r.deobTime}ms | 总计: ${r.totalTime}ms | ${r.success ? '✅' : '❌'}`);
    });

    console.log('\n=== 优化效果 ===');
    console.log('优化前平均耗时: ~180ms');
    console.log(`优化后平均耗时: ${(totalTime / samples.length).toFixed(2)}ms`);
    const improvement = ((180 - totalTime / samples.length) / 180 * 100).toFixed(1);
    console.log(`性能提升: ${improvement}%`);
}

main().catch(error => {
    console.error('测试出错:', error);
    process.exit(1);
});