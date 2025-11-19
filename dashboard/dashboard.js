let currentTab = "text";

function toggleMenu() {
  document.getElementById("navMenu").classList.toggle("active");
}

function switchTab(tab) {
  currentTab = tab;
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((t) => t.classList.remove("active"));
  contents.forEach((c) => c.classList.remove("active"));

  if (tab === "text") {
    tabs[0].classList.add("active");
    document.getElementById("text-tab").classList.add("active");
  } else {
    tabs[1].classList.add("active");
    document.getElementById("url-tab").classList.add("active");
  }
}

function drawScoreRing(score) {
  const canvas = document.getElementById("scoreCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Get actual size based on screen width
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;

  let size, radius, lineWidth;
  if (isSmallMobile) {
    size = 120;
    radius = 45;
    lineWidth = 12;
  } else if (isMobile) {
    size = 140;
    radius = 55;
    lineWidth = 14;
  } else {
    size = 180;
    radius = 70;
    lineWidth = 16;
  }

  // Set canvas size
  canvas.width = size;
  canvas.height = size;

  const centerX = size / 2;
  const centerY = size / 2;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#E8E8E8";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Score arc
  const startAngle = -0.5 * Math.PI;
  const endAngle = startAngle + (score / 100) * 2 * Math.PI;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);

  if (score >= 70) {
    ctx.strokeStyle = "#4CAF50";
  } else if (score >= 40) {
    ctx.strokeStyle = "#FFA500";
  } else {
    ctx.strokeStyle = "#F44336";
  }

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

/**
 * ==========================================
 * FUNGSI NORMALISASI - DISESUAIKAN DENGAN BACKEND
 * ==========================================
 * Mengubah response backend Flask ke format frontend
 */
function normalizeResult(backendResponse) {
  console.log("Raw backend response:", backendResponse);

  // Helper function untuk membersihkan teks
  function cleanText(text) {
    if (typeof text !== "string") return "";
    return text
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\"/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  // Helper function untuk memastikan array
  function ensureArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [];
  }

  // 1. Extract prediction
  let prediction = backendResponse.prediction || "UNKNOWN";
  prediction = cleanText(prediction).toUpperCase();

  // Normalize prediction labels
  if (prediction.includes("REAL") || prediction.includes("VALID")) {
    prediction = "ASLI";
  } else if (prediction.includes("FAKE") || prediction.includes("HOAX")) {
    prediction = "HOAKS";
  } else {
    prediction = "DIRAGUKAN";
  }

  // 2. Extract confidence dan convert ke percentage (0-100)
  let confidence =
    backendResponse.confidence || backendResponse.credibility_score || 0;

  // Jika confidence dalam format 0-1, convert ke 0-100
  if (confidence <= 1) {
    confidence = confidence * 100;
  }
  confidence = Math.round(confidence);

  // 3. Extract indicative_words (keywords)
  let keywords = ensureArray(backendResponse.indicative_words);
  keywords = keywords
    .map((word) => cleanText(word))
    .filter((word) => word.length > 0);

  // 4. Extract indicative_sentences
  let sentences = ensureArray(backendResponse.indicative_sentences);
  sentences = sentences
    .map((sentence) => cleanText(sentence))
    .filter((sentence) => sentence.length > 0);

  // 5. Extract related_sources
  let sources = ensureArray(backendResponse.related_sources);
  sources = sources.map((source) => {
    if (typeof source === "string") {
      return {
        title: "Sumber Terkait",
        snippet: cleanText(source),
        link: "",
      };
    }

    return {
      title: cleanText(source.title || source.name || "Sumber Terkait"),
      snippet: cleanText(
        source.snippet || source.description || source.summary || ""
      ),
      link: source.link || source.url || "",
    };
  });

  // 6. Extract insight
  let insight = cleanText(
    backendResponse.insight ||
      backendResponse.summary ||
      backendResponse.explanation ||
      "Analisis selesai. Pastikan untuk selalu melakukan cross-check dari berbagai sumber terpercaya sebelum menyebarkan informasi."
  );

  // 7. Extract additional metadata (jika ada dari mode URL)
  const url = backendResponse.url || "";
  const preview = cleanText(backendResponse.preview || "");
  const language = backendResponse.language || "id";

  // 8. Return normalized structure
  const normalized = {
    prediction: prediction,
    confidence: confidence,
    indicative_words: keywords,
    indicative_sentences: sentences,
    related_sources: sources,
    insight: insight,
    url: url,
    preview: preview,
    language: language,
  };

  console.log("Normalized result:", normalized);
  return normalized;
}

/**
 * ==========================================
 * FUNGSI ANALISIS - DISESUAIKAN DENGAN BACKEND
 * ==========================================
 */
async function analyzeContent() {
  const textInput = document.getElementById("text-input").value.trim();
  const urlInput = document.getElementById("url-input").value.trim();

  // Validasi input
  if (!textInput && !urlInput) {
    alert("Harap masukkan teks atau URL terlebih dahulu");
    return;
  }

  // Tentukan endpoint dan payload berdasarkan tab aktif
  let endpoint = "";
  let payload = {};

  if (currentTab === "url" && urlInput) {
    // Mode URL
    endpoint = "https://kodergpt-rupafakta.hf.space/predict_url";
    payload = { url: urlInput };
  } else if (currentTab === "text" && textInput) {
    // Mode Text
    endpoint = "https://kodergpt-rupafakta.hf.space/predict";
    payload = { text: textInput };
  } else {
    alert("Harap masukkan input sesuai tab yang aktif");
    return;
  }

  console.log("📤 Sending request to:", endpoint);
  console.log("📦 Payload:", payload);

  // UI loading state
  document.getElementById("placeholder").classList.add("hide");
  document.getElementById("loading").classList.add("show");
  document.getElementById("resultContainer").classList.remove("show");
  document.getElementById("analyzeBtn").disabled = true;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `HTTP error ${response.status}`
      );
    }

    const backendResult = await response.json();
    console.log("✅ Backend response:", backendResult);

    // Check for backend error
    if (backendResult.error) {
      throw new Error(backendResult.error);
    }

    // Normalisasi hasil
    const normalizedResult = normalizeResult(backendResult);

    // Hide loading, show result
    document.getElementById("loading").classList.remove("show");
    document.getElementById("resultContainer").classList.add("show");

    // Display results
    displayResults(normalizedResult);
  } catch (err) {
    console.error("❌ Error:", err);

    // Hide loading, show placeholder
    document.getElementById("loading").classList.remove("show");
    document.getElementById("placeholder").classList.remove("hide");

    // Show user-friendly error message
    let errorMessage = "Gagal memuat hasil analisis.\n\n";

    if (err.message.includes("HTTP error 400")) {
      errorMessage +=
        "Input tidak valid. Pastikan teks/URL yang Anda masukkan benar.";
    } else if (err.message.includes("HTTP error 500")) {
      errorMessage +=
        "Server mengalami error. Silakan coba lagi dalam beberapa saat.";
    } else if (err.message.includes("Failed to fetch")) {
      errorMessage +=
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
    } else if (err.message.includes("Could not extract")) {
      errorMessage +=
        "Tidak dapat mengekstrak konten dari URL tersebut. Website mungkin memblokir akses otomatis.\n\nSaran: Coba salin teks artikel secara manual ke tab Teks.";
    } else {
      errorMessage += "Detail: " + err.message;
    }

    errorMessage +=
      "\n\nPastikan:\n1. Space Hugging Face aktif\n2. Input sesuai format\n3. Koneksi internet stabil";

    alert(errorMessage);
  } finally {
    document.getElementById("analyzeBtn").disabled = false;
  }
}

