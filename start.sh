#!/bin/bash

echo "=========================================="
echo "   门店商品经营AI分析助手 - 启动程序"
echo "=========================================="
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未检测到Python3，请先安装Python 3.8+"
    echo "Mac: brew install python3"
    echo "Linux: sudo apt-get install python3 python3-venv"
    exit 1
fi

# 检查依赖
echo "[1/3] 检查依赖..."
if [ ! -d "venv" ]; then
    echo "       正在创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[错误] 依赖安装失败，请检查网络连接"
    exit 1
fi

echo "[2/3] 依赖检查完成"
echo ""

# 检查API Key配置
echo "[3/3] 检查AI配置..."
if [ -z "$AI_API_KEY" ]; then
    echo "       未检测到环境变量 AI_API_KEY"
    echo "       启动后请在网页中点击 [配置API] 按钮填写API Key"
else
    echo "       已检测到环境变量 AI_API_KEY，配置完成"
fi

echo ""
echo "=========================================="
echo "   启动成功！正在打开浏览器..."
echo "   访问地址: http://127.0.0.1:8080"
echo "=========================================="
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动服务并打开浏览器
sleep 2
if command -v open &> /dev/null; then
    open http://127.0.0.1:8080
elif command -v xdg-open &> /dev/null; then
    xdg-open http://127.0.0.1:8080
fi

python main.py
