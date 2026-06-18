<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  BrainCircuit,
  Gauge,
  Moon,
  Search,
  Sun,
  Tag
} from 'lucide-vue-next';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const professors = ref([]);
const query = ref('');
const activeTag = ref('全部');
const theme = ref(localStorage.getItem('teacher-search-theme') || 'dark');
const isLoading = ref(true);
const errorMessage = ref('');

const examples = [
  '我想做自然語言處理、聊天機器人與中文文本生成',
  '資安、區塊鏈、密碼學與網路安全相關專題',
  '嵌入式系統、VLSI、物聯網與邊緣運算應用',
  '醫療影像辨識、深度學習、資料探勘與預測分析'
];

const synonymGroups = [
  ['ai', '人工智慧', 'ai', '機器學習', '深度學習', '類神經網路', '神經網路', '智慧代理人', '生成式人工智慧', '生成式ai', '聯邦式學習', '異常檢測', '推薦系統'],
  ['nlp', '自然語言處理', '自然口語處理', '語音辨識', '計算語言學', '文本', '文字探勘', '中文文本', '中文故事', '故事生成', '生成', '聊天機器人', '語言模型'],
  ['security', '資訊安全', '資安', '網路安全', '網安', '密碼學', '密碼分析', '電腦密碼學', '區塊鏈', '零信任', '取證', '信息取證', '藏密分析', '硬體安全', '物聯網安全', '行動商務安全', '電子商務安全', '惡意流量分析'],
  ['image', '影像處理', '影像辨識', '物件偵測', '電腦視覺', '醫療影像', '圖像', '數位影像', '人臉識別', '生物識別', '浮水印', '數位浮水印', '資訊隱藏', '圖像與信號處理', '信號處理'],
  ['iot', '物聯網', 'iot', '智慧聯網', '嵌入式系統', '車載網路', '車聯網', '人聯網', '感測網路', '無線感測網路', '無線隨意網路', '行動計算', '行動網路', '無線網路', '無線通訊', '邊緣運算', '微控制器'],
  ['cloud', '雲端計算', '雲端運算', '雲端服務', '雲端', 'devops', '服務導向運算', '分散式', '分散式系統', '平行分散式計算', '自我穩定系統'],
  ['software', '軟體工程', '軟體開發', '軟體系統開發', '設計樣式', '軟體架構', '軟體品質', '軟體品質驗證', '物件導向', '物件設計', '專案管理', '作業系統', '軟體整合', '軟體重用'],
  ['hardware', 'vlsi', '半導體', '晶片', '電子電路', '積體電路', '電磁相容', '電腦輔助設計', '高效能低功率', '多核心系統', '嵌入式周邊驅動'],
  ['data', '資料庫', '資料庫設計', '資料分析', '巨量資料', '大數據', '大數據分析', '資料科學', '資料探勘', '商務智慧', '可解釋人工智慧', '演算法', '計算機演算法'],
  ['statistics', '統計', '模糊統計', '統計建模', '機率統計', '機率論', '預測分析', '模擬理論', '系統思維', '機率'],
  ['bio-medical', '生物資訊', '結構生物資訊', '計算系統生物', '醫療資訊', '智慧醫療', '醫學影像', '青光眼預測', '腦機介面', '認知神經科學', '生心理量測'],
  ['graphics-vr', '電腦圖學', '圖學理論', '虛擬實境', 'vr', '擴增實境', 'ar', '延展實境', 'xr'],
  ['education', '教育資料科學', '資訊教育', '學習科技', '創新學習', '電腦輔助語言學習', '教育科技'],
  ['robotics-mobility', '機器人', '自駕車', '無人機', '行動應用', '行動應用設計'],
  ['business', '電子商務', '行動商務', '推薦系統', '群眾外包'],
  ['kansei', '感性工學', '感性工程', '感性設計', '感性分析', '情感運算', '使用者體驗', '人因工程']
];

const stopWords = new Set(['研究', '專題', '應用', '系統', '技術', '相關', '想做', '使用', '分析', '設計', '與', '和', '的']);
const weakConcepts = new Set(['資訊', '技術', '系統', '設計', '應用', '研究', '分析', '工程', '工學', '計算', '網路']);

const dictionary = computed(() => {
  const words = new Set();
  synonymGroups.flat().forEach((word) => words.add(word.toLowerCase()));
  professors.value.forEach((professor) => {
    tokenize(`${professor.name} ${professor.description}`, false).forEach((word) => words.add(word));
  });
  return [...words].filter((word) => word.length > 1).sort((a, b) => b.length - a.length);
});

