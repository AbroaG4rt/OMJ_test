document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('jlpt_user');
    const targetLevel = localStorage.getItem('jlpt_target_level');
    const answersStr = localStorage.getItem('jlpt_test_answers');
    
    if (!userStr || !targetLevel) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    const answers = answersStr ? JSON.parse(answersStr) : {};
    
    try {
        const res = await fetch(`data/${targetLevel}.json`);
        const data = await res.json();
        
        gradeTest(user, targetLevel, data.questions, answers);
    } catch (e) {
        console.error("Scoring error", e);
        document.getElementById('loadingBox').innerHTML = "<h3>Error fetching testing data</h3>";
    }
});

const quotes = [
    "Gagal itu bukan akhir, it's just a delay.",
    "また挑戦すればいい。\n(Just try again.)",
    "You didn’t fail, you learned.",
    "一歩ずつでも前に進め。\n(Even one step forward matters.)",
    "JLPT bukan segalanya, but your growth is.",
    "続ける人が勝つ。\n(The one who continues wins.)",
    "Don’t stop now, kamu sudah sejauh ini.",
    "諦めなければ道はある。\n(If you don’t give up, there is a way.)",
    "Progress > Perfection.",
    "もう一度やってみよう。\n(Let’s try one more time.)",
    "Kegagalan itu data, bukan identitas.",
    "努力は裏切らない。\n(Effort never betrays.)",
    "You’re closer than you think.",
    "今日の努力は未来の力。\n(Today’s effort is tomorrow’s power.)",
    "Belajar itu investasi jangka panjang.",
    "Keep going, your future self will thank you.",
    "小さな進歩も大事。\n(Small progress matters.)",
    "Gagal JLPT? berarti kamu sudah berani mencoba.",
    "Try again, stronger this time.",
    "継続すれば必ず伸びる。\n(If you continue, you will grow.)",
    "Kamu bukan gagal, kamu sedang proses.",
    "Every mistake is a lesson.",
    "できるまでやればいい。\n(Just keep going until you can.)",
    "Belajar pelan tapi pasti.",
    "Don’t compare, just improve.",
    "昨日の自分より成長しよう。\n(Be better than yesterday.)",
    "Kegagalan itu guru terbaik.",
    "Success is built on retries.",
    "あきらめるな。\n(Don’t give up.)",
    "Ulangi lagi, pasti bisa.",
    "You got this.",
    "努力の積み重ねが未来を作る。\n(Accumulated effort builds the future.)",
    "Pelan gak apa, berhenti itu masalah.",
    "Failure is part of mastery.",
    "もう少し頑張ろう。\n(Let’s push a little more.)",
    "Belajar tiap hari walau sedikit.",
    "Your time will come.",
    "夢は逃げない。\n(Dreams don’t run away.)",
    "Gagal sekarang, sukses nanti.",
    "Consistency beats talent.",
    "やればできる。\n(If you do it, you can.)",
    "Terus belajar, jangan menyerah.",
    "Every expert was once a beginner.",
    "一歩一歩進め。\n(Go step by step.)",
    "Kamu sedang berkembang.",
    "Hard work always pays off.",
    "信じて続けよう。\n(Believe and continue.)",
    "Jangan takut gagal lagi.",
    "Try smarter, not just harder.",
    "未来は自分で作る。\n(You create your future.)",
    "Belajarからkesalahan.",
    "Fall seven, rise eight.",
    "失敗しても前進。\n(Even failing is forward.)",
    "Kamu lebih kuat dari hasil test.",
    "Keep learning, keep growing.",
    "夢に向かって進め。\n(Move toward your dream.)",
    "Fokus proses, bukan hasil.",
    "Retry is part of success.",
    "続けることが鍵。\n(Continuing is the key.)",
    "Kegagalan hari ini = kemenangan besok.",
    "Don’t quit before it works.",
    "努力は必ず報われる。\n(Effort will be rewarded.)",
    "Belajar itu perjalanan panjang.",
    "Stay consistent.",
    "できなくてもいい、やることが大事。\n(It’s okay if you can’t, trying matters.)",
    "Kamu hampir sampai.",
    "One more try.",
    "挑戦し続けよう。\n(Keep challenging yourself.)",
    "Jangan berhenti sekarang.",
    "Growth takes time.",
    "前向きに行こう。\n(Let’s move forward positively.)",
    "Kamu sedang menuju sukses.",
    "Never stop improving.",
    "夢をあきらめないで。\n(Don’t give up your dream.)",
    "Gagal itu bagian dari cerita sukses.",
    "Push yourself.",
    "一日一歩。\n(One step a day.)",
    "Pelan tapi naik.",
    "You’re doing great.",
    "頑張った分だけ成長する。\n(You grow as much as you try.)",
    "Kamu pasti bisa.",
    "Keep moving forward.",
    "自分を信じて。\n(Believe in yourself.)",
    "Ulangi sampai berhasil.",
    "Stay focused.",
    "失敗は終わりじゃない。\n(Failure is not the end.)",
    "Kamu sedang belajar, bukan kalah.",
    "Try again tomorrow.",
    "努力は未来への投資。\n(Effort is an investment in the future.)",
    "Semangat terus.",
    "Success needs patience.",
    "一度の失敗で終わらない。\n(One failure doesn’t end everything.)",
    "Kamu semakin dekat.",
    "Keep pushing.",
    "夢は叶う。\n(Dreams come true.)",
    "Gagal hari ini, lulus nanti.",
    "Never give up on your goal.",
    "最後までやり抜こう。\n(See it through to the end.)"
];

