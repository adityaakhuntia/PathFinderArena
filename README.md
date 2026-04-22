# 🎮 PathFinderArena

> An interactive AI algorithm battle game where BFS, DFS, Greedy Best-First, and A* race each other to find the goal — in real time.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## 🧠 What Is This?

PathFinderArena is a full-stack AI visualizer and game. Four AI agents — each powered by a different search algorithm — are dropped onto the same grid and race to reach the goal node simultaneously. You watch them explore, backtrack, and converge in real time.

It's both an educational tool and a genuinely fun game. The metrics dashboard shows you exactly *why* A\* beats DFS on most grids — not just that it does.

---

## ✨ Features

- 🗺️ **Custom Grid Builder** — place start, goal, and wall nodes freely before each race
- ⚡ **Race Mode** — all 4 algorithms run simultaneously, winner highlighted on arrival
- 📊 **Metrics Dashboard** — live tracking of nodes explored, path length, and execution time per algorithm
- 🧩 **Algorithm Reasoning Feed** — real-time text feed explaining each algorithm's decision at each step
- 🎨 **Polished Single-Page UI** — clean, responsive interface served directly from Python

---

## 🤖 Algorithms Implemented

| Algorithm | Strategy | Optimal? | Complete? |
|---|---|---|---|
| **BFS** | Explore level by level | ✅ Yes (unweighted) | ✅ Yes |
| **DFS** | Dive deep first | ❌ No | ✅ Yes |
| **Greedy Best-First** | Chase the heuristic | ❌ No | ❌ Not always |
| **A\*** | Cost + heuristic balanced | ✅ Yes | ✅ Yes |

---

## 🏗️ Architecture

```
PathFinderArena/
│
├── backend/
│   └── app.py          # Python HTTP server — serves frontend & runs algorithms
│
├── frontend/
│   ├── index.html      # Single-page app
│   └── static/
│       ├── app.js      # Grid logic, race engine, metrics dashboard
│       └── styles.css  # UI styling
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+

### Run Locally

```bash
# Clone the repo
git clone https://github.com/adityaakhuntia/PathFinderArena.git
cd PathFinderArena

# Start the server
python backend/app.py
```

Then open `http://127.0.0.1:8000` in your browser.

---

## 🎮 How to Play

1. **Build your grid** — click cells to place walls, select start and goal nodes
2. **Hit Race** — all 4 algorithms launch simultaneously
3. **Watch** — see them explore the grid in real time, each with its own color
4. **Read the metrics** — check which algorithm was fastest, most efficient, or explored fewest nodes
5. **Repeat** — change the grid layout and race again to see how results change

---

## 💡 Why I Built This

I wanted a way to *see* the difference between search algorithms rather than just reading about them. Most CS students learn BFS and A\* theoretically — this makes the difference visceral and obvious. A\* winning a race it started 2x slower than DFS is more memorable than any textbook explanation.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Made by <a href="https://github.com/adityaakhuntia">Aditya Khuntia</a> · 
<a href="https://linkedin.com/in/adityakhuntia">LinkedIn</a>
</div>
