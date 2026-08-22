# 🎓 Mission 17 & Barangay E-Services: Capstone Documentation Guide

This guide is designed to help the team write Chapters 1-5 of the Capstone Project / Research Document. It contains all the essential system details, technical concepts, and features mapped to standard thesis chapters.

---

## 📖 Chapter 1: Introduction

**Background of the Study**
* The system is a hybrid platform: A **digital governance portal** (Barangay Bagong Pag-asa E-Services) combined with a **sustainability gamification app** (Mission 17).
* It modernizes traditional barangay processes (blotters, clearances) and incentivizes citizens to complete Sustainable Development Goals (SDGs) like recycling and tree planting.

**Objectives of the System**
1. To digitize and streamline barangay services (Document Requests, Announcements, Suggestions).
2. To ensure transparency and tamper-proof record-keeping of Blotter Reports using Blockchain technology.
3. To encourage civic engagement through the Mission 17 gamification system, rewarding users for sustainable actions.
4. To implement an AI-powered verification system that accurately validates photo evidence of civic duties to prevent cheating.
5. To provide instant citizen support via a Smart Chatbot.

**Scope & Limitations**
* **Scope:** Mobile app for residents, Web portal for barangay officials, AI verification for images, Blockchain ledger for blotter resolution.
* **Limitations:** The blockchain operates on the Ethereum Sepolia Testnet (not mainnet, to keep it gasless/free). The AI model is specialized only for specific missions (like Tree Planting/SDG 13/15 and Recycling/SDG 12).

---

## 📚 Chapter 2: Review of Related Literature (RRL)

When researching for your RRL, focus on these four main pillars that our system uses:

1. **E-Governance & Smart Communities:** Research how digital portals (like the eGovPH system) improve local government unit (LGU) efficiency and citizen satisfaction.
2. **Gamification for Social Good:** Look into how points, leaderboards, and rewards motivate people to participate in environmental conservation (Sustainable Development Goals).
3. **Blockchain in E-Governance:** Discuss the use of Decentralized Ledgers (Ethereum, Smart Contracts) for creating immutable, tamper-proof public records (our Blotter system). 
4. **Artificial Intelligence & Computer Vision:** Research Convolutional Neural Networks (CNNs) and how AI can be used to automatically classify images and prevent fraud (our Anti-Cheat duplicate detection).

---

## 🛠️ Chapter 3: Methodology

**System Architecture & Tech Stack**
The project uses a highly modern, distributed architecture:

* **Frontend (Resident Mobile App):** React Native (Expo) using TypeScript. Styled with a custom centralized theme (`theme.ts`) focusing on Human-Centered Design.
* **Frontend (Admin Portal):** React.js (Vite) with Vanilla CSS.
* **Backend API:** Node.js & Express.js. Uses a Modular MVC architecture (Controllers separate from Routes).
* **Database:** MongoDB (NoSQL) with Mongoose (ODM). Authentication is handled via JWT and Bcrypt.
* **Artificial Intelligence:** A Python (Flask) server running a TensorFlow Computer Vision model. Hosted on Hugging Face Spaces via Docker. Uses the Groq API (LLaMA 3) for the chatbot.
* **Blockchain Integration:** Ethereum (Sepolia Testnet), using Solidity for Smart Contracts and Ethers.js for integration. Transactions are gasless for users via a Sponsor Wallet.
* **DevOps:** GitHub Actions for CI/CD, and Expo Application Services (EAS) for Over-The-Air (OTA) mobile updates.

**Development Model**
* Mention if the team is using Agile Methodology (Sprints, Iterative development) to build the modular components (Mobile, Admin, Backend, AI).

---

## 📊 Chapter 4: Results & Discussion

*(This chapter will be filled out after the system is fully tested, but here is what the team needs to measure and discuss)*

* **AI Verification Accuracy:** Test how accurately the Hugging Face AI accepts valid photos (e.g., actual trees/recycling) and rejects invalid or duplicate photos. Present the success/failure rates.
* **Blockchain Transaction Speed & Verification:** Show screenshots of the Sepolia Etherscan block explorer proving that when an Admin resolves a blotter, the record is permanently stored.
* **System Usability Scale (SUS):** Conduct User Acceptance Testing (UAT). Have users test the mobile app and admins test the web portal, and gather feedback on the UI/UX responsiveness.
* **Chatbot Efficiency:** Test the response time and accuracy of the Groq-powered smart chatbot when answering resident queries.

---

## 🔮 Chapter 5: Conclusion & Recommendations

**Conclusion**
* Summarize how the integration of AI, Blockchain, and Mobile/Web technologies successfully addressed the problem of inefficient barangay services and low civic participation.
* Highlight that the system provides a transparent, secure, and engaging way to run local governance.

**Recommendations for Future Work**
* Expanding the AI model to verify a wider range of SDGs.
* Migrating the Smart Contracts from the Sepolia Testnet to a Layer 2 Mainnet (like Polygon or Arbitrum) for low-cost, real-world deployment.
* Integrating local payment gateways (like GCash/Maya) for paid document requests.
