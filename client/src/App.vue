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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
  ['ai', '人工智慧', '機器學習', '深度學習', '類神經網路', '智慧代理人', '資料探勘'],
  ['nlp', '自然語言處理', '文本', '文字探勘', '生成', '聊天機器人', '語言模型'],
  ['security', '資訊安全', '網路安全', '密碼學', '區塊鏈', '零信任', '資安', '取證'],
  ['image', '影像處理', '電腦視覺', '醫療影像', '圖像', '人臉識別', '浮水印'],
  ['iot', '物聯網', '智慧聯網', '嵌入式系統', '車載網路', '行動計算', '邊緣運算'],
  ['cloud', '雲端計算', 'DevOps', '分散式', '系統設計', '軟體工程'],
  ['hardware', 'VLSI', '半導體', '晶片', '電子電路', '積體電路'],
  ['data', '資料庫', '資料分析', '統計', '預測分析', '商務智慧', '資料科學']
];

const stopWords = new Set(['研究', '專題', '應用', '系統', '技術', '相關', '想做', '使用', '分析', '設計', '與', '和', '的']);

const dictionary = computed(() => {
  const words = new Set();
  synonymGroups.flat().forEach((word) => words.add(word.toLowerCase()));
  professors.value.forEach((professor) => {
    tokenize(`${professor.name} ${professor.description}`, false).forEach((word) => words.add(word));
  });
  return [...words].filter((word) => word.length > 1).sort((a, b) => b.length - a.length);
});

const documents = computed(() =>
  professors.value.map((professor) => ({
    ...professor,
    tokens: expandSynonyms(tokenize(`${professor.name} ${professor.description}`)),
    tags: extractTags(professor.description)
  }))
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

const queryTokens = computed(() => expandSynonyms(tokenize(query.value)));
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
  const queryVector = vectorize(queryTokens.value);
  const hasQuery = queryTokens.value.length > 0;

  return documents.value
    .map((professor) => {
      const professorVector = vectorize(professor.tokens);
      const cosine = hasQuery ? cosineSimilarity(queryVector, professorVector) : 0;
      const fuzzy = hasQuery ? fuzzyScore(query.value, professor) : 0;
      const coverage = hasQuery ? matchedCoverage(queryTokens.value, professor.tokens) : 0;
      const rawScore = cosine * 0.58 + fuzzy * 0.2 + coverage * 0.22;
      const score = hasQuery ? Math.min(96, Math.round(rawScore * 100)) : 0;
      const matched = professor.tokens
        .filter((token) => selectedTokens.value.has(token))
        .filter((token, index, arr) => arr.indexOf(token) === index)
        .slice(0, 8);

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
  const source = String(text || '').toLowerCase();
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
  const normalized = `${professor.name} ${professor.description}`.toLowerCase();
  const tokens = tokenize(input);
  if (!tokens.length) return 0;
  const hits = tokens.filter((token) => normalized.includes(token)).length;
  return hits / tokens.length;
}

function matchedCoverage(queryTokensList, professorTokens) {
  if (!queryTokensList.length || !professorTokens.length) return 0;
  const professorSet = new Set(professorTokens);
  const hits = queryTokensList.filter((token) => professorSet.has(token)).length;
  return hits / queryTokensList.length;
}

// 修改自 tokenize 的標籤提取邏輯
function extractTags(text) {
  const candidates = tokenize(text)
    .filter((word) => word.length >= 2)
    .filter((word) => !['資訊', '技術', '系統', '設計', '應用', '研究'].includes(word));

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
