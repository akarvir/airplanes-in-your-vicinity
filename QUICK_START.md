# 🚀 Quick Start Guide

## Get Running in 3 Steps

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start the Application
```bash
./start.sh
```

**OR manually:**
```bash
npm run dev
```

### 3. Open Your Browser
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🎯 What You'll See

1. **Location Permission**: Allow the app to access your location
2. **Aircraft Display**: View all planes within 100km of your position
3. **Real-time Updates**: Data refreshes automatically every 30 seconds
4. **Directional Info**: See exactly where to look for each aircraft

## 📱 Example Output

```
Look to your North East, there is a UAL123 at 10,000m flying at 450 knots
```

## ⚠️ Important Notes

- **No API Keys Required**: Uses free OpenSky Network API
- **Location Required**: Must allow browser location access
- **Internet Required**: Needs connection to aviation data sources
- **HTTPS Recommended**: Some browsers require secure context for location

## 🆘 If Something Goes Wrong

1. **Check the console** for error messages
2. **Verify location permission** is granted
3. **Check internet connection**
4. **Try refreshing the page**

## 🔧 Customization

- **Search Radius**: Adjust from 25km to 500km in Settings
- **Auto-refresh**: Toggle automatic updates on/off
- **API Keys**: Add Aviation Stack API key for enhanced data (optional)

---

**Ready to track some planes? Run `./start.sh` and enjoy!** ✈️


