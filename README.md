# 😺 Mewoinfo - Purrfect PDF Facts

![Manifest Version](https://img.shields.io/badge/manifest-v3-blue?logo=googlechrome)
![Version](https://img.shields.io/badge/version-1.0.0-success)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Supported-red?logo=googlechrome)

> Upload a PDF and get meow-tastic facts delivered by a cute cat while you browse! 🐱📚

---

## ✨ Features

- 📄 **PDF Upload & Processing** - Extract text from PDFs using PDF.js library
- 🤖 **AI-Powered Facts** - Generate interesting facts using Google Gemini API
- 🎨 **Cute Cat Animations** - Random cat GIFs deliver your facts with style
- ⏰ **Scheduled Notifications** - Set intervals for cat fact notifications
- 💾 **Local Storage** - Store facts and settings securely
- 🎯 **Easy Controls** - Intuitive popup interface for managing the extension

---

## 📦 Project Structure

```
mewoinfo/
├── manifest.json           # Extension configuration (Manifest V3)
├── README.md              # This file
├── popup/                 # Extension popup UI
│   ├── popup.html         # Popup interface
│   ├── popup.js           # Popup logic & controls
│   └── popup.css          # Popup styling
├── scripts/               # Background & content scripts
│   ├── background.js      # Service worker (main logic)
│   ├── content.js         # Content script (runs on web pages)
│   ├── db.js              # Chrome storage wrapper
│   └── gemini.js          # Google Gemini API integration
├── styles/                # Stylesheets
│   └── content.css        # Animations & styling for cat widget
├── lib/                   # External libraries
│   ├── jspdf.umd.min.js   # PDF generation (optional)
│   ├── pdf.min.js         # PDF.js library
│   └── pdf.worker.min.js  # PDF.js worker
├── icons/                 # Extension icons
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── cat_gifs/              # Cat GIF animations
    ├── cat0.gif
    ├── cat1.gif
    ├── cat2.gif
    └── ... (up to cat9.gif)
```

---

## 🚀 How It Works

### 1. **User Uploads PDF**
   - User opens the extension popup
   - Selects and uploads a PDF file
   - Text is extracted and stored locally

### 2. **Generate Facts**
   - User provides Google Gemini API key
   - Clicks "Generate Facts"
   - AI generates interesting facts from PDF content

### 3. **Receive Facts**
   - Enable the alarm/timer
   - Set interval (minimum 1 minute)
   - Random cat GIFs deliver facts at intervals
   - Facts appear as animated bubbles on any webpage

### 4. **Auto-Refill**
   - When facts run out, system automatically requests more
   - Infinite scroll of generated facts

---

## 🔧 Setup & Installation

### Requirements
- Google Chrome/Chromium browser (v88+)
- Google Gemini API key
- PDF file to process

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/C0D3K0NG/mewoinfo.git
   cd mewoinfo
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `mewoinfo` folder

3. **Configure API Key**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Open extension popup
   - Paste API key in settings
   - Set interval (1-60 minutes)

4. **Upload PDF**
   - Click **Upload PDF**
   - Select your PDF file
   - Wait for upload to complete

5. **Generate & Enable**
   - Click **Generate Facts**
   - Wait for AI to process
   - Enable the alarm
   - Facts will appear as cat notifications!

---

## 📋 File Documentation

### `manifest.json`
- Extension configuration file (Manifest V3)
- Defines permissions, scripts, icons, and resources
- Content script injection configuration
- Service worker definition

### `background.js`
- Main service worker
- Handles alarm scheduling
- Manages message passing between popup and content scripts
- Controls fact generation and delivery
- Handles refill logic when facts run out

### `content.js`
- Runs on every webpage matching content script rules
- Listens for messages from background script
- Renders cat widget with facts
- Handles animations and user interactions

### `popup.js` / `popup.html` / `popup.css`
- User-facing interface
- File upload handling
- API key configuration
- Alarm control (start/stop)
- Settings management

### `db.js`
- Chrome storage abstraction layer
- Manages:
  - PDF text storage
  - Generated facts
  - Current fact index
  - User settings (API key, interval, enabled state)

### `gemini.js`
- Google Gemini API integration
- Takes PDF text and generates facts
- Handles API calls and error management

### `styles/content.css`
- Cat widget animations
- Bubble styling
- Responsive positioning
- Keyframe animations (slideUp, fadeOut, bounce, floatUp)

---

## 🎨 Customization

### Change Cat Animation Speed
Edit `styles/content.css`:
```css
#mewoinfo-container {
    animation: slideUp 0.6s cubic-bezier(...) forwards; /* Adjust time */
}
```

### Modify Widget Position
Edit `styles/content.css`:
```css
#mewoinfo-container {
    bottom: 20px;  /* Adjust bottom position */
    right: 20px;   /* Adjust right position */
}
```

### Change Number of Cats
- Add more GIF files to `cat_gifs/` folder (cat10.gif, cat11.gif, etc.)
- Update the range in `background.js`:
  ```javascript
  catIndex: Math.floor(Math.random() * 15)  // For 15 cats
  ```

### Adjust Auto-Remove Timer
Edit `scripts/content.js`:
```javascript
autoRemoveTimer = setTimeout(() => {
    removeCat();
}, 30000); // Change 30000 (milliseconds) to desired duration
```

---

## 🔐 Privacy & Security

- ✅ All PDF data stored locally in browser
- ✅ No server-side storage
- ✅ API key stored securely in Chrome storage
- ✅ Content script runs only on http/https pages
- ✅ Restricted from chrome:// and edge:// URLs

---

## 🐛 Troubleshooting

### Cat not appearing?
- Check extension is enabled in `chrome://extensions/`
- Verify content script is loaded (check console)
- Ensure you're on a regular website (not chrome://... pages)

### API key errors?
- Verify API key is valid from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check API quota hasn't been exceeded
- Ensure API is enabled for your project

### PDF not loading?
- Try smaller PDF files first
- Ensure PDF is text-based (not scanned image)
- Check browser console for errors

### Facts not generating?
- Verify PDF has extractable text
- Check API key is correct
- Try generating manually from popup

---

## 📦 Dependencies

| Library | Purpose | Version |
|---------|---------|---------|
| **pdf.js** | PDF text extraction | Latest |
| **jspdf** | PDF generation (optional) | Latest |
| **Google Gemini API** | AI fact generation | 1.0 |
| **Chrome Extension APIs** | Extension functionality | MV3 |

---

## 🛠️ Development

### Debug Mode
1. Open `chrome://extensions/`
2. Find "Mewoinfo" extension
3. Click **Details** → **Inspect views** → **service worker**
4. View console logs and errors

### Console Logging
All major events are logged with emoji indicators:
- 🐱 Installation events
- 📩 Message passing
- 🐈 Cat widget display
- ⏰ Alarm triggers
- ❌ Errors and issues

### Testing
- Test on multiple websites
- Test with PDFs of varying sizes
- Test alarm intervals (1, 5, 10 minutes)
- Test API rate limiting

---

## 📝 License

MIT License - Feel free to fork and modify!

---

## 🤝 Contributing

Have ideas? Found a bug? 
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 👨‍💻 Author

**C0D3K0NG** - [@C0D3K0NG](https://github.com/C0D3K0NG)

---

## 🎯 Future Features

- [ ] Multiple PDF support
- [ ] Custom fact templates
- [ ] Voice narration for facts
- [ ] Fact filtering by category
- [ ] Dark mode for widget
- [ ] Firefox extension support
- [ ] Statistics dashboard
- [ ] Share facts functionality

---

## ⭐ Support

If you find this extension helpful, please:
- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 📢 Share with friends

---

<div align="center">

**Happy learning with your purrfect cat! 😺📚**

*Made with ❤️ and lots of meows*

</div>
