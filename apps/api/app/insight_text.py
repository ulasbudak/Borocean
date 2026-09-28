"""Epic 13 — short, factual text for an insight event, for the AI prompt (Turkish) and the
push notification (Turkish/English). The web/mobile UI renders events itself from
`type` + `facts` via i18n; this module only serves the server-side text.

Every sentence states what was measured, never what to do with the stock (Story 12.1).
"""

TECHNICAL_NAMES = {
    "tr": {
        "golden_cross": "SMA50, SMA200'ü yukarı kesti (Golden Cross)",
        "death_cross": "SMA50, SMA200'ü aşağı kesti (Death Cross)",
        "bollinger_breakout_up": "fiyat Bollinger üst bandının üzerine çıktı",
        "bollinger_breakout_down": "fiyat Bollinger alt bandının altına indi",
    },
    "en": {
        "golden_cross": "SMA50 crossed above SMA200 (Golden Cross)",
        "death_cross": "SMA50 crossed below SMA200 (Death Cross)",
        "bollinger_breakout_up": "price closed above the upper Bollinger band",
        "bollinger_breakout_down": "price closed below the lower Bollinger band",
    },
}

METRIC_NAMES = {
    "tr": {
        "net_margin": "net kâr marjı",
        "roe": "özsermaye kârlılığı (ROE)",
        "debt_to_equity": "borç/özsermaye",
        "eps_growth": "EPS büyümesi",
    },
    "en": {
        "net_margin": "net margin",
        "roe": "return on equity (ROE)",
        "debt_to_equity": "debt-to-equity",
        "eps_growth": "EPS growth",
    },
}


def _num(value: float, locale: str) -> str:
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return text.replace(".", ",") if locale == "tr" else text


def _signed(value: float, locale: str) -> str:
    return ("+" if value > 0 else "") + _num(value, locale)


def describe_event(event: dict, locale: str = "tr") -> str:
    locale = "en" if locale == "en" else "tr"
    t, f = event.get("type"), event.get("facts", {})
    tr = locale == "tr"
    if t == "price_move":
        pct = _signed(f["change_pct"], locale)
        return f"günlük değişim %{pct}" if tr else f"daily change {pct}%"
    if t == "volume_spike":
        ratio = _num(f["volume_ratio"], locale)
        return (
            f"hacim 20 günlük ortalamanın {ratio} katı"
            if tr
            else f"volume {ratio}× the 20-day average"
        )
    if t == "week52_high":
        return "52 haftanın en yüksek kapanışı" if tr else "52-week closing high"
    if t == "week52_low":
        return "52 haftanın en düşük kapanışı" if tr else "52-week closing low"
    if t == "technical":
        return TECHNICAL_NAMES[locale].get(f.get("rule_id"), f.get("rule_id", ""))
    if t == "earnings":
        base = "bilanço açıkladı" if tr else "reported earnings"
        if f.get("surprise_pct") is not None:
            pct = _signed(f["surprise_pct"], locale)
            base += f" (beklentiden sapma %{pct})" if tr else f" (surprise {pct}%)"
        return base
    if t == "upcoming_earnings":
        days = f.get("days", 0)
        if tr:
            return (
                "bugün bilanço açıklaması bekleniyor"
                if days == 0
                else (f"{days} gün içinde bilanço açıklaması bekleniyor")
            )
        return "earnings expected today" if days == 0 else f"earnings expected in {days} days"
    if t == "filing":
        return f"yeni SEC dosyası: {f.get('form')}" if tr else f"new SEC filing: {f.get('form')}"
    if t == "fundamental_change":
        name = METRIC_NAMES[locale].get(f.get("metric"), f.get("metric", ""))
        before, after = _num(f["before"], locale), _num(f["after"], locale)
        return f"{name} {before} → {after}"
    return t or ""


def push_text(items: list[dict], locale: str) -> tuple[str, str]:
    """Title and body of the once-a-day summary push. `items` are (symbol, events) rows for
    one user, most severe first."""
    tr = locale != "en"
    count = len(items)
    title = (
        f"Portföyünde {count} gelişme"
        if tr
        else f"{count} update{'s' if count > 1 else ''} in your portfolio"
    )
    parts = []
    for item in items[:3]:
        top = max(item["events"], key=lambda e: e.get("severity", 0))
        parts.append(f"{item['symbol']}: {describe_event(top, locale)}")
    body = ", ".join(parts)
    if count > 3:
        body += f" ve {count - 3} diğer" if tr else f" and {count - 3} more"
    return title, body
