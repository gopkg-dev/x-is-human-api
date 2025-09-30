/**
 * 测试API是否能正确处理test.js
 */

const fs = require('fs');
const path = require('path');
const { deobfuscate } = require('../dist/src/deobfuscator/index');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { webcrypto } = require('crypto');

const crypto = webcrypto;

// 读取混淆源文件
const testJsPath = path.join(__dirname, '混淆源文件.js');
const testJs = fs.readFileSync(testJsPath, 'utf8');

console.log('=== 开始处理 test.js ===\n');

// 1. 反混淆
console.log('1. 反混淆中...');
const deobfuscatedCode = deobfuscate(testJs);
console.log('✅ 反混淆完成\n');

// 2. 解析AST
console.log('2. 解析AST...');
const ast = parse(deobfuscatedCode, {
  sourceType: 'script',
  plugins: []
});
console.log('✅ AST解析完成\n');

// 3. 提取数据
console.log('3. 提取数据...');

const targetValues = {
  specificNumber: null,
  jwtToken: null,
  objectPropertyS: null,
  passwordVariables: null,
};

const stringAssignments = new Map();
const variableConcatenations = [];

traverse(ast, {
  CallExpression(path) {
    const callee = path.node.callee;
    const args = path.node.arguments;

    // 查找名为X的函数调用
    if (callee.type === "Identifier" && callee.name === "X" && args.length === 5) {
      if (args[2].type === "NumericLiteral") {
        targetValues.specificNumber = args[2].value;
        console.log(`✅ 找到X函数调用中的数字: ${args[2].value}`);
      }

      if (args[3].type === "StringLiteral" && args[3].value.startsWith("eyJ")) {
        targetValues.jwtToken = args[3].value;
        console.log(`✅ 找到X函数调用中的JWT Token: ${args[3].value.substring(0, 50)}...`);
      }
    }
  },

  ObjectProperty(path) {
    if (path.node.key && path.node.value) {
      let keyName = "";
      if (path.node.key.type === "StringLiteral") {
        keyName = path.node.key.value;
      } else if (path.node.key.type === "Identifier") {
        keyName = path.node.key.name;
      }

      if (keyName === "S" && path.node.value.type === "NumericLiteral") {
        const value = path.node.value.value;
        targetValues.objectPropertyS = { key: keyName, value: value };
        console.log(`✅ 找到对象属性 'S': ${value}`);
      }
    }
  },

  AssignmentExpression(path) {
    if (
      path.node.left.type === "Identifier" &&
      path.node.right.type === "StringLiteral"
    ) {
      const varName = path.node.left.name;
      const varValue = path.node.right.value;

      if (varValue && varValue.trim() !== "") {
        stringAssignments.set(varName, varValue);
        console.log(`🔍 发现字符串赋值: ${varName} = "${varValue}"`);
      }
    }
  },

  BinaryExpression(path) {
    if (
      path.node.operator === "+" &&
      path.node.left.type === "Identifier" &&
      path.node.right.type === "Identifier"
    ) {
      const leftVar = path.node.left.name;
      const rightVar = path.node.right.name;
      variableConcatenations.push({ left: leftVar, right: rightVar });
      console.log(`🔗 发现变量连接: ${leftVar} + ${rightVar}`);
    }
  },
});

console.log("\n=== 分析变量连接模式 ===");
for (const concat of variableConcatenations) {
  const leftValue = stringAssignments.get(concat.left);
  const rightValue = stringAssignments.get(concat.right);

  if (leftValue && rightValue) {
    console.log(`✅ 找到密码变量对: ${concat.left}="${leftValue}" + ${concat.right}="${rightValue}"`);
    const password = leftValue + rightValue;

    targetValues.passwordVariables = {
      var1: leftValue,
      var2: rightValue,
      password: password
    };
    break;
  }
}

// 验证结果
console.log("\n=== 提取结果验证 ===");
console.log("特定数字:", targetValues.specificNumber);
console.log("JWT Token:", targetValues.jwtToken ? `找到 (${targetValues.jwtToken.substring(0, 50)}...)` : "未找到");
console.log("对象属性S:", targetValues.objectPropertyS);
console.log("密码变量:", targetValues.passwordVariables);

if (!targetValues.specificNumber) {
  console.error("\n❌ 错误: 特定数字未找到");
  process.exit(1);
}

if (!targetValues.jwtToken) {
  console.error("\n❌ 错误: JWT Token未找到");
  process.exit(1);
}

if (!targetValues.objectPropertyS) {
  console.error("\n❌ 错误: 对象属性S未找到");
  process.exit(1);
}

if (!targetValues.passwordVariables) {
  console.error("\n❌ 错误: 密码变量对未找到");
  process.exit(1);
}

console.log("\n✅ 所有数据提取成功!");

// 4. 测试加密
async function encryptData(password, data) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 0x186a0,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 0x100,
    },
    false,
    ["encrypt"]
  );

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    derivedKey,
    new TextEncoder().encode(JSON.stringify(data))
  );

  return btoa(
    String.fromCharCode(...salt, ...iv, ...new Uint8Array(encryptedData))
  );
}

(async () => {
  console.log("\n=== 测试加密 ===");
  const j = {
    p: false,
    S: targetValues.objectPropertyS.value,
    w: {
      v: "Google Inc. (Apple)",
      r: "ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)",
    },
    s: false,
    h: false,
    b: false,
    d: false,
  };

  const password = targetValues.passwordVariables.password;
  console.log(`使用密码: ${password}`);

  const encryptedData = await encryptData(password, j);
  console.log(`✅ 加密成功 (长度: ${encryptedData.length})`);

  const result = {
    b: 0,
    v: targetValues.specificNumber,
    e: targetValues.jwtToken,
    s: encryptedData,
    d: 0,
    vr: "3",
  };

  console.log("\n=== 最终结果 ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n✅✅✅ test.js 测试通过! ✅✅✅");
})();