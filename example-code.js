// 示例代码文件 - 用于测试代码审查功能
const calculateSum = (a, b) => a + b;

const calculateProduct = (a, b) => a * b;

// 使用数组的高阶函数简化逻辑
const processArray = arr => arr
  .filter(item => item > 0)   // 只保留正数
  .map(item => item * 2);     // 每个正数翻倍

// 导出函数
module.exports = {
  calculateSum,
  calculateProduct,
  processArray
};