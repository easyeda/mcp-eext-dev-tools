#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 获取项目根目录和 dist 目录的绝对路径
const projectRoot = path.resolve(__dirname, '..');
const distPath = path.join(projectRoot, 'dist', 'index.js');

// 生成 MCP 配置
const mcpConfig = {
  mcpServers: {
    'mcp-eext-dev-tools': {
      command: 'node',
      args: [distPath],
      env: {},
      disabled: false,
      autoApprove: ['dev_plugin', 'import_plugin', 'get_console_logs']
    }
  }
};

// 写入配置文件
const configPath = path.join(projectRoot, 'mcp-config.json');
fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2) + '\n');

console.log('✅ MCP 配置文件已生成:');
console.log(`   路径: ${configPath}`);
console.log(`   入口: ${distPath}`);
console.log('\n📋 配置内容:');
console.log(JSON.stringify(mcpConfig, null, 2));
console.log('\n💡 使用方法:');
console.log('   按照您所使用的AI Agent查看对应的MCP配置说明配置');
