/**
 * 测试API接口
 */

const fs = require('fs');
const path = require('path');

// 读取test.js
const testJsPath = path.join(__dirname, '..', 'botid-xxoo', 'test.js');
const jsCode = fs.readFileSync(testJsPath, 'utf8');

console.log('=== 测试 API 接口 ===\n');
console.log(`发送请求到: http://localhost:3000/api/process`);
console.log(`JS代码长度: ${jsCode.length}\n`);

fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsCode: jsCode
  })
})
.then(response => response.json())
.then(data => {
  console.log('=== API 响应 ===\n');
  console.log(JSON.stringify(data, null, 2));

  if (data.success) {
    console.log('\n✅✅✅ API 测试成功! ✅✅✅');
    console.log('\n返回的 x-is-human 对象:');
    console.log(JSON.stringify(data.data, null, 2));
  } else {
    console.log('\n❌ API 返回错误:', data.error);
    process.exit(1);
  }
})
.catch(error => {
  console.error('\n❌ 请求失败:', error.message);
  process.exit(1);
});