let globalReportData = null;

async function gradeTest(user, level, masterQuestions, userAnswers) {
    let correct = 0;
    let incorrectContext = [];
    let correctContext = [];

    masterQuestions.forEach(q => {
        const uAns = userAnswers[q.id];
        if (uAns && uAns === q.answer) {
            correct++;
            correctContext.push(q);
        } else {
            incorrectContext.push({
                ...q,
                userAnswer: uAns || "Unanswered"
            });
        }
    });

    const total = masterQuestions.length;
    const score = Math.round((correct / total) * 100);
    
    // Save to History before cleaning
    saveHistory(level, score);
    
    // Clean states so we can't refresh result
    localStorage.removeItem('jlpt_target_level');
    localStorage.removeItem('jlpt_test_answers');
    localStorage.removeItem('jlpt_timer_end');
    
    // Render UI
    document.getElementById('loadingBox').style.display = 'none';
    document.getElementById('resultContent').style.display = 'block';
    
    document.getElementById('scoreCircle').textContent = `${score}%`;
    document.getElementById('scoreText').textContent = `You answered ${correct} out of ${total} correctly.`;
    document.getElementById('quoteText').innerText = quotes[Math.floor(Math.random() * quotes.length)];
    
    renderChart(correct, total - correct);
    
    const correctList = document.getElementById('correctList');
    if (correctContext.length === 0) {
        correctList.innerHTML = "<li>None this time. Keep practicing!</li>";
    } else {
        const preview = correctContext.slice(0, 10);
        preview.forEach(q => {
            let li = document.createElement('li');
            li.style.padding = '8px 0';
            li.style.borderBottom = '1px solid #eee';
            li.innerHTML = `<strong>Q${q.id}:</strong> ${q.question}`;
            correctList.appendChild(li);
        });
        if(correctContext.length > 10){
             let more = document.createElement('li');
             more.style.padding = '8px 0';
             more.innerHTML = `<em>...and ${correctContext.length - 10} more. Download PDF for full list.</em>`;
             correctList.appendChild(more);
        }
    }

    globalReportData = { user, level, score, correctContext, incorrectContext, correct, total };
    
    // Attempt Worker Email Sync
    sendEmailReport(globalReportData);
    
    // Bind PDF
    document.getElementById('downloadPdfBtn').addEventListener('click', generatePdf);
}

function saveHistory(level, score) {
    let history = JSON.parse(localStorage.getItem('jlpt_history')) || [];
    history.push({
        level: level,
        score: score,
        timestamp: Date.now()
    });
    localStorage.setItem('jlpt_history', JSON.stringify(history));
}

function renderChart(correct, incorrect) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Correct', 'Incorrect'],
            datasets: [{
                data: [correct, incorrect],
                backgroundColor: ['#8ebd8e', '#d97b7b'], // success / danger
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            animation: {
                onComplete: function() {} // Chart is rendered
            }
        }
    });
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR PDF GENERATION
// -------------------------------------------------------------

function addWatermark(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const text = "test omoshiro japan";
    
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(24);
    
    // Set opacity using GState
    if (doc.GState) {
        const gState = new doc.GState({ opacity: 0.15 });
        doc.setGState(gState);
    }

    // Grid repeated pattern
    for (let x = -50; x < pageWidth + 50; x += 100) {
        for (let y = 0; y < pageHeight + 50; y += 80) {
            doc.text(text, x, y, { angle: 45 });
        }
    }

    // Reset opacity and color
    if (doc.GState) {
        const normalState = new doc.GState({ opacity: 1.0 });
        doc.setGState(normalState);
    }
    doc.setTextColor(0, 0, 0);
}

function addSectionTitle(doc, title, y) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y + 2, doc.internal.pageSize.getWidth() - 14, y + 2);
    doc.setFont(undefined, 'normal');
}

function generatePdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Apply background watermark grid
    addWatermark(doc);
    
    // --------------------------------------------------
    // Title & User Info
    // --------------------------------------------------
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("JLPT Practice Report", 14, 25);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    const infoStartY = 35;
    doc.text(`Name: ${globalReportData.user.username}`, 14, infoStartY);
    doc.text(`Level: ${globalReportData.level}`, 14, infoStartY + 8);
    doc.text(`Score: ${globalReportData.score}%`, 14, infoStartY + 16);
    doc.text(`Result: ${globalReportData.correct} Correct, ${globalReportData.total - globalReportData.correct} Incorrect out of ${globalReportData.total}`, 14, infoStartY + 24);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, infoStartY + 32);
    
    // --------------------------------------------------
    // Centered Visual Chart Canvas Export
    // --------------------------------------------------
    const chartCanvas = document.getElementById('scoreChart');
    if (chartCanvas) {
        const chartImgData = chartCanvas.toDataURL('image/png');
        // Center the image horizontally. Image size approx 50x50
        const imgWidth = 50;
        const imgHeight = 50;
        const pageWidth = doc.internal.pageSize.getWidth();
        const xPos = (pageWidth - imgWidth) / 2;
        
        doc.addImage(chartImgData, 'PNG', xPos, infoStartY, imgWidth, imgHeight);
    }
    
    let currentY = infoStartY + 60; // below the chart and info
    
    // --------------------------------------------------
    // Table 1: Correct Answers
    // --------------------------------------------------
    addSectionTitle(doc, "Correct Answers", currentY);
    currentY += 8;
    
    const correctTableData = globalReportData.correctContext.map(q => [
        `Q${q.id}`, 
        q.question,
        q.answer
    ]);
    
    doc.autoTable({
        startY: currentY,
        head: [['ID', 'Question', 'Correct Answer']],
        body: correctTableData,
        theme: 'striped',
        styles: { 
            fontSize: 10,
            overflow: 'linebreak',
            cellPadding: 4
        },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 40 }
        },
        headStyles: { fillColor: [74, 111, 165], textColor: [255, 255, 255] },
        didDrawPage: function (data) {
            // Apply watermark on new pages created by autoTable
             if (data.pageNumber > 1) {
                // To avoid drawing over table headers on new pages, we inject it below the table layer
                // However, jsPDF draws sequentially. We can just draw over safely since it's 15% opacity.
                addWatermark(doc);
             }
        }
    });

    currentY = doc.lastAutoTable.finalY + 15;
    
    // Need to check if there is enough space to start Table 2, otherwise add new page
    if (currentY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        addWatermark(doc);
        currentY = 20;
    }

    // --------------------------------------------------
    // Table 2: Incorrect Answers
    // --------------------------------------------------
    addSectionTitle(doc, "Incorrect Answers", currentY);
    currentY += 8;
    
    const incorrectTableData = globalReportData.incorrectContext.map(q => [
        `Q${q.id}`, 
        q.question,
        q.userAnswer,
        q.answer
    ]);
    
    doc.autoTable({
        startY: currentY,
        head: [['ID', 'Question', 'Your Answer', 'Correct Answer']],
        body: incorrectTableData,
        theme: 'grid',
        styles: { 
            fontSize: 10,
            overflow: 'linebreak',
            cellPadding: 4
        },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 }
        },
        headStyles: { fillColor: [217, 123, 123], textColor: [255, 255, 255] }, // muted red
        alternateRowStyles: { fillColor: [250, 245, 245] },
        didDrawPage: function (data) {
             if (data.pageNumber > doc.internal.getNumberOfPages() - 1) {
                // Actually the didDrawPage Hook applies per page. 
                // Using autoTable, we just need to ensure the watermark is there 
                // But autoTable creates pages before our hook if we don't handle it in willDrawPage or page break.
                // We'll safely add watermark if this is a newly created page.
             }
        }
    });
    
    currentY = doc.lastAutoTable.finalY + 20;
    
    // --------------------------------------------------
    // Footer / Motivational Message
    // --------------------------------------------------
    // Ensure space for footer
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        addWatermark(doc);
        currentY = 40;
    }
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)].replace(/\n/g, " - ");
    const finalMessage = `七転び八起き – Fall down seven times, stand up eight.\n\n${randomQuote}`;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    
    const splitText = doc.splitTextToSize(finalMessage, doc.internal.pageSize.getWidth() - 28);
    doc.text(splitText, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
    
    doc.save(`jlpt_${globalReportData.level}_report.pdf`);
}

async function sendEmailReport(data) {
    try {
        const payload = {
            name: data.user.username,
            password: data.user.code,
            level: data.level,
            score: data.score,
            correctAnswers: data.correctContext.map(q => `Q${q.id}: ${q.answer}`)
        };
        
        // This will POST to the relative /api/send-report, which Cloudflare Pages will map to the Worker.
        const res = await fetch('/api/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) console.warn("Email service reported non-200 code");
        else console.log("Email queued via Worker.");
        
    } catch(e) {
        console.warn("Could not reach worker API - if running locally, this is expected.");
    }
}
