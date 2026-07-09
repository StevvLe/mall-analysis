/**
 * 门店商品经营AI分析助手 - 前端脚本
 */

// ==================== 示例数据 ====================
const EXAMPLE_DATA = {
  totalSku: '1200',
  shoeSku: '35%',
  clothingSku: '50%',
  accessorySku: '15%',
  newSku: '30%',
  stagnantSku: '20%',
  联名Sku: '8%',
  salesAmountRatio: '鞋45% / 服40% / 配15%',
  movingRate: '65%',
  turnoverDays: '鞋45天 / 服60天 / 配90天',
  stagnantInvRatio: '25%',
  selloutRate: '78%',
  purchaseSalesMatch: '进销比1.2:1，基本匹配但鞋类备货偏紧',
  categoryContribution: '鞋50% / 服38% / 配12%',
  priceBand: '低价位(＜300)30% / 中价位(300-800)45% / 高价位(＞800)25%',
  bestsellerLongtail: '爆款TOP20贡献60% / 长尾SKU贡献40%',
  memberRepurchase: '会员复购鞋类占比最高42%，其次服装33%，配饰25%',
  scenarioSales: '运动场景35% / 通勤场景28% / 休闲场景22% / 社交场景15%',
  competitorAnalysis: '竞品A鞋类SKU占比50%，联名限量款较多；竞品B主打高性价比服装'
};

function fillExample() {
  Object.entries(EXAMPLE_DATA).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

function clearForm() {
  const inputs = document.querySelectorAll('#inputPage input[type="text"]');
  inputs.forEach(i => i.value = '');
}

function collectData() {
  return {
    total_sku: document.getElementById('totalSku').value,
    shoe_sku_ratio: document.getElementById('shoeSku').value,
    clothing_sku_ratio: document.getElementById('clothingSku').value,
    accessory_sku_ratio: document.getElementById('accessorySku').value,
    new_sku_ratio: document.getElementById('newSku').value,
    stagnant_sku_ratio: document.getElementById('stagnantSku').value,
    联名_limit_sustainable_ratio: document.getElementById('联名Sku').value,
    sales_amount_ratio: document.getElementById('salesAmountRatio').value,
    sales_volume_ratio: '',
    overall_moving_rate: document.getElementById('movingRate').value,
    inventory_turnover_days: document.getElementById('turnoverDays').value,
    stagnant_inventory_ratio: document.getElementById('stagnantInvRatio').value,
    core_sellout_rate: document.getElementById('selloutRate').value,
    purchase_sales_match: document.getElementById('purchaseSalesMatch').value,
    category_contribution: document.getElementById('categoryContribution').value,
    price_band_distribution: document.getElementById('priceBand').value,
    bestseller_longtail_ratio: document.getElementById('bestsellerLongtail').value,
    member_repurchase: document.getElementById('memberRepurchase').value,
    scenario_sales: document.getElementById('scenarioSales').value,
    competitor_analysis: document.getElementById('competitorAnalysis').value
  };
}

// ==================== Markdown 简易渲染 ====================
function simpleMarkdownToHtml(md) {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // 标题
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    // 粗体斜体
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 引用
    .replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // 无序列表
    .replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // 包裹列表
  html = html.replace(/(<li>.*?<\/li>)(\s*(?=<li>|$))/gs, '<ul>$1</ul>');
  // 清理多余ul嵌套
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  // 包裹段落
  if (!html.startsWith('<')) html = '<p>' + html;
  if (!html.endsWith('>')) html += '</p>';
  html = html.replace(/<p><(h|ul|blockquote|pre)/g, '<$1');
  html = html.replace(/<\/(h[1-6]|ul|blockquote|pre)><\/p>/g, '</$1>');

  return html;
}

// ==================== 报告分段解析 ====================
function splitReport(content) {
  const result = {
    intro: '',
    yiwu: '',
    yueren: '',
    action: ''
  };

  // 清理内容
  const lines = content.split('\n');
  let current = 'intro';

  const yiwuKeywords = ['易物提销', '商品价值重构', '商品结构优化', '动销提速', '库存周转',
    '社交货币化', '闲置价值', '商品场景化', '流通效率', '价值循环'];
  const yuerenKeywords = ['悦人增黏', '情绪价值', '情绪价值赋能', '社交场景', '兴趣场景',
    '仪式场景', '圈层运营', 'IP联名', '社群活动', '体验型商品', '定制', '手作'];
  const actionKeywords = ['优先级', '落地动作', '预期经营效果', '快速执行'];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (yiwuKeywords.some(k => lower.includes(k.toLowerCase())) &&
        !yuerenKeywords.some(k => lower.includes(k.toLowerCase()))) {
      current = 'yiwu';
    } else if (yuerenKeywords.some(k => lower.includes(k.toLowerCase())) &&
               !actionKeywords.some(k => lower.includes(k.toLowerCase()))) {
      current = 'yueren';
    } else if (actionKeywords.some(k => lower.includes(k.toLowerCase())) ||
               (lower.includes('3条') || lower.includes('三条')) && lower.includes('优先级')) {
      current = 'action';
    }

    result[current] += line + '\n';
  }

  // 如果分段不明显，尝试按标题分割
  if (result.yiwu.length < 50) {
    const sections = content.split(/(?=#{1,3}\s*(易物|悦人|优先|落地|行动))/i);
    if (sections.length >= 3) {
      result.intro = sections[0];
      result.yiwu = sections[1] || '';
      result.yueren = sections[2] || '';
      result.action = sections.slice(3).join('');
    }
  }

  // 兜底：如果某个分区为空，平均分配
  const totalLen = result.intro.length + result.yiwu.length + result.yueren.length + result.action.length;
  if (totalLen > 100 && (result.yiwu.length < 50 || result.yueren.length < 50)) {
    const parts = content.split(/\n\n+/).filter(p => p.trim().length > 20);
    const chunkSize = Math.ceil(parts.length / 3);
    result.intro = parts.slice(0, chunkSize).join('\n\n');
    result.yiwu = parts.slice(chunkSize, chunkSize * 2).join('\n\n');
    result.yueren = parts.slice(chunkSize * 2, chunkSize * 3).join('\n\n');
    result.action = parts.slice(chunkSize * 3).join('\n\n');
  }

  return result;
}

// ==================== 生成报告 ====================
let currentReportRaw = '';

async function generateReport() {
  const data = collectData();

  if (!data.total_sku || !data.sales_amount_ratio || !data.category_contribution) {
    alert('请至少填写「总SKU量」「销售额占比」「销售贡献占比」三个必填项');
    return;
  }

  // 显示loading
  const loading = document.getElementById('loadingOverlay');
  loading.classList.add('active');
  currentReportRaw = '';

  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text.replace(/\s+/g, ' ').slice(0, 300) || `请求失败（HTTP ${resp.status}）`);
    }

    document.getElementById('inputPage').classList.remove('active');
    document.getElementById('resultPage').classList.add('active');
    renderReport('正在生成报告，请稍候...');
    window.scrollTo(0, 0);

    await readStreamedReport(resp);

    if (!currentReportRaw.trim()) {
      throw new Error('AI没有返回报告内容，请稍后重试');
    }

    renderReport(currentReportRaw);

  } catch (err) {
    alert('生成报告失败：' + err.message);
    console.error(err);
  } finally {
    loading.classList.remove('active');
  }
}

