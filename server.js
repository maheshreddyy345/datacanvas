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

app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "system",
        content: `Extract numerical data from the text and calculate the total value for each category. Return a JSON array where each object has 'name' and 'value' properties.

Instructions:
1. For items with quantity and price:
   - Multiply quantity by price to get total value
   - Example: "3 items at $10 each" = $30 total

2. Group items by category and sum their values:
   - Regular items
   - Premium/Deluxe items
   - Additional charges

3. Calculate percentage of total for each category:
   - If a total is mentioned, use that as reference
   - Otherwise, sum all values and calculate percentages

4. Return array of objects with:
   - name: Clear category name
   - value: Percentage (0-100)

Example Input:
"A large order was placed on Tuesday for 15 regular items at $10 each, 5 premium items at $25 each, and 2 deluxe items at $50 each, resulting in a total sale of $425."

Expected Output:
{
  "data": [
    {"name": "Regular Items", "value": 35},
    {"name": "Premium Items", "value": 29},
    {"name": "Deluxe Items", "value": 36}
  ]
}`
      }, {
        role: "user",
        content: prompt
      }],
      response_format: { type: "json_object" },
      temperature: 0
    });

    try {
      const content = completion.choices[0].message.content;
      const parsedData = JSON.parse(content);
      let data = [];

      if (Array.isArray(parsedData)) {
        data = parsedData;
      } else if (parsedData.data && Array.isArray(parsedData.data)) {
        data = parsedData.data;
      }

      // Validate and clean the data
      data = data
        .map(item => ({
          name: String(item.name || '').trim(),
          value: Number(item.value) || 0
        }))
        .filter(item => !isNaN(item.value) && item.value > 0 && item.name);

      if (data.length === 0) {
        return res.status(400).json({ error: 'Could not extract valid data from the prompt' });
      }

      // Ensure percentages sum to 100
      const total = data.reduce((sum, item) => sum + item.value, 0);
      if (Math.abs(total - 100) > 0.1) {
        data = data.map(item => ({
          ...item,
          value: Math.round((item.value / total) * 100)
        }));
      }

      res.json(data);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      res.status(400).json({ error: 'Could not extract valid data from the prompt' });
    }
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
