import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadIlocano() {
  try {
    console.log("Fetching dataset from Hugging Face API...");
    const url = "https://datasets-server.huggingface.co/rows?dataset=saillab%2Falpaca_ilocano_taco&config=default&split=train&offset=0&length=20";
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const examples = data.rows.map(row => {
      // Alpaca datasets usually have instruction, input, output
      const content = row.row;
      let userQuery = content.instruction;
      if (content.input && content.input.trim() !== "") {
        userQuery += "\n" + content.input;
      }
      
      return {
        User: userQuery.trim(),
        Bot: content.output.trim()
      };
    });

    const outputPath = path.join(__dirname, 'ilocano_examples.json');
    fs.writeFileSync(outputPath, JSON.stringify(examples, null, 2));
    
    console.log(`✅ Successfully saved ${examples.length} examples to ${outputPath}`);
  } catch (error) {
    console.error("❌ Error downloading dataset:", error);
  }
}

downloadIlocano();