async function readStreamedReport(resp) {
  if (!resp.body) {
    throw new Error('当前浏览器不支持流式读取响应');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const lines = event.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const payload = line.slice(6).trim();
        if (!payload) continue;

        let chunk;
        try {
          chunk = JSON.parse(payload);
        } catch (err) {
          continue;
        }

        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (chunk.content) {
          currentReportRaw += chunk.content;
          renderReport(currentReportRaw);
        }
      }
    }
  }
}

function renderReport(content) {
  // 先尝试智能分段
  const parts = splitReport(content);

  // 渲染各分区
  document.getElementById('reportIntroBody').innerHTML = simpleMarkdownToHtml(parts.intro || content.substring(0, 500));
  document.getElementById('reportYiWuBody').innerHTML = simpleMarkdownToHtml(parts.yiwu || content);
  document.getElementById('reportYueRenBody').innerHTML = simpleMarkdownToHtml(parts.yueren || '');
  document.getElementById('reportActionBody').innerHTML = simpleMarkdownToHtml(parts.action || '');

  // 为action区域添加特殊样式卡片
  const actionBody = document.getElementById('reportActionBody');
  if (parts.action) {
    // 尝试提取3条优先级动作做成卡片
    const actionHtml = actionBody.innerHTML;
    // 已经在markdown渲染中了
  }
}

// ==================== 页面导航 ====================
function goBack() {
  document.getElementById('resultPage').classList.remove('active');
  document.getElementById('inputPage').classList.add('active');
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // 更新侧边栏激活状态
    document.querySelectorAll('.toc-list li').forEach(li => li.classList.remove('active'));
    document.querySelector(`[data-target="${id}"]`).classList.add('active');
  }
}

function copyReport() {
  if (!currentReportRaw) return;
  navigator.clipboard.writeText(currentReportRaw).then(() => {
    alert('报告内容已复制到剪贴板！');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = currentReportRaw;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('报告内容已复制到剪贴板！');
  });
}

// ==================== 侧边栏滚动联动 ====================
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const sections = ['reportIntro', 'reportYiWu', 'reportYueRen', 'reportAction'];
    let current = sections[0];
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 150) current = id;
      }
    }
    document.querySelectorAll('.toc-list li').forEach(li => li.classList.remove('active'));
    const activeLi = document.querySelector(`[data-target="${current}"]`);
    if (activeLi) activeLi.classList.add('active');
  }, 100);
});