const documents = computed(() =>
  professors.value.map((professor) => {
    const searchText = `${professor.name} ${professor.description}`;
    const tags = extractTags(professor.description);
    const tokens = buildSearchTokens(`${searchText} ${tags.join(' ')}`);
    return {
      ...professor,
      tags,
      tagSet: new Set(tags),
      tokens,
      tokenSet: new Set(tokens),
      fuzzyTokens: tokenize(searchText),
      normalizedText: normalizeSearchText(searchText),
      searchableTags: tags.flatMap((tag) => [tag, ...conceptFragments(tag)])
    };
  })
);

const idf = computed(() => {
  const scores = {};
  const total = Math.max(documents.value.length, 1);

  documents.value.forEach((document) => {
    new Set(document.tokens).forEach((token) => {
      scores[token] = (scores[token] || 0) + 1;
    });
  });

  Object.keys(scores).forEach((token) => {
    scores[token] = Math.log((total + 1) / (scores[token] + 1)) + 1;
  });

  return scores;
});

const queryTokens = computed(() => buildSearchTokens(query.value));
const selectedTokens = computed(() => new Set(queryTokens.value));

const tags = computed(() => {
  const counter = {};
  documents.value.forEach((document) => {
    document.tags.forEach((tag) => {
      counter[tag] = (counter[tag] || 0) + 1;
    });
  });
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([name, count]) => ({ name, count }));
});

const rankedProfessors = computed(() => {
  const queryTokenList = queryTokens.value;
  const queryTokenSet = selectedTokens.value;
  const queryVector = vectorize(queryTokenList);
  const hasQuery = queryTokenList.length > 0;

  return documents.value
    .map((professor) => {
      const professorVector = vectorize(professor.tokens);
      const cosine = hasQuery ? cosineSimilarity(queryVector, professorVector) : 0;
      const fuzzy = hasQuery ? fuzzyScore(query.value, professor) : 0;
      const coverage = hasQuery ? matchedCoverage(queryTokenList, professor.tokens, professor.tokenSet) : 0;
      const semantic = hasQuery ? semanticSimilarity(queryTokenList, professor.tokens) : 0;
      const tagBoost = hasQuery ? tagSimilarity(queryTokenList, professor.searchableTags) : 0;
      const rawScore = cosine * 0.36 + fuzzy * 0.16 + coverage * 0.2 + semantic * 0.16 + tagBoost * 0.12;
      const score = hasQuery ? Math.min(96, Math.round(rawScore * 100)) : 0;
      const matched = matchReasons(professor, queryTokenList, queryTokenSet);

      return {
        ...professor,
        score,
        cosine,
        matched
      };
    })
    .filter((professor) => activeTag.value === '全部' || professor.tags.includes(activeTag.value))
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length);
});

const visibleProfessors = computed(() => {
  if (!query.value.trim() && activeTag.value === '全部') {
    return rankedProfessors.value;
  }
  return rankedProfessors.value.filter((professor) => professor.score > 0 || activeTag.value !== '全部');
});

const topMatch = computed(() => visibleProfessors.value[0]);
const averageScore = computed(() => {
  if (!visibleProfessors.value.length) return 0;
  return Math.round(visibleProfessors.value.reduce((sum, professor) => sum + professor.score, 0) / visibleProfessors.value.length);
});

watch(theme, (value) => {
  document.documentElement.dataset.theme = value;
  localStorage.setItem('teacher-search-theme', value);
});

onMounted(async () => {
  document.documentElement.dataset.theme = theme.value;
  await fetchProfessors();
});

