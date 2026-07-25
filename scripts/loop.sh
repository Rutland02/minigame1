#!/bin/bash
# 自动测试循环
# 用法: bash scripts/loop.sh [max_iterations]
#
# 前提：
#   1. 微信开发者工具已启动 (npm run dev)
#   2. 游戏已加载测试模块（启动参数 debug=1）

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT="$PROJECT_ROOT/test-report.json"
MAX_ITER=${1:-5}

cd "$PROJECT_ROOT"

echo "============================================"
echo "  微信小游戏自动测试循环"
echo "  最大迭代次数: $MAX_ITER"
echo "============================================"
echo ""

ITER=0
ALL_PASSED=false

while [ $ITER -lt $MAX_ITER ]; do
  ITER=$((ITER + 1))
  echo "============================================"
  echo "  迭代 $ITER / $MAX_ITER"
  echo "============================================"
  echo ""

  # 运行测试
  echo "[1/3] 运行测试..."
  if node scripts/test-runner.js 2>&1; then
    echo ""
    echo "[OK] 所有测试通过!"
    ALL_PASSED=true
    break
  fi

  # 读取报告
  echo ""
  echo "[2/3] 分析失败项..."
  if [ ! -f "$REPORT" ]; then
    echo "[!] 测试报告未生成，退出"
    exit 1
  fi

  # 提取失败测试
  FAILS=$(node -e "
    const r = JSON.parse(require('fs').readFileSync('$REPORT', 'utf8'));
    if (r.failed === 0) process.exit(0);
    console.log('失败测试 (' + r.failed + ' 项):');
    r.failedTests.forEach(t => {
      console.log('  - ' + t.name + ': ' + t.error);
    });
  ")

  if [ -z "$FAILS" ]; then
    echo "[OK] 无失败项"
    ALL_PASSED=true
    break
  fi

  echo "$FAILS"
  echo ""

  # 生成修复提示
  echo "[3/3] 生成修复提示..."
  echo ""
  echo "--------------------------------------------"
  echo "  需要修复的失败项:"
  echo "--------------------------------------------"
  echo "$FAILS"
  echo ""
  echo "--------------------------------------------"
  echo "  请将以下内容发给 Claude Code:"
  echo "--------------------------------------------"
  echo ""
  echo "测试报告路径: $REPORT"
  echo "请读取报告并修复所有失败的测试用例。"
  echo ""

  # 如果安装了 claude CLI，可以自动调用
  if command -v claude &> /dev/null; then
    echo "[自动] 检测到 Claude CLI，自动修复中..."
    claude --print "请读取 $REPORT，修复所有失败的测试用例。只修改必要的代码文件。" \
      --allowedTools Edit,Read,Grep,Glob,Bash 2>&1
    echo ""
    echo "[OK] 自动修复完成，继续下一轮测试..."
    echo ""
  else
    echo "[手动] 请手动修复后重新运行，或安装 Claude CLI 后使用自动模式"
    echo ""
    read -p "修复完成后按 Enter 继续测试 (输入 q 退出): " INPUT
    if [ "$INPUT" = "q" ]; then
      echo "退出测试循环"
      exit 0
    fi
  fi
done

echo ""
echo "============================================"
if [ "$ALL_PASSED" = true ]; then
  echo "  全部测试通过!"
else
  echo "  达到最大迭代次数 ($MAX_ITER)，仍有失败项"
fi
echo "============================================"

exit $( [ "$ALL_PASSED" = true ] && echo 0 || echo 1 )
