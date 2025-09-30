import express from 'express';
import cors from 'cors';
import router from './routes/process';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '30kb' })); // 允许最大30KB请求体（jsCode最多20KB + 其他字段）

// 路由
app.use('/', router);
app.use('/api', router);

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 X-Is-Human API 启动成功!`);
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`📝 API接口: POST http://localhost:${PORT}/api/process`);
    console.log(`🏥 健康检查: GET http://localhost:${PORT}/health`);
});
