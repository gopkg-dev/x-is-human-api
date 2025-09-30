import { webcrypto } from 'crypto';

const crypto = webcrypto as any;

/**
 * 加密函数 - 使用PBKDF2和AES-GCM加密数据
 * @param password 密码字符串
 * @param data 要加密的数据对象
 * @returns Base64编码的加密结果
 */
export async function encryptData(password: string, data: any): Promise<string> {
    // 生成随机盐值 (16字节)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // 生成随机初始化向量 (12字节)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 导入密码密钥
    const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
        'deriveBits',
        'deriveKey'
    ]);

    // 使用PBKDF2派生加密密钥
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 0x186a0, // 100,000次迭代
            hash: 'SHA-256'
        },
        passwordKey,
        {
            name: 'AES-GCM',
            length: 0x100 // 256位密钥长度
        },
        false,
        ['encrypt']
    );

    // 加密数据
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        derivedKey,
        new TextEncoder().encode(JSON.stringify(data))
    );

    // 返回Base64编码的结果 (盐值 + IV + 加密数据)
    return btoa(String.fromCharCode(...salt, ...iv, ...new Uint8Array(encryptedData)));
}
