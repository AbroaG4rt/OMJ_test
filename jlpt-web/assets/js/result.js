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
    " Progress > Perfection.",
    "もう一度やってみよう。\n(Let’s try one more time.)",
    "Kegagalan itu data, bukan identitas.",
    "努力は裏切らない。\n(Effort never betrays.)"
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
    
    saveHistory(level, score);
    
    localStorage.removeItem('jlpt_target_level');
    localStorage.removeItem('jlpt_test_answers');
    localStorage.removeItem('jlpt_timer_end');
    
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
    
    sendEmailReport(globalReportData);
    
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
                backgroundColor: ['#8ebd8e', '#d97b7b'], 
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR PDF GENERATION
// -------------------------------------------------------------

function generateWatermark(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const text = "test omoshiro japan";
    
    if (doc.GState) {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
    }
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(30);

    const xStep = 100;
    const yStep = 80;
    
    // Pattern repeated ~20 times
    for (let x = -50; x < pageWidth + 50; x += xStep) {
        for (let y = 0; y < pageHeight + 50; y += yStep) {
            doc.text(text, x, y, { angle: 45 });
        }
    }
    
    // Reset Graphics State
    if (doc.GState) {
        doc.setGState(new doc.GState({ opacity: 1.0 }));
    }
    doc.setTextColor(0, 0, 0);
}

function generateScoreChart(doc, yPos) {
    const total = globalReportData.total;
    const correct = globalReportData.correct;
    const correctPct = Math.round((correct / total) * 100);
    const incorrectPct = 100 - correctPct;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("Performance Overview", 14, yPos);
    
    yPos += 12;

    const barWidth = Math.max(doc.internal.pageSize.getWidth() - 28, 100);
    const barHeight = 16;
    const startX = 14;

    const correctWidth = (correctPct / 100) * barWidth;
    
    // Correct part (Green)
    doc.setFillColor(114, 186, 114); // #72ba72
    doc.rect(startX, yPos, correctWidth, barHeight, 'F');
    
    // Incorrect part (Red)
    doc.setFillColor(217, 104, 104); // #d96868
    doc.rect(startX + correctWidth, yPos, barWidth - correctWidth, barHeight, 'F');

    // Labels
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    
    // Correct Label if space accommodates
    if (correctPct > 10) {
        doc.setTextColor(255, 255, 255);
        doc.text(`${correctPct}% Correct`, startX + 5, yPos + 11);
    }
    
    // Incorrect Label if space accommodates
    if (incorrectPct > 10) {
        doc.setTextColor(255, 255, 255);
        const textWidth = doc.getTextWidth(`${incorrectPct}% Incorrect`);
        doc.text(`${incorrectPct}% Incorrect`, startX + barWidth - textWidth - 5, yPos + 11);
    }
    
    doc.setTextColor(0, 0, 0);
    return yPos + 35; 
}

function generateCorrectTable(doc, startY) {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 167, 69); // Green
    doc.text("Correct Answers", 14, startY);
    
    const tableData = globalReportData.correctContext.map(q => [
        `Q${q.id}`,
        q.question,
        q.answer,
        '✔ Correct'
    ]);

    doc.autoTable({
        startY: startY + 8,
        head: [['ID', 'Question', 'Selected Answer', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak' },
        columnStyles: { 
            0: { cellWidth: 15 }, 
            1: { cellWidth: 'auto' }, 
            2: { cellWidth: 40 }, 
            3: { cellWidth: 25, textColor: [40, 167, 69], fontStyle: 'bold' } 
        },
        headStyles: { fillColor: [142, 189, 142], textColor: 255 },
        alternateRowStyles: { fillColor: [247, 252, 247] }
    });
}

function generateWrongTable(doc, startY) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (startY > pageHeight - 40) {
        doc.addPage();
        startY = 25;
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(220, 53, 69); // Red
    doc.text("Incorrect Answers", 14, startY);
    
    const tableData = globalReportData.incorrectContext.map(q => [
        `Q${q.id}`,
        q.question,
        q.userAnswer,
        q.answer,
        '✖ Wrong'
    ]);

    doc.autoTable({
        startY: startY + 8,
        head: [['ID', 'Question', 'Your Answer', 'Correct Answer', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak' },
        columnStyles: { 
            0: { cellWidth: 15 }, 
            1: { cellWidth: 'auto' }, 
            2: { cellWidth: 35 }, 
            3: { cellWidth: 35 }, 
            4: { cellWidth: 25, textColor: [220, 53, 69], fontStyle: 'bold' } 
        },
        headStyles: { fillColor: [217, 123, 123], textColor: 255 },
        alternateRowStyles: { fillColor: [253, 246, 246] }
    });
}

function generatePdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // 1. JLPT Practice Report Title
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text("JLPT Practice Report", 14, 25);
    
    // 2. User Info Section
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    doc.text(`Name: ${globalReportData.user.username}`, 14, 40);
    doc.text(`Level: ${globalReportData.level}`, 14, 46);
    doc.text(`Score: ${globalReportData.score}% (${globalReportData.correct}/${globalReportData.total})`, 14, 52);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 58);
    
    // 3. Performance Overview (Graph using native shapes)
    let currentY = generateScoreChart(doc, 75);
    
    // 4. Correct Answers Table (Green section)
    generateCorrectTable(doc, currentY);
    
    // 5. Wrong Answers Table (Red section)
    currentY = doc.lastAutoTable.finalY + 20;
    generateWrongTable(doc, currentY);
    
    // 6. Draw Watermark Layer on all existing pages dynamically
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        generateWatermark(doc);
    }
    
    // Append Motivational Quote precisely at the end
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)].replace(/\n/g, " - ");
    const finalMessage = `七転び八起き – Fall down seven times, stand up eight.\n\n${randomQuote}`;
    
    let footerY = doc.lastAutoTable.finalY + 30;
    if (footerY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        generateWatermark(doc);
        footerY = 40;
    }
    
    doc.setPage(doc.internal.getNumberOfPages()); // Ensure we are on last page
    doc.setFontSize(12);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(120, 120, 120);
    const splitText = doc.splitTextToSize(finalMessage, doc.internal.pageSize.getWidth() - 28);
    doc.text(splitText, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });

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
