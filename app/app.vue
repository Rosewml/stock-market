<script setup lang="ts">
const themes = [
  {
    id: 'samsung',
    name: '三星蓝色',
    description: 'mPOP 风格，蓝色资产卡片',
    brand: '삼성증권 mPOP',
    accent: '#0d4fe3',
    accentDark: '#063fc7',
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'],
    assetLabel: '총 자산',
    assetValue: '386,247,300',
    today: '오늘 +5,327,800원 (+1.40%)',
    badge: '자산분석',
    adColor: '#eaf2ff',
    adAccent: '#0757ff',
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'],
  },
  {
    id: 'green',
    name: 'N证券绿色',
    description: '绿色资产卡，清爽交易首页',
    brand: 'N 증권',
    accent: '#0ba45c',
    accentDark: '#087f47',
    nav: ['홈', '국내증시', '해외증시', '특징주', '뉴스', '투자정보'],
    assetLabel: '내 자산',
    assetValue: '358,672,150',
    today: '오늘 +2,874,350원 (+0.81%)',
    badge: '자산분석',
    adColor: '#eef8f2',
    adAccent: '#08a758',
    bottom: ['홈', '관심종목', '현재가', '주문', '자산', '더보기'],
  },
  {
    id: 'mirae',
    name: '未来橙色',
    description: 'Mirae Asset 风格，橙色资产卡片',
    brand: 'MIRAE ASSET',
    accent: '#f15a16',
    accentDark: '#e94600',
    nav: ['홈', '국내주식', '해외주식', '연금', '상품', '자산 · 뱅킹'],
    assetLabel: '나의 자산',
    assetValue: '395,880,250',
    today: '오늘 +4,521,300원 (+1.15%)',
    badge: '자산분석',
    adColor: '#fff2e7',
    adAccent: '#f15a16',
    bottom: ['홈', '관심종목', '주식현재가', '주문', '자산', '전체메뉴'],
  },
]

const selectedTheme = ref(themes[0])

const presets = [
  { name: '삼성전자', code: '005930', stockId: 'KR_005930', status: '已匹配', enabled: true },
  { name: 'HD현대중공업', code: '329180', stockId: 'KR_329180', status: '已匹配', enabled: true },
  { name: 'POSCO홀딩스', code: '005490', stockId: 'KR_005490', status: '已匹配', enabled: true },
  { name: 'SK스퀘어', code: '402340', stockId: 'KR_402340', status: '待确认', enabled: false },
]

const holdings = [
  { name: '삼성전자', code: '005930', qty: '806', buy: '72,650', price: '88,400', profit: '+12,669,450', rate: '+21.65%', up: true },
  { name: '두산에너빌리티', code: '034020', qty: '1,247', buy: '19,870', price: '27,350', profit: '+9,321,560', rate: '+37.65%', up: true },
  { name: '한화에어로스페이스', code: '012450', qty: '91', buy: '268,750', price: '307,000', profit: '+3,481,750', rate: '+14.20%', up: true },
  { name: '카카오뱅크', code: '323410', qty: '527', buy: '22,850', price: '25,400', profit: '+1,345,950', rate: '+11.17%', up: true },
  { name: 'HMM', code: '011200', qty: '243', buy: '17,650', price: '20,600', profit: '+717,450', rate: '+16.71%', up: true },
  { name: 'ISC', code: '095340', qty: '48', buy: '74,800', price: '89,100', profit: '+686,400', rate: '+19.11%', up: true },
  { name: '리노공업', code: '058470', qty: '35', buy: '187,300', price: '206,500', profit: '+672,000', rate: '+10.27%', up: true },
  { name: '이수페타시스', code: '007660', qty: '142', buy: '34,950', price: '33,150', profit: '-255,600', rate: '-5.15%', up: false },
  { name: '한국전력', code: '015760', qty: '942', buy: '20,350', price: '19,720', profit: '-593,460', rate: '-3.09%', up: false },
]

