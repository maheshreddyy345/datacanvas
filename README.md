# 📊 Interactive Chart Generator with AI

A modern web application that converts natural language descriptions into beautiful, animated charts using AI. Built with React, Node.js, and powered by GPT-4.

![Chart Demo](demo.gif)

## ✨ Features

- **Natural Language Processing**: Simply describe your data in plain English
- **Multiple Chart Types**: 
  - 📊 Bar Charts
  - 📈 Line Charts
  - 🔵 Area Charts
  - 🥧 Pie Charts
- **Smart Data Extraction**: Automatically identifies numbers, percentages, and categories
- **Beautiful Animations**: Smooth, customizable chart animations
- **Video Export**: Record and download chart animations
- **Modern UI**: Clean, responsive design using Material-UI
- **Real-time Updates**: Instant chart preview as you type

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/maheshreddyy345/datacanvas.git
   cd datacanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`

## 💡 Usage Examples

1. **Simple Percentage Distribution**
   ```
   "Market share: 40% in North America, 35% in Europe, 25% in Asia"
   ```

2. **Sales Data with Multiple Categories**
   ```
   "A large order was placed on Tuesday for 15 regular items at $10 each, 5 premium items at $25 each, and 2 deluxe items at $50 each, resulting in a total sale of $425."
   ```

3. **Time Series Data**
   ```
   "Sales growth: Q1: $100K, Q2: $150K, Q3: $200K, Q4: $250K"
   ```

## 🛠️ Tech Stack

- **Frontend**:
  - React.js
  - Material-UI
  - ECharts
  - RecordRTC

- **Backend**:
  - Node.js
  - Express
  - OpenAI API

## 📝 Notes

- The application requires a valid OpenAI API key to function
- Chart recording works best in modern browsers
- For optimal performance, use Chrome or Firefox

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built using [Windsurf](https://www.codeium.com/windsurf), the world's first agentic IDE
- Powered by [OpenAI's GPT-4](https://openai.com/gpt-4)
- Charts rendered using [Apache ECharts](https://echarts.apache.org)
