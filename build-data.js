#!/usr/bin/env node
// build-data.js - Convert CSV and JSON to minified JSON for web app

const fs = require('fs');
const path = require('path');

// Parse CSV to JSON
function csvToJson(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const obj = {};
        const values = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j].trim()] = values[j] ? values[j].trim() : '';
        }
        
        result.push(obj);
    }
    
    return result;
}

// Main build function
function build() {
    console.log('Building web data files...');
    
    const contentDir = path.join(__dirname, 'content');
    const outputDir = path.join(__dirname, 'web', 'data');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert verbs.csv
    console.log('Converting verbs.csv...');
    const verbsCsv = fs.readFileSync(path.join(contentDir, 'verbs.csv'), 'utf8');
    const verbsJson = csvToJson(verbsCsv);
    fs.writeFileSync(
        path.join(outputDir, 'verbs.min.json'),
        JSON.stringify(verbsJson)
    );
    console.log(`✓ Created verbs.min.json (${verbsJson.length} verbs)`);
    
    // Convert conjugations.csv
    console.log('Converting conjugations.csv...');
    const conjugationsCsv = fs.readFileSync(path.join(contentDir, 'conjugations.csv'), 'utf8');
    const conjugationsJson = csvToJson(conjugationsCsv);
    fs.writeFileSync(
        path.join(outputDir, 'conjugations.min.json'),
        JSON.stringify(conjugationsJson)
    );
    console.log(`✓ Created conjugations.min.json (${conjugationsJson.length} forms)`);
    
    // Convert phrases.csv
    console.log('Converting phrases.csv...');
    const phrasesCsv = fs.readFileSync(path.join(contentDir, 'phrases.csv'), 'utf8');
    const phrasesJson = csvToJson(phrasesCsv);
    fs.writeFileSync(
        path.join(outputDir, 'phrases.min.json'),
        JSON.stringify(phrasesJson)
    );
    console.log(`✓ Created phrases.min.json (${phrasesJson.length} phrases)`);
    
    // Copy and minify patterns.json
    console.log('Copying patterns.json...');
    const patternsJson = JSON.parse(
        fs.readFileSync(path.join(contentDir, 'patterns.json'), 'utf8')
    );
    fs.writeFileSync(
        path.join(outputDir, 'patterns.min.json'),
        JSON.stringify(patternsJson)
    );
    console.log('✓ Created patterns.min.json');
    
    // Copy and minify prompts.json
    console.log('Copying prompts.json...');
    const promptsJson = JSON.parse(
        fs.readFileSync(path.join(contentDir, 'prompts.json'), 'utf8')
    );
    fs.writeFileSync(
        path.join(outputDir, 'prompts.min.json'),
        JSON.stringify(promptsJson)
    );
    console.log('✓ Created prompts.min.json');
    
    console.log('\n✓ Build completed successfully!');
}

// Run build
try {
    build();
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
