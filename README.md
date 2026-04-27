# SaleSeer

SaleSeer is a Vite + React + TypeScript prototype for supermarket price comparison, short-term price forecasting, and an in-page trigger experience.

The project has two main parts:

1. **Frontend MVP website** — search a product, compare prices across supermarkets, and view history/prediction.
2. **Browser trigger extension** — detects when a user clicks **Add to Cart** on supported supermarket websites and shows a quick summary box with a link back to the dashboard.

---

## Demo Video

Video walkthrough: https://drive.google.com/file/d/12sXACNaNnM7AjNtb2wf5pkeBLlKdIh4W/view?usp=drive_link

---

## Features

- Product comparison across supermarkets
- Price history and short-term prediction UI
- Mock product database stored in CSV / JSON
- Chrome extension trigger for supported supermarket pages
- React + TypeScript + Vite frontend
- Recharts-based visualization for history and prediction

---

## Project Structure

```text
spark-project/
├── public/                  # Static assets and mock data files
├── src/                     # React frontend
├── trigger/                 # Chrome extension files
├── package.json             # Frontend scripts and dependencies
├── vite.config.ts           # Vite config
└── README.md
```

### Key folders

- `src/` — frontend pages and UI logic
- `public/data/` — mock CSV / JSON product data for the MVP
- `trigger/` — extension logic:
  - `manifest.json`
  - `content.js`
  - `background.js`

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** shadcn-style components, lucide-react
- **Charts:** recharts
- **Data parsing:** PapaParse
- **Extension:** Chrome Manifest V3

---

## Prerequisites

Make sure you have:

- **Node.js** 18+ recommended
- **npm**
- **Google Chrome** for testing the extension

---

## Installation

Clone the repository:

```bash
git clone https://github.com/khoangdadk/spark-project.git
cd spark-project
```

Install dependencies:

```bash
npm install
```

---

## Run the Frontend

Start the development server:

```bash
npm run dev
```

By default, Vite will give you a local URL such as:

```text
http://localhost:5173
```

Other useful commands:

```bash
npm run build
npm run preview
npm run lint
```

---

## Mock Database

The MVP uses mock product data stored in CSV / JSON.

Recommended location:

```text
public/data/
```

Typical files:

```text
public/data/mock_supermarket_products.csv
public/data/mock_supermarket_products.json
```

### Update the data

If you add new products:

1. Add rows to the CSV / JSON file
2. Make sure the frontend product list includes the new `product_key`
3. If the trigger extension should recognize the product, update the matching logic in `trigger/content.js`

Example:

```js
if (t.includes("carrot") && t.includes("1kg")) return "carrots_1kg";
```

---

## Run the Chrome Trigger Extension

This project includes a Chrome extension in the `trigger/` folder.

### Load the extension

1. Open Chrome
2. Go to:

```text
chrome://extensions
```

3. Turn on **Developer mode**
4. Click **Load unpacked**
5. Select the `trigger/` folder

### Reload after code changes

Whenever you edit files in `trigger/`:

1. Save the file
2. Go back to `chrome://extensions`
3. Click **Reload** on the extension
4. Refresh the supermarket page

---

## Supported Supermarket Sites

The extension is configured to run on:

- Coles
- Woolworths
- ALDI

Supported by `trigger/manifest.json`.

---

## How the Trigger Works

Current trigger flow:

1. User visits a supported supermarket product page
2. User clicks **Add to Cart**
3. `content.js` listens for the click
4. Product text is matched to a known `product_key`
5. Mock database rows are used to find the selected store data and a better-price suggestion
6. A summary info box appears on the supermarket page
7. The user can open the detailed SaleSeer dashboard

---

## How to Use the App

### Frontend dashboard

1. Open the local frontend
2. Choose a product from the list
3. Compare current prices across supermarkets
4. Select a store to view history and prediction

### Trigger workflow

1. Load the unpacked Chrome extension
2. Visit a supported supermarket page
3. Click **Add to Cart**
4. Review the SaleSeer summary popup
5. Click **Open detailed product page** to open the dashboard

---

## Common Development Tasks

### Add a new product

To add a product completely:

1. Add rows to the mock CSV / JSON database
2. Add the product to the frontend options list
3. Add a matching rule in `trigger/content.js`
4. Reload the extension
5. Test the new product on the frontend and on a supermarket page

### Debug the trigger

If the trigger does not work:

- Check the supermarket page console for logs from `content.js`
- Check the extension service worker console for logs from `background.js`
- Make sure the extension was reloaded after every code change
- Verify that the clicked product is supported by the matching rules

Useful places:

- **Page console:** right click supermarket page → **Inspect**
- **Extension console:** `chrome://extensions` → click **Service worker** / **Inspect**

---

## Known Limitations

- The current comparison flow is mock-data-driven rather than fully real-time.
- Trigger behavior depends on site-specific DOM structures.
- Product matching currently works best for products explicitly listed in the mock database.
- Some supermarket controls may require additional selector tuning.

---

## Recommended Next Improvements

- Replace mock comparison with live cross-supermarket search
- Improve trigger robustness across different product pages
- Add stronger URL-based state transfer from trigger to dashboard
- Add better error states when a product cannot be matched
- Expand the product database and prediction logic

---

## Credits

Built as the **SaleSeer / Spark Project** MVP for supermarket price comparison, trigger-based decision support, and short-term price prediction.