/**
 * ==========================================
 * FUNGSI DISPLAY - DISESUAIKAN DENGAN STRUKTUR BARU
 * ==========================================
 */
function displayResults(data) {
  console.log("🎨 Displaying results:", data);

  // 1. Display Score
  const score = data.confidence;
  const isValid = score >= 70;

  document.getElementById("scoreValue").textContent = score + "%";
  const statusEl = document.getElementById("scoreStatus");

  // Set status berdasarkan prediction
  let statusText = "";
  let statusClass = "";

  if (data.prediction === "ASLI") {
    statusText = "Kemungkinan Valid";
    statusClass = "valid";
  } else if (data.prediction === "HOAKS") {
    statusText = "Potensi Hoaks Tinggi";
    statusClass = "hoax";
  } else {
    statusText = "Perlu Verifikasi Lebih Lanjut";
    statusClass = isValid ? "valid" : "hoax";
  }

  statusEl.textContent = statusText;
  statusEl.className = "score-status " + statusClass;

  // Draw score ring
  drawScoreRing(score);

  // 2. Display Indicative Words
  const keywordsContainer = document.getElementById("keywordsContainer");
  keywordsContainer.innerHTML = "";

  if (data.indicative_words && data.indicative_words.length > 0) {
    data.indicative_words.forEach((word) => {
      if (word && word.trim()) {
        const chip = document.createElement("div");
        chip.className = "keyword-chip";
        chip.textContent = word;
        keywordsContainer.appendChild(chip);
      }
    });
  }

  // Fallback jika tidak ada kata indikasi
  if (keywordsContainer.children.length === 0) {
    keywordsContainer.innerHTML =
      '<p style="color: #8DA9C4;">Tidak ada kata indikasi yang terdeteksi</p>';
  }

  // 3. Display Indicative Sentences
  const sentencesContainer = document.getElementById("sentencesContainer");
  sentencesContainer.innerHTML = "";

  if (data.indicative_sentences && data.indicative_sentences.length > 0) {
    data.indicative_sentences.forEach((sentence) => {
      if (sentence && sentence.trim()) {
        const item = document.createElement("div");
        item.className = "sentence-item";
        item.textContent = sentence;
        sentencesContainer.appendChild(item);
      }
    });
  }

  // Fallback jika tidak ada kalimat indikasi
  if (sentencesContainer.children.length === 0) {
    sentencesContainer.innerHTML =
      '<p style="color: #8DA9C4;">Tidak ada kalimat mencurigakan yang terdeteksi</p>';
  }

  // 4. Display Related Sources
  const newsContainer = document.getElementById("newsContainer");
  newsContainer.innerHTML = "";

  if (data.related_sources && data.related_sources.length > 0) {
    data.related_sources.forEach((source) => {
      const item = document.createElement("div");
      item.className = "news-item";

      // Determine tag type based on content
      let tagClass = "clarification";
      let tagText = "Referensi";

      const titleLower = source.title.toLowerCase();
      const snippetLower = source.snippet.toLowerCase();

      if (
        titleLower.includes("hoax") ||
        titleLower.includes("hoaks") ||
        snippetLower.includes("hoax") ||
        snippetLower.includes("hoaks")
      ) {
        tagClass = "rebuttal";
        tagText = "Klarifikasi Hoaks";
      } else if (
        titleLower.includes("fact") ||
        titleLower.includes("fakta") ||
        snippetLower.includes("benar") ||
        snippetLower.includes("valid")
      ) {
        tagClass = "fact";
        tagText = "Verifikasi Fakta";
      }

      // Build HTML
      let html = `<div class="news-title">${source.title}</div>`;

      if (source.snippet) {
        html += `<div class="news-source">${source.snippet}</div>`;
      }

      if (source.link && source.link.startsWith("http")) {
        html += `<a href="${source.link}" target="_blank" rel="noopener noreferrer" style="color: #134074; text-decoration: none; font-size: 13px; display: inline-block; margin-top: 8px;">Baca selengkapnya →</a>`;
      }

      html += `<div class="news-tag ${tagClass}">${tagText}</div>`;

      item.innerHTML = html;
      newsContainer.appendChild(item);
    });
  }

  // Fallback jika tidak ada sumber terkait
  if (newsContainer.children.length === 0) {
    newsContainer.innerHTML =
      '<p style="color: #8DA9C4;">Tidak ada sumber berita terkait yang ditemukan</p>';
  }

  // 5. Display Insight
  document.getElementById("insightText").textContent = data.insight;

  // 6. Log completion
  console.log("✅ Display completed:", {
    prediction: data.prediction,
    confidence: data.confidence,
    words: data.indicative_words.length,
    sentences: data.indicative_sentences.length,
    sources: data.related_sources.length,
  });
}

/**
 * ==========================================
 * INITIALIZATION
 * ==========================================
 */
window.onload = function () {
  drawScoreRing(0);
  console.log("🚀 RupaFakta Dashboard initialized");
  console.log("📋 Active tab:", currentTab);
};

/**
 * ==========================================
 * RESPONSIVE HANDLING
 * ==========================================
 */
let resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    if (document.getElementById("resultContainer").classList.contains("show")) {
      const currentScore = parseInt(
        document.getElementById("scoreValue").textContent
      );
      drawScoreRing(currentScore);
    }
  }, 250);
});