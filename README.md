# X-is-Human API

> 反混淆和反爬虫分析API服务 - 白帽安全研究工具

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://github.com/users/karen/packages/container/package/x-is-human-api)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker Image CI/CD](https://github.com/gopkg-dev/x-is-human-api/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/gopkg-dev/x-is-human-api/actions/workflows/docker-publish.yml)

## 📖 项目简介

这是一个用于处理混淆JavaScript代码并提取特定验证数据（x-is-human）的API服务。该项目属于**白帽安全研究**,用于分析和理解反爬虫机制,以便构建更好的防御系统。

### 核心功能

- 🔓 **多轮反混淆**: 采用50轮迭代转换架构,支持13种转换类型
- 🎯 **智能提取**: 自动识别和提取x-is-human验证对象
- 🔐 **加密处理**: 集成PBKDF2 + AES-GCM加密算法
- 🚀 **REST API**: 简洁高效的HTTP接口

## 🚀 快速开始

### 使用Docker运行 (推荐)

```bash
# 拉取镜像
docker pull ghcr.io/karen/x-is-human-api:latest

# 运行容器
docker run -d -p 3000:3000 --name x-is-human-api ghcr.io/karen/x-is-human-api:latest
```

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式 (热重载)
npm run dev

# 构建项目
npm run build

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动

## 📡 API接口

### 主接口: 处理混淆代码

**端点**: `POST /api/process`

**⚠️ 重要说明**: 目标网站的JavaScript混淆代码是**动态生成**的,每次请求可能不同。本API需要你从目标网站实时获取最新的混淆JS代码作为输入。混淆代码通常包含时间戳、随机数等动态元素,因此无法使用固定样本。

**请求体**:

```json
{
  "jsCode": "从目标网站实时获取的混淆JavaScript代码字符串"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "b": 0,
    "v": 123456,
    "e": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "s": "base64加密数据",
    "d": 0,
    "vr": "3"
  }
}
```

### 健康检查

**端点**: `GET /health`

**响应**:

```json
{
  "status": "ok",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### cURL示例

```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "jsCode": "你的混淆JavaScript代码"
  }'
```

## 🏗️ 架构设计

```bash
混淆JS代码
  ↓
反混淆器 (50轮迭代)
  ├─ 字符串解密
  ├─ 控制流恢复
  ├─ 对象简化
  ├─ 代理函数内联
  └─ 变量优化
  ↓
AST解析 (Babel)
  ↓
数据提取器
  ├─ 函数调用模式识别
  ├─ 对象属性提取
  └─ 变量连接分析
  ↓
加密处理 (PBKDF2 + AES-GCM)
  ↓
x-is-human对象
```

### 核心模块

- **入口层** (`src/index.ts`): Express应用和中间件配置
- **路由层** (`src/routes/process.ts`): API路由处理
- **提取器层** (`src/extractors/astExtractor.ts`): AST数据提取
- **工具层** (`src/utils/crypto.ts`): 加密算法实现
- **反混淆器** (`src/deobfuscator/`): 多轮转换系统

## 🔧 配置说明

### 环境变量

- `PORT`: 服务端口 (默认: 3000)
- `NODE_ENV`: 运行环境 (development/production)

### 反混淆配置

所有转换可通过 `src/deobfuscator/deobfuscator/transformations/config.ts` 配置:

```typescript
const config = {
  silent: false,
  objectSimplification: { isEnabled: true, unsafeReplace: true },
  // ... 其他转换配置
}
```

## 🧪 测试

项目包含完整的测试套件:

```bash
# 基础测试
node tests/test.js

# API完整流程测试
node tests/test-api.js

# 反混淆测试
node tests/deobfuscated-test.js

# 调试工具
node tests/debug.js
```

## 🐋 Docker支持

### 构建镜像

```bash
docker build -t x-is-human-api .
```

### 自定义运行

```bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  --name x-is-human-api \
  x-is-human-api
```

## 📦 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.2+
- **Web框架**: Express 4.x
- **AST解析**: Babel 7.x
- **加密**: Node.js Crypto (PBKDF2, AES-GCM)

## ⚠️ 安全声明

**本项目仅用于防御性安全研究和教育目的。**

- ✅ 允许: 安全分析、漏洞研究、防御系统构建
- ❌ 禁止: 未授权访问、恶意攻击、非法用途

使用者需对自己的行为负责,作者不承担任何滥用责任。

## 💡 关键提示

### 动态混淆代码处理

目标反爬虫系统使用**动态混淆技术**,具有以下特点:

1. **时效性**: 混淆代码每次生成都包含时间戳,具有时效性
2. **随机性**: 代码结构中包含随机数、随机变量名等元素
3. **不可复用**: 同一份混淆代码通常只能使用一次或短时间内有效
4. **实时获取**: 必须从目标网站实时抓取最新的混淆JS代码

### 使用流程建议

```bash
1. 访问目标网站 → 2. 拦截/提取混淆JS → 3. 调用本API → 4. 获取验证数据 → 5. 使用验证数据
```

**注意**: 不要尝试缓存或重复使用旧的混淆代码,这会导致验证失败。

## 🤝 贡献指南

本项目采用模块化架构,扩展简单:

1. **添加新转换**: 继承 `Transformation` 类并实现 `execute()` 方法
2. **修改提取逻辑**: 在 `astExtractor.ts` 中调整traverse逻辑
3. **测试覆盖**: 在 `tests/` 目录添加对应测试

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关资源

- [Babel文档](https://babeljs.io/)
- [AST Explorer](https://astexplorer.net/)
- [反爬虫研究](https://github.com/topics/anti-bot)

---

**注意**: 如果你是安全研究者,欢迎交流防御技术;如果你想用于非法目的,请立即离开。
