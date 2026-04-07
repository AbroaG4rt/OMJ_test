const fs = require('fs');
const path = require('path');

const levels = [
  { name: 'N5', total: 95, image: 20, reading: 10, grammar: 45, listening: 15, timer: 120 },
  { name: 'N4', total: 100, image: 20, reading: 10, grammar: 45, listening: 25, timer: 125 },
  { name: 'N3', total: 130, image: 20, reading: 10, grammar: 70, listening: 30, timer: 130 },
  { name: 'N2', total: 135, image: 20, reading: 10, grammar: 70, listening: 35, timer: 140 },
  { name: 'N1', total: 140, image: 20, reading: 10, grammar: 70, listening: 40, timer: 150 }
];

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
}

levels.forEach(levelArgs => {
  const { name, image, reading, grammar, listening } = levelArgs;
  
  let currentId = 1;
  const questions = [];

  const addQuestions = (count, type, hasImage, hasAudio) => {
    for (let i = 0; i < count; i++) {
        let questionObj = {
            id: currentId++,
            type: type,
            question: `Sample ${name} ${type} question ${i + 1} - Kore wa nan desu ka?`,
            options: ["Option A - Hai", "Option B - Iie", "Option C - Wakaranai", "Option D - Sou desu"],
            answer: ["Option A - Hai", "Option B - Iie", "Option C - Wakaranai", "Option D - Sou desu"][Math.floor(Math.random() * 4)] // Random answer
        };
        
        if (hasImage) {
            questionObj.image = `https://via.placeholder.com/600x400.png?text=${name}+Image+${i+1}`;
        } else {
            questionObj.image = "";
        }
        
        if (hasAudio) {
            questionObj.audio = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`; // Dummy audio
        } else {
            questionObj.audio = "";
        }
        
        questions.push(questionObj);
    }
  };

  addQuestions(image, 'image', true, false);
  addQuestions(reading, 'reading', false, false);
  addQuestions(grammar, 'grammar', false, false);
  addQuestions(listening, 'listening', false, true);

  const finalObject = {
      level: name,
      timerMinutes: levelArgs.timer,
      questions: questions
  };

  fs.writeFileSync(
      path.join(dataDir, `${name}.json`),
      JSON.stringify(finalObject, null, 2)
  );

  console.log(`Generated ${name}.json with ${questions.length} questions.`);
});
