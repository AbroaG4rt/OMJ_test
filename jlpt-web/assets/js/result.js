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
    "Belajar dari kesalahan.",
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
            incorrectContext.push(q);
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
        if (correctContext.length > 10) {
            let more = document.createElement('li');
            more.style.padding = '8px 0';
            more.innerHTML = `<em>...and ${correctContext.length - 10} more. Download PDF for full list.</em>`;
            correctList.appendChild(more);
        }
    }

    globalReportData = { user, level, score, correctContext, correct, total };

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
            }
        }
    });
}

function generatePdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Watermark settings
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(50);
    // opacity isn't natively supported easily in standard pdfs without graphics state, 
    // but drawing text behind in light gray simulates 15% opacity watermark
    const waterMarkText = "test omoshiro japan";
    // diagonal layout
    for (let i = 0; i < 3; i++) {
        doc.text(waterMarkText, 10, 80 + (i * 60), { angle: 30 });
    }

    // Reset colors
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(22);
    doc.text("JLPT Practice Report", 14, 30);

    doc.setFontSize(12);
    doc.text(`Name: ${globalReportData.user.username}`, 14, 40);
    doc.text(`Level: ${globalReportData.level}`, 14, 48);
    doc.text(`Score: ${globalReportData.score}% (${globalReportData.correct}/${globalReportData.total})`, 14, 56);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 64);

    doc.setFontSize(14);
    doc.text("Mastered Questions (Correct):", 14, 80);

    const tableData = globalReportData.correctContext.map(q => [
        `Q${q.id}`,
        q.question.length > 50 ? q.question.substring(0, 47) + '...' : q.question,
        q.answer.length > 30 ? q.answer.substring(0, 27) + '...' : q.answer
    ]);

    doc.autoTable({
        startY: 85,
        head: [['ID', 'Question', 'Your Answer']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [74, 111, 165] }
    });

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

    } catch (e) {
        console.warn("Could not reach worker API - if running locally, this is expected.");
    }
}
