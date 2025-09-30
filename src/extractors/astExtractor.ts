import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { encryptData } from '../utils/crypto';

/**
 * 目标值结构
 */
interface TargetValues {
    specificNumber: number | null;
    jwtToken: string | null;
    objectPropertyS: { key: string; value: number } | null;
    passwordVariables: {
        var1: string;
        var2: string;
        password: string;
    } | null;
}

/**
 * x-is-human响应结构
 */
export interface XIsHumanResponse {
    b: number;
    v: number;
    e: string;
    s: string;
    d: number;
    vr: string;
}

/**
 * 从AST中提取特定值并生成x-is-human对象
 */
export async function extractBotIDxIsHuman(ast: t.File): Promise<XIsHumanResponse> {
    const targetValues: TargetValues = {
        specificNumber: null,
        jwtToken: null,
        objectPropertyS: null,
        passwordVariables: null
    };

    // 收集所有字符串变量赋值
    const stringAssignments = new Map<string, string>();

    // 收集所有变量连接操作
    const variableConcatenations: Array<{ left: string; right: string }> = [];

    traverse(ast, {
        // 提取CallExpression - 查找X(0,0,数字,"JWT","3")格式
        CallExpression(path) {
            const callee = path.node.callee;
            const args = path.node.arguments;

            // 查找名为X的函数调用（反混淆后的结果）
            if (callee.type === 'Identifier' && callee.name === 'X' && args.length === 5) {
                // X(0, 0, 数字, JWT, '3')
                if (args[2].type === 'NumericLiteral') {
                    targetValues.specificNumber = args[2].value;
                    console.log(`✅ 找到X函数调用中的数字: ${args[2].value}`);
                }

                if (args[3].type === 'StringLiteral' && args[3].value.startsWith('eyJ')) {
                    targetValues.jwtToken = args[3].value;
                    console.log(`✅ 找到X函数调用中的JWT Token: ${args[3].value.substring(0, 50)}...`);
                }
            }

            // 备用：查找包含JWT token的其他函数调用
            for (let i = 0; i < args.length; i++) {
                const arg: any = args[i];
                if (
                    arg.type === 'StringLiteral' &&
                    arg.value.startsWith('eyJ') &&
                    arg.value.includes('.') &&
                    !targetValues.jwtToken
                ) {
                    targetValues.jwtToken = arg.value;
                    console.log(`✅ 找到JWT Token(备用): ${arg.value.substring(0, 50)}...`);

                    // 查找JWT前面的数字参数
                    if (i > 0 && args[i - 1] && !targetValues.specificNumber) {
                        const prevArg: any = args[i - 1];

                        if (prevArg.type === 'BinaryExpression' && prevArg.operator === '*') {
                            // 处理乘法表达式
                            if (prevArg.left.type === 'NumericLiteral' && prevArg.right.type === 'NumericLiteral') {
                                targetValues.specificNumber = prevArg.left.value * prevArg.right.value;
                                console.log(`✅ 找到JWT Token前的数字(计算): ${targetValues.specificNumber}`);
                            }
                        } else if (prevArg.type === 'NumericLiteral') {
                            targetValues.specificNumber = prevArg.value;
                            console.log(`✅ 找到JWT Token前的数字: ${prevArg.value}`);
                        }
                    }
                }
            }
        },

        // 提取对象属性
        ObjectProperty(path) {
            if (path.node.key && path.node.value) {
                let keyName = '';
                if (path.node.key.type === 'StringLiteral') {
                    keyName = path.node.key.value;
                } else if (path.node.key.type === 'Identifier') {
                    keyName = path.node.key.name;
                }

                // 检查是否是 'S' 属性
                if (keyName === 'S' && path.node.value.type === 'NumericLiteral') {
                    const value = path.node.value.value;
                    targetValues.objectPropertyS = { key: keyName, value: value };
                    console.log(`✅ 找到对象属性 '${keyName}': ${value}`);
                }
            }
        },

        // 提取赋值表达式 - 收集所有字符串赋值
        AssignmentExpression(path) {
            if (path.node.left.type === 'Identifier' && path.node.right.type === 'StringLiteral') {
                const varName = path.node.left.name;
                const varValue = path.node.right.value;

                // 只收集非空字符串赋值
                if (varValue && varValue.trim() !== '') {
                    stringAssignments.set(varName, varValue);
                    console.log(`🔍 发现字符串赋值: ${varName} = "${varValue}"`);
                }
            }
        },

        // 提取二元表达式 - 查找变量连接
        BinaryExpression(path) {
            if (
                path.node.operator === '+' &&
                path.node.left.type === 'Identifier' &&
                path.node.right.type === 'Identifier'
            ) {
                const leftVar = path.node.left.name;
                const rightVar = path.node.right.name;
                variableConcatenations.push({ left: leftVar, right: rightVar });
                console.log(`🔗 发现变量连接: ${leftVar} + ${rightVar}`);
            }
        }
    });

    // 根据变量连接找到密码变量
    console.log('\n=== 分析变量连接模式 ===');
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

    // 验证所有必需的值
    if (!targetValues.specificNumber) {
        throw new Error('特定数字未找到');
    }

    if (!targetValues.jwtToken) {
        throw new Error('JWT Token未找到');
    }

    if (!targetValues.objectPropertyS) {
        throw new Error('对象属性S未找到');
    }

    if (!targetValues.passwordVariables) {
        throw new Error('密码变量对未找到');
    }

    // 输出提取的结果
    console.log('\n=== 目标值提取结果 ===');
    console.log('特定数字:', targetValues.specificNumber);
    console.log('对象属性S:', targetValues.objectPropertyS);
    console.log('密码变量:', targetValues.passwordVariables);
    console.log('JWT Token:', targetValues.jwtToken ? '已找到' : '未找到');

    // 构建加密对象
    const encryptionPayload = {
        p: false, // Selenium/Puppeteer检测
        S: targetValues.objectPropertyS.value,
        w: {
            v: 'Google Inc. (Apple)',
            r: 'ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)'
        },
        s: false, // webdriver检测
        h: false, // headless检测
        b: false, // DevTools检测
        d: false // DevTools检测(窗口尺寸)
    };

    const password = targetValues.passwordVariables.password;
    console.log(`加密密码: ${password}`);

    // 加密数据
    const encryptedData = await encryptData(password, encryptionPayload);
    console.log('加密后的数据:', encryptedData);

    return {
        b: 0,
        v: targetValues.specificNumber,
        e: targetValues.jwtToken,
        s: encryptedData,
        d: 0,
        vr: '3'
    };
}
