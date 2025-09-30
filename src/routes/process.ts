import { Router, Request, Response } from 'express';
import { parse } from '@babel/parser';
import { deobfuscate } from '../deobfuscator/index';
import { extractBotIDxIsHuman } from '../extractors/astExtractor';

const router = Router();

/**
 * POST /api/process - 处理JS代码并返回x-is-human
 */
router.post('/process', async (req: Request, res: Response) => {
    try {
        const { jsCode } = req.body;

        if (!jsCode) {
            return res.status(400).json({
                success: false,
                error: '请提供jsCode参数'
            });
        }

        // 检查jsCode大小（最大20KB）
        const jsCodeSize = Buffer.byteLength(jsCode, 'utf8');
        if (jsCodeSize > 20 * 1024) {
            return res.status(400).json({
                success: false,
                error: `jsCode超过大小限制，最大允许20KB，当前${(jsCodeSize / 1024).toFixed(2)}KB`
            });
        }

        // 1. 反混淆
        const deobfuscatedCode = deobfuscate(jsCode);

        // 2. 解析AST
        const ast = parse(deobfuscatedCode, {
            sourceType: 'script',
            plugins: []
        });

        // 3. 提取数据并生成x-is-human
        const xIsHuman = await extractBotIDxIsHuman(ast);

        res.json({
            success: true,
            data: xIsHuman
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /health - 健康检查
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'x-is-human-api',
        time: new Date().toISOString()
    });
});

export default router;
