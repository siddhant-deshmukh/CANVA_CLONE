# 🖌️ CANVA_CLONE

A simplified clone of Canva built with a modular microservices architecture. Users can create templates, design with them, and export high-quality PDFs.

> 🔗 **GitHub Repository**: [CANVA_CLONE](https://github.com/siddhant-deshmukh/CANVA_CLONE)

---

## 🚀 Features Implemented

### ✅ Core Functionalities
- **Template & Design Separation**:  
  Users must create or select a **template** to begin designing.  
  Each **design** maintains its own `canvasData` linked to a `templateId`.

- **Inline Editing**:
  - Editable **text**
  - Editable **image**
  - Editable **block**
  - Resizing blocks is intentionally disabled

- **PDF Export**:
  - **Quick Export (Client-side)**: Canvas is converted to image and inserted into a PDF
  - **Server-side Export**: Sends `templateId/designId` to backend and renders from stored canvasData
    - Fonts currently handled separately
    - Layout accuracy under improvement

- **Paper Settings**:
  - A4 and other paper formats
  - Customizable **margins** and **bleeds**
  - 300 DPI support for print-quality PDFs

---

## 📸 Screenshots

### 🎨 Template Selection
![Template Selection](/documentation/1.png)
![Design Selection](/documentation/4.png)

### 🖊️ Design Editor (Inline Editing)
![Editor Inline Editing](/documentation/2.png)

### 📄 PDF Export Interface
![PDF Export](/documentation/3.png)

📄 Check this Browser generated PDF: [documentation/design-2.pdf](documentation/design-2.pdf)


📄 Check this Server generated PDF: [server/design-service/document.pdf](server/design-service/document.pdf)


---

## 🛠️ Getting Started

### 📥 Clone the Repo

```bash
git clone https://github.com/siddhant-deshmukh/CANVA_CLONE.git
cd CANVA_CLONE
```

💻 Frontend Setup

```bash
cd client
npm install
npm run build
npm run start
```

🧩 Server Setup
```bash
cd server

cd api-gateway && npm install && cd ..
cd design-service && npm install && cd ..
cd subscription-service && npm install && cd ..
cd upload-service && npm install && cd ..

cd api-gateway
npm run dev:start-all
```

🧪 Environment Variables

📍 server/api-gateway/.env
```env
PORT=3079
DESIGN=http://localhost:3083/
UPLOAD=http://localhost:3081/
SUBSCRIPTION=http://localhost:3082/
GOOGLE_CLIENT_ID=
```


📍 server/design-service/.env
```env
PORT=3083
MONGO_URI=mongodb://127.0.0.1:27017/CANVA_CLONE

```

📍 server/subscription-service/.env
```env
PORT=3082
MONGO_URI=mongodb://127.0.0.1:27017/CANVA_CLONE
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
FRONTEND_URL=http://localhost:3000/

```

📍 server/upload-service/.env
```env
PORT=3081
MONGO_URI=mongodb://127.0.0.1:27017/CANVA_CLONE
cloud_name=
api_key=
api_secret=
STABILITY_API_KEY=
```



📍 client/.env
```env
AUTH_SECRET=AVeryStrongSecret 
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
API_URL=http://localhost:3079/
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```