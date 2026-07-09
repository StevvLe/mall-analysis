@echo off
chcp 65001 >nul
title 门店商品经营AI分析助手
echo ==========================================
echo    门店商品经营AI分析助手 - 启动程序
echo ==========================================
echo.

:: 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查依赖
echo [1/3] 检查依赖...
if not exist "venv" (
    echo        正在创建虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境并安装依赖
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络连接
    pause
    exit /b 1
)

echo [2/3] 依赖检查完成
echo.

:: 检查API Key配置
echo [3/3] 检查AI配置...
if "%AI_API_KEY%"=="" (
    echo        未检测到环境变量 AI_API_KEY
    echo        启动后请在网页中点击 [配置API] 按钮填写API Key
) else (
    echo        已检测到环境变量 AI_API_KEY，配置完成
)

echo.
echo ==========================================
echo    启动成功！正在打开浏览器...
echo    访问地址: http://127.0.0.1:8080
echo ==========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

:: 启动服务并打开浏览器
timeout /t 2 >nul
start http://127.0.0.1:8080
python main.py

pause