async function fetchProfessors() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch(`${API_BASE_URL}/professors`);
    const result = await response.json();
    if (!response.ok || result.message !== 'success') {
      throw new Error(result.error || 'API 回傳格式不正確');
    }
    professors.value = result.data;
  } catch (error) {
    errorMessage.value = `無法連線到後端 API：${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

function tokenize(text, useDictionary = true) {
  const source = normalizeSearchText(text);
  const terms = new Set();
  const latinWords = source.match(/[a-z0-9+#.]+/g) || [];
  latinWords.forEach((word) => {
    if (!stopWords.has(word)) terms.add(word);
  });

  if (useDictionary) {
    dictionary.value.forEach((word) => {
      if (source.includes(word) && !stopWords.has(word)) terms.add(word);
    });
  }

  source
    .replace(/[a-z0-9+#.]/g, ' ')
    .split(/[，。；、\s,./()（）]+/)
    .forEach((part) => {
      const word = part.trim();
      if (word.length > 1 && !stopWords.has(word)) terms.add(word);
    });

  return [...terms];
}

function buildSearchTokens(text) {
  const expanded = expandSynonyms(tokenize(text));
  const tokens = expanded.reduce((tokenSet, token) => {
    tokenSet.add(token);
    normalizeTerm(token)
      .split(/[，。；、\s,./()（）]+/)
      .filter(Boolean)
      .forEach((part) => tokenSet.add(part));
    conceptFragments(token).forEach((part) => tokenSet.add(part));
    return tokenSet;
  }, new Set());

  return [...tokens];
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/網安/g, '網路安全')
    .replace(/資安/g, '資訊安全')
    .replace(/雲端運算/g, '雲端計算')
    .replace(/大數據/g, '巨量資料')
    .replace(/生成式ai/g, '生成式人工智慧')
    .replace(/vr/g, '虛擬實境')
    .replace(/ar/g, '擴增實境')
    .replace(/xr/g, '延展實境')
    .replace(/iot/g, '物聯網');
}

function expandSynonyms(tokens) {
  const expanded = new Set(tokens);
  synonymGroups.forEach((group) => {
    if (group.some((word) => expanded.has(word.toLowerCase()))) {
      group.forEach((word) => expanded.add(word.toLowerCase()));
    }
  });
  return [...expanded];
}

function vectorize(tokens) {
  const counts = {};
  tokens.forEach((token) => {
    counts[token] = (counts[token] || 0) + 1;
  });

  const vector = {};
  Object.entries(counts).forEach(([token, count]) => {
    vector[token] = count * (idf.value[token] || 1);
  });
  return vector;
}

function cosineSimilarity(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let aMag = 0;
  let bMag = 0;

  keys.forEach((key) => {
    dot += (a[key] || 0) * (b[key] || 0);
    aMag += (a[key] || 0) ** 2;
    bMag += (b[key] || 0) ** 2;
  });

  if (!aMag || !bMag) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

function fuzzyScore(input, professor) {
  const normalized = professor.normalizedText || normalizeSearchText(`${professor.name} ${professor.description}`);
  const candidates = professor.fuzzyTokens || tokenize(normalized);
  const tokens = tokenize(input);
  if (!tokens.length) return 0;
  const hits = tokens.map((token) => {
    if (normalized.includes(token)) return 1;
    return bestTokenSimilarity(token, candidates);
  });
  return hits.reduce((sum, score) => sum + score, 0) / tokens.length;
}

function matchedCoverage(queryTokensList, professorTokens, professorTokenSet = new Set(professorTokens)) {
  if (!queryTokensList.length || !professorTokens.length) return 0;
  const hits = queryTokensList.filter((token) => professorTokenSet.has(token) || bestTokenSimilarity(token, professorTokens) >= 0.62).length;
  return hits / queryTokensList.length;
}

function semanticSimilarity(queryTokensList, professorTokens) {
  if (!queryTokensList.length || !professorTokens.length) return 0;
  const total = queryTokensList.reduce((sum, token) => sum + bestTokenSimilarity(token, professorTokens), 0);
  return total / queryTokensList.length;
}

function tagSimilarity(queryTokensList, searchableTags) {
  if (!queryTokensList.length || !searchableTags.length) return 0;
  return Math.max(...queryTokensList.map((token) => bestTokenSimilarity(token, searchableTags)), 0);
}

function matchReasons(professor, queryTokensList, queryTokenSet) {
  const candidates = [...professor.tags, ...professor.tokens];
  return candidates
    .filter((token) => !weakConcepts.has(token))
    .filter((token) => queryTokenSet.has(token) || bestTokenSimilarity(token, queryTokensList) >= 0.62)
    .filter((token, index, arr) => arr.indexOf(token) === index)
    .sort((a, b) => Number(professor.tagSet.has(b)) - Number(professor.tagSet.has(a)) || b.length - a.length)
    .slice(0, 8);
}

function bestTokenSimilarity(token, candidates) {
  if (!token || !candidates.length) return 0;
  return Math.max(...candidates.map((candidate) => tokenSimilarity(token, candidate)), 0);
}

function tokenSimilarity(a, b) {
  const left = normalizeTerm(a);
  const right = normalizeTerm(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }

  const charScore = overlapScore([...left], [...right]);
  const bigramScore = overlapScore(toNgrams(left, 2), toNgrams(right, 2));
  return Math.max(charScore, bigramScore);
}

function normalizeTerm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/工程/g, '工學')
    .replace(/網安/g, '網路安全')
    .replace(/資安/g, '資訊安全')
    .replace(/雲端運算/g, '雲端計算')
    .replace(/大數據/g, '巨量資料')
    .replace(/生成式ai/g, '生成式人工智慧')
    .replace(/vr/g, '虛擬實境')
    .replace(/ar/g, '擴增實境')
    .replace(/xr/g, '延展實境')
    .replace(/iot/g, '物聯網');
}

function conceptFragments(value) {
  const normalized = normalizeTerm(value);
  if (!/[\u4e00-\u9fff]/.test(normalized) || normalized.length < 3) return [];
  const fragments = new Set();
  [2, 3].forEach((size) => {
    toNgrams(normalized, size).forEach((part) => {
      if (part.length >= 2 && !stopWords.has(part) && !weakConcepts.has(part)) {
        fragments.add(part);
      }
    });
  });
  return [...fragments];
}

function toNgrams(value, size) {
  if (value.length <= size) return [value];
  return Array.from({ length: value.length - size + 1 }, (_, index) => value.slice(index, index + size));
}

function overlapScore(left, right) {
  if (!left.length || !right.length) return 0;
  const rightCounts = right.reduce((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
  const overlap = left.reduce((count, item) => {
    if (!rightCounts[item]) return count;
    rightCounts[item] -= 1;
    return count + 1;
  }, 0);
  return (overlap * 2) / (left.length + right.length);
}

// 修改自 tokenize 的標籤提取邏輯
function extractTags(text) {
  const candidates = tokenize(text)
    .filter((word) => word.length >= 2)
    .filter((word) => !weakConcepts.has(word));

  return candidates.slice(0, 5);
}

function useExample(example) {
  query.value = example;
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <main class="app-shell">
    <nav class="topbar" aria-label="主要導覽">
      <div class="brand">
        <span class="brand-mark"><BrainCircuit :size="22" /></span>
        <span>老師專長搜尋</span>
      </div>
      <div class="topbar-actions">
        <button class="icon-button" type="button" :aria-label="theme === 'dark' ? '切換淺色模式' : '切換深色模式'" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" :size="19" />
          <Moon v-else :size="19" />
        </button>
      </div>
    </nav>

    <section class="hero-section">
      <div class="hero-copy">
        <h1>用一段專題想法，找到最適合指導的老師。</h1>
        <p class="hero-text">
          支援關鍵字、同義詞、模糊比對與概念式搜尋，前端即時計算教授專長與使用者輸入的相似度排序。
        </p>
      </div>
    </section>

    <section class="search-panel" aria-label="智慧搜尋">
      <div class="query-card">
        <label for="query"><Search :size="18" /> 輸入專題概念或研究方向</label>
        <textarea id="query" v-model="query" rows="5" placeholder="例如：我想做自然語言處理、深度學習、醫療影像辨識..." />
        <div class="example-row">
          <button v-for="example in examples" :key="example" type="button" @click="useExample(example)">
            {{ example }}
          </button>
        </div>
      </div>

      <aside class="insight-panel">
        <div class="metric">
          <span>資料筆數</span>
          <strong>{{ professors.length }}</strong>
        </div>
        <div class="metric">
          <span>平均媒合分數</span>
          <strong>{{ averageScore }}</strong>
        </div>
        <div class="metric wide">
          <span>目前最佳媒合</span>
          <strong>{{ topMatch?.name || '等待搜尋' }}</strong>
        </div>
      </aside>
    </section>

    <section class="tag-section" aria-label="研究標籤篩選">
      <div class="section-title">
        <Tag :size="18" />
        <h2>研究領域標籤</h2>
      </div>
      <div class="tag-cloud">
        <button type="button" :class="{ active: activeTag === '全部' }" @click="activeTag = '全部'">全部</button>
        <button
          v-for="tag in tags"
          :key="tag.name"
          type="button"
          :class="{ active: activeTag === tag.name }"
          @click="activeTag = tag.name"
        >
          {{ tag.name }}
          <span>{{ tag.count }}</span>
        </button>
      </div>
    </section>

    <section class="content-grid">
      <div class="results-area">
        <div class="section-title">
          <Gauge :size="18" />
          <h2>媒合排序</h2>
        </div>

        <div v-if="isLoading" class="state-box">正在讀取教授資料...</div>
        <div v-else-if="errorMessage" class="state-box error">{{ errorMessage }}</div>
        <div v-else-if="!visibleProfessors.length" class="state-box">找不到符合條件的教授，請換一段描述試試。</div>

        <article v-for="professor in visibleProfessors" v-else :key="professor.id" class="professor-card">
          <div class="card-head">
            <div>
              <p class="rank">#{{ professor.id }}</p>
              <h3>{{ professor.name }}</h3>
            </div>
            <div class="score-ring" :style="{ '--score': professor.score }">
              <strong>{{ professor.score }}</strong>
              <span>match</span>
            </div>
          </div>
          <p class="description">{{ professor.description }}</p>
          <div class="match-row">
            <span v-for="token in professor.matched" :key="token">{{ token }}</span>
            <span v-if="!professor.matched.length">等待更多關鍵概念</span>
          </div>
        </article>
      </div>

      <aside class="trend-panel">
        <div class="section-title">
          <BrainCircuit :size="18" />
          <h2>系上熱門方向</h2>
        </div>
        <div class="trend-list">
          <div v-for="tag in tags.slice(0, 8)" :key="tag.name" class="trend-item">
            <div>
              <strong>{{ tag.name }}</strong>
              <span>{{ tag.count }} 位老師</span>
            </div>
            <meter min="0" :max="tags[0]?.count || 1" :value="tag.count" />
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

<style>
:root {
  color-scheme: dark;
  font-family: Inter, "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
  --bg: #10141d;
  --surface: rgba(22, 29, 43, 0.78);
  --surface-strong: #182131;
  --text: #eef5ff;
  --muted: #9fb0c9;
  --line: rgba(159, 176, 201, 0.2);
  --accent: #48d5ff;
  --accent-2: #87f7b5;
  --accent-3: #f2c66d;
  --danger: #ff7a90;
  --shadow: 0 22px 70px rgba(0, 0, 0, 0.28);
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f4f7fb;
  --surface: rgba(255, 255, 255, 0.84);
  --surface-strong: #ffffff;
  --text: #142033;
  --muted: #5f6f86;
  --line: rgba(58, 78, 109, 0.16);
  --accent: #006dbe;
  --accent-2: #16815a;
  --accent-3: #b46d00;
  --danger: #b42343;
  --shadow: 0 22px 60px rgba(44, 62, 92, 0.13);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 10%, rgba(72, 213, 255, 0.18), transparent 28rem),
    radial-gradient(circle at 78% 8%, rgba(135, 247, 181, 0.14), transparent 26rem),
    linear-gradient(140deg, var(--bg), color-mix(in srgb, var(--bg), #263858 26%));
}

button,
textarea,
a {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

.app-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 22px 0 48px;
}

.topbar,
.hero-section,
.search-panel,
.tag-section,
.professor-card,
.trend-panel,
.state-box {
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.topbar {
  position: sticky;
  top: 14px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 8px;
}

.brand,
.topbar-actions,
.ghost-button,
.system-strip,
.system-strip div,
.section-title,
label,
.eyebrow {
  display: flex;
  align-items: center;
}

.brand {
  gap: 10px;
  font-weight: 800;
  letter-spacing: 0;
}

.brand-mark,
.icon-button {
  display: grid;
  place-items: center;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  color: #09101d;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}

.topbar-actions {
  gap: 8px;
}

.ghost-button,
.icon-button,
.example-row button,
.tag-cloud button {
  border: 1px solid var(--line);
  color: var(--text);
  background: color-mix(in srgb, var(--surface-strong), transparent 12%);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.ghost-button:hover,
.icon-button:hover,
.example-row button:hover,
.tag-cloud button:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent), white 18%);
}

.ghost-button {
  gap: 8px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  text-decoration: none;
}

.icon-button {
  width: 38px;
  height: 38px;
  border-radius: 8px;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 28px;
  margin-top: 18px;
  padding: 42px;
  border-radius: 8px;
  overflow: hidden;
}

.eyebrow {
  gap: 8px;
  margin: 0 0 14px;
  color: var(--accent-2);
  font-size: 0.92rem;
  font-weight: 800;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  max-width: 860px;
  margin-bottom: 16px;
  font-size: clamp(2.15rem, 5vw, 5rem);
  line-height: 1.02;
  letter-spacing: 0;
}

.hero-text {
  max-width: 720px;
  margin-bottom: 0;
  color: var(--muted);
  font-size: 1.1rem;
  line-height: 1.8;
}

.system-strip {
  align-self: end;
  flex-direction: column;
  gap: 10px;
  min-width: 190px;
}

.system-strip div {
  width: 100%;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-strong), transparent 4%);
  color: var(--muted);
  font-weight: 700;
}

.search-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 22px;
  margin-top: 18px;
  padding: 22px;
  border-radius: 8px;
}

.query-card label {
  gap: 8px;
  margin-bottom: 12px;
  color: var(--accent);
  font-weight: 800;
}

textarea {
  width: 100%;
  min-height: 150px;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  color: var(--text);
  outline: none;
  background: color-mix(in srgb, var(--surface-strong), transparent 12%);
  line-height: 1.7;
}

textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent), transparent 78%);
}

.example-row,
.tag-cloud,
.match-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-row {
  margin-top: 12px;
}

.example-row button,
.tag-cloud button {
  border-radius: 8px;
  padding: 8px 11px;
  color: var(--muted);
}

.insight-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric {
  min-height: 104px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--surface-strong), transparent 8%), transparent);
}

.metric.wide {
  grid-column: 1 / -1;
}

.metric span,
.rank,
.score-ring span,
.trend-item span {
  color: var(--muted);
  font-size: 0.82rem;
}

.metric strong {
  display: block;
  margin-top: 10px;
  font-size: 1.85rem;
  line-height: 1.1;
}

.tag-section,
.trend-panel {
  margin-top: 18px;
  padding: 20px;
  border-radius: 8px;
}

.section-title {
  gap: 8px;
  margin-bottom: 14px;
}

.section-title h2 {
  margin: 0;
  font-size: 1.1rem;
}

.tag-cloud button.active {
  color: #07111f;
  border-color: transparent;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}

.tag-cloud span {
  margin-left: 6px;
  opacity: 0.72;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
  margin-top: 18px;
}

.results-area {
  display: grid;
  gap: 14px;
}

.professor-card {
  padding: 20px;
  border-radius: 8px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.rank {
  margin-bottom: 4px;
  font-weight: 800;
}

h3 {
  margin-bottom: 0;
  font-size: 1.45rem;
}

.description {
  margin: 16px 0;
  color: var(--muted);
  line-height: 1.75;
}

.score-ring {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background:
    linear-gradient(var(--surface-strong), var(--surface-strong)) padding-box,
    conic-gradient(var(--accent) calc(var(--score) * 1%), color-mix(in srgb, var(--line), transparent 12%) 0) border-box;
  border: 7px solid transparent;
  text-align: center;
}

.score-ring strong,
.score-ring span {
  grid-column: 1;
}

.score-ring strong {
  align-self: end;
  font-size: 1.35rem;
}

.score-ring span {
  align-self: start;
  font-size: 0.68rem;
}

.match-row span {
  padding: 7px 9px;
  border: 1px solid color-mix(in srgb, var(--accent-2), transparent 60%);
  border-radius: 8px;
  color: var(--accent-2);
  background: color-mix(in srgb, var(--accent-2), transparent 90%);
  font-size: 0.86rem;
}

.trend-panel {
  position: sticky;
  top: 90px;
}

.trend-list {
  display: grid;
  gap: 14px;
}

.trend-item {
  display: grid;
  gap: 8px;
}

.trend-item div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

meter {
  width: 100%;
  height: 10px;
}

meter::-webkit-meter-bar {
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--line), transparent 20%);
}

meter::-webkit-meter-optimum-value {
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
}

.state-box {
  padding: 24px;
  border-radius: 8px;
  color: var(--muted);
}

.state-box.error {
  color: var(--danger);
}

@media (max-width: 900px) {
  .hero-section,
  .search-panel,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .system-strip {
    align-self: stretch;
  }

  .trend-panel {
    position: static;
  }
}

@media (max-width: 620px) {
  .app-shell {
    width: min(100% - 20px, 1180px);
    padding-top: 10px;
  }

  .topbar,
  .topbar-actions,
  .card-head {
    align-items: stretch;
  }

  .topbar {
    position: static;
    flex-direction: column;
  }

  .topbar-actions,
  .ghost-button {
    width: 100%;
  }

  .ghost-button {
    justify-content: center;
  }

  .icon-button {
    width: 44px;
  }

  .hero-section {
    padding: 26px 18px;
  }

  .search-panel,
  .tag-section,
  .trend-panel,
  .professor-card {
    padding: 16px;
  }

  .insight-panel {
    grid-template-columns: 1fr;
  }

  .card-head {
    flex-direction: column;
  }
}
</style>
