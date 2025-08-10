const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupMunicipality() {
  console.log('🏛️ Municipal Setup Tool for HelpToken\n');

  try {
    const cityName = await askQuestion('Enter city name: ');
    const population = await askQuestion('Enter city population: ');
    const contactEmail = await askQuestion('Enter municipal contact email: ');
    const departments = await askQuestion('Enter departments (comma-separated): ');

    const municipalConfig = {
      cityName,
      population: parseInt(population),
      contactEmail,
      departments: departments.split(',').map(d => d.trim()),
      setupDate: new Date().toISOString(),
      tokenAllocation: Math.floor(population * 0.1), // 0.1 tokens per resident
      status: 'pending_activation'
    };

    console.log('\n📋 Municipal Configuration:');
    console.log(JSON.stringify(municipalConfig, null, 2));

    const confirm = await askQuestion('\nSave this configuration? (yes/no): ');
    
    if (confirm.toLowerCase() === 'yes') {
      const filename = `municipal-configs/${cityName.toLowerCase().replace(/\s+/g, '-')}-config.json`;
      
      // Create directory if it doesn't exist
      if (!fs.existsSync('municipal-configs')) {
        fs.mkdirSync('municipal-configs');
      }
      
      fs.writeFileSync(filename, JSON.stringify(municipalConfig, null, 2));
      console.log(`✅ Configuration saved to ${filename}`);
      
      console.log('\n📋 Next Steps:');
      console.log('1. Review the configuration file');
      console.log('2. Deploy smart contracts to testnet');
      console.log('3. Register municipality on blockchain');
      console.log('4. Set up verification processes');
    } else {
      console.log('❌ Configuration not saved');
    }

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  }

  rl.close();
}

setupMunicipality();

