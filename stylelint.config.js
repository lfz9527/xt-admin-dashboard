export default {
  // 从标准配置中继承规则
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-idiomatic-order',
  ],
  // 规则配置
  rules: {
    /* 禁止重复属性 */
    'declaration-block-no-duplicate-properties': true,
    /* 允许未知属性（兼容变量 / 新特性） */
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes'],
      },
    ],

    'selector-class-pattern': null,
  },
  // 忽略检查的文件或文件夹
  ignoreFiles: ['node_modules/**/*', 'dist/**/*'],
}