const marketCards = [
  { name: 'KOSPI', value: '2,628.38', change: '▲ 12.04 (+0.46%)' },
  { name: 'KOSDAQ', value: '716.42', change: '▲ 4.25 (+0.60%)' },
]
</script>

<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />

    <header class="window-bar">
      <div class="window-title">股票市场</div>
      <div class="service-pill">
        <span />
        本地服务运行中
      </div>
      <div class="window-actions">
        <span>−</span>
        <span>□</span>
        <span>×</span>
      </div>
    </header>

    <main class="workspace">
      <section class="panel left-panel">
        <h1>股票管理</h1>

        <div class="card add-card">
          <h2>添加股票名称</h2>
          <div class="add-row">
            <input value="" placeholder="请输入网站上的完整股票名称">
            <button>添加股票</button>
          </div>
        </div>

        <div class="card preset-card">
          <h2>预设股票</h2>
          <table class="preset-table">
            <thead>
              <tr>
                <th>选择</th>
                <th>股票名称</th>
                <th>代码</th>
                <th>股票ID</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in presets" :key="stock.code">
                <td>
                  <span :class="['check-box', { checked: stock.enabled }]">{{ stock.enabled ? '✓' : '' }}</span>
                </td>
                <td class="stock-name">{{ stock.name }}</td>
                <td>{{ stock.code }}</td>
                <td>{{ stock.stockId }}</td>
                <td>
                  <span :class="['status', stock.status === '待确认' ? 'pending' : 'matched']">{{ stock.status }}</span>
                </td>
                <td class="actions">
                  <button>编辑</button>
                  <button class="danger">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="hint">ⓘ 名称必须与网站完全一致</p>
        </div>
      </section>

      <section class="panel preview-panel">
        <h1>手机界面预览</h1>

        <div class="phone-frame" :style="{ '--theme': selectedTheme.accent, '--theme-dark': selectedTheme.accentDark }">
          <div class="phone-screen">
            <div class="phone-content">
            <div class="phone-status">
              <strong>9:41</strong>
              <div class="status-icons">
                <span>▮▮▮</span>
                <span>⌁</span>
                <span class="battery" />
              </div>
            </div>

            <div class="broker-head">
              <div class="brand" :class="selectedTheme.id">{{ selectedTheme.brand }}</div>
              <div class="broker-tools">
                <span class="search-icon" />
                <span>검색</span>
                <span class="bell">♧<i>2</i></span>
                <span>☰</span>
              </div>
            </div>

            <nav class="phone-tabs">
              <span
                v-for="(item, index) in selectedTheme.nav"
                :key="item"
                :class="{ active: index === 0 }"
              >
                {{ item }}
              </span>
            </nav>

            <section class="asset-card">
              <div class="asset-top">
                <div>
                  <p>{{ selectedTheme.assetLabel }} <span>◉</span></p>
                  <strong>{{ selectedTheme.assetValue }}<small>원</small></strong>
                  <em>{{ selectedTheme.today }} 〉</em>
                </div>
                <button>{{ selectedTheme.badge }}</button>
              </div>
              <div class="asset-shortcuts">
                <span>ⓦ<b>입출금</b></span>
                <span>↗<b>투자정보</b></span>
                <span>▤<b>주문내역</b></span>
                <span>•••<b>더보기</b></span>
              </div>
            </section>

            <section class="market-strip">
              <article v-for="card in marketCards" :key="card.name">
                <div>
                  <p>{{ card.name }}</p>
                  <strong>{{ card.value }}</strong>
                  <em>{{ card.change }}</em>
                </div>
                <svg viewBox="0 0 130 58" aria-hidden="true">
                  <polyline points="4,44 18,28 30,34 41,22 56,25 68,18 78,13 88,20 98,8 110,17 124,12" />
                </svg>
              </article>
              <div class="dots">
                <span class="active" />
                <span />
                <span />
              </div>
            </section>

            <section class="holdings">
              <div class="holding-title">
                <h2>보유종목 (9)</h2>
                <button>평가금액순⌄</button>
                <span>⚙</span>
              </div>
              <div class="holding-head">
                <span>종목명</span>
                <span>보유수량</span>
                <span>매입가<br>(평균)</span>
                <span>현재가</span>
                <span>평가손익(원)</span>
                <span>수익률(%)</span>
              </div>
              <div class="holding-row" v-for="row in holdings" :key="row.code">
                <div>
                  <strong>{{ row.name }}</strong>
                  <small>{{ row.code }}</small>
                </div>
                <span>{{ row.qty }}</span>
                <span>{{ row.buy }}</span>
                <span>{{ row.price }}</span>
                <span :class="row.up ? 'up' : 'down'">{{ row.profit }}</span>
                <span :class="row.up ? 'up' : 'down'">{{ row.rate }}</span>
              </div>
              <button class="more-btn">더보기⌄</button>
            </section>

            <section class="promo" :style="{ background: selectedTheme.adColor }">
              <div>
                <p>해외주식 거래하고</p>
                <strong>최대 <span :style="{ color: selectedTheme.adAccent }">100달러</span> 받아가세요!</strong>
                <small>기간 : 2024.05.01 ~ 2024.06.30</small>
              </div>
              <div class="coupon" :style="{ color: selectedTheme.adAccent }">$100</div>
            </section>

            <nav class="bottom-nav">
              <span class="active">
                <i class="nav-n">N</i>
                홈
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.4l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8L12 3.4z" />
                </svg>
                관심종목
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 19h16M7 16V9m5 7V5m5 11v-4M6 10l6-5 5 4 3-3" />
                </svg>
                현재가
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 7h11M15 4l3 3-3 3M17 17H6m3-3-3 3 3 3" />
                </svg>
                주문
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 8V6.5C7 5.1 8.1 4 9.5 4h5C15.9 4 17 5.1 17 6.5V8M5 8h14v11H5zM5 12h14" />
                </svg>
                자산
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.7" />
                  <circle cx="12" cy="12" r="1.7" />
                  <circle cx="19" cy="12" r="1.7" />
                </svg>
                더보기
              </span>
            </nav>
            <div class="home-indicator" />
            </div>
          </div>
        </div>
      </section>

      <section class="panel right-panel">
        <h1>主题与下载</h1>

        <div class="card theme-card">
          <h2>主题选择</h2>
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-option"
            :class="{ selected: selectedTheme.id === theme.id }"
            @click="selectedTheme = theme"
          >
            <span class="theme-thumb" :style="{ '--thumb': theme.accent }">
              <i />
            </span>
            <span>
              <strong>{{ theme.name }}</strong>
              <em>{{ theme.description }}</em>
            </span>
            <b>{{ selectedTheme.id === theme.id ? '✓' : '' }}</b>
          </button>
        </div>

        <div class="card download-card">
          <h2>下载设置</h2>
          <div class="select-row">图片格式：<strong>PNG</strong><span>⌄</span></div>
        </div>

        <button class="download-btn">⇩ 下载图片</button>
        <p class="download-note">点击下载时使用当前最新数据生成图片</p>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  color: #0c1f18;
  background: #f8f7f3;
  font-family:
    "Microsoft YaHei",
    "PingFang SC",
    "Noto Sans CJK SC",
    "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input {
  font: inherit;
}

