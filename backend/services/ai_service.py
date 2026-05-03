import os
import json
import re
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_PROMPT = """Bạn là chuyên gia phân tích dữ liệu cho nền tảng bán vé sự kiện TicketRush.
Nhiệm vụ: dựa vào dữ liệu thống kê được cung cấp, đưa ra 3-5 insight ngắn gọn, thực tế, có giá trị hành động cho admin.

Mỗi insight phải:
- Tiếng Việt, tự nhiên, súc tích (≤30 từ)
- Có tính hành động (gợi ý làm gì) hoặc cảnh báo cụ thể
- Dựa CHÍNH XÁC trên số liệu được cung cấp, không bịa
- Phân loại theo type:
  * "positive": tin tốt, xu hướng tích cực
  * "warning": vấn đề cần chú ý, rủi ro
  * "info": thông tin trung tính, cần lưu ý

CHỈ trả về JSON thuần, KHÔNG markdown, KHÔNG code fence, KHÔNG văn bản giải thích trước/sau JSON.

Schema chính xác:
{
  "summary": "1 câu tổng kết tình hình chung (≤25 từ)",
  "insights": [
    {"type": "positive", "text": "..."},
    {"type": "warning", "text": "..."},
    {"type": "info", "text": "..."}
  ]
}"""

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "summary": {"type": "STRING"},
        "insights": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "type": {
                        "type": "STRING",
                        "enum": ["positive", "warning", "info"],
                    },
                    "text": {"type": "STRING"},
                },
                "required": ["type", "text"],
            },
        },
    },
    "required": ["summary", "insights"],
}


def _strip(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        m = re.match(r"^```(?:json)?\s*\n?(.*?)\n?```$", s, re.DOTALL)
        if m:
            return m.group(1).strip()
    return s


def _extract_json(s: str) -> str:
    s = _strip(s)

    try:
        json.loads(s)
        return s
    except:
        pass

    start = s.find("{")
    if start == -1:
        return s

    depth = 0
    in_string = False
    escape = False

    for i in range(start, len(s)):
        ch = s[i]

        if escape:
            escape = False
            continue

        if ch == "\\":
            escape = True
            continue

        if ch == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return s[start:i + 1]

    candidate = s[start:]
    candidate += "]" * (candidate.count("[") - candidate.count("]"))
    candidate += "}" * (candidate.count("{") - candidate.count("}"))

    return candidate


async def generate_insights(stats: Dict[str, Any]) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        return {
            "insights": [{"type": "warning", "text": "Thiếu GEMINI_API_KEY"}],
            "summary": "AI chưa khả dụng",
        }

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{
                    "text": SYSTEM_PROMPT + "\n\n" + json.dumps(stats, ensure_ascii=False, indent=2)
                }]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    raw_text = ""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                GEMINI_URL,
                headers={
                    "x-goog-api-key": GEMINI_API_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            res.raise_for_status()
            data = res.json()

        cand = (data.get("candidates") or [])[0]
        raw_text = "".join(
            p.get("text", "")
            for p in (cand.get("content") or {}).get("parts", [])
        ).strip()

        parsed = json.loads(_extract_json(raw_text))

        insights = []
        for it in parsed.get("insights", [])[:5]:
            if isinstance(it, dict) and "text" in it:
                insights.append({
                    "type": it.get("type", "info"),
                    "text": str(it["text"]).strip()[:300]
                })

        return {
            "summary": str(parsed.get("summary", "")).strip()[:200],
            "insights": insights,
        }

    except json.JSONDecodeError as e:
        print(f"[AI] JSONDecodeError: {e}")
        print(raw_text[:1000])
        return {
            "insights": [{"type": "warning", "text": "AI trả dữ liệu lỗi"}],
            "summary": "Lỗi parse JSON",
        }

    except httpx.HTTPStatusError as e:
        print(f"[AI] HTTP {e.response.status_code}")
        print(e.response.text[:500])
        return {
            "insights": [{"type": "warning", "text": "Lỗi Gemini API"}],
            "summary": "Không kết nối được AI",
        }

    except Exception as e:
        print(f"[AI] {type(e).__name__}: {e}")
        if raw_text:
            print(raw_text[:1000])

        return {
            "insights": [{"type": "warning", "text": "Không thể tạo insight"}],
            "summary": "Lỗi hệ thống",
        }