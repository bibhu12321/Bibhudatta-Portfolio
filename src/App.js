const { MemoryStorage } = require("botbuilder");
const pdfParse = require('pdf-parse');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

let fileContentSegments = [];

function splitIntoSegments(text) {
  const segmentSize = 4096;
  const segments = [];
  let currentIndex = 0;
  while (currentIndex < text.length) {
    segments.push(text.slice(currentIndex, currentIndex + segmentSize));
    currentIndex += segmentSize;
  }
  return segments;
}

function loadPDF() {
  return new Promise((resolve, reject) => {
    fs.readFile('OM6in1Files (1).pdf', (err, dataBuffer) => {
      if (err) {
        reject(`Error loading PDF file: ${err}`);
      } else {
        pdfParse(dataBuffer).then((pdfData) => {
          const { text } = pdfData;
          fileContentSegments = splitIntoSegments(text);
          console.log('PDF file loaded and segmented.');
          resolve();
        }).catch((err) => {
          reject(`Error parsing PDF: ${err}`);
        });
      }
    });
  });
}

async function run(context) {
  await loadPDF();

  const configuration = new Configuration({
    apiKey: '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', // Replace with your OpenAI API key
  });

  const openai = new OpenAIApi(configuration);

  const storage = new MemoryStorage();

  const userQuestion = context.activity.text;
  let foundAnswer = false;

  for (let i = 0; i < fileContentSegments.length; i++) {
    const segment = fileContentSegments[i];
   
    const prompt = `You are a HR policy bot.  " User: ${userQuestion}\nPDF: ${segment}\nAI:`;

    const gptResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 400,
      temperature: 0.0,
    });
console.log(gptResponse.data.choices[0].text);
    const newAnswer = gptResponse.data.choices[0].text.trim();
    if (newAnswer !== '') {
      foundAnswer = true;
      await context.sendActivity(newAnswer);
      break;
    }
  }

  if (!foundAnswer) {
    await context.sendActivity('I am sorry, I couldn\'t find an appropriate response.');
  }
}

module.exports = {
  run
};