.app-shell {
  width: 100vw;
  min-height: 100dvh;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 50% 8%, rgba(11, 76, 49, 0.08), transparent 34rem),
    #fbfaf7;
}

.window-bar {
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 28px;
  color: #fff;
  background: linear-gradient(90deg, #01291d 0%, #004029 52%, #012f23 100%);
  box-shadow: 0 2px 16px rgba(2, 48, 31, 0.22);
}

.window-title {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.service-pill {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 28px;
  padding: 9px 18px;
  border: 1px solid rgba(38, 211, 101, 0.3);
  border-radius: 10px;
  color: #d5ffe0;
  background: rgba(1, 72, 45, 0.72);
  font-size: 16px;
}

.service-pill span {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #00d832;
  box-shadow: 0 0 18px rgba(0, 216, 50, 0.7);
}

.window-actions {
  display: flex;
  gap: 34px;
  align-items: center;
  margin-left: auto;
  font-size: 30px;
  line-height: 1;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(430px, 38.5%) minmax(430px, 31.5%) minmax(360px, 30%);
  gap: 18px;
  height: calc(100dvh - 70px);
  min-height: 0;
  padding: 18px;
}

.panel {
  min-height: 0;
  overflow: auto;
  padding: 24px 22px 20px;
  border: 1px solid rgba(217, 213, 205, 0.9);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 60px rgba(30, 42, 35, 0.08);
  scrollbar-width: thin;
}

.panel::-webkit-scrollbar {
  width: 6px;
}

.panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(0, 64, 41, 0.22);
}

.left-panel {
  display: flex;
  flex-direction: column;
}

h1 {
  margin: 0 0 22px;
  font-size: 29px;
  letter-spacing: -0.04em;
}

h2 {
  margin: 0;
  font-size: 19px;
}

.card {
  border: 1px solid #ddd8cf;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 18px 50px rgba(33, 29, 20, 0.04);
}

.add-card {
  flex: 0 0 auto;
  padding: 22px 16px 28px;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 12px;
  margin-top: 17px;
}

.add-row input {
  height: 56px;
  padding: 0 20px;
  border: 1px solid #d7d2ca;
  border-radius: 7px;
  color: #736f69;
  background: #fff;
  font-size: 16px;
}

.add-row button,
.download-btn {
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(180deg, #006342, #003f2d);
  font-weight: 800;
}

.preset-card {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 24px;
  padding: 22px 14px;
}

.preset-table {
  width: 100%;
  margin-top: 16px;
  border: 1px solid #e1ddd6;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.68);
}

.preset-table th,
.preset-table td {
  height: 84px;
  padding: 0 11px;
  border-bottom: 1px solid #ebe7df;
  text-align: left;
  white-space: nowrap;
}

.preset-table th {
  height: 58px;
  color: #1a261f;
  font-weight: 500;
}

.stock-name {
  color: #07100c;
  font-weight: 900;
}

.check-box {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid #6f7672;
  border-radius: 4px;
  color: #fff;
  font-size: 20px;
  font-weight: 900;
}

.check-box.checked {
  border-color: #00492f;
  background: #00492f;
}

.status {
  padding: 8px 12px;
  border-radius: 7px;
  font-weight: 800;
}

.status.matched {
  border: 1px solid #78c792;
  color: #16743b;
  background: #edf9f0;
}

.status.pending {
  border: 1px solid #ffa52e;
  color: #ed7c00;
  background: #fff9ed;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.actions button {
  min-width: 54px;
  height: 34px;
  border: 1px solid #9ea5a0;
  border-radius: 6px;
  color: #083823;
  background: #fff;
  font-weight: 700;
}

.actions .danger {
  border-color: #ff6b70;
  color: #ff202a;
}

.hint {
  margin: 18px 0 0;
  color: #6c6d68;
  font-size: 14px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding-bottom: 28px;
}

.preview-panel h1 {
  width: min(100%, 520px);
}

.phone-frame {
  width: min(390px, calc(100dvh * 0.42));
  height: min(790px, calc(100dvh - 170px));
  padding: 11px;
  border: 5px solid #101010;
  border-radius: 50px;
  background: #050505;
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.18),
    0 0 0 4px #393939 inset;
}

.phone-screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 36px;
  background: #fff;
}

