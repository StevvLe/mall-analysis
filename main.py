"""
门店商品经营AI分析助手 - FastAPI后端
根据门店经营数据调用AI生成商品经营管理优化方案
"""

import os
import json
import httpx
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# ==================== 配置区（请根据实际情况修改） ====================
# AI API配置 - 支持OpenAI兼容接口
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
AI_API_KEY = os.getenv("AI_API_KEY", "")  # 请设置环境变量或在代码中填入
AI_MODEL = os.getenv("AI_MODEL", "doubao-1-5-pro-256k-250115")
# =====================================================================

app = FastAPI(title="门店商品经营AI分析助手")
BASE_DIR = Path(__file__).resolve().parent

# 挂载静态文件和模板
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")


class StoreData(BaseModel):
    """门店经营数据模型"""
    # SKU结构
    total_sku: str = ""
    shoe_sku_ratio: str = ""
    clothing_sku_ratio: str = ""
    accessory_sku_ratio: str = ""
    new_sku_ratio: str = ""
    stagnant_sku_ratio: str = ""
    联名_limit_sustainable_ratio: str = ""
    
    # 进销存表现
    sales_amount_ratio: str = ""
    sales_volume_ratio: str = ""
    overall_moving_rate: str = ""
    inventory_turnover_days: str = ""
    stagnant_inventory_ratio: str = ""
    core_sellout_rate: str = ""
    purchase_sales_match: str = ""
    
    # 品类结构
    category_contribution: str = ""
    price_band_distribution: str = ""
    bestseller_longtail_ratio: str = ""
    
    # 可选补充
    member_repurchase: str = ""
    scenario_sales: str = ""
    competitor_analysis: str = ""


SYSTEM_PROMPT = """你是实体零售商品运营专家，深度掌握「易物+悦人」双轨共生的零售经营逻辑，擅长基于门店经营数据输出可落地、可量化的商品经营管理优化方案。

请根据以下门店经营数据，从「易物提销·商品价值重构」与「悦人增黏·情绪价值赋能」两大核心维度，出具完整的门店商品经营管理建议：

【门店经营数据输入】

1. SKU结构：
{sku_section}

2. 进销存表现：
{sales_section}

3. 品类结构：
{category_section}

4. 可选补充：
{optional_section}

【输出规则】

1. 易物提销维度：围绕商品流通效率与价值循环，针对性输出商品结构优化、动销提速、库存周转改善、社交货币化商品（联名/限量/环保款）打造、闲置价值激活（以旧换新/旧物改造）、商品场景化延伸等方向的具体动作，匹配对应品类数据给出调整比例与执行路径；

2. 悦人增黏维度：围绕情绪价值与圈层运营，输出适配社交/兴趣/仪式三大场景的商品组合方案、文化/IP联名款运营策略、社群活动配套商品规划、体验型商品（定制/手作类）落地建议，结合门店客群特征给出可执行的商品运营动作；

3. 末尾输出3条优先级最高的落地动作及对应预期经营效果，确保方案贴合门店实际、可快速执行验证。

请用专业且易于执行的语言输出，结构清晰，每个建议都要具体可量化。"""


def build_prompt(data: StoreData) -> str:
    """根据用户输入构建完整提示词"""
    
    sku_section = f"""- 总SKU量：{data.total_sku or '未填写'}
- 鞋/服/配各品类SKU占比：{data.shoe_sku_ratio or '未填写'} / {data.clothing_sku_ratio or '未填写'} / {data.accessory_sku_ratio or '未填写'}
- 新品/滞销品SKU占比：{data.new_sku_ratio or '未填写'} / {data.stagnant_sku_ratio or '未填写'}
- 联名/限量/可持续类话题性SKU占比：{data.联名_limit_sustainable_ratio or '未填写'}"""

    sales_section = f"""- 各品类销售额/销量占比：{data.sales_amount_ratio or '未填写'}
- 整体动销率：{data.overall_moving_rate or '未填写'}
- 分品类库存周转天数：{data.inventory_turnover_days or '未填写'}
- 滞销款库存占比：{data.stagnant_inventory_ratio or '未填写'}
- 核心款售罄率：{data.core_sellout_rate or '未填写'}
- 进销匹配度：{data.purchase_sales_match or '未填写'}"""

    category_section = f"""- 鞋服配销售贡献占比：{data.category_contribution or '未填写'}
- 价格带分布：{data.price_band_distribution or '未填写'}
- 爆款/长尾款销售占比：{data.bestseller_longtail_ratio or '未填写'}"""

    optional_parts = []
    if data.member_repurchase:
        optional_parts.append(f"- 会员复购品类偏好：{data.member_repurchase}")
    if data.scenario_sales:
        optional_parts.append(f"- 场景化商品销售数据：{data.scenario_sales}")
    if data.competitor_analysis:
        optional_parts.append(f"- 周边竞品商品结构：{data.competitor_analysis}")
    
    optional_section = "\n".join(optional_parts) if optional_parts else "无补充数据"

    return SYSTEM_PROMPT.format(
        sku_section=sku_section,
        sales_section=sales_section,
        category_section=category_section,
        optional_section=optional_section
    )


@app.get("/")
async def index(request: Request):
    """首页 - 数据输入表单"""
    return templates.TemplateResponse(request, "index.html")


@app.get("/healthz")
async def healthz():
    """健康检查接口"""
    return {"ok": True}


@app.post("/api/analyze")
async def analyze(data: StoreData):
    """分析接口 - 流式返回AI分析结果"""
    
    if not AI_API_KEY:
        return JSONResponse(
            status_code=400, 
            content={"error": "未配置AI API Key，请在环境变量中设置 AI_API_KEY 或修改 main.py 中的配置"}
        )
    
    prompt = build_prompt(data)
    
    async def generate():
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    f"{AI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {AI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": AI_MODEL,
                        "messages": [
                            {"role": "system", "content": "你是一个专业的实体零售商品运营专家。"},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": True,
                        "temperature": 0.7,
                        "max_tokens": 8000
                    }
                )
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0]["delta"]
                            if "content" in delta:
                                content = delta["content"]
                                yield f"data: {json.dumps({'content': content})}\n\n"
                        except (json.JSONDecodeError, KeyError):
                            continue
                            
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/analyze-sync")
async def analyze_sync(data: StoreData):
    """分析接口 - 同步返回AI分析结果"""
    
    if not AI_API_KEY:
        return JSONResponse(
            status_code=400, 
            content={"error": "未配置AI API Key，请在环境变量中设置 AI_API_KEY 或修改 main.py 中的配置"}
        )
    
    prompt = build_prompt(data)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{AI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {AI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": AI_MODEL,
                "messages": [
                    {"role": "system", "content": "你是一个专业的实体零售商品运营专家。"},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "temperature": 0.7,
                "max_tokens": 8000
            }
        )
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        return {"content": content}


@app.get("/api/config")
async def get_config():
    """获取前端配置（隐藏API Key）"""
    return {
        "base_url": AI_BASE_URL,
        "model": AI_MODEL,
        "has_api_key": bool(AI_API_KEY)
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("门店商品经营AI分析助手")
    print("=" * 60)
    print(f"访问地址: http://127.0.0.1:8080")
    print(f"API配置: {AI_BASE_URL}")
    print(f"模型: {AI_MODEL}")
    if not AI_API_KEY:
        print("\n⚠️ 警告: 未配置AI_API_KEY，请在环境变量中设置或修改main.py")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8080)
