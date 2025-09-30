# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个反混淆和反爬虫分析API服务，用于处理混淆的JavaScript代码并提取特定的验证数据（x-is-human）。该项目属于白帽安全研究，用于分析和理解反爬虫机制，以便构建更好的防御系统。

## 核心架构

项目采用模块化分层架构，职责清晰：

### 1. 入口层 (`src/index.ts`)

- Express应用初始化和中间件配置
- 路由注册
- 服务器启动（仅22行，保持简洁）

### 2. 路由层 (`src/routes/process.ts`)

- **主接口**: `POST /api/process` - 接收混淆的JS代码，返回x-is-human验证对象
- **健康检查**: `GET /health` - 服务状态检查
- **API文档**: `GET /` - 接口使用说明

### 3. 提取器层 (`src/extractors/astExtractor.ts`)

- **核心功能**: 从反混淆后的AST中提取关键数据
- **提取流程**:
  1. 遍历AST节点收集数据
  2. 识别函数调用模式（如`X(0,0,数字,JWT,'3')`）
  3. 提取对象属性（特别是`S`属性）
  4. 分析变量连接模式生成密码
  5. 构建加密载荷并返回x-is-human对象

### 4. 工具层 (`src/utils/crypto.ts`)

- **加密功能**: PBKDF2 + AES-GCM加密实现
- **参数**: 100,000次迭代，256位密钥，16字节盐值，12字节IV

### 5. 反混淆器系统 (`src/deobfuscator/`)

反混淆器采用**多轮迭代转换架构**，最多执行50轮，直到代码不再变化。

#### 核心类结构

- **`Deobfuscator`** (`deobfuscator/deobfuscator.ts`): 主控制器，管理转换流程
- **`Transformation`** (`transformations/transformation.ts`): 所有转换的抽象基类

#### 转换执行顺序（重要！）

转换按以下顺序执行，顺序会影响反混淆效果：

1. `UnusedVariableRemover` - 移除未使用变量
2. `ConstantPropagator` - 常量传播
3. `ReassignmentRemover` - 移除重复赋值
4. `DeadBranchRemover` - 移除死代码分支
5. `ObjectPacker` - 对象打包
6. `ProxyFunctionInliner` - 代理函数内联
7. `ExpressionSimplifier` - 表达式简化
8. `SequenceSplitter` - 序列表达式拆分
9. `ControlFlowRecoverer` - 控制流恢复
10. `PropertySimplifier` - 属性访问简化
11. `AntiTamperRemover` - 反篡改代码移除
12. `ObjectSimplifier` - 对象简化
13. `StringRevealer` - 字符串解密

#### 转换类型详解

- **字符串解密** (`strings/stringRevealer.ts`): 支持Base64、RC4、基础字符串数组等多种解密方式
- **控制流恢复** (`controlFlow/`): 恢复被平坦化的控制流结构
- **对象简化** (`objects/`): 处理对象混淆和代理对象
- **代理函数内联** (`proxyFunctions/`): 内联包装函数
- **变量优化** (`variables/`): 常量传播、移除无用变量和重复赋值

## 目录结构

```bash
src/
├── index.ts                    # 入口文件（简洁）
├── routes/
│   └── process.ts              # 路由处理
├── extractors/
│   └── astExtractor.ts         # AST数据提取
├── utils/
│   └── crypto.ts               # 加密工具
└── deobfuscator/               # 反混淆器系统
    ├── index.ts
    └── deobfuscator/
        ├── deobfuscator.ts     # 主控制器
        ├── helpers/            # 辅助函数
        └── transformations/    # 转换器集合
```

## 数据流

```bash
混淆JS代码
  → 反混淆(deobfuscator)
  → 解析AST(babel/parser)
  → 提取关键数据(astExtractor)
  → 加密(crypto)
  → x-is-human对象
```

## 开发命令

### 构建和运行

```bash
npm run build    # 编译TypeScript到dist/目录
npm run dev      # 开发模式（使用ts-node直接运行）
npm start        # 生产模式（运行编译后的JS）
```

### 测试

`tests/`目录下包含多个测试文件：

- `test.js` - 基础测试
- `test-api.js` - API完整流程测试
- `test-api-request.js` - API请求测试
- `test-complete.js` - 完整功能测试
- `debug.js` - 调试工具
- `analyze-deobfuscated.js` - 反混淆结果分析
- `deobfuscated-test.js` - 反混淆测试

使用`node tests/test-api.js`等命令直接运行测试。

## 配置系统

### 反混淆配置 (`src/deobfuscator/deobfuscator/transformations/config.ts`)

所有转换都可以通过`Config`对象启用/禁用：

```typescript
const config: Config = {
  silent: false,  // 是否静默模式
  objectSimplification: { isEnabled: true, unsafeReplace: true },
  // ... 其他转换配置
}
```

### 服务器配置

- 端口: `process.env.PORT || 3000`
- CORS: 已启用
- JSON限制: 10MB

## 关键注意事项

1. **转换顺序不可随意修改**: `Deobfuscator`中的`transformationTypes`数组顺序经过优化，改变顺序会影响反混淆效果

2. **最大迭代次数**: 设为50次，防止无限循环。大多数混淆代码在5-10轮内完成

3. **AST缓存清理**: 某些转换需要重建作用域树，通过`clearCache()`实现

4. **错误处理**: 每个转换都包含try-catch，单个转换失败不会中断整个流程

5. **安全性**: 这是防御性安全工具，仅用于分析混淆代码，不得用于恶意目的

## 扩展开发

### 添加新的转换

1. 在`transformations/`下创建新的转换类
2. 继承`Transformation`抽象类
3. 实现`execute(log: LogFunction): boolean`方法
4. 定义静态`properties`属性（包含`key`和`rebuildScopeTree`）
5. 在`config.ts`中添加配置项
6. 在`Deobfuscator`的`transformationTypes`数组中按合适顺序添加

### 修改提取逻辑

如果需要提取不同的数据模式，修改`extractBotIDxIsHuman`函数中的traverse逻辑。主要关注：

- `CallExpression`: 函数调用模式
- `ObjectProperty`: 对象属性
- `AssignmentExpression`: 变量赋值
- `BinaryExpression`: 二元操作（特别是字符串连接）

## API使用示例

```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"jsCode": "混淆的JavaScript代码"}'
```

响应格式：

```json
{
  "success": true,
  "data": {
    "b": 0,
    "v": 123456,
    "e": "eyJ...",
    "s": "base64加密数据",
    "d": 0,
    "vr": "3"
  }
}
```
