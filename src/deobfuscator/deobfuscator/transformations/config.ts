import { TransformationConfig } from './transformation';

export type TransformationKey =
    | 'objectSimplification'
    | 'objectPacking'
    | 'proxyFunctionInlining'
    | 'stringRevealing'
    | 'expressionSimplification'
    | 'constantPropagation'
    | 'reassignmentRemoval'
    | 'sequenceSplitting'
    | 'controlFlowRecovery'
    | 'deadBranchRemoval'
    | 'antiTamperRemoval'
    | 'unusedVariableRemoval'
    | 'propertySimplification';

export type Config = { [key in TransformationKey]: TransformationConfig } & {
    silent?: boolean;
};

export const defaultConfig: Config = {
    silent: true, // 性能优化：关闭所有日志输出
    objectSimplification: {
        isEnabled: true,
        unsafeReplace: true
    },
    objectPacking: {
        isEnabled: true
    },
    proxyFunctionInlining: {
        isEnabled: true
    },
    stringRevealing: {
        isEnabled: true
    },
    expressionSimplification: {
        isEnabled: true
    },
    constantPropagation: {
        isEnabled: true
    },
    reassignmentRemoval: {
        isEnabled: true // 需要保留，影响密码提取
    },
    sequenceSplitting: {
        isEnabled: true
    },
    controlFlowRecovery: {
        isEnabled: true
    },
    deadBranchRemoval: {
        isEnabled: false // 性能优化：非关键，禁用
    },
    antiTamperRemoval: {
        isEnabled: false // 性能优化：非关键，禁用
    },
    unusedVariableRemoval: {
        isEnabled: true // 需要保留，清理无用代码
    },
    propertySimplification: {
        isEnabled: true
    }
};
