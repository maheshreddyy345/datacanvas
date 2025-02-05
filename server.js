const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();

// Basic CORS setup
app.use(cors());

// JSON parsing middleware
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const extractDataFromText = (text) => {
  const data = [];
  // Match patterns like "40% software licenses" or "30% hardware sales"
  const regex = /(\d+)%\s*([\w\s-]+?)(?=,|\s+and\s+|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [_, percentage, label] = match;
    const value = parseInt(percentage, 10);
    
    if (!isNaN(value)) {
      const name = label.trim()
        .toLowerCase()
        .replace(/^(for|from|by|in|of)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (name && !data.some(item => item.name === name)) {
        data.push({ name, value });
      }
    }
  }

  return data;
};

app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Try direct extraction first
    let data = extractDataFromText(prompt);
    
    // If direct extraction fails, use OpenAI
    if (data.length === 0) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "Extract age range demographics from the text and return a JSON array of objects. Each object should have 'name' (age range) and 'value' (percentage) properties. Format age ranges consistently (e.g., 'aged 25-34', 'aged 45+'). Values should be numbers (0-100)."
        }, {
          role: "user",
          content: prompt
        }],
        response_format: { type: "json_object" }
      });

      try {
        const content = completion.choices[0].message.content;
        const parsedData = JSON.parse(content);
        if (Array.isArray(parsedData)) {
          data = parsedData;
        } else if (parsedData.data && Array.isArray(parsedData.data)) {
          data = parsedData.data;
        }
      } catch (error) {
        console.error('Failed to parse OpenAI response:', error);
      }
    }

    // Validate and normalize data
    data = data.map(item => ({
      name: String(item.name || '').trim(),
      value: Number(item.value) || 0
    })).filter(item => !isNaN(item.value) && item.value > 0 && item.name);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Could not extract valid data from the prompt' });
    }

    // Sort data by age range
    data.sort((a, b) => {
      const getStartAge = (range) => {
        const match = range.match(/\d+/);
        return match ? parseInt(match[0], 10) : 999;
      };
      return getStartAge(a.name) - getStartAge(b.name);
    });

    // Normalize to 100%
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total !== 100) {
      data = data.map(item => ({
        ...item,
        value: Math.round((item.value / total) * 100)
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze prompt',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
