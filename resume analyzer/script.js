// ---------- Setup pdf.js worker ----------
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ---------- Grab elements ----------
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const fileNameEl = document.getElementById("fileName");
const imageWarning = document.getElementById("imageWarning");
const analyzeBtn = document.getElementById("analyzeBtn");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const results = document.getElementById("results");
const scoreCircle = document.getElementById("scoreCircle");
const scoreValue = document.getElementById("scoreValue");
const scoreLabel = document.getElementById("scoreLabel");
const goodList = document.getElementById("goodList");
const suggestionList = document.getElementById("suggestionList");
const rawTextOutput = document.getElementById("rawTextOutput");

let uploadedFile = null;

// ---------- Upload box interactions ----------
dropArea.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    handleFile(fileInput.files[0]);
  }
});

function handleFile(file) {
  uploadedFile = file;
  fileNameEl.textContent = "Selected: " + file.name;
  analyzeBtn.disabled = false;

  // show warning only for image uploads
  if (file.type.startsWith("image/")) {
    imageWarning.classList.remove("hidden");
  } else {
    imageWarning.classList.add("hidden");
  }
}

// ---------- Progress bar helper ----------
function setProgress(percent, label) {
  progressFill.style.width = percent + "%";
  progressPercent.textContent = percent + "%";
  if (label) loaderText.textContent = label;
}

// ---------- Analyze button ----------
analyzeBtn.addEventListener("click", async () => {
  if (!uploadedFile) return;

  results.classList.add("hidden");
  loader.classList.remove("hidden");
  setProgress(0, "Starting...");

  try {
    let text = "";

    if (uploadedFile.type === "application/pdf") {
      setProgress(20, "Reading PDF...");
      text = await extractTextFromPDF(uploadedFile);
      setProgress(100, "Analyzing your resume...");
    } else if (uploadedFile.type.startsWith("image/")) {
      text = await extractTextFromImage(uploadedFile);
    } else {
      setProgress(50, "Reading file...");
      text = await uploadedFile.text(); // .txt
      setProgress(100, "Analyzing your resume...");
    }

    const report = analyzeResume(text);

    setTimeout(() => {
      showResults(report);
      loader.classList.add("hidden");
      results.classList.remove("hidden");
      setProgress(0, "Analyzing your resume...");
    }, 400);

  } catch (err) {
    loader.classList.add("hidden");
    alert("Could not read this file. Try a clearer image or a different format.");
    console.error(err);
  }
});

// ---------- Extract text from PDF using pdf.js ----------
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const percent = Math.round((i / pdf.numPages) * 80) + 10; // 10% -> 90%
    setProgress(percent, `Reading page ${i} of ${pdf.numPages}...`);

    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

// ---------- Extract text from image using Tesseract OCR ----------
async function extractTextFromImage(file) {
  setProgress(0, "Loading OCR engine...");

  const result = await Tesseract.recognize(file, "eng", {
    logger: (info) => {
      if (info.status === "recognizing text") {
        const percent = Math.round(info.progress * 100);
        setProgress(percent, `Reading text from image... ${percent}%`);
      } else if (info.status === "loading tesseract core") {
        setProgress(5, "Loading OCR engine...");
      } else if (info.status === "initializing api") {
        setProgress(10, "Initializing OCR...");
      }
    }
  });

  setProgress(100, "Analyzing your resume...");
  return result.data.text;
}