.phone-screen::before {
  position: absolute;
  z-index: 3;
  top: 0;
  left: 50%;
  width: 132px;
  height: 27px;
  border-radius: 0 0 16px 16px;
  background: #050505;
  content: "";
  transform: translateX(-50%);
}

.phone-content {
  position: relative;
  height: 100%;
  padding-bottom: 52px;
}

.phone-status {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 22px;
  font-size: 10px;
}

.status-icons {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 8px;
}

.battery {
  width: 20px;
  height: 9px;
  border: 2px solid #111;
  border-radius: 3px;
}

.broker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 22px;
}

.brand {
  color: var(--theme);
  font-size: 17px;
  font-weight: 950;
  letter-spacing: -0.05em;
}

.brand.green {
  color: #111;
}

.brand.green::first-letter {
  color: var(--theme);
  font-size: 27px;
}

.brand.mirae {
  color: #0d3b69;
  font-size: 15px;
  font-style: italic;
}

.broker-tools {
  display: flex;
  gap: 6px;
  align-items: center;
  color: #101010;
  font-size: 10px;
}

.search-icon {
  width: 17px;
  height: 17px;
  border: 2px solid #111;
  border-radius: 50%;
}

.bell {
  position: relative;
  font-size: 15px;
}

.bell i {
  position: absolute;
  top: -7px;
  right: -8px;
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  color: #fff;
  background: #f21e2b;
  font-size: 7px;
  font-style: normal;
}

