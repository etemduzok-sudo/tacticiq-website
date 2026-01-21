#!/usr/bin/env node

/**
 * Cleanup Unused Imports and Dead Code
 * TacticIQ - Code Quality Tool
 * 
 * This script helps identify:
 * - Unused imports
 * - Unused variables
 * - Dead code
 * - Commented out code blocks
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const SCAN_DIRS = [
  'src/components',
  'src/screens',
  'src/services',
  'src/utils',
  'src/hooks',
];

// File extensions to check
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to detect
const PATTERNS = {
  unusedImport: /import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/g,
  commentedCode: /\/\*[\s\S]*?\*\/|\/\/.+$/gm,
  consoleLog: /console\.(log|debug|info|warn)/g,
  debugger: /debugger;?/g,
  todoComment: /\/\/\s*TODO:/gi,
  fixmeComment: /\/\/\s*FIXME:/gi,
};

// Statistics
const stats = {
  filesScanned: 0,
  totalLines: 0,
  commentedLines: 0,
  consoleLogs: 0,
  debuggers: 0,
  todos: 0,
  fixmes: 0,
};

// Issues found
const issues = [];

/**
 * Scan a file for issues
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  stats.filesScanned++;
  stats.totalLines += lines.length;
  
  // Check for commented code
  const commentedMatches = content.match(PATTERNS.commentedCode);
  if (commentedMatches) {
    stats.commentedLines += commentedMatches.length;
    issues.push({
      file: filePath,
      type: 'commented-code',
      count: commentedMatches.length,
      message: `${commentedMatches.length} commented code blocks found`,
    });
  }
  
  // Check for console.log
  const consoleMatches = content.match(PATTERNS.consoleLog);
  if (consoleMatches) {
    stats.consoleLogs += consoleMatches.length;
    issues.push({
      file: filePath,
      type: 'console-log',
      count: consoleMatches.length,
      message: `${consoleMatches.length} console.log statements found`,
    });
  }
  
  // Check for debugger
  const debuggerMatches = content.match(PATTERNS.debugger);
  if (debuggerMatches) {
    stats.debuggers += debuggerMatches.length;
    issues.push({
      file: filePath,
      type: 'debugger',
      count: debuggerMatches.length,
      message: `${debuggerMatches.length} debugger statements found`,
    });
  }
  
  // Check for TODOs
  const todoMatches = content.match(PATTERNS.todoComment);
  if (todoMatches) {
    stats.todos += todoMatches.length;
  }
  
  // Check for FIXMEs
  const fixmeMatches = content.match(PATTERNS.fixmeComment);
  if (fixmeMatches) {
    stats.fixmes += fixmeMatches.length;
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTENSIONS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  CODE CLEANUP REPORT                           ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ Files Scanned: ${stats.filesScanned.toString().padEnd(46)} ║`);
  console.log(`║ Total Lines: ${stats.totalLines.toString().padEnd(48)} ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║ ISSUES FOUND:                                                  ║');
  console.log(`║ • Commented Code Blocks: ${stats.commentedLines.toString().padEnd(33)} ║`);
  console.log(`║ • Console.log Statements: ${stats.consoleLogs.toString().padEnd(32)} ║`);
  console.log(`║ • Debugger Statements: ${stats.debuggers.toString().padEnd(35)} ║`);
  console.log(`║ • TODO Comments: ${stats.todos.toString().padEnd(41)} ║`);
  console.log(`║ • FIXME Comments: ${stats.fixmes.toString().padEnd(40)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  if (issues.length > 0) {
    console.log('📋 DETAILED ISSUES:\n');
    
    // Group by type
    const grouped = {};
    issues.forEach(issue => {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    });
    
    Object.entries(grouped).forEach(([type, items]) => {
      console.log(`\n🔍 ${type.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`   ${item.file}`);
        console.log(`   → ${item.message}\n`);
      });
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  if (stats.consoleLogs > 0) {
    console.log('   • Remove console.log statements before production');
    console.log('   • Use proper logging service instead\n');
  }
  
  if (stats.debuggers > 0) {
    console.log('   • Remove debugger statements');
    console.log('   • Use breakpoints in IDE instead\n');
  }
  
  if (stats.commentedLines > 10) {
    console.log('   • Remove commented code blocks');
    console.log('   • Use version control (git) instead\n');
  }
  
  if (stats.todos > 5) {
    console.log('   • Address TODO comments');
    console.log('   • Create GitHub issues for tracking\n');
  }
  
  // Score
  const score = calculateScore();
  console.log(`\n📊 CODE QUALITY SCORE: ${score}/100\n`);
  
  if (score >= 90) {
    console.log('✅ Excellent! Your code is very clean.\n');
  } else if (score >= 70) {
    console.log('⚠️  Good, but could be improved.\n');
  } else {
    console.log('❌ Needs cleanup before production.\n');
  }
}

/**
 * Calculate quality score
 */
function calculateScore() {
  let score = 100;
  
  // Deduct points for issues
  score -= Math.min(stats.consoleLogs * 2, 20);
  score -= Math.min(stats.debuggers * 5, 20);
  score -= Math.min(stats.commentedLines * 1, 20);
  score -= Math.min(stats.todos * 0.5, 10);
  score -= Math.min(stats.fixmes * 1, 10);
  
  return Math.max(0, Math.round(score));
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning codebase for issues...\n');
  
  SCAN_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    }
  });
  
  generateReport();
}

// Run
main();