// ---------- Core scoring logic ----------
function analyzeResume(rawText) {
  const text = rawText.toLowerCase();
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

  let score = 0;
  const good = [];
  const suggestions = [];

  // 1. Contact info
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(rawText);
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(rawText);
  if (hasEmail) {
    score += 10;
    good.push("Contains a valid email address.");
  } else {
    suggestions.push("Add a professional email address so recruiters can contact you.");
  }
  if (hasPhone) {
    score += 5;
    good.push("Contains a phone number.");
  } else {
    suggestions.push("Add a phone number for easy contact.");
  }

  // 2. Key sections — now checks multiple keyword variants per section
  // to be more forgiving of OCR noise / different resume wording
  const sectionChecks = {
    Education: ["education", "academic background", "qualification"],
    Experience: ["experience", "work history", "employment", "work experience"],
    Skills: ["skills", "technical skills", "core competencies", "competencies"],
    Projects: ["project"]
  };

  for (const label in sectionChecks) {
    const found = sectionChecks[label].some((term) => text.includes(term));
    if (found) {
      score += 10;
      good.push(`Includes a "${label}" section.`);
    } else {
      suggestions.push(`Add a clear "${label}" section — recruiters look for this explicitly.`);
    }
  }

  // 3. Word count check
  if (wordCount >= 250 && wordCount <= 900) {
    score += 15;
    good.push("Resume length looks appropriate.");
  } else if (wordCount < 250) {
    suggestions.push("Your resume seems short. Add more detail about your projects and achievements.");
  } else {
    suggestions.push("Your resume looks long. Try trimming it to 1-2 pages of relevant content.");
  }

  // 4. Action verbs
  const actionVerbs = ["built", "developed", "led", "designed", "created",
                        "managed", "improved", "launched", "implemented", "achieved",
                        "used", "oversaw", "coordinated", "reduced", "increased",
                        "conducted", "drew", "provided", "monitored"];
  const verbHits = actionVerbs.filter((v) => text.includes(v));
  if (verbHits.length >= 3) {
    score += 15;
    good.push("Uses strong action verbs (e.g. " + verbHits.slice(0, 3).join(", ") + ").");
  } else {
    suggestions.push('Use strong action verbs like "built", "led", "developed" instead of passive phrases.');
  }

  // 5. Weak phrases
  const weakPhrases = ["responsible for", "worked on", "helped with"];
  const weakHits = weakPhrases.filter((p) => text.includes(p));
  if (weakHits.length > 0) {
    suggestions.push('Avoid weak phrases like "responsible for" — describe the actual impact instead.');
  } else {
    score += 5;
    good.push("Avoids generic/weak phrasing.");
  }

  // 6. Quantified achievements (numbers, %, etc.)
  const hasNumbers = /\d+%|\d+\+|\$\d+|\b\d{2,}\b/.test(rawText);
  if (hasNumbers) {
    score += 15;
    good.push("Includes measurable results (numbers/percentages).");
  } else {
    suggestions.push('Add measurable achievements, e.g. "increased performance by 20%" or "handled 500+ users".');
  }

  // 7. Bullet point usage
  const bulletCount = (rawText.match(/•|- /g) || []).length;
  if (bulletCount >= 4) {
    score += 10;
    good.push("Uses bullet points for readability.");
  } else {
    suggestions.push("Use bullet points instead of long paragraphs to make your resume easy to scan.");
  }

  // 8. Links (LinkedIn/GitHub/portfolio)
  const hasLink = /linkedin\.com|github\.com|http/.test(text);
  if (hasLink) {
    score += 5;
    good.push("Includes a link (LinkedIn/GitHub/portfolio).");
  } else {
    suggestions.push("Add a LinkedIn or GitHub link so recruiters can see more of your work.");
  }

  // clamp score to 100
  score = Math.min(score, 100);

  return { score, good, suggestions, rawText };
}

// ---------- Display results ----------
function showResults(report) {
  let current = 0;
  const target = report.score;
  const color = target >= 75 ? "#22c55e" : target >= 50 ? "#fbbf24" : "#ef4444";

  const interval = setInterval(() => {
    current++;
    scoreValue.textContent = current;
    scoreCircle.style.background =
      `conic-gradient(${color} ${current * 3.6}deg, #1e293b 0deg)`;
    if (current >= target) clearInterval(interval);
  }, 12);

  scoreLabel.textContent =
    target >= 75 ? "Great Resume! 🎉" :
    target >= 50 ? "Decent, but needs work 🛠️" :
    "Needs Improvement ⚠️";

  goodList.innerHTML = "";
  report.good.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = "✓ " + item;
    goodList.appendChild(li);
  });
  if (report.good.length === 0) {
    goodList.innerHTML = "<li>Nothing strong detected yet — check suggestions below.</li>";
  }

  suggestionList.innerHTML = "";
  report.suggestions.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = "→ " + item;
    suggestionList.appendChild(li);
  });
  if (report.suggestions.length === 0) {
    suggestionList.innerHTML = "<li>You're all set — no major issues found!</li>";
  }

  // fill in the debug raw text panel
  rawTextOutput.textContent = report.rawText && report.rawText.trim()
    ? report.rawText
    : "(no text could be extracted from this file)";
}