.phone-tabs {
  display: flex;
  justify-content: space-between;
  height: 30px;
  padding: 0 18px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 10px;
  font-weight: 800;
}

.phone-tabs span {
  display: flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.phone-tabs .active {
  color: var(--theme);
  border-color: var(--theme);
}

.asset-card {
  margin: 5px 11px 0;
  padding: 8px 12px 2px;
  border-radius: 8px;
  color: #fff;
  background:
    radial-gradient(circle at 22% 78%, rgba(255, 255, 255, 0.14), transparent 14rem),
    linear-gradient(135deg, var(--theme), var(--theme-dark));
}

.asset-top {
  display: flex;
  justify-content: space-between;
}

.asset-top p {
  margin: 0 0 3px;
  font-size: 9px;
  font-weight: 800;
}

.asset-top strong {
  display: block;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.03em;
}

.asset-top small {
  margin-left: 3px;
  font-size: 8px;
}

.asset-top em {
  display: block;
  margin-top: 3px;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
}

.asset-top button {
  align-self: flex-start;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  font-size: 7px;
  font-weight: 800;
}

.asset-shortcuts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 5px;
  padding: 3px 0 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  text-align: center;
}

.asset-shortcuts span {
  display: grid;
  gap: 3px;
  font-size: 15px;
}

.asset-shortcuts b {
  font-size: 6.5px;
}

.market-strip {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 5px 11px 0;
  padding: 9px 9px 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.market-strip article {
  display: flex;
  gap: 5px;
  justify-content: space-between;
  padding-right: 10px;
}

.market-strip article + article {
  padding-left: 12px;
  border-left: 1px solid #eeeeee;
}

.market-strip p {
  margin: 0 0 1px;
  font-size: 8px;
  font-weight: 800;
}

.market-strip strong,
.market-strip em {
  display: block;
  color: #f00d1f;
}

.market-strip strong {
  font-size: 15px;
}

.market-strip em {
  margin-top: 1px;
  font-size: 5.5px;
  font-style: normal;
}

.market-strip svg {
  width: 38px;
  align-self: end;
}

.market-strip polyline {
  fill: none;
  stroke: #f20c20;
  stroke-width: 4;
}

.dots {
  position: absolute;
  bottom: 4px;
  left: 50%;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}

.dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d9dce3;
}

.dots .active {
  background: var(--theme);
}

.holdings {
  margin: 7px 11px 0;
  padding-top: 3px;
  padding-bottom: 4px;
  border-radius: 8px;
  background: #fff;
}

.holding-title {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 6px;
  align-items: center;
  padding: 0 10px 4px;
}

.holding-title h2 {
  font-size: 13px;
}

.holding-title button {
  border: 0;
  border-radius: 999px;
  background: #f6f6f6;
  font-size: 8px;
  font-weight: 700;
}

.holding-head,
.holding-row {
  display: grid;
  grid-template-columns: 1.35fr 0.75fr 0.9fr 0.85fr 1.2fr 0.85fr;
  align-items: center;
  column-gap: 5px;
}

.holding-head {
  padding: 0 9px 4px;
  border-bottom: 1px solid #eeeeee;
  color: #333;
  font-size: 6.5px;
}

