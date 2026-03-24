import json
import math
import time
from collections import deque
from heapq import heappop, heappush
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

ALGORITHM_META = {
    "bfs": {
        "label": "Breadth-First Search",
        "accent": "#6ec8ff",
        "reasoning": "Exploring neighbors level by level to guarantee the shortest unweighted route.",
    },
    "dfs": {
        "label": "Depth-First Search",
        "accent": "#b88dff",
        "reasoning": "Diving deep along one branch before backtracking to alternative options.",
    },
    "greedy": {
        "label": "Greedy Best-First Search",
        "accent": "#ffd76a",
        "reasoning": "Choosing the cell that appears closest to the goal using the heuristic distance.",
    },
    "astar": {
        "label": "A* Search",
        "accent": "#ff8a80",
        "reasoning": "Balancing travel cost and goal distance with f(n) = g(n) + h(n).",
    },
}


def neighbors(position, rows, cols, walls):
    row, col = position
    result = []
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = row + dr, col + dc
        if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in walls:
            result.append((nr, nc))
    return result


def heuristic(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def reconstruct_path(came_from, start, goal):
    if goal != start and goal not in came_from:
        return []
    path = [goal]
    current = goal
    while current != start:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path


def bfs_search(start, goal, rows, cols, walls):
    queue = deque([start])
    came_from = {}
    visited = {start}
    order = []
    while queue:
        current = queue.popleft()
        order.append(current)
        if current == goal:
            break
        for nxt in neighbors(current, rows, cols, walls):
            if nxt in visited:
                continue
            visited.add(nxt)
            came_from[nxt] = current
            queue.append(nxt)
    return order, reconstruct_path(came_from, start, goal)


def dfs_search(start, goal, rows, cols, walls):
    stack = [start]
    came_from = {}
    visited = {start}
    order = []
    while stack:
        current = stack.pop()
        order.append(current)
        if current == goal:
            break
        for nxt in reversed(neighbors(current, rows, cols, walls)):
            if nxt in visited:
                continue
            visited.add(nxt)
            came_from[nxt] = current
            stack.append(nxt)
    return order, reconstruct_path(came_from, start, goal)


def greedy_search(start, goal, rows, cols, walls):
    heap = []
    heappush(heap, (heuristic(start, goal), 0, start))
    came_from = {}
    seen = {start}
    order = []
    tie_break = 0
    while heap:
        _, _, current = heappop(heap)
        order.append(current)
        if current == goal:
            break
        for nxt in neighbors(current, rows, cols, walls):
            if nxt in seen:
                continue
            seen.add(nxt)
            came_from[nxt] = current
            tie_break += 1
            heappush(heap, (heuristic(nxt, goal), tie_break, nxt))
    return order, reconstruct_path(came_from, start, goal)


def astar_search(start, goal, rows, cols, walls):
    heap = []
    heappush(heap, (heuristic(start, goal), 0, start))
    came_from = {}
    g_score = {start: 0}
    closed = set()
    order = []
    tie_break = 0
    while heap:
        _, _, current = heappop(heap)
        if current in closed:
            continue
        closed.add(current)
        order.append(current)
        if current == goal:
            break
        for nxt in neighbors(current, rows, cols, walls):
            tentative_cost = g_score[current] + 1
            if tentative_cost >= g_score.get(nxt, math.inf):
                continue
            came_from[nxt] = current
            g_score[nxt] = tentative_cost
            tie_break += 1
            heappush(heap, (tentative_cost + heuristic(nxt, goal), tie_break, nxt))
    return order, reconstruct_path(came_from, start, goal)


def run_algorithm(name, payload):
    rows = int(payload["rows"])
    cols = int(payload["cols"])
    start = tuple(payload["start"])
    goal = tuple(payload["goal"])
    walls = {tuple(item) for item in payload["walls"]}
    start_time = time.perf_counter()
    if name == "bfs":
        visited_order, path = bfs_search(start, goal, rows, cols, walls)
    elif name == "dfs":
        visited_order, path = dfs_search(start, goal, rows, cols, walls)
    elif name == "greedy":
        visited_order, path = greedy_search(start, goal, rows, cols, walls)
    elif name == "astar":
        visited_order, path = astar_search(start, goal, rows, cols, walls)
    else:
        raise ValueError(f"Unsupported algorithm: {name}")
    elapsed_ms = (time.perf_counter() - start_time) * 1000
    meta = ALGORITHM_META[name]
    steps = []
    for index, node in enumerate(visited_order[:28], start=1):
        steps.append(
            {
                "index": index,
                "node": list(node),
                "message": f"{meta['reasoning']} Step {index}: inspecting cell ({node[0]}, {node[1]}).",
            }
        )
    found = bool(path)
    return {
        "id": name,
        "name": meta["label"],
        "accent": meta["accent"],
        "found": found,
        "visitedOrder": [list(node) for node in visited_order],
        "path": [list(node) for node in path],
        "metrics": {
            "nodesExplored": len(visited_order),
            "pathLength": max(len(path) - 1, 0) if found else None,
            "executionTimeMs": round(elapsed_ms, 3),
        },
        "summary": meta["reasoning"],
        "steps": steps,
    }


class ArenaHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="text/html; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def _write_json(self, payload, status=200):
        self._set_headers(status=status, content_type="application/json; charset=utf-8")
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def _serve_static(self, relative_path):
        target = STATIC_DIR / relative_path
        if not target.exists() or not target.is_file():
            self._write_json({"error": "Not found"}, status=404)
            return
        content_type = "text/plain; charset=utf-8"
        if target.suffix == ".html":
            content_type = "text/html; charset=utf-8"
        elif target.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            content_type = "application/javascript; charset=utf-8"
        self._set_headers(content_type=content_type)
        self.wfile.write(target.read_bytes())


    def do_GET(self):
        path = urlparse(self.path).path
        if path in {"/", "/index.html"}:
            self._serve_static("index.html")
            return
        if path.startswith("/static/"):
            self._serve_static(path.removeprefix("/static/"))
            return
        if path == "/api/health":
            self._write_json({"status": "ok"})
            return
        if path == "/api/presets":
            self._write_json(
                {
                    "rows": 12,
                    "cols": 16,
                    "start": [1, 1],
                    "goal": [10, 14],
                    "walls": [
                        [2, 3], [3, 3], [4, 3], [5, 3], [7, 3], [7, 4], [7, 5], [7, 6],
                        [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [2, 10], [3, 10], [4, 10],
                        [8, 11], [8, 12], [8, 13], [5, 12],
                    ],
                }
            )
            return
        self._write_json({"error": "Route not found"}, status=404)


    def do_POST(self):
        path = urlparse(self.path).path
        if path not in {"/api/run", "/api/race"}:
            self._write_json({"error": "Route not found"}, status=404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length)
        try:
            payload = json.loads(raw_body.decode("utf-8"))
            algorithms = payload.get("algorithms") or ["astar"]
            if path == "/api/run":
                self._write_json(run_algorithm(algorithms[0], payload))
                return
            results = [run_algorithm(name, payload) for name in algorithms]
            ranked = [item for item in results if item["found"]]
            winner = None
            if ranked:
                winner = sorted(
                    ranked,
                    key=lambda item: (
                        item["metrics"]["pathLength"],
                        item["metrics"]["executionTimeMs"],
                        item["metrics"]["nodesExplored"],
                    ),
                )[0]["id"]
            self._write_json({"results": results, "winner": winner})
        except Exception as exc:
            self._write_json({"error": str(exc)}, status=400)


def main():
    port = 8000
    server = HTTPServer(("127.0.0.1", port), ArenaHandler)
    print(f"Pathfinding Arena running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