.holding-row {
  min-height: 23px;
  padding: 0 9px;
  border-bottom: 1px solid #f1f1f1;
  font-size: 7.5px;
}

.holding-row strong,
.holding-row small {
  display: block;
}

.holding-row strong {
  font-size: 7.5px;
}

.holding-row small {
  margin-top: 1px;
  font-size: 6px;
}

.up {
  color: #f00718;
}

.down {
  color: #0757dc;
}

.more-btn {
  display: block;
  margin: 2px auto 3px;
  border: 0;
  background: transparent;
  color: #555;
  font-size: 9px;
}

.promo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 11px 5px;
  padding: 6px 14px;
  border-radius: 7px;
}

.promo p,
.promo strong,
.promo small {
  display: block;
  margin: 0;
}

.promo p {
  font-size: 10px;
}

.promo strong {
  margin-top: 2px;
  font-size: 11px;
}

.promo small {
  margin-top: 3px;
  color: #555;
  font-size: 7px;
}

.coupon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 39px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  font-size: 18px;
  font-weight: 950;
  transform: rotate(-4deg);
}

.bottom-nav {
  position: absolute;
  right: 0;
  bottom: 9px;
  left: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  height: 41px;
  padding: 5px 8px 0;
  border-top: 1px solid #e9e9e9;
  text-align: center;
  background: #fff;
}

.bottom-nav span {
  display: grid;
  grid-template-rows: 17px 1fr;
  gap: 2px;
  place-items: center;
  color: #222;
  font-size: 7px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.bottom-nav svg {
  width: 15px;
  height: 15px;
  overflow: visible;
  fill: none;
  stroke: #1f1f1f;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.bottom-nav svg circle {
  fill: #1f1f1f;
  stroke: none;
}

.nav-n {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  color: #fff;
  background: #14b866;
  font-size: 8px;
  font-style: normal;
  font-weight: 950;
  line-height: 1;
}

.bottom-nav .active {
  color: #14b866;
  font-weight: 900;
}

.home-indicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 100px;
  height: 4px;
  border-radius: 999px;
  background: #000;
  transform: translateX(-50%);
}

.right-panel {
  display: flex;
  flex-direction: column;
  padding-left: 30px;
  padding-right: 30px;
}

.theme-card {
  padding: 15px;
}

.theme-option {
  position: relative;
  display: grid;
  grid-template-columns: 140px 1fr 24px;
  gap: 22px;
  align-items: center;
  width: 100%;
  min-height: 108px;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #ded9d1;
  border-radius: 8px;
  background: #fff;
  text-align: left;
}

.theme-option.selected {
  border: 2px solid #005339;
}

.theme-thumb {
  height: 70px;
  padding: 10px;
  border-radius: 5px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e2ded8;
}

.theme-thumb i {
  display: block;
  height: 26px;
  border-radius: 5px;
  background: var(--thumb);
  box-shadow: 0 34px 0 -12px rgba(0, 0, 0, 0.08);
}

.theme-option strong,
.theme-option em {
  display: block;
}

.theme-option strong {
  font-size: 22px;
}

.theme-option em {
  margin-top: 8px;
  color: #66615c;
  font-style: normal;
}

.theme-option b {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 1px solid #9a9a9a;
  border-radius: 50%;
  color: #fff;
  background: transparent;
}

.theme-option.selected b {
  border-color: #005339;
  background: #005339;
}

.download-card {
  margin-top: 22px;
  padding: 16px 18px;
}

.select-row {
  display: flex;
  align-items: center;
  height: 42px;
  margin-top: 12px;
  padding: 0 14px;
  border: 1px solid #ded9d1;
  border-radius: 6px;
  color: #5d5953;
  background: #fff;
}

.select-row strong {
  margin-left: 12px;
  color: #111;
}

.select-row span {
  margin-left: auto;
}

.download-btn {
  width: 100%;
  height: 56px;
  margin-top: 22px;
  font-size: 24px;
}

.download-note {
  margin: 14px 0 0;
  color: #7b7770;
  text-align: center;
}

@media (min-width: 1201px) and (max-height: 1000px) {
  .window-bar {
    height: 64px;
  }

  .workspace {
    height: calc(100dvh - 64px);
  }

  .panel {
    padding-top: 22px;
    padding-bottom: 14px;
  }

  h1 {
    margin-bottom: 18px;
    font-size: 27px;
  }

  .right-panel {
    padding-left: 30px;
    padding-right: 30px;
  }

  .theme-card {
    padding: 12px 15px;
  }

  .theme-option {
    min-height: 88px;
    margin-top: 12px;
    padding: 10px 14px;
  }

  .theme-thumb {
    height: 62px;
  }

  .download-card {
    margin-top: 16px;
    padding: 13px 18px;
  }

  .select-row {
    height: 38px;
    margin-top: 9px;
  }

  .download-btn {
    height: 50px;
    margin-top: 16px;
    font-size: 22px;
  }

  .download-note {
    margin-top: 10px;
  }

  .phone-frame {
    width: min(370px, calc(100dvh * 0.4));
    height: min(760px, calc(100dvh - 170px));
  }
}

@media (min-width: 1201px) and (max-height: 860px) {
  .window-bar {
    height: 58px;
  }

  .workspace {
    height: calc(100dvh - 58px);
  }

  .panel {
    padding-top: 18px;
    padding-bottom: 12px;
  }

  h1 {
    margin-bottom: 14px;
    font-size: 25px;
  }

  .add-card {
    padding: 18px 16px 22px;
  }

  .add-row {
    margin-top: 13px;
  }

  .add-row input {
    height: 48px;
  }

  .preset-card {
    margin-top: 18px;
    padding-top: 18px;
  }

  .preset-table th {
    height: 50px;
  }

  .preset-table td {
    height: 72px;
  }

  .theme-option {
    min-height: 78px;
  }

  .theme-thumb {
    height: 52px;
  }

  .theme-option strong {
    font-size: 20px;
  }

  .theme-option em {
    margin-top: 4px;
  }

  .phone-frame {
    width: min(350px, calc(100dvh * 0.38));
    height: min(700px, calc(100dvh - 178px));
    padding: 8px;
    border-width: 4px;
    border-radius: 42px;
  }

  .phone-screen {
    border-radius: 30px;
  }

  .phone-content {
    width: calc(100% / 0.8);
    height: calc(100% / 0.8);
    padding-bottom: 44px;
    transform: scale(0.8);
    transform-origin: top left;
  }

  .phone-screen::before {
    width: 104px;
    height: 22px;
    border-radius: 0 0 13px 13px;
  }

  .phone-status {
    height: 24px;
    padding: 0 18px;
    font-size: 8px;
  }

  .status-icons {
    gap: 4px;
    font-size: 6px;
  }

  .battery {
    width: 16px;
    height: 7px;
    border-width: 1px;
  }

  .broker-head {
    height: 30px;
    padding: 0 17px;
  }

  .brand {
    font-size: 13px;
  }

  .brand.green::first-letter {
    font-size: 20px;
  }

  .brand.mirae {
    font-size: 12px;
  }

  .broker-tools {
    gap: 4px;
    font-size: 7px;
  }

  .search-icon {
    width: 13px;
    height: 13px;
    border-width: 1px;
  }

  .bell {
    font-size: 11px;
  }

  .bell i {
    top: -6px;
    right: -7px;
    width: 12px;
    height: 12px;
    font-size: 5px;
  }

  .phone-tabs {
    height: 20px;
    padding: 0 13px;
    font-size: 6.5px;
  }

  .phone-tabs span {
    border-bottom-width: 1px;
  }

  .asset-card {
    margin: 3px 8px 0;
    padding: 6px 8px 2px;
    border-radius: 7px;
  }

  .asset-top p {
    margin-bottom: 1px;
    font-size: 5.5px;
  }

  .asset-top strong {
    font-size: 16px;
  }

  .asset-top small {
    font-size: 5px;
  }

  .asset-top em {
    margin-top: 1px;
    font-size: 5.5px;
  }

  .asset-top button {
    padding: 2px 5px;
    font-size: 4px;
  }

  .asset-shortcuts {
    margin-top: 3px;
    padding: 2px 0 3px;
  }

  .asset-shortcuts span {
    gap: 1px;
    font-size: 9px;
  }

  .asset-shortcuts b {
    font-size: 3.5px;
  }

  .market-strip {
    margin: 5px 8px 0;
    padding: 7px 7px 11px;
    border-radius: 7px;
  }

  .market-strip article {
    gap: 3px;
    padding-right: 6px;
  }

  .market-strip article + article {
    padding-left: 7px;
  }

  .market-strip p {
    margin-bottom: 1px;
    font-size: 4.5px;
  }

  .market-strip strong {
    font-size: 10px;
  }

  .market-strip em {
    margin-top: 0;
    font-size: 3px;
  }

  .market-strip svg {
    width: 24px;
  }

  .dots {
    bottom: 4px;
    gap: 4px;
  }

  .dots span {
    width: 5px;
    height: 5px;
  }

  .holdings {
    margin: 4px 8px 0;
    padding-top: 2px;
    padding-bottom: 4px;
  }

  .holding-title {
    gap: 4px;
    padding: 0 7px 2px;
  }

  .holding-title h2 {
    font-size: 8px;
  }

  .holding-title button {
    font-size: 5px;
  }

  .holding-head,
  .holding-row {
    grid-template-columns: 1.28fr 0.65fr 0.78fr 0.76fr 1.04fr 0.74fr;
    column-gap: 3px;
  }

  .holding-head {
    padding: 0 6px 2px;
    font-size: 4px;
    line-height: 1.08;
  }

  .holding-row {
    min-height: 13px;
    padding: 0 6px;
    font-size: 4.2px;
  }

  .holding-row strong {
    font-size: 4.4px;
    line-height: 1;
  }

  .holding-row small {
    margin-top: 0;
    font-size: 3.6px;
    line-height: 1;
  }

  .more-btn {
    margin: 1px auto 2px;
    font-size: 5px;
  }

  .promo {
    margin: 0 8px 5px;
    padding: 4px 9px;
    border-radius: 6px;
  }

  .promo p {
    font-size: 5.5px;
  }

  .promo strong {
    margin-top: 1px;
    font-size: 6.5px;
  }

  .promo small {
    margin-top: 1px;
    font-size: 4px;
  }

  .coupon {
    width: 48px;
    height: 26px;
    border-radius: 7px;
    font-size: 11px;
  }

  .bottom-nav {
    height: 29px;
    padding: 3px 6px 0;
  }

  .bottom-nav span {
    grid-template-rows: 11px 1fr;
    gap: 1px;
    font-size: 4.8px;
    line-height: 1;
    white-space: nowrap;
  }

  .bottom-nav svg {
    width: 10px;
    height: 10px;
    stroke-width: 1.8;
  }

  .nav-n {
    width: 10px;
    height: 10px;
    font-size: 5.5px;
  }

  .home-indicator {
    bottom: 3px;
    width: 76px;
    height: 3px;
  }
}

@media (max-width: 1200px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .workspace {
    grid-template-columns: 1fr;
    height: auto;
    min-height: calc(100vh - 70px);
  }

  .panel {
    overflow: visible;
    padding-bottom: 48px;
  }

  .panel + .panel {
    border-top: 0;
  }

  .preview-panel h1 {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .window-bar {
    height: auto;
    flex-wrap: wrap;
    gap: 12px;
    padding: 18px;
  }

  .window-actions {
    display: none;
  }

  .panel {
    padding: 20px 14px;
  }

  .add-row,
  .theme-option {
    grid-template-columns: 1fr;
  }

  .preset-card {
    overflow-x: auto;
  }

  .phone-frame {
    width: min(100%, 350px);
    height: 720px;
    transform-origin: top center;
  }
}
</style